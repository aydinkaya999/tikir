// V4's words (docs/planlar/faz-3.md, karar 24): the preview's text, a style's name and the
// comparison's sentence.
import { trialSmallDifference } from '../../domain/config';
import type { TrialComparison } from '../../domain/readingStyle';
import type { Page, ReadingStyle } from '../../domain/types';
import { tr } from '../../i18n/tr';
import type { SessionData } from '../session/sessionStore';

const copy = tr.readingStyle;

/** "Net harfler, normal aralık". */
export function styleName(style: ReadingStyle): string {
  const spacing = copy.spacings[style.spacingStep];
  return copy.trial.styleName(copy.fonts[style.font].label, spacing.toLocaleLowerCase('tr-TR'));
}

/** The sentence under the two styles' rows, for each state of the comparison. */
export function trialSentence(comparison: TrialComparison): string {
  const { current, trial, state, remaining, better } = comparison;
  const difference =
    current.average === null || trial.average === null ? 0 : trial.average - current.average;
  switch (state) {
    case 'none':
      return copy.trial.none;
    case 'collecting':
      // The design's sentence calls the difference small: a large one is not called so.
      return Math.abs(difference) < trialSmallDifference
        ? copy.trial.collecting(current.count, remaining)
        : copy.trial.collectingApart(current.count, remaining);
    case 'smallDifference':
      return copy.trial.small(current.count);
    case 'recommend': {
      const gain = Math.round(Math.abs(difference));
      // Only the tried style is one to switch to.
      return better === 'trial'
        ? `${copy.trial.better(styleName(trial.style), gain)} ${copy.trial.switchTo}`
        : copy.trial.better(styleName(current.style), gain);
    }
  }
}

/**
 * The preview (karar 24): the book's title and the first two sentences of the chapter the child
 * read last; before any reading, of the first chapter.
 */
export function readingPreview(data: SessionData): { title: string; page: Page } {
  const lastRead = [...data.sessions]
    .reverse()
    .find((session) => session.readings.length > 0 && session.chapterRef.bookId === data.series.id);
  const chapter =
    data.series.chapters.find((each) => each.number === lastRead?.chapterRef.chapter) ??
    data.series.chapters[0];
  return { title: data.series.title, page: (chapter?.pages.flat() ?? []).slice(0, 2) };
}
