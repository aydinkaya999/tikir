import { describe, expect, it } from 'vitest';
import { chapterTokens } from '../../domain/text';
import type { Chapter } from '../../domain/types';
import { seriesBook } from '../../services/repository/seedContent';
import { screenPageOf, screenPages } from './pages';

function chapter(number: number): Chapter {
  const found = seriesBook().chapters.find((item) => item.number === number);
  if (found === undefined) {
    throw new Error(`chapter ${number} is missing`);
  }
  return found;
}

describe('screenPages', () => {
  it('shows each content page as a page', () => {
    const pages = screenPages(chapter(4));

    expect(pages.map((page) => page.firstIndex)).toEqual([0, 25, 45, 59, 73, 88]);
    expect(pages.map((page) => page.wordCount)).toEqual([25, 20, 14, 14, 15, 11]);
  });

  it('joins content pages 1 and 2 in the design layout, and the rest into a second page', () => {
    const pages = screenPages(chapter(4), 'design');

    expect(pages.map((page) => page.firstIndex)).toEqual([0, 45]);
    expect(pages.map((page) => page.wordCount)).toEqual([45, 54]);
    expect(pages[0]?.page).toHaveLength(7);
    expect(pages[0]?.unitCount).toBe(18);
    expect(screenPageOf(pages, 44)).toBe(0);
    expect(screenPageOf(pages, 45)).toBe(1);
  });

  it('groups chapter 5 the same way', () => {
    const five = chapter(5);
    const tokens = chapterTokens(five);
    const pages = screenPages(five, 'design');

    expect(pages).toHaveLength(2);
    expect(pages[0]?.wordCount).toBe(tokens.filter((token) => token.page <= 1).length);
    expect(pages[1]?.firstIndex).toBe(tokens.find((token) => token.page === 2)?.index);
    expect(pages[1]?.wordCount).toBe(tokens.filter((token) => token.page >= 2).length);
  });

  it('keeps a one-page chapter one page in the design layout', () => {
    const onePage: Chapter = { ...chapter(4), pages: chapter(4).pages.slice(0, 1) };

    expect(screenPages(onePage, 'design')).toHaveLength(1);
  });
});
