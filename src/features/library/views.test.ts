import { describe, expect, it } from 'vitest';
import { type DemoSessionOptions, demoSessionStore } from '../../test/sessionStore';
import type { SessionData } from '../session/sessionStore';
import { coverPatterns, libraryView } from './views';

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
    expect(view.canStart).toBe(true);
  });

  it('keeps the books for tomorrow once today has its session (P5)', async () => {
    expect(libraryView(await demoData({ step: 'read-1' })).canStart).toBe(false);
    expect(libraryView(await demoData({ step: 'done' })).canStart).toBe(false);
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
