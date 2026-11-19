import { describe, expect, it } from 'vitest';
import seriesBook from '../../seed/kayip-fenerin-izinde.json';
import {
  chapterTokens,
  countSyllables,
  readCardinal,
  readOrdinal,
  splitPhraseUnits,
  splitSentences,
  syllabify,
  tokenize,
  tokenizePage,
  toLowerTr,
  toUpperTr,
} from './text';
import type { Chapter } from './types';

describe('syllabify', () => {
  // docs/mimari.md, "Heceleme" table, verbatim.
  it.each([
    ['kıvrılıyordu', 'kıv-rı-lı-yor-du'],
    ['ağaçlarının', 'a-ğaç-la-rı-nın'],
    ['belirdiğinde', 'be-lir-di-ğin-de'],
    ['öğretmenlerimizden', 'öğ-ret-men-le-ri-miz-den'],
    ['gözlükçülerden', 'göz-lük-çü-ler-den'],
    ['Türkçe', 'Türk-çe'],
    ['kontrol', 'kont-rol'],
    ['elektrik', 'e-lekt-rik'],
    ['saat', 'sa-at'],
    ['şiir', 'şi-ir'],
    ['tren', 'tren'],
    ['rüzgârı', 'rüz-gâ-rı'],
    ['İstanbul', 'İs-tan-bul'],
  ])('%s → %s', (word, expected) => {
    expect(syllabify(word).join('-')).toBe(expected);
  });

  it('keeps the apostrophe where it is, so the syllables join back into the word', () => {
    expect(syllabify('Tıkır’ın')).toEqual(['Tı', 'kı', 'r’ın']);
  });

  it('treats dotless capital I as a vowel', () => {
    expect(syllabify('IŞIK')).toEqual(['I', 'ŞIK']);
  });

  it('returns a vowelless word whole', () => {
    expect(syllabify('hmm')).toEqual(['hmm']);
  });

  it('composes decomposed letters, so a pasted "a + combining circumflex" reads as â', () => {
    expect(syllabify('rüzgârı')).toEqual(['rüz', 'gâ', 'rı']);
  });
});

describe('countSyllables', () => {
  it('counts one syllable per vowel and ignores the apostrophe', () => {
    expect(countSyllables('Tıkır’ın')).toBe(3);
    expect(countSyllables('tren')).toBe(1);
    expect(countSyllables('saat')).toBe(2);
    expect(countSyllables('rüzgârı')).toBe(3);
  });
});

describe('tokenize', () => {
  it('keeps quotes and punctuation out of the word but attached to it', () => {
    expect(tokenize('“Fener bu tepenin ardında olmalı,” dedi')).toEqual([
      { word: 'Fener', spoken: 'Fener', leading: '“', trailing: '', spaceAfter: true },
      { word: 'bu', spoken: 'bu', leading: '', trailing: '', spaceAfter: true },
      { word: 'tepenin', spoken: 'tepenin', leading: '', trailing: '', spaceAfter: true },
      { word: 'ardında', spoken: 'ardında', leading: '', trailing: '', spaceAfter: true },
      { word: 'olmalı', spoken: 'olmalı', leading: '', trailing: ',”', spaceAfter: true },
      { word: 'dedi', spoken: 'dedi', leading: '', trailing: '', spaceAfter: false },
    ]);
  });

  it('keeps an apostrophe suffix inside the word', () => {
    expect(tokenize('Tıkır’ın kulakları').map((token) => token.word)).toEqual([
      'Tıkır’ın',
      'kulakları',
    ]);
  });

  it('appends a chunk without letters to the previous word', () => {
    expect(tokenize('Dur — dedi')).toEqual([
      { word: 'Dur', spoken: 'Dur', leading: '', trailing: ' —', spaceAfter: true },
      { word: 'dedi', spoken: 'dedi', leading: '', trailing: '', spaceAfter: false },
    ]);
  });

  it('prepends a leading chunk without letters to the first word', () => {
    expect(tokenize('— Dur')).toEqual([
      { word: 'Dur', spoken: 'Dur', leading: '— ', trailing: '', spaceAfter: false },
    ]);
  });

  it('reads decomposed (NFD) letters as whole words, returned composed', () => {
    expect(tokenize('Göz ağacı'.normalize('NFD')).map((token) => token.word)).toEqual([
      'Göz',
      'ağacı',
    ]);
  });

  it('splits two words joined by punctuation without a space', () => {
    expect(tokenize('ve/veya')).toEqual([
      { word: 've', spoken: 've', leading: '', trailing: '/', spaceAfter: false },
      { word: 'veya', spoken: 'veya', leading: '', trailing: '', spaceAfter: false },
    ]);
  });
});

