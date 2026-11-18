import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Page } from '../../domain/types';
import { ReadingText } from './ReadingText';

// seed/kayip-fenerin-izinde.json, chapter 4, page 1 (as phrase units).
const page: Page = [
  ['Deniz sırt çantasını', 'omzuna aldı.'],
  ['Tıkır kulaklarını dikti', 've rüzgârı dinledi.'],
  ['Dar patika,', 'çam ağaçlarının arasından', 'yukarıya kıvrılıyordu.'],
  ['“Fener', 'bu tepenin ardında olmalı,”', 'dedi Deniz.'],
];

function words(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-word-index]'));
}

function visibleText(word: HTMLElement) {
  return word.querySelector('[data-part="text"]')?.textContent;
}

describe('ReadingText', () => {
  it('shows every word with its punctuation in one span, numbered from firstIndex', () => {
    const { container } = render(<ReadingText page={page} firstIndex={100} />);
    const spans = words(container);

    expect(spans).toHaveLength(25);
    expect(spans[0]).toHaveAttribute('data-word-index', '100');
    expect(visibleText(spans[4] as HTMLElement)).toBe('aldı.');
    expect(visibleText(spans[18] as HTMLElement)).toBe('“Fener');
    expect(visibleText(spans[22] as HTMLElement)).toBe('olmalı,”');
  });

  it('marks the G4 moment: read words, the current word, the ghost and the two marks', () => {
    const { container } = render(
      <ReadingText
        page={page}
        readCount={14}
        currentIndex={14}
        ghostIndex={12}
        marks={{ 6: 'hesitation', 9: 'error' }}
      />,
    );
    const spans = words(container);

    expect(spans.filter((span) => span.hasAttribute('data-read'))).toHaveLength(14);
    expect(spans.filter((span) => span.hasAttribute('data-current'))).toEqual([spans[14]]);
    expect(spans.filter((span) => span.hasAttribute('data-ghost'))).toEqual([spans[12]]);
    expect(spans[6]).toHaveAttribute('data-mark', 'hesitation');
    expect(spans[9]).toHaveAttribute('data-mark', 'error');
    expect(visibleText(spans[14] as HTMLElement)).toBe('ağaçlarının');
  });

  it('reserves the bold width with a copy that assistive technology never reads', () => {
    const { container } = render(<ReadingText page={page} />);

    for (const span of words(container)) {
      const reserve = span.querySelector('[data-part="reserve"]');
      expect(reserve).toHaveAttribute('aria-hidden', 'true');
      expect(reserve?.textContent).toBe(visibleText(span));
    }
  });
});
