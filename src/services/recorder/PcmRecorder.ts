// Records the capture's frames as 16 kHz mono WAV, kept on the device and played with Web Audio
// (docs/kararlar.md T21; docs/planlar/faz-2a.md, karar 10): AudioCapture gives frames, not a
// stream, and playing a buffer needs no media-src in the content security policy.
import type { Id } from '../../domain/types';
import type { AudioCapture } from '../audio/AudioCapture';
import { captureFormat } from '../audio/captureChain';
import { rms, toFloat32 } from '../audio/pcm';
import type { WavPlayer } from '../audio/WavPlayer';
import { encodeWav, sliceWav } from '../audio/wav';
import { createId } from '../id';
import type { Unsubscribe } from '../types';
import type { PlaybackRange, Recorder, RecordingEntry, RecordingInfo } from './Recorder';
import type { RecordingStore } from './RecordingStore';

/** Five minutes at 32 KB a second is about 9.6 MB. */
export const recordingLimits = { maxSeconds: 300, levelBars: 64 } as const;

type RecordingLimits = { maxSeconds: number; levelBars: number };

/** The loudness of each of `bars` equal parts, scaled so the loudest is 1. */
export function waveformLevels(samples: Int16Array, bars: number): number[] {
  const floats = toFloat32(samples);
  const levels = Array.from({ length: bars }, (_, bar) => {
    const start = Math.floor((bar * floats.length) / bars);
    const end = Math.floor(((bar + 1) * floats.length) / bars);
    return rms(floats.subarray(start, end));
  });
  const peak = Math.max(...levels);
  return peak > 0 ? levels.map((level) => level / peak) : levels;
}

function joined(chunks: readonly Int16Array[], length: number): Int16Array {
  const samples = new Int16Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }
  return samples;
}

export class PcmRecorder implements Recorder {
  private readonly store: RecordingStore;
  private readonly player: WavPlayer;
  private readonly limits: RecordingLimits;
  private chunks: Int16Array[] = [];
  private sampleCount = 0;
  private releaseFrames: Unsubscribe | null = null;
  private paused = false;

  constructor(store: RecordingStore, player: WavPlayer, limits: Partial<RecordingLimits> = {}) {
    this.store = store;
    this.player = player;
    this.limits = { ...recordingLimits, ...limits };
  }

  start(audio: AudioCapture): Promise<void> {
    if (this.releaseFrames !== null) {
      return Promise.reject(new Error('Already recording.'));
    }
    if (audio.state !== 'capturing') {
      return Promise.reject(new Error('The microphone is not capturing.'));
    }
    this.chunks = [];
    this.sampleCount = 0;
    this.paused = false;
    this.releaseFrames = audio.onFrame((pcm16) => {
      this.take(pcm16);
    });
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  async stop(): Promise<RecordingInfo> {
    if (this.releaseFrames === null) {
      throw new Error('Not recording.');
    }
    this.releaseFrames();
    this.releaseFrames = null;
    const samples = joined(this.chunks, this.sampleCount);
    this.chunks = [];
    const info: RecordingInfo = {
      id: createId(),
      seconds: samples.length / captureFormat.sampleRate,
      levels: waveformLevels(samples, this.limits.levelBars),
    };
    await this.store.put({
      ...info,
      createdAt: new Date().toISOString(),
      wav: encodeWav(samples, captureFormat.sampleRate),
    });
    return info;
  }

  play(id: Id, range?: PlaybackRange): Promise<void> {
    this.player.prepare();
    return this.store.get(id).then((recording) => {
      if (recording === null) {
        throw new Error(`No recording ${id}.`);
      }
      return this.player.play(
        range === undefined ? recording.wav : sliceWav(recording.wav, range.fromMs, range.toMs),
      );
    });
  }

  stopPlayback(): void {
    this.player.stop();
  }

  remove(id: Id): Promise<void> {
    return this.store.remove(id);
  }

  async get(id: Id): Promise<RecordingInfo | null> {
    const recording = await this.store.get(id);
    if (recording === null) {
      return null;
    }
    const info: RecordingInfo = {
      id: recording.id,
      seconds: recording.seconds,
      levels: recording.levels,
    };
    if (recording.approval !== undefined) {
      info.approval = recording.approval;
    }
    return info;
  }

  async requestApproval(id: Id): Promise<void> {
    const recording = await this.store.get(id);
    if (recording === null) {
      throw new Error(`No recording ${id}.`);
    }
    await this.store.put({ ...recording, approval: 'pending' });
  }

  async approve(id: Id): Promise<void> {
    const recording = await this.store.get(id);
    if (recording === null) {
      throw new Error(`No recording ${id}.`);
    }
    await this.store.put({ ...recording, approval: 'approved' });
  }

  async list(): Promise<RecordingEntry[]> {
    return (await this.store.list()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Frames are copied: the capture may reuse its buffer. */
  private take(pcm16: Int16Array): void {
    if (this.paused) {
      return;
    }
    const room = this.limits.maxSeconds * captureFormat.sampleRate - this.sampleCount;
    if (room <= 0) {
      return;
    }
    const chunk = pcm16.slice(0, Math.min(room, pcm16.length));
    this.chunks.push(chunk);
    this.sampleCount += chunk.length;
  }
}
