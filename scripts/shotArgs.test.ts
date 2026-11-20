import { describe, expect, it } from 'vitest';
import { parseShotArgs } from './shotArgs';

describe('parseShotArgs', () => {
  it('reads the steps in order and the routes', () => {
    expect(
      parseShotArgs([
        '--dokun',
        'Kelimeyi dinle',
        '--bekle',
        'Dinliyor. Duraklatmak için dokun',
        '--ileri',
        '1200',
        '/a',
        '/b?x=1',
      ]),
    ).toEqual({
      steps: [
        { kind: 'tap', name: 'Kelimeyi dinle' },
        { kind: 'wait', name: 'Dinliyor. Duraklatmak için dokun' },
        { kind: 'advance', ms: 1200 },
      ],
      routes: ['/a', '/b?x=1'],
    });
  });

  it('takes plain routes with no steps and ignores a bare --', () => {
    expect(parseShotArgs(['--', '/'])).toEqual({ steps: [], routes: ['/'] });
  });

  it('refuses a clock move that is not a whole number of milliseconds', () => {
    expect(() => parseShotArgs(['--ileri', 'abc', '/'])).toThrow('--ileri');
    expect(() => parseShotArgs(['--ileri', '-5', '/'])).toThrow('--ileri');
  });

  it('refuses a step without its value, a route without a slash and no route at all', () => {
    expect(() => parseShotArgs(['/', '--dokun'])).toThrow('--dokun');
    expect(() => parseShotArgs(['seans/oku'])).toThrow('seans/oku');
    expect(() => parseShotArgs(['--ileri', '100'])).toThrow('route');
  });
});
