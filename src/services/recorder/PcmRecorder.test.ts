import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WavPlayer } from '../audio/WavPlayer';
import { toInt16 } from '../audio/pcm';
import { encodeWav, parseWav } from '../audio/wav';
import { FakeAudioCapture } from '../../test/fakeCapture';
import { sine } from '../../test/signal';
import { PcmRecorder } from './PcmRecorder';
import {
  IndexedDbRecordingStore,
  type RecordingStore,
  type StoredRecording,
  type StoredRecordingInfo,
} from './RecordingStore';

class MemoryStore implements RecordingStore {
  readonly records = new Map<string, StoredRecording>();

  put(recording: StoredRecording): Promise<void> {
    this.records.set(recording.id, recording);
    return Promise.resolve();
  }

  get(id: string): Promise<StoredRecording | null> {
    return Promise.resolve(this.records.get(id) ?? null);
  }

  remove(id: string): Promise<void> {
    this.records.delete(id);
    return Promise.resolve();
  }

  list(): Promise<StoredRecordingInfo[]> {
    return Promise.resolve(
      [...this.records.values()].map((recording) => {
        const info: StoredRecordingInfo & { wav?: ArrayBuffer } = { ...recording };
        delete info.wav;
        return info;
      }),
    );
  }
}

function stored(id: string, createdAt: string, fields: Partial<StoredRecording> = {}) {
  return {
    id,
    createdAt,
    seconds: 3,
    levels: [0.5, 1],
    wav: encodeWav(new Int16Array(48000), 16000),
    ...fields,
  } satisfies StoredRecording;
}

function fakePlayer() {
  let finish: () => void = () => undefined;
  const player = {
    prepare: vi.fn(),
    play: vi.fn<WavPlayer['play']>(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    ),
    stop: vi.fn(),
  } satisfies WavPlayer;
  return { player, finish: () => finish() };
}

/** 20 ms frames of a 440 Hz tone, as the capture delivers them. */
function toneFrames(count: number): Int16Array[] {
  const tone = toInt16(
    sine({ hz: 440, sampleRate: 16000, seconds: (count * 320) / 16000, amplitude: 0.5 }),
  );
  return Array.from({ length: count }, (_, index) => tone.slice(index * 320, (index + 1) * 320));
}

function setup(limits?: { maxSeconds?: number }) {
  const audio = new FakeAudioCapture();
  audio.setState('capturing');
  const store = new MemoryStore();
  const { player, finish } = fakePlayer();
  const recorder = new PcmRecorder(store, player, limits);
  const send = (frames: Int16Array[]) => {
    for (const frame of frames) {
      audio.emitFrame(frame);
    }
  };
  return { audio, store, player, finish, recorder, send };
}

