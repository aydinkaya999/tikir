import { describe, expect, it } from 'vitest';
import { seedPassages, seriesBook } from './seedContent';

describe('seed content', () => {
  it('loads the series book with its written chapters', () => {
    const book = seriesBook();

    expect(book).toMatchObject({ id: 'kayip-fenerin-izinde', source: 'series', totalChapters: 12 });
    expect(book.chapters).toHaveLength(5);
  });

  it('splits sentences into phrase units and drops the reference stats', () => {
    const chapter = seriesBook().chapters.find((item) => item.number === 4);

    expect(chapter?.pages[0]?.[0]).toEqual(['Deniz sırt çantasını', 'omzuna aldı.']);
    expect(chapter).not.toHaveProperty('stats');
  });

  it('loads the five assessment passages', () => {
    const passages = seedPassages();

    expect(passages.map((passage) => passage.id)).toEqual([
      'olcum-1a',
      'olcum-2a',
      'olcum-3a',
      'olcum-3b',
      'olcum-4a',
    ]);
    expect(passages[0]).not.toHaveProperty('stats');
  });
});
