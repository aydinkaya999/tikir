import { describe, expect, it } from 'vitest';
import { toFailure } from './AudioCapture';

describe('toFailure', () => {
  it('keeps the name and message of an error', () => {
    expect(toFailure(new TypeError('bad constraints'))).toEqual({
      name: 'TypeError',
      message: 'bad constraints',
    });
  });

  it('reads them from an exception that is not an Error (DOMException in some engines)', () => {
    expect(toFailure({ name: 'NotAllowedError', message: 'Playback was not allowed' })).toEqual({
      name: 'NotAllowedError',
      message: 'Playback was not allowed',
    });
  });

  it('names anything else a plain error', () => {
    expect(toFailure('boom')).toEqual({ name: 'Error', message: 'boom' });
    expect(toFailure(null)).toEqual({ name: 'Error', message: 'null' });
  });
});
