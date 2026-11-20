import { describe, expect, it } from 'vitest';
import sampleBooks from '../../seed/ornek-kitaplar.json';
import {
  bookChapterFromText,
  bookTitleFromText,
  type CardSet,
  cardLabel,
  cardsSummary,
  cardsTitle,
  chapterSentences,
  nextBookChapter,
  readingMinutes,
  withChildName,
} from './books';
import { levelCheck } from './readability';
import type { Book, Chapter } from './types';
import { testSession } from '../test/sessions';

const cards: CardSet = sampleBooks.cards;

/** The text on U2's design (design/ekranlar/U2-metinden-kitap-tablet.html). */
const designText =
  'Dinozorlar milyonlarca yıl önce yaşadı. Bazıları bir otobüsten uzundu, bazıları ise bir tavuk kadar küçüktü. Bilim insanları, kemiklerini inceleyerek onların nasıl yaşadığını anlamaya çalışıyor.';

describe('the cards’ sentences (U3)', () => {
  it('gives the design’s choice the design’s title and summary', () => {
    const choice = { hero: 'cocuk-ve-tikir', place: 'uzay-istasyonu', event: 'gizemli-ses' };

    expect(cardsTitle(cards, choice)).toBe('Uzay İstasyonunda Gizemli Ses');
    expect(cardsSummary(cards, choice, 'Deniz')).toBe(
      'Deniz ve Tıkır, uzay istasyonunda gizemli bir sesin peşine düşüyor.',
    );
  });

  it('follows another choice and the child’s name', () => {
    const robot = { hero: 'robot-bip', place: 'orman', event: 'buyuk-yaris' };
    expect(cardsTitle(cards, robot)).toBe('Ormanda Büyük Yarış');
    expect(cardsSummary(cards, robot, 'Ali')).toBe(
      'Robot Bip, ormanda büyük bir yarışa katılıyor.',
    );

    const ali = { hero: 'cocuk-ve-tikir', place: 'deniz-alti', event: 'kayip-harita' };
    expect(cardsSummary(cards, ali, 'Ali')).toBe(
      'Ali ve Tıkır, deniz altında kayıp bir haritanın peşine düşüyor.',
    );
    expect(cards.hero.map((hero) => cardLabel(hero.label, 'Ali'))).toEqual([
      'Ali ve Tıkır',
      'Kâşif kedi',
      'Robot Bip',
    ]);
  });
});

describe('bookChapterFromText (U2, MockBookGenerator.fromText)', () => {
  it('keeps the sentences and splits them into phrase units at their commas', () => {
    const chapter = bookChapterFromText(designText, 'Dinozorlar');

    expect(chapter).toMatchObject({ number: 1, title: 'Dinozorlar', questions: [], chains: {} });
    expect(chapter.pages).toEqual([
      [
        ['Dinozorlar milyonlarca yıl önce yaşadı.'],
        ['Bazıları bir otobüsten uzundu,', 'bazıları ise bir tavuk kadar küçüktü.'],
        [
          'Bilim insanları,',
          'kemiklerini inceleyerek onların nasıl yaşadığını anlamaya çalışıyor.',
        ],
      ],
    ]);
  });

  it('puts at most four sentences on a page', () => {
    const text = 'Bir. İki. Üç. Dört. Beş.';
    expect(bookChapterFromText(text, 'Sayılar').pages.map((page) => page.length)).toEqual([4, 1]);
  });

  it('takes a text without punctuation, numbers and stray spaces', () => {
    expect(bookChapterFromText('Kediler   uyur', 'Kediler').pages).toEqual([[['Kediler uyur']]]);
    expect(bookChapterFromText('Deniz 3 elma\naldı.', 'Elma').pages).toEqual([
      [['Deniz 3 elma aldı.']],
    ]);
  });

  it('ends a line without a closing mark before a new sentence: a title, a verse', () => {
    expect(
      bookChapterFromText(
        'Kırmızı Başlıklı Kız\n\nBir varmış bir yokmuş. Ormanda bir kız yaşarmış.',
        'x',
      ).pages,
    ).toEqual([
      [['Kırmızı Başlıklı Kız'], ['Bir varmış bir yokmuş.'], ['Ormanda bir kız yaşarmış.']],
    ]);
    expect(bookChapterFromText('Ali topu at\r\nAyşe ip atla\r\n3 kedi uyur', 'x').pages).toEqual([
      [['Ali topu at'], ['Ayşe ip atla'], ['3 kedi uyur']],
    ]);
  });

  it('keeps a sentence wrapped over two lines whole', () => {
    expect(
      bookChapterFromText('Dinozorlar milyonlarca yıl önce\nyaşadı. Bazıları uzundu.', 'x').pages,
    ).toEqual([[['Dinozorlar milyonlarca yıl önce yaşadı.'], ['Bazıları uzundu.']]]);
  });

  it('gives the level check the same numbers as the text itself', () => {
    const chapter = bookChapterFromText(designText, 'Dinozorlar');

    expect(levelCheck(chapterSentences(chapter), 3).stats).toEqual(levelCheck(designText, 3).stats);
  });
});

