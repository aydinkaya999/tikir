import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const repositoryRoot = new URL('../', import.meta.url);

function read(relativePath: string): Buffer {
  return readFileSync(new URL(relativePath, repositoryRoot));
}

// design/ is a read-only reference the app must not link to (design/README.md), so the files
// the app needs are copied into src/. Each copy must stay byte-identical to its source.
const illustrations = readdirSync(new URL('src/assets/illustrations/', repositoryRoot));

const copies: [copy: string, source: string][] = [
  ['src/styles/tokens.css', 'design/tokens.css'],
  ['src/components/Icon/icons.json', 'design/svg/ikonlar.json'],
  ...illustrations.map((file): [string, string] => [
    `src/assets/illustrations/${file}`,
    `design/svg/${file}`,
  ]),
];

describe('illustrations', () => {
  it('include every Tıkır face, monster and tile drawing', () => {
    expect(illustrations).toHaveLength(17);
  });
});

describe('copies of design files', () => {
  it.each(copies)('%s is identical to %s', (copy, source) => {
    expect(read(copy).equals(read(source))).toBe(true);
  });
});
