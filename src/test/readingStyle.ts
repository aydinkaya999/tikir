// The reading style a reading text is shown in (docs/planlar/faz-3.md, karar 23): read from the
// container ReadingStyleScope writes, since the test DOM computes no CSS.
import type { ReadingStyle } from '../domain/types';

/** The far end of the reading style: school letters, the largest size, the widest spacing. */
export const schoolLargest: ReadingStyle = {
  font: 'school',
  sizeStep: 3,
  spacingStep: 2,
  trialEnabled: false,
};

export function shownStyle(text: Element | null) {
  const scope = text?.closest('[data-reading-font]') ?? null;
  return {
    font: scope?.getAttribute('data-reading-font') ?? null,
    size: scope?.getAttribute('data-reading-size') ?? null,
    spacing: scope?.getAttribute('data-reading-spacing') ?? null,
  };
}

export const schoolLargestShown = { font: 'school', size: '3', spacing: '2' };
