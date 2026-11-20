import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './id';

const version4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes distinct RFC 4122 version 4 ids', () => {
    const ids = Array.from({ length: 100 }, () => createId());

    expect(new Set(ids).size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(version4);
    }
  });

  it('works where crypto.randomUUID is missing (an insecure context)', () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal('crypto', { getRandomValues });

    expect(createId()).toMatch(version4);
  });
});
