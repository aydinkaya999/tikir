import { describe, expect, it } from 'vitest';
import { sine, zeroCrossingHz } from '../../test/signal';
import { CaptureChain, type ChainOutput } from './captureChain';
import { toFloat32 } from './pcm';

/** Feeds the input in 128-sample render quanta, as the AudioWorklet does, then flushes. */
function run(inputRate: number, input: Float32Array): ChainOutput {
  const chain = new CaptureChain(inputRate);
  const output: ChainOutput = { frames: [], levels: [] };
  const collect = (part: ChainOutput) => {
    output.frames.push(...part.frames);
    output.levels.push(...part.levels);
  };
  for (let offset = 0; offset < input.length; offset += 128) {
    collect(chain.process(input.subarray(offset, offset + 128)));
  }
  collect(chain.flush());
  return output;
}

describe('CaptureChain', () => {
  it('turns a second of 48 kHz audio into 50 frames of 16 kHz PCM and 20 levels', () => {
    const tone = sine({ hz: 1000, sampleRate: 48_000, seconds: 1, amplitude: 0.5 });

    const { frames, levels } = run(48_000, tone);

    expect(frames).toHaveLength(50);
    expect(frames.every((frame) => frame.length === 320)).toBe(true);
    expect(levels).toHaveLength(20);
    levels.slice(1).forEach((level) => {
      expect(Math.abs(level - 0.3536)).toBeLessThanOrEqual(0.3536 * 0.01);
    });
    const samples = toFloat32(Int16Array.from(frames.flatMap((frame) => Array.from(frame))));
    expect(Math.abs(zeroCrossingHz(samples, 16_000) - 1000)).toBeLessThanOrEqual(2);
  });

  it('gives 50 frames for a second of 44.1 kHz audio too', () => {
    const tone = sine({ hz: 1000, sampleRate: 44_100, seconds: 1, amplitude: 0.5 });

    expect(run(44_100, tone).frames).toHaveLength(50);
  });
});
