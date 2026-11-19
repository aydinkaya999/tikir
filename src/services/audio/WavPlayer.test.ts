import { describe, expect, it } from 'vitest';
import { WebAudioWavPlayer } from './WavPlayer';

/** Just enough of an AudioContext: decoding waits for the test, sources record what happens. */
function fakeContext() {
  const events: string[] = [];
  let finishDecoding: () => void = () => undefined;
  let lastSource: { onended: (() => void) | null } | null = null;
  const context = {
    destination: {},
    resume: () => Promise.resolve(),
    decodeAudioData: () =>
      new Promise((resolve) => {
        finishDecoding = () => {
          resolve({});
        };
      }),
    createBufferSource: () => {
      const source = {
        buffer: null,
        onended: null as (() => void) | null,
        connect: () => undefined,
        disconnect: () => undefined,
        start: () => events.push('start'),
        stop: () => events.push('stop'),
      };
      lastSource = source;
      return source;
    },
  };
  return {
    events,
    decode: () => {
      finishDecoding();
    },
    end: () => lastSource?.onended?.(),
    player: new WebAudioWavPlayer(() => context as unknown as AudioContext),
  };
}

/** Lets pending promise callbacks run. */
async function settle(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    await Promise.resolve();
  }
}

describe('WebAudioWavPlayer', () => {
  it('plays to the end and then resolves', async () => {
    const { events, decode, end, player } = fakeContext();
    let done = false;
    const playing = player.play(new ArrayBuffer(8)).then(() => {
      done = true;
    });

    await settle();
    decode();
    await settle();
    expect(events).toEqual(['start']);
    expect(done).toBe(false);

    end();
    await playing;
    expect(done).toBe(true);
  });

  it('a stop while the file is still decoding cancels the play', async () => {
    const { events, decode, player } = fakeContext();
    const playing = player.play(new ArrayBuffer(8));
    await settle();

    player.stop(); // pressed before decoding finished (WebKit, phase 1)
    decode();
    await playing;

    expect(events).toEqual([]);
  });

  it('a stop during playback stops the source and resolves the play', async () => {
    const { events, decode, player } = fakeContext();
    const playing = player.play(new ArrayBuffer(8));
    await settle();
    decode();
    await settle();

    player.stop();
    await playing;

    expect(events).toEqual(['start', 'stop']);
  });
});

describe('WebAudioWavPlayer.prepare', () => {
  it('creates the context and starts resuming it at once, inside the gesture', () => {
    const events: string[] = [];
    let created = 0;
    const player = new WebAudioWavPlayer(() => {
      created += 1;
      return {
        resume: () => {
          events.push('resume');
          return Promise.resolve();
        },
      } as unknown as AudioContext;
    });

    player.prepare();

    expect(created).toBe(1);
    expect(events).toEqual(['resume']); // synchronously, before anything is awaited
  });
});