describe('bookTitleFromText', () => {
  it('takes at most six words of the first sentence, without its closing mark', () => {
    expect(bookTitleFromText(designText)).toBe('Dinozorlar milyonlarca yıl önce yaşadı');
    expect(
      bookTitleFromText('Bazıları bir otobüsten uzundu, bazıları ise bir tavuk kadar küçüktü.'),
    ).toBe('Bazıları bir otobüsten uzundu, bazıları ise');
    expect(bookTitleFromText('  Kısa bir masal, tamam mı?  ')).toBe('Kısa bir masal, tamam mı');
    expect(bookTitleFromText('Kırmızı Başlıklı Kız\nBir varmış bir yokmuş.')).toBe(
      'Kırmızı Başlıklı Kız',
    );
  });
});

describe('withChildName (docs/kararlar.md C9)', () => {
  it('puts the child’s name where the sample text says Deniz', () => {
    const chapter: Chapter = {
      number: 1,
      title: 'Örnek',
      pages: [
        [
          ['Deniz ile Tıkır', 'o sabah uyandı.'],
          ['Denizaltı ışıldadı.', 'Deniz’in sesi.', 'Bak Deniz.'],
        ],
      ],
      questions: [
        {
          prompt: 'Deniz ne gördü?',
          options: ['Deniz bir ışık gördü.', 'Hiçbir şey.'],
          correctIndex: 0,
        },
      ],
      chains: {},
    };

    const named = withChildName(chapter, 'Ali');

    expect(named.pages).toEqual([
      [
        ['Ali ile Tıkır', 'o sabah uyandı.'],
        ['Denizaltı ışıldadı.', 'Deniz’in sesi.', 'Bak Ali.'],
      ],
    ]);
    expect(named.questions[0]).toMatchObject({
      prompt: 'Ali ne gördü?',
      options: ['Ali bir ışık gördü.', 'Hiçbir şey.'],
    });
  });

  it('changes the sample cards book’s three Denizes', () => {
    const [book] = sampleBooks.books;
    const chapter = book?.chapters[0];
    if (chapter === undefined) {
      throw new Error('No sample book.');
    }
    const sample: Chapter = {
      number: chapter.number,
      title: chapter.title,
      pages: chapter.pages.map((page) => page.map((sentence) => sentence.split(' | '))),
      questions: chapter.questions,
      chains: chapter.chains,
    };

    const text = withChildName(sample, 'Elif').pages.flat(2).join(' ');

    expect(text).not.toMatch(/Deniz/);
    expect(text.match(/Elif/g)).toHaveLength(3);
  });
});

describe('readingMinutes (U4)', () => {
  it('rounds the words over the child’s pace up, at least one minute', () => {
    expect(readingMinutes(176, 71)).toBe(3);
    expect(readingMinutes(176, null)).toBe(3);
    expect(readingMinutes(10, 71)).toBe(1);
    expect(readingMinutes(0, null)).toBe(1);
  });
});

describe('nextBookChapter', () => {
  const book = (chapters: number): Book => ({
    id: 'kitap',
    title: 'Kitap',
    grade: 3,
    source: 'cards',
    totalChapters: chapters,
    chapters: Array.from({ length: chapters }, (_, index) => ({
      number: index + 1,
      title: 'Bölüm',
      pages: [],
      questions: [],
      chains: {},
    })),
  });

  it('reads the chapter after the last one read, and a book read through from its start', () => {
    expect(nextBookChapter([], book(1))).toBe(1);
    expect(nextBookChapter([testSession('2026-11-20', 1, {}, 'kitap')], book(1))).toBe(1);
    expect(nextBookChapter([testSession('2026-11-20', 1, {}, 'kitap')], book(3))).toBe(2);
    expect(
      nextBookChapter(
        [testSession('2026-11-20', 1, { step: 'read', completedAt: undefined }, 'kitap')],
        book(3),
      ),
    ).toBe(1);
    expect(nextBookChapter([testSession('2026-11-20', 2, {}, 'baska')], book(3))).toBe(1);
  });
});
