import { describe, expect, it } from 'vitest';
import {
  countSyllables,
  splitPhraseUnits,
  splitSentences,
  syllabify,
  tokenize,
  tokenizePage,
  toLowerTr,
  toUpperTr,
} from './text';

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
      { word: 'Fener', leading: '“', trailing: '', spaceAfter: true },
      { word: 'bu', leading: '', trailing: '', spaceAfter: true },
      { word: 'tepenin', leading: '', trailing: '', spaceAfter: true },
      { word: 'ardında', leading: '', trailing: '', spaceAfter: true },
      { word: 'olmalı', leading: '', trailing: ',”', spaceAfter: true },
      { word: 'dedi', leading: '', trailing: '', spaceAfter: false },
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
      { word: 'Dur', leading: '', trailing: ' —', spaceAfter: true },
      { word: 'dedi', leading: '', trailing: '', spaceAfter: false },
    ]);
  });

  it('prepends a leading chunk without letters to the first word', () => {
    expect(tokenize('— Dur')).toEqual([
      { word: 'Dur', leading: '— ', trailing: '', spaceAfter: false },
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
      { word: 've', leading: '', trailing: '/', spaceAfter: false },
      { word: 'veya', leading: '', trailing: '', spaceAfter: false },
    ]);
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
    expect(tokens[4]).toEqual({ word: 'aldı', leading: '', trailing: '.', spaceAfter: true });
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
