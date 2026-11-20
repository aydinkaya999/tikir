import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import seriesBook from '../../../seed/kayip-fenerin-izinde.json';
import { splitPhraseUnits } from '../../domain/text';
import type { Page } from '../../domain/types';
import { unitDurationMs } from './Narrator';
import { SilentNarrator } from './SilentNarrator';

/** Chapter 4, content pages 1 and 2 as one page, as G3 shows them (docs/kararlar.md D12). */
function mergedPage(): Page {
  const chapter = seriesBook.chapters.find((item) => item.number === 4);
  if (chapter === undefined) {
    throw new Error('seed chapter 4 is missing');
  }
  return chapter.pages.slice(0, 2).flat().map(splitPhraseUnits);
}

function narrator() {
  return new SilentNarrator({ now: () => Date.now() });
}

describe('estimateSeconds', () => {
  it('times the merged G3 page at 47.0 s slow and 38.5 s normal', () => {
    const page = mergedPage();
    const silent = narrator();
    expect(page.flat()).toHaveLength(18);

    expect(silent.estimateSeconds(page)).toBeCloseTo(47, 6);
    silent.setRate('normal');
    expect(silent.estimateSeconds(page)).toBeCloseTo(38.5, 6);
  });
});

describe('SilentNarrator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces every phrase unit at its time and completes the page', async () => {
    const page = mergedPage();
    const silent = narrator();
    const started = Date.now();
    const times: number[] = [];

    const end = silent.speakPage(page, () => times.push(Date.now() - started));
    vi.advanceTimersByTime(48000);

    await expect(end).resolves.toBe('completed');
    let expected = 0;
    page.flat().forEach((unit, index) => {
      expect(Math.abs((times[index] ?? Infinity) - expected)).toBeLessThanOrEqual(10);
      expected += unitDurationMs(unit, 'slow');
    });
    expect(times).toHaveLength(18);
  });

  it('stops: the page ends as stopped and no unit follows', async () => {
    const silent = narrator();
    const units: number[] = [];

    const end = silent.speakPage(mergedPage(), (unit) => units.push(unit));
    vi.advanceTimersByTime(3000);
    silent.stop();
    vi.advanceTimersByTime(60000);

    await expect(end).resolves.toBe('stopped');
    expect(units).toEqual([0, 1]);
  });

  it('pauses within a unit and goes on with what is left of it', () => {
    const page = mergedPage();
    const silent = narrator();
    const units: number[] = [];
    const first = unitDurationMs(page.flat()[0] ?? '', 'slow');

    void silent.speakPage(page, (unit) => units.push(unit));
    vi.advanceTimersByTime(Math.floor(first / 2));
    silent.pause();
    vi.advanceTimersByTime(10000);
    expect(units).toEqual([0]);

    silent.resume();
    vi.advanceTimersByTime(Math.ceil(first / 2) - 5);
    expect(units).toEqual([0]);
    vi.advanceTimersByTime(10);
    expect(units).toEqual([0, 1]);
  });

  it('reads a word in its syllable time and changes speed from the next unit', async () => {
    const silent = narrator();
    const word = silent.speakWord('ağaçlarının');
    const wordMs = (5 / 2.8) * 1000 + 250;

    vi.advanceTimersByTime(Math.floor(wordMs) - 5);
    let settled = false;
    void word.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    vi.advanceTimersByTime(10);
    await expect(word).resolves.toBe('completed');

    const times: number[] = [];
    const started = Date.now();
    const page: Page = [['Dar patika,', 'çam ağaçlarının arasından']];
    void silent.speakPage(page, (unit) => {
      times.push(Date.now() - started);
      if (unit === 0) {
        silent.setRate('normal');
      }
    });
    vi.advanceTimersByTime(10000);

    expect(Math.abs((times[1] ?? 0) - unitDurationMs('Dar patika,', 'slow'))).toBeLessThanOrEqual(
      1,
    );
    expect(silent.rate).toBe('normal');
  });
});
