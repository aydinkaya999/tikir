import { describe, expect, it } from 'vitest';
import { describeCaptureProblem } from './captureProblem';
import { copy } from './copy';

describe('describeCaptureProblem', () => {
  it('explains a refused permission', () => {
    expect(
      describeCaptureProblem('denied', { name: 'NotAllowedError', message: 'Permission denied' }),
    ).toEqual({ message: copy.mic.problems.denied, detail: null });
  });

  it('tells an insecure page apart from a missing microphone', () => {
    expect(
      describeCaptureProblem('unavailable', { name: 'MediaDevicesMissing', message: '…' })?.message,
    ).toBe(copy.mic.problems.insecure);
    expect(
      describeCaptureProblem('unavailable', { name: 'NotFoundError', message: 'No device' })
        ?.message,
    ).toBe(copy.mic.problems.noDevice);
  });

  it('gives the browser’s reason with an error', () => {
    expect(
      describeCaptureProblem('error', { name: 'NotReadableError', message: 'Device in use' }),
    ).toEqual({
      message: copy.mic.problems.error,
      detail: 'Ayrıntı: NotReadableError: Device in use',
    });
  });

  it.each(['idle', 'starting', 'capturing'] as const)('has nothing to say while %s', (state) => {
    expect(describeCaptureProblem(state, null)).toBeNull();
  });
});
