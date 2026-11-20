import { describe, expect, it } from 'vitest';
import type { TrialComparison } from '../../domain/readingStyle';
import type { ReadingStyle } from '../../domain/types';
import { demoSessionStore } from '../../test/sessionStore';
import { readingPreview, styleName, trialSentence } from './views';

const current: ReadingStyle = { font: 'clear', sizeStep: 1, spacingStep: 0, trialEnabled: true };
const tried: ReadingStyle = { ...current, spacingStep: 1 };

function comparison(
  state: TrialComparison['state'],
  averages: [number | null, number | null],
  count: number,
  better: TrialComparison['better'] = null,
): TrialComparison {
  return {
    current: { style: current, average: averages[0], count },
    trial: { style: tried, average: averages[1], count },
    state,
    remaining: Math.max(0, 4 - count),
    better,
  };
}

describe('styleName', () => {
  it('names a style by its letters and its spacing, as V4 does', () => {
    expect(styleName(current)).toBe('Net harfler, normal aralık');
    expect(styleName(tried)).toBe('Net harfler, açık aralık');
    expect(styleName({ ...current, font: 'school', spacingStep: 2 })).toBe(
      'Okul harfleri, daha açık aralık',
    );
  });
});

describe('trialSentence', () => {
  it('says there is nothing to compare yet', () => {
    expect(trialSentence(comparison('none', [null, null], 0))).toBe(
      'Henüz iki ayarla ölçüm yapılmadı. İlk ölçümlerden sonra sonuçlar burada görünür.',
    );
  });

  it('says how many measurements a decision still needs, as the design does', () => {
    expect(trialSentence(comparison('collecting', [69, 72], 2))).toBe(
      'Doğru kelime / dk, 2 ölçümün ortalaması. Fark henüz küçük; karar için 2 ölçüm daha gerekiyor.',
    );
  });

  it('does not call a large difference small while it still collects', () => {
    expect(trialSentence(comparison('collecting', [64, 72], 2))).toBe(
      'Doğru kelime / dk, 2 ölçümün ortalaması. Karar için 2 ölçüm daha gerekiyor.',
    );
  });

  it('calls a difference under five words small after four measurements', () => {
    expect(trialSentence(comparison('smallDifference', [70, 73], 4))).toBe(
      'Doğru kelime / dk, 4 ölçümün ortalaması. Fark küçük; iki ayar da uygun.',
    );
  });

  it('recommends the tried style when it reads better', () => {
    expect(trialSentence(comparison('recommend', [70, 76], 4, 'trial'))).toBe(
      'Net harfler, açık aralık ile ortalama 6 doğru kelime daha fazla okuyor. Bu ayara geçebilirsiniz.',
    );
  });

  it('only names the current style when it reads better', () => {
    expect(trialSentence(comparison('recommend', [77, 70], 4, 'current'))).toBe(
      'Net harfler, normal aralık ile ortalama 7 doğru kelime daha fazla okuyor.',
    );
  });
});

describe('readingPreview', () => {
  it('takes the first two sentences of the chapter read last, with the book’s title', async () => {
    const { store } = await demoSessionStore({ mode: 'veli-haftasonu' });
    await store.getState().load();
    const data = store.getState().data;
    if (data === null) {
      throw new Error('The demo profile did not load.');
    }

    const shown = readingPreview(data);

    expect(shown.title).toBe('Kayıp Fenerin İzinde');
    expect(shown.page).toHaveLength(2);
    expect(shown.page.map((sentence) => sentence.join(' '))).toEqual([
      'Deniz sırt çantasını omzuna aldı.',
      'Tıkır kulaklarını dikti ve rüzgârı dinledi.',
    ]);
  });

  it('takes the first chapter before any reading', async () => {
    const { store } = await demoSessionStore();
    await store.getState().load();
    const data = store.getState().data;
    if (data === null) {
      throw new Error('The demo profile did not load.');
    }

    const shown = readingPreview({ ...data, sessions: [] });

    expect(shown.page).toEqual(data.series.chapters[0]?.pages.flat().slice(0, 2));
  });
});
