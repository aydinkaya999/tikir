import { describe, expect, it } from 'vitest';
import sampleBooks from '../../../seed/ornek-kitaplar.json';
import { chapterSentences } from '../../domain/books';
import { MockBookGenerator } from './MockBookGenerator';

const design = { hero: 'cocuk-ve-tikir', place: 'uzay-istasyonu', event: 'gizemli-ses' };

/** The text on U2's design. */
const designText =
  'Dinozorlar milyonlarca yıl önce yaşadı. Bazıları bir otobüsten uzundu, bazıları ise bir tavuk kadar küçüktü. Bilim insanları, kemiklerini inceleyerek onların nasıl yaşadığını anlamaya çalışıyor.';

function generator() {
  let id = 0;
  return new MockBookGenerator({
    delayMs: 0,
    createId: () => {
      id += 1;
      return `kitap-${String(id)}`;
    },
  });
}

describe('MockBookGenerator', () => {
  it('gives U3 the content’s cards', () => {
    expect(generator().cards()).toEqual(sampleBooks.cards);
  });

  it('makes the sample book from cards, titled by the cards and named for the child', async () => {
    const books = generator();

    const book = await books.fromCards({ choice: design, childName: 'Ali', grade: 2 });

    expect(book).toMatchObject({
      id: 'kitap-1',
      title: 'Uzay İstasyonunda Gizemli Ses',
      grade: 2,
      source: 'cards',
      totalChapters: 1,
      insertedWords: ['kıvrılıyordu', 'belirdiğinde', 'ağaçlarının'],
      request: { kind: 'cards', ...design },
    });
    const [chapter] = book.chapters;
    const text = chapter === undefined ? '' : chapterSentences(chapter).join(' ');
    expect(text).not.toMatch(/Deniz/);
    expect(text.match(/Ali/g)).toHaveLength(3);
    expect(chapter?.pages).toHaveLength(6);
    expect(chapter?.questions).toHaveLength(2);
    expect(chapter?.chains).toHaveProperty('kıvrılıyordu');
    expect((await books.fromCards({ choice: design, childName: 'Ali', grade: 2 })).id).toBe(
      'kitap-2',
    );
  });

  it('makes a book from a parent’s text, as written', async () => {
    const request = {
      kind: 'text' as const,
      text: designText,
      grade: 3 as const,
      length: 'medium' as const,
      insertStuckWords: true,
      addQuestions: true,
    };

    const book = await generator().fromText(request);

    expect(book).toMatchObject({
      title: 'Dinozorlar milyonlarca yıl önce yaşadı',
      grade: 3,
      source: 'parentText',
      totalChapters: 1,
      request,
    });
    expect(book.chapters[0]?.pages).toHaveLength(1);
    expect(book.chapters[0]?.questions).toEqual([]);
    expect(book.insertedWords).toBeUndefined();
  });

  it('gives up when asked, and gives no book', async () => {
    const books = new MockBookGenerator({ delayMs: 60_000 });
    const control = new AbortController();

    const making = books.fromCards({ choice: design, childName: 'Ali', grade: 3 }, control.signal);
    control.abort();

    await expect(making).rejects.toMatchObject({ name: 'AbortError' });
    const aborted = new AbortController();
    aborted.abort();
    await expect(
      books.fromText(
        {
          kind: 'text',
          text: 'Kısa.',
          grade: 2,
          length: 'short',
          insertStuckWords: false,
          addQuestions: false,
        },
        aborted.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
