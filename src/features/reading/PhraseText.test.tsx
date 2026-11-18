import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Page } from '../../domain/types';
import { PhraseText } from './PhraseText';

const page: Page = [
  ['Deniz sırt çantasını', 'omzuna aldı.'],
  ['Tıkır kulaklarını dikti', 've rüzgârı dinledi.'],
  ['Dar patika,', 'çam ağaçlarının arasından', 'yukarıya kıvrılıyordu.'],
  ['“Fener', 'bu tepenin ardında olmalı,”', 'dedi Deniz.'],
];

describe('PhraseText', () => {
  it('separates the units of a sentence with decorative bars, sentences with a space', () => {
    const { container } = render(<PhraseText page={page} />);

    expect(container.querySelectorAll('[data-unit-index]')).toHaveLength(10);
    const bars = container.querySelectorAll('[data-part="divider"]');
    expect(bars).toHaveLength(6);
    for (const bar of bars) {
      expect(bar).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('marks the unit being read and the ones already read (G3)', () => {
    const { container } = render(<PhraseText page={page} currentUnit={6} readUnits={6} />);
    const units = Array.from(container.querySelectorAll('[data-unit-index]'));

    expect(units.filter((unit) => unit.hasAttribute('data-read'))).toHaveLength(6);
    expect(units.filter((unit) => unit.hasAttribute('data-current'))).toEqual([units[6]]);
    expect(units[6]).toHaveTextContent('yukarıya kıvrılıyordu.');
  });
});
