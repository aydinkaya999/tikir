import { afterEach, describe, expect, it, vi } from 'vitest';
import { notifyAll } from './notify';

describe('notifyAll', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls every listener and reports one that throws without stopping the rest', () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const failure = new Error('listener failed');
    const calls: string[] = [];

    notifyAll<number>(
      [
        (value) => calls.push(`first ${value}`),
        () => {
          throw failure;
        },
        (value) => calls.push(`third ${value}`),
      ],
      7,
    );

    expect(calls).toEqual(['first 7', 'third 7']);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(failure);
  });

  it('falls back to console.error where reportError is missing', () => {
    vi.stubGlobal('reportError', undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('listener failed');

    notifyAll<undefined>(
      [
        () => {
          throw failure;
        },
      ],
      undefined,
    );

    expect(consoleError).toHaveBeenCalledWith(failure);
    consoleError.mockRestore();
  });
});