describe('readCardinal', () => {
  it.each([
    ['0', 'sıfır'],
    ['7', 'yedi'],
    ['10', 'on'],
    ['11', 'on bir'],
    ['45', 'kırk beş'],
    ['99', 'doksan dokuz'],
    ['100', 'yüz'],
    ['101', 'yüz bir'],
    ['200', 'iki yüz'],
    ['999', 'dokuz yüz doksan dokuz'],
    ['1000', 'bin'],
    ['1001', 'bin bir'],
    ['1100', 'bin yüz'],
    ['1923', 'bin dokuz yüz yirmi üç'],
    ['2000', 'iki bin'],
    ['10000', 'on bin'],
    ['100000', 'yüz bin'],
    ['1000000', 'bir milyon'],
    ['2500000', 'iki milyon beş yüz bin'],
    ['1000000000', 'bir milyar'],
  ])('reads %s as "%s"', (digits, reading) => {
    expect(readCardinal(digits)).toBe(reading);
  });

  it('reads a run with a leading zero or more than 12 digits digit by digit', () => {
    expect(readCardinal('007')).toBe('sıfır sıfır yedi');
    expect(readCardinal('1234567890123')).toBe(
      'bir iki üç dört beş altı yedi sekiz dokuz sıfır bir iki üç',
    );
  });

  it('reads decimal digits of other scripts by their value and rejects anything else', () => {
    expect(readCardinal('١٩٢٣')).toBe('bin dokuz yüz yirmi üç');
    expect(() => readCardinal('12a')).toThrow(RangeError);
    expect(() => readCardinal('')).toThrow(RangeError);
  });
});

describe('readOrdinal', () => {
  it.each([
    ['1', 'birinci'],
    ['2', 'ikinci'],
    ['3', 'üçüncü'],
    ['4', 'dördüncü'],
    ['5', 'beşinci'],
    ['6', 'altıncı'],
    ['7', 'yedinci'],
    ['8', 'sekizinci'],
    ['9', 'dokuzuncu'],
    ['10', 'onuncu'],
    ['20', 'yirminci'],
    ['30', 'otuzuncu'],
    ['40', 'kırkıncı'],
    ['50', 'ellinci'],
    ['60', 'altmışıncı'],
    ['70', 'yetmişinci'],
    ['80', 'sekseninci'],
    ['90', 'doksanıncı'],
    ['100', 'yüzüncü'],
    ['1000', 'bininci'],
    ['21', 'yirmi birinci'],
    ['1000000', 'bir milyonuncu'],
  ])('reads %s as "%s"', (digits, reading) => {
    expect(readOrdinal(digits)).toBe(reading);
  });
});

describe('tokenize with digits', () => {
  it('makes a digit run its own word, spoken as its reading', () => {
    const tokens = tokenize('Deniz 3 elma aldı.');
    expect(tokens.map((token) => token.word)).toEqual(['Deniz', '3', 'elma', 'aldı']);
    expect(tokens.map((token) => token.spoken)).toEqual(['Deniz', 'üç', 'elma', 'aldı']);
  });

  it('appends an apostrophe suffix to the reading', () => {
    const number = tokenize('Kitabın 100’ü bitti.')[1];
    expect(number?.word).toBe('100’ü');
    expect(number?.spoken).toBe('yüzü');
  });

  it('reads digits before a full stop and a lower-case word as an ordinal', () => {
    const number = tokenize('Deniz 3. sınıfta.')[1];
    expect(number?.spoken).toBe('üçüncü');
    expect(number?.trailing).toBe('.');
    expect(tokenize('Saat 3. Sonra eve döndü.')[1]?.spoken).toBe('üç');
  });

  it('reads each digit group of a decimal number as its own number (known limit)', () => {
    expect(tokenize('3,5 elma').map((token) => token.spoken)).toEqual(['üç', 'beş', 'elma']);
  });
});

describe('syllables of a spoken number', () => {
  it('syllabifies and counts a reading of several words', () => {
    expect(syllabify('bin dokuz yüz')).toEqual(['bin', 'do', 'kuz', 'yüz']);
    expect(countSyllables('bin dokuz yüz yirmi üç')).toBe(7);
  });
});

describe('chapterTokens', () => {
  const seedChapter = seriesBook.chapters.find((chapter) => chapter.number === 4);
  if (seedChapter === undefined) {
    throw new Error('seed chapter 4 is missing');
  }
  const chapter: Chapter = {
    number: seedChapter.number,
    title: seedChapter.title,
    pages: seedChapter.pages.map((page) => page.map(splitPhraseUnits)),
    questions: [],
    chains: {},
  };

  it('numbers the words of a chapter across its pages', () => {
    const tokens = chapterTokens(chapter);
    expect(tokens).toHaveLength(99);
    expect(tokens[14]).toMatchObject({ index: 14, word: 'ağaçlarının', page: 0 });
    expect(tokens[40]).toMatchObject({ index: 40, word: 'soluk', page: 1 });
    const firstOfPage = tokens.filter(
      (token, position) => position === 0 || tokens[position - 1]?.page !== token.page,
    );
    expect(firstOfPage.map((token) => token.index)).toEqual([0, 25, 45, 59, 73, 88]);
  });
});

