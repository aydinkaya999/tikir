import { describe, expect, it } from 'vitest';
import {
  describeAppliedSettings,
  formatDbfs,
  formatMs,
  formatSeconds,
  meterValue,
  trialFileName,
} from './format';

describe('meterValue', () => {
  it.each([
    [0, 0],
    [1, 1],
    [0.001, 0], // -60 dBFS, the bottom of the scale
    [2, 1], // above full scale stays full
  ])('puts RMS %f at %f', (rms, expected) => {
    expect(meterValue(rms)).toBeCloseTo(expected, 6);
  });

  it('is linear in decibels: -30 dBFS is half way', () => {
    expect(Math.abs(meterValue(0.0316) - 0.5)).toBeLessThanOrEqual(0.01);
  });
});

describe('formatDbfs', () => {
  it('rounds to whole decibels, Turkish style', () => {
    expect(formatDbfs(0.5)).toBe('-6 dBFS');
  });

  it('calls a zero level silence', () => {
    expect(formatDbfs(0)).toBe('Sessiz');
  });
});

describe('formatSeconds and formatMs', () => {
  it('keep one decimal with a comma', () => {
    expect(formatSeconds(10)).toBe('10,0');
    expect(formatSeconds(4.2)).toBe('4,2');
    expect(formatMs(12.345)).toBe('12,3');
  });
});

describe('trialFileName', () => {
  it('names downloads by local date and time to the second, so takes A and B do not collide', () => {
    expect(trialFileName(new Date(2026, 10, 19, 14, 32, 5), 'wav')).toBe(
      'ses-denemesi-20261119-143205.wav',
    );
    expect(trialFileName(new Date(2026, 0, 5, 7, 3, 9), 'json')).toBe(
      'ses-denemesi-20260105-070309.json',
    );
  });
});

describe('describeAppliedSettings', () => {
  it('names each processing setting as on, off, a reported mode or unknown', () => {
    expect(
      describeAppliedSettings({ echoCancellation: 'remote-only', noiseSuppression: false }),
    ).toBe('Yankı giderme remote-only, Gürültü bastırma kapalı, Otomatik kazanç bilinmiyor');
    expect(
      describeAppliedSettings({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }),
    ).toBe('Yankı giderme açık, Gürültü bastırma açık, Otomatik kazanç açık');
  });

  it('is unknown before the microphone has opened', () => {
    expect(describeAppliedSettings(null)).toBe('bilinmiyor');
  });
});
