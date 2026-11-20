import { describe, expect, it } from 'vitest';
import { type DemoSessionOptions, demoSessionStore } from '../../test/sessionStore';
import type { SessionData } from '../session/sessionStore';
import { MockBookGenerator } from '../../services/books/MockBookGenerator';
import { coverPatterns, libraryView, readyView } from './views';

async function demoData(options: DemoSessionOptions = {}): Promise<SessionData> {
  const { store } = await demoSessionStore(options);
  await store.getState().load();
  const data = store.getState().data;
  if (data === null) {
    throw new Error('The demo profile did not load.');
  }
  return data;
}

describe('libraryView (U1)', () => {
  it('shows the series’ progress and the child’s books, the newest first', async () => {
    const view = libraryView(await demoData());

    expect(view.series).toEqual({
      title: 'Kayıp Fenerin İzinde',
      completed: 3,
      total: 12,
      progress: '12 bölümün 3’ü tamam',
    });
    expect(view.books.map((book) => [book.id, book.title, book.source])).toEqual([
      ['uzay-istasyonunda-gizemli-ses', 'Uzay İstasyonunda Gizemli Ses', 'Kartlarla yaptın'],
      ['dinozorlar-neden-buyuktu', 'Dinozorlar Neden Büyüktü?', 'Velin ekledi'],
    ]);
    expect(view.books[0]?.patterns).toEqual(coverPatterns('uzay-istasyonunda-gizemli-ses'));
  });

  it('keeps the books for tomorrow once today has its session (P5)', async () => {
    for (const step of ['read-1', 'done'] as const) {
      expect(libraryView(await demoData({ step })).books.map((book) => book.state)).toEqual([
        'tomorrow',
        'tomorrow',
      ]);
    }
  });
});

describe('coverPatterns', () => {
  it('gives a book the same two patterns every time, never the series’ own', () => {
    for (const id of [
      'uzay-istasyonunda-gizemli-ses',
      'dinozorlar-neden-buyuktu',
      'a',
      'kitap-2',
    ]) {
      const patterns = coverPatterns(id);

      expect(coverPatterns(id)).toEqual(patterns);
      expect(new Set(patterns).size).toBe(2);
      expect(patterns).not.toContain(1);
    }
  });
});

describe('readyView (U4)', () => {
  it('says the stuck words come three times only when each one does', async () => {
    const data = await demoData();
    const book = data.books.find((each) => each.id === 'uzay-istasyonunda-gizemli-ses');
    const chapter = book?.chapters[0];
    if (book === undefined || chapter === undefined) {
      throw new Error('No sample book.');
    }
    expect(readyView(data, book).inserted?.note).toBe(
      'Deniz’in bu hafta takıldığı kelimeler hikâyede üçer kez geçiyor.',
    );

    // The first page carries one of the three "kıvrılıyordu".
    const fewer = { ...book, chapters: [{ ...chapter, pages: chapter.pages.slice(1) }] };
    const view = readyView(data, fewer);

    expect(view.inserted?.words).toEqual(['kıvrılıyordu', 'belirdiğinde', 'ağaçlarının']);
    expect(view.inserted?.note).toBeNull();
  });

  it('shows only the inserted words that are the child’s cards', async () => {
    const data = await demoData();
    const book = data.books.find((each) => each.id === 'uzay-istasyonunda-gizemli-ses');
    if (book === undefined) {
      throw new Error('No sample book.');
    }

    const cards = data.cards.filter((card) => card.word !== 'belirdiğinde');

    expect(readyView({ ...data, cards }, book).inserted?.words).toEqual([
      'kıvrılıyordu',
      'ağaçlarının',
    ]);
    expect(readyView({ ...data, cards: [] }, book).inserted).toBeNull();
  });
});

describe('readyView for a book from cards (review finding 1)', () => {
  it('lets a first grader’s book pass the level check: it is the content’s grade 3 text', async () => {
    const data = await demoData();
    const book = await new MockBookGenerator({ delayMs: 0 }).fromCards({
      choice: { hero: 'cocuk-ve-tikir', place: 'uzay-istasyonu', event: 'gizemli-ses' },
      childName: 'Deniz',
      grade: 1,
    });

    const view = readyView({ ...data, child: { ...data.child, grade: 1 } }, book);

    expect(view.passed).toBe(true);
    expect(view.level[0]).toEqual({ text: '3. sınıf düzeyine uygun', ok: true });
  });
});

describe('the book read today (review finding 2)', () => {
  const cardsBook = 'uzay-istasyonunda-gizemli-ses';

  it('resumes the book today’s session reads; the others wait for tomorrow', async () => {
    const data = await demoData({ book: cardsBook });

    expect(libraryView(data).books.map((book) => [book.id, book.state])).toEqual([
      [cardsBook, 'resume'],
      ['dinozorlar-neden-buyuktu', 'tomorrow'],
    ]);
    const today = data.books.find((book) => book.id === cardsBook);
    const other = data.books.find((book) => book.id === 'dinozorlar-neden-buyuktu');
    if (today === undefined || other === undefined) {
      throw new Error('No sample books.');
    }
    expect(readyView(data, today).start).toBe('resume');
    expect(readyView(data, other).start).toBe('tomorrow');
  });

  it('starts any book on a day without a session, and none once the day is done', async () => {
    expect(libraryView(await demoData()).books.map((book) => book.state)).toEqual([
      'start',
      'start',
    ]);
    expect(
      libraryView(await demoData({ book: cardsBook, step: 'done' })).books.map(
        (book) => book.state,
      ),
    ).toEqual(['tomorrow', 'tomorrow']);
  });
});
