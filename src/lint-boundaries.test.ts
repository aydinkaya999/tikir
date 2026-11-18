import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// CLAUDE.md: components and screens never touch the microphone, the network or storage
// directly; they go through the interfaces in src/services. ESLint enforces the boundary.

const eslint = new ESLint();

/** Names the effective `no-restricted-globals` setting forbids in a file. */
async function restrictedGlobals(filePath: string): Promise<string[]> {
  const config: unknown = await eslint.calculateConfigForFile(filePath);
  const rules = (config as { rules?: Record<string, unknown> } | undefined)?.rules ?? {};
  const setting = rules['no-restricted-globals'];
  if (!Array.isArray(setting)) {
    return [];
  }
  return setting.slice(1).flatMap((entry: unknown) => {
    if (typeof entry === 'string') {
      return [entry];
    }
    const name = (entry as { name?: unknown } | null)?.name;
    return typeof name === 'string' ? [name] : [];
  });
}

/** The microphone, the network, storage, and the global objects that reach them. */
const forbidden = [
  'navigator',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'caches',
  'AudioContext',
  'MediaRecorder',
  'Audio',
  'Image',
  'Worker',
  'window',
  'self',
  'globalThis',
];

describe('browser API boundary', () => {
  it.each([
    'src/domain/text.ts',
    'src/components/Button/Button.tsx',
    'src/features/session/pages.tsx',
    'src/features/dev/showcase/ShowcasePage.tsx',
    'src/app/router.tsx',
    'src/app/shells/SessionShell.tsx',
  ])('%s cannot reach the microphone, the network or storage', async (filePath) => {
    expect(await restrictedGlobals(filePath)).toEqual(expect.arrayContaining(forbidden));
  });

  it('leaves src/services, the one layer that wraps those APIs, free to use them', async () => {
    expect(await restrictedGlobals('src/services/storage.ts')).toEqual([]);
  });
});
