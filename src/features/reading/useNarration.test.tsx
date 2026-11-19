import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SilentNarrator } from '../../services/narrator/SilentNarrator';
import { seriesBook } from '../../services/repository/seedContent';
import { screenPages } from './pages';
import { useNarration } from './useNarration';

const now = () => Date.now();

function designPages() {
  const chapter = seriesBook().chapters.find((item) => item.number === 4);
  if (chapter === undefined) {
    throw new Error('chapter 4 is missing');
  }
  return screenPages(chapter, 'design');
}

function setup() {
  const narrator = new SilentNarrator({ now });
  const stop = vi.spyOn(narrator, 'stop');
  const pages = designPages();
  const hook = renderHook(() => useNarration({ narrator, pages, now }));
  return { narrator, stop, pages, ...hook };
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('useNarration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the pages one after another and remembers it read them all', async () => {
    const { result } = setup();
    expect(result.current.totalMs).toBeCloseTo(47000, 0);

    act(() => {
      result.current.play();
    });
    expect(result.current.currentUnit).toBe(0);
    expect(result.current.playing).toBe(true);

    await advance(47100);
    expect(result.current.pageIndex).toBe(1);
    expect(result.current.finishedOnce).toBe(false);

    await advance(60000);
    expect(result.current.finishedOnce).toBe(true);
    expect(result.current.playing).toBe(false);
  });

  it('pauses, resumes, restarts and changes speed', async () => {
    const { result } = setup();
    act(() => {
      result.current.play();
    });
    await advance(5000);

    act(() => {
      result.current.pause();
    });
    const held = result.current;
    await advance(10000);
    expect(result.current.currentUnit).toBe(held.currentUnit);
    expect(result.current.elapsedMs).toBe(held.elapsedMs);
    expect(result.current.playing).toBe(false);

    act(() => {
      result.current.resume();
    });
    await advance(5000);
    expect(result.current.readUnits).toBeGreaterThan(held.readUnits);

    await advance(120000);
    expect(result.current.finishedOnce).toBe(true);
    act(() => {
      result.current.restart();
    });
    expect(result.current.pageIndex).toBe(0);
    expect(result.current.currentUnit).toBe(0);
    expect(result.current.finishedOnce).toBe(true);

    act(() => {
      result.current.setRate('normal');
    });
    expect(result.current.totalMs).toBeCloseTo(38500, 0);
  });

  it('stops the narration when the screen goes', () => {
    const { result, stop, unmount } = setup();
    act(() => {
      result.current.play();
    });

    unmount();

    expect(stop).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
