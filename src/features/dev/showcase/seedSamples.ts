// Reading samples for the showcase come from seed/ (CLAUDE.md: never invent the child's text).
import seriesBook from '../../../../seed/kayip-fenerin-izinde.json';
import { splitPhraseUnits } from '../../../domain/text';
import type { Page } from '../../../domain/types';

const chapter4 = seriesBook.chapters.find((chapter) => chapter.number === 4);
if (!chapter4) {
  throw new Error('seed/kayip-fenerin-izinde.json has no chapter 4');
}

/** Chapter 4, page 1 as phrase units: the page the G4 design shows. */
export const samplePage: Page = (chapter4.pages[0] ?? []).map(splitPhraseUnits);

export const samplePageCount = chapter4.pages.length;

/** Plain text of the sample page (phrase-unit markers removed). */
export const samplePageText = samplePage.map((sentence) => sentence.join(' ')).join(' ');
