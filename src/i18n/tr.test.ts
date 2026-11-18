import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tr } from './tr';

describe('tr', () => {
  it('keeps the product name in one place', () => {
    expect(tr.appName).toBe('Tıkır');
  });

  it('contains no emoji, including inside templates', () => {
    const source = readFileSync(new URL('./tr.ts', import.meta.url), 'utf8');

    expect(source).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
