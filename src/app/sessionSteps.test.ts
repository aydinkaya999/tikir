import { describe, expect, it } from 'vitest';
import { sessionStepAt, sessionSteps } from './sessionSteps';

describe('sessionSteps', () => {
  it('lists the five tiled steps in session order (docs/urun.md, section 3)', () => {
    expect(sessionSteps.map((step) => step.key)).toEqual([
      'warmup',
      'listen',
      'read',
      'record',
      'wrapUp',
    ]);
  });

  it.each([
    ['/seans/isinma', 0, 1],
    ['/seans/dinle', 1, 2],
    ['/seans/oku', 2, 3],
    ['/seans/kayit', 3, 4],
    ['/seans/kapanis', 4, 5],
  ])('%s is step %i ("%i / 5")', (path, current, number) => {
    expect(sessionStepAt(path)).toEqual({ current, number });
  });

  it('treats the done screen as every step finished ("5 / 5", G7)', () => {
    expect(sessionStepAt('/seans/bitti')).toEqual({ current: null, number: 5 });
  });
});