describe('PcmRecorder', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('records the frames as 16 kHz WAV with a 64-bar waveform', async () => {
    const { audio, store, recorder, send } = setup();

    await recorder.start(audio);
    send(toneFrames(100));
    const info = await recorder.stop();

    expect(info.seconds).toBe(2);
    expect(info.levels).toHaveLength(64);
    expect(Math.max(...info.levels)).toBe(1);
    const stored = store.records.get(info.id);
    expect(stored === undefined ? null : parseWav(stored.wav)).toMatchObject({ sampleRate: 16000 });
    expect(stored === undefined ? 0 : parseWav(stored.wav).samples.length).toBe(32000);
  });

  it('refuses to start while the microphone is not capturing', async () => {
    const { audio, recorder } = setup();
    audio.setState('idle');
    const onFrame = vi.spyOn(audio, 'onFrame');

    await expect(recorder.start(audio)).rejects.toThrow('The microphone is not capturing');
    expect(onFrame).not.toHaveBeenCalled();
  });

  it('prepares the player inside the gesture and plays the recording to its end', async () => {
    const { audio, player, finish, recorder, send } = setup();
    await recorder.start(audio);
    send(toneFrames(10));
    const { id } = await recorder.stop();

    const playing = recorder.play(id);
    expect(player.prepare).toHaveBeenCalledTimes(1);
    let ended = false;
    void playing.then(() => {
      ended = true;
    });
    await vi.waitFor(() => {
      expect(player.play).toHaveBeenCalledTimes(1);
    });
    expect(ended).toBe(false);

    finish();
    await playing;
    expect(ended).toBe(true);

    recorder.stopPlayback();
    expect(player.stop).toHaveBeenCalledTimes(1);
  });

  it('plays only the part of a recording between two times', async () => {
    const { audio, player, finish, recorder, send } = setup();
    await recorder.start(audio);
    send(toneFrames(100));
    const { id } = await recorder.stop();

    const playing = recorder.play(id, { fromMs: 500, toMs: 1000 });

    expect(player.prepare).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(player.play).toHaveBeenCalledTimes(1);
    });
    const [wav] = player.play.mock.calls[0] ?? [];
    expect(wav === undefined ? 0 : parseWav(wav).samples.length).toBe(8000);
    finish();
    await playing;
  });

  it('lists the recordings newest first, without their sound', async () => {
    const { store, recorder } = setup();
    await store.put(stored('eski', '2026-11-20T08:10:00.000Z', { approval: 'pending' }));
    await store.put(stored('yeni', '2026-11-21T08:10:00.000Z'));

    expect(await recorder.list()).toEqual([
      { id: 'yeni', createdAt: '2026-11-21T08:10:00.000Z', seconds: 3, levels: [0.5, 1] },
      {
        id: 'eski',
        createdAt: '2026-11-20T08:10:00.000Z',
        seconds: 3,
        levels: [0.5, 1],
        approval: 'pending',
      },
    ]);
  });

  it('marks a recording the parent approves', async () => {
    const { store, recorder } = setup();
    await store.put(stored('kayit-1', '2026-11-21T08:10:00.000Z', { approval: 'pending' }));

    await recorder.approve('kayit-1');

    expect((await recorder.get('kayit-1'))?.approval).toBe('approved');
    await expect(recorder.approve('yok')).rejects.toThrow('No recording yok');
  });

  it('removes a recording', async () => {
    const { audio, recorder, send } = setup();
    await recorder.start(audio);
    send(toneFrames(10));
    const { id } = await recorder.stop();

    await recorder.remove(id);

    expect(await recorder.get(id)).toBeNull();
  });

  it('stops taking frames at the length limit', async () => {
    const { audio, recorder, send } = setup({ maxSeconds: 3 });

    await recorder.start(audio);
    send(toneFrames(400));

    expect((await recorder.stop()).seconds).toBe(3);
  });

  it('refuses stop() without a recording and ignores frames after it', async () => {
    const { audio, recorder, send } = setup();
    await expect(recorder.stop()).rejects.toThrow('Not recording');

    await recorder.start(audio);
    send(toneFrames(50));
    expect((await recorder.stop()).seconds).toBe(1);
    send(toneFrames(50));

    await recorder.start(audio);
    send(toneFrames(10));
    expect((await recorder.stop()).seconds).toBeCloseTo(0.2, 6);
  });

  it('marks a recording as waiting for the parent when the child sends it', async () => {
    const { audio, recorder, send } = setup();
    await recorder.start(audio);
    send(toneFrames(10));
    const info = await recorder.stop();
    expect(info.approval).toBeUndefined();

    await recorder.requestApproval(info.id);

    expect((await recorder.get(info.id))?.approval).toBe('pending');
    await expect(recorder.requestApproval('yok')).rejects.toThrow('No recording yok');
  });

  it('keeps an empty recording when no frame came: no seconds and flat bars', async () => {
    const { audio, recorder } = setup();

    await recorder.start(audio);
    const info = await recorder.stop();

    expect(info.seconds).toBe(0);
    expect(info.levels).toEqual(Array.from({ length: 64 }, () => 0));
  });

  it('records on when the microphone goes away and comes back, leaving the gap out', async () => {
    const { audio, recorder, send } = setup();
    await recorder.start(audio);
    send(toneFrames(50));

    audio.setState('idle');
    audio.setState('capturing');
    send(toneFrames(50));
    const info = await recorder.stop();

    expect(info.seconds).toBe(2);
  });

  it('leaves out the frames that come while it is paused', async () => {
    const { audio, recorder, send } = setup();
    await recorder.start(audio);
    send(toneFrames(50));

    recorder.pause();
    send(toneFrames(100));
    recorder.resume();
    send(toneFrames(50));
    const info = await recorder.stop();

    expect(info.seconds).toBe(2);
  });

  it('starts every recording unpaused', async () => {
    const { audio, recorder, send } = setup();
    await recorder.start(audio);
    recorder.pause();
    await recorder.stop();

    await recorder.start(audio);
    send(toneFrames(50));
    const info = await recorder.stop();

    expect(info.seconds).toBe(1);
  });

  it('lists what IndexedDB keeps without the sound', async () => {
    const store = new IndexedDbRecordingStore();
    await store.put(stored('kayit-1', '2026-11-21T08:10:00.000Z'));
    await store.put(stored('kayit-2', '2026-11-20T08:10:00.000Z', { approval: 'approved' }));

    const listed = await store.list();

    expect(listed.map((each) => each.id).sort()).toEqual(['kayit-1', 'kayit-2']);
    expect(listed.every((each) => !('wav' in each))).toBe(true);
    expect(listed.find((each) => each.id === 'kayit-2')?.approval).toBe('approved');
  });

  it('keeps recordings in IndexedDB for a later page', async () => {
    const audio = new FakeAudioCapture();
    audio.setState('capturing');
    const first = new PcmRecorder(new IndexedDbRecordingStore(), fakePlayer().player);
    await first.start(audio);
    for (const frame of toneFrames(25)) {
      audio.emitFrame(frame);
    }
    const { id } = await first.stop();

    const later = new PcmRecorder(new IndexedDbRecordingStore(), fakePlayer().player);

    expect(await later.get(id)).toMatchObject({ id, seconds: 0.5 });
  });
});
