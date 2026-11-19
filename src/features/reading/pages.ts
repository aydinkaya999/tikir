// The pages a reading screen shows (docs/kararlar.md D12; docs/planlar/faz-2a.md, karar 3). Each
// content page is a page, except in the design scenario: G3 and G4 show content pages 1 and 2 as
// one page, and the rest as the second.
import { tokenizePage } from '../../domain/text';
import type { Chapter, Page } from '../../domain/types';

export type PageLayout = 'content' | 'design';

export interface ScreenPage {
  page: Page;
  /** The index of the page's first word in the chapter (WordResult.index). */
  firstIndex: number;
  wordCount: number;
  /** Phrase units, as the narrator counts them. */
  unitCount: number;
}

export function screenPages(chapter: Chapter, layout: PageLayout = 'content'): ScreenPage[] {
  const groups =
    layout === 'design'
      ? [chapter.pages.slice(0, 2), chapter.pages.slice(2)]
      : chapter.pages.map((page) => [page]);
  const pages: ScreenPage[] = [];
  let firstIndex = 0;
  for (const group of groups.filter((item) => item.length > 0)) {
    const wordCount = group.reduce((sum, page) => sum + tokenizePage(page).length, 0);
    const page = group.flat();
    pages.push({ page, firstIndex, wordCount, unitCount: page.flat().length });
    firstIndex += wordCount;
  }
  return pages;
}

/** The page that holds the word; past the end, the last page. */
export function screenPageOf(pages: readonly ScreenPage[], wordIndex: number): number {
  let found = 0;
  pages.forEach((page, index) => {
    if (page.firstIndex <= wordIndex) {
      found = index;
    }
  });
  return found;
}
