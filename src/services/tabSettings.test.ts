import { afterEach, describe, expect, it, vi } from 'vitest';
import { readTabSetting, writeTabSetting } from './tabSettings';

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
}

describe('tab settings', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a value for the tab and forgets it on null', () => {
    vi.stubGlobal('sessionStorage', memoryStorage());

    writeTabSetting('anahtar', 'design');
    expect(readTabSetting('anahtar')).toBe('design');

    writeTabSetting('anahtar', null);
    expect(readTabSetting('anahtar')).toBeNull();
  });

  it('reads nothing and never throws where the storage is missing or refuses', () => {
    expect(readTabSetting('anahtar')).toBeNull();
    expect(() => {
      writeTabSetting('anahtar', 'design');
    }).not.toThrow();

    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new DOMException('Blocked', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('Full', 'QuotaExceededError');
      },
      removeItem: () => undefined,
    });
    expect(readTabSetting('anahtar')).toBeNull();
    expect(() => {
      writeTabSetting('anahtar', 'design');
    }).not.toThrow();
  });
});
