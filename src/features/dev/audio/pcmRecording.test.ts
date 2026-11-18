import { describe, expect, it } from 'vitest';
import { PcmRecording, recordingFrames, summarizeRecording } from './pcmRecording';

function frame(value: number): Int16Array {
  return new Int16Array(320).fill(value);
}

describe('PcmRecording', () => {
  it('fills up at 500 frames: ten seconds, 160 000 samples, in order', () => {
    const recording = new PcmRecording(recordingFrames);
    const answers: boolean[] = [];

    for (let index = 0; index < 500; index += 1) {
      answers.push(recording.append(frame(index)));
    }

    expect(answers.slice(0, 499).every((full) => !full)).toBe(true);
    expect(answers[499]).toBe(true);
    expect(recording.frameCount).toBe(500);
    expect(recording.seconds).toBe(10);
    const samples = recording.toSamples();
    expect(samples).toHaveLength(160_000);
    expect(samples[0]).toBe(0);
    expect(samples[320]).toBe(1);
    expect(samples[159_999]).toBe(499);
  });

  it('ignores frames that arrive once it is full', () => {
    const recording = new PcmRecording(2);
    recording.append(frame(1));
    recording.append(frame(2));

    expect(recording.append(frame(3))).toBe(true);
    expect(recording.frameCount).toBe(2);
    expect(recording.toSamples()[640 - 1]).toBe(2);
  });

  it('knows how long a recording cut short is: 210 frames are 4.2 s', () => {
    const recording = new PcmRecording(recordingFrames);
    for (let index = 0; index < 210; index += 1) {
      recording.append(frame(0));
    }

    expect(recording.seconds).toBeCloseTo(4.2, 10);
  });
});

describe('summarizeRecording', () => {
  it('gives the length and the level of the whole take', () => {
    const recording = new PcmRecording(recordingFrames);
    for (let index = 0; index < 100; index += 1) {
      recording.append(frame(16_384)); // half of full scale
    }

    const summary = summarizeRecording(recording);

    expect(summary.seconds).toBeCloseTo(2, 10);
    expect(summary.frames).toBe(100);
    expect(Math.abs(summary.levelDbfs - -6.02)).toBeLessThanOrEqual(0.01);
  });
});