describe('tokenizePage', () => {
  it('reads a page of phrase-unit sentences as one run of words, spaced between sentences', () => {
    const tokens = tokenizePage([
      ['Deniz sırt çantasını', 'omzuna aldı.'],
      ['“Fener', 'bu tepenin ardında olmalı,”', 'dedi Deniz.'],
    ]);

    expect(tokens.map((token) => token.word)).toEqual([
      'Deniz',
      'sırt',
      'çantasını',
      'omzuna',
      'aldı',
      'Fener',
      'bu',
      'tepenin',
      'ardında',
      'olmalı',
      'dedi',
      'Deniz',
    ]);
    expect(tokens[4]).toEqual({
      word: 'aldı',
      spoken: 'aldı',
      leading: '',
      trailing: '.',
      spaceAfter: true,
    });
    expect(tokens[5]?.leading).toBe('“');
    expect(tokens.at(-1)?.spaceAfter).toBe(false);
  });
});

describe('splitSentences', () => {
  it('splits the Ateşman example into two sentences', () => {
    expect(
      splitSentences(
        'Deniz sırt çantasını omzuna aldı. Tıkır kulaklarını dikti ve rüzgârı dinledi.',
      ),
    ).toEqual(['Deniz sırt çantasını omzuna aldı.', 'Tıkır kulaklarını dikti ve rüzgârı dinledi.']);
  });

  it('does not split when speech continues in lower case after a closing quote', () => {
    expect(splitSentences('“Işığım geri geliyor!” diye bağırdı.')).toEqual([
      '“Işığım geri geliyor!” diye bağırdı.',
    ]);
  });

  it('splits before an opening quote that starts with a capital letter', () => {
    expect(splitSentences('Tıkır durdu. “Bak!” dedi.')).toEqual(['Tıkır durdu.', '“Bak!” dedi.']);
  });

  it('ends sentences at question marks, exclamation marks and ellipses', () => {
    expect(
      splitSentences('Nereye gidiyorsun? Eve gidiyorum! Kapı açıldı… İçeride kimse yoktu.'),
    ).toEqual(['Nereye gidiyorsun?', 'Eve gidiyorum!', 'Kapı açıldı…', 'İçeride kimse yoktu.']);
  });

  it('starts a sentence at a dialogue dash', () => {
    expect(splitSentences('Ali geldi.\n— Nereye gidiyorsun? dedi Veli.\n– Eve, dedi Ali.')).toEqual(
      ['Ali geldi.', '— Nereye gidiyorsun? dedi Veli.', '– Eve, dedi Ali.'],
    );
  });

  it('starts a sentence at a number', () => {
    expect(splitSentences('Herkes gitti. 5 kişi kaldı.')).toEqual([
      'Herkes gitti.',
      '5 kişi kaldı.',
    ]);
  });

  it('never returns a fragment without words', () => {
    expect(splitSentences('... Ali geldi. Veli gitti.')).toEqual(['... Ali geldi.', 'Veli gitti.']);
  });

  it('reads decomposed (NFD) text and returns it composed', () => {
    expect(splitSentences('Göz açtı. Şiir okudu.'.normalize('NFD'))).toEqual([
      'Göz açtı.',
      'Şiir okudu.',
    ]);
  });

  it('does not split when a full stop is followed by a lower-case word', () => {
    expect(splitSentences('Saat 3. kattaydı.')).toEqual(['Saat 3. kattaydı.']);
  });

  it('keeps text without a closing mark as one sentence and trims whitespace', () => {
    expect(splitSentences('  Dar patika\n')).toEqual(['Dar patika']);
  });
});

describe('splitPhraseUnits', () => {
  it('splits a seed sentence at the " | " markers', () => {
    expect(
      splitPhraseUnits('Dar patika, | çam ağaçlarının arasından | yukarıya kıvrılıyordu.'),
    ).toEqual(['Dar patika,', 'çam ağaçlarının arasından', 'yukarıya kıvrılıyordu.']);
  });
});

describe('Turkish casing', () => {
  it('upper-cases i to İ and ı to I', () => {
    expect(toUpperTr('istanbul ılık')).toBe('İSTANBUL ILIK');
  });

  it('lower-cases İ to i and I to ı', () => {
    expect(toLowerTr('İSTANBUL IŞIK')).toBe('istanbul ışık');
  });
});
