import { describe, expect, it } from 'vitest';
import seriesBook from '../../seed/kayip-fenerin-izinde.json';
import demoProfile from '../../seed/demo-profil.json';
import { addDays } from './date';
import {
  applyWarmupResult,
  drillCards,
  isWarmupCorrect,
  recordMisses,
  remainingToTame,
  tamedWords,
  warmupDeck,
  warmupItems,
  type WarmupSource,
} from './stuckWords';
import { chapterTokens, splitPhraseUnits, syllabify } from './text';
import type { Chapter, StuckWord, StuckWordStatus } from './types';

const today = '2026-11-21';

function card(word: string, fields: Partial<StuckWord> = {}): StuckWord {
  return {
    word,
    syllables: syllabify(word),
    chain: [],
    misses: 1,
    status: 'wild',
    correctStreak: 0,
    dueOn: addDays(today, 1),
    ...fields,
  };
}

function missed(word: string, chain: readonly string[] = []) {
  return { word, spoken: word, chain };
}

function chapterFour(): Chapter {
  const seedChapter = seriesBook.chapters.find((chapter) => chapter.number === 4);
  if (seedChapter === undefined) {
    throw new Error('seed chapter 4 is missing');
  }
  const seedChains: Readonly<Record<string, string[] | undefined>> = seedChapter.chains;
  const chains: Record<string, string[]> = {};
  for (const [word, chain] of Object.entries(seedChains)) {
    if (chain !== undefined) {
      chains[word] = chain;
    }
  }
  return {
    number: seedChapter.number,
    title: seedChapter.title,
    pages: seedChapter.pages.map((page) => page.map(splitPhraseUnits)),
    questions: [],
    chains,
  };
}

function chapterFourSource(): WarmupSource {
  const chapter = chapterFour();
  return { words: chapterTokens(chapter), chains: chapter.chains };
}

function asStatus(value: string): StuckWordStatus {
  if (value === 'wild' || value === 'practicing' || value === 'tamed') {
    return value;
  }
  throw new Error(`Not a card status: ${value}`);
}

describe('recordMisses', () => {
  it('turns a new stuck word into a wild card due tomorrow', () => {
    expect(recordMisses([], [missed('rüzgârı')], today)).toEqual([
      {
        word: 'rüzgârı',
        syllables: ['rüz', 'gâ', 'rı'],
        chain: [],
        misses: 1,
        status: 'wild',
        correctStreak: 0,
        dueOn: '2026-11-22',
      },
    ]);
  });

  it('counts a word missed twice in one reading once', () => {
    const cards = recordMisses([], [missed('patika'), missed('patika')], today);

    expect(cards).toHaveLength(1);
    expect(cards[0]?.misses).toBe(1);
  });

  it('keeps one card per word whatever its case, shown in lower case once seen so', () => {
    const first = recordMisses([], [missed('Gökyüzünde')], today);
    expect(first.map((item) => item.word)).toEqual(['Gökyüzünde']);

    const second = recordMisses(first, [missed('gökyüzünde')], today);
    expect(second).toHaveLength(1);
    expect(second[0]).toMatchObject({
      word: 'gökyüzünde',
      syllables: ['gök', 'yü', 'zün', 'de'],
      misses: 2,
    });

    const third = recordMisses(second, [missed('Gökyüzünde')], today);
    expect(third[0]).toMatchObject({ word: 'gökyüzünde', misses: 3 });
  });

  it('sends a card missed again in the text back to tomorrow, unless it is due sooner', () => {
    const cards = recordMisses(
      [
        card('kıvrılıyordu', {
          misses: 4,
          status: 'practicing',
          correctStreak: 2,
          dueOn: '2026-11-25',
        }),
        card('belirdiğinde', { misses: 3, status: 'practicing', dueOn: '2026-11-20' }),
      ],
      [missed('kıvrılıyordu'), missed('belirdiğinde')],
      today,
    );

    expect(cards[0]).toMatchObject({
      misses: 5,
      correctStreak: 0,
      status: 'practicing',
      dueOn: '2026-11-22',
    });
    expect(cards[1]).toMatchObject({ misses: 4, dueOn: '2026-11-20' });
  });

  it('keeps a tamed card tamed and only counts the miss', () => {
    const cards = recordMisses(
      [card('ağaçlarının', { misses: 3, status: 'tamed', correctStreak: 3, dueOn: null })],
      [missed('ağaçlarının')],
      today,
    );

    expect(cards[0]).toMatchObject({
      status: 'tamed',
      misses: 4,
      correctStreak: 3,
      dueOn: null,
    });
  });
});

describe('applyWarmupResult', () => {
  it('moves a card along the taming intervals and tames it at three in a row', () => {
    const first = applyWarmupResult(card('patika'), true, today);
    expect(first).toMatchObject({ status: 'practicing', correctStreak: 1, dueOn: '2026-11-23' });

    const second = applyWarmupResult(first, true, today);
    expect(second).toMatchObject({ status: 'practicing', correctStreak: 2, dueOn: '2026-11-25' });

    const third = applyWarmupResult(second, true, today);
    expect(third).toMatchObject({ status: 'tamed', correctStreak: 3, dueOn: null });
  });

  it('starts the streak again after a wrong reading', () => {
    const card2 = card('patika', { status: 'practicing', correctStreak: 2, dueOn: today });

    expect(applyWarmupResult(card2, false, today)).toMatchObject({
      status: 'practicing',
      correctStreak: 0,
      dueOn: '2026-11-22',
    });
  });
});

describe('remainingToTame', () => {
  it('counts the correct warmups still needed', () => {
    expect(remainingToTame(card('patika', { correctStreak: 1 }))).toBe(2);
    expect(remainingToTame(card('patika', { status: 'tamed', correctStreak: 3 }))).toBe(0);
  });
});

describe('warmupDeck', () => {
  it('deals the demo profile cards due today, most missed first', () => {
    const chains = chapterFour().chains;
    const cards = demoProfile.modes['cocuk-sabahi'].stuckWords.map((seedCard) =>
      card(seedCard.word, {
        chain: chains[seedCard.word] ?? [],
        misses: seedCard.misses,
        status: asStatus(seedCard.status),
        correctStreak: seedCard.correctStreak,
        dueOn: addDays(today, seedCard.dueDay),
      }),
    );

    const deck = warmupDeck(cards, today, chapterFourSource());

    expect(deck.map((item) => item.word)).toEqual(['kıvrılıyordu', 'ağaçlarının', 'belirdiğinde']);
    expect(deck[0]?.syllables).toEqual(['kıv', 'rı', 'lı', 'yor', 'du']);
    expect(deck[0]?.chain).toEqual(['kıvrıl', 'kıvrılıyor', 'kıvrılıyordu']);
    const first = deck[0]?.card;
    expect(first ? remainingToTame(first) : null).toBe(2);
  });

  it('breaks ties in Turkish alphabetical order and deals at most three cards', () => {
    const cards = ['şeker', 'sabah', 'çiçek', 'cadde'].map((word) =>
      card(word, { misses: 2, dueOn: today }),
    );

    expect(warmupDeck(cards, today, chapterFourSource()).map((item) => item.word)).toEqual([
      'cadde',
      'çiçek',
      'sabah',
    ]);
  });

  it('picks the three longest words of the text when no card is due, without making cards', () => {
    const notDue = [card('tırmanmaya', { misses: 2, dueOn: '2026-11-22' })];

    const deck = warmupDeck(notDue, today, chapterFourSource());

    expect(deck.map((item) => item.word)).toEqual(['belirdiğinde', 'Karşılarında', 'kıvrılıyordu']);
    expect(deck.every((item) => item.card === null)).toBe(true);
    expect(deck[0]?.chain).toEqual(['belir', 'belirdi', 'belirdiğinde']);
    expect(deck[1]?.chain).toEqual([]);
    expect(deck[1]?.syllables).toEqual(['Kar', 'şı', 'la', 'rın', 'da']);
  });

  it('does not fill a short deck with words from the text', () => {
    const deck = warmupDeck([card('patika', { dueOn: today })], today, chapterFourSource());

    expect(deck.map((item) => item.word)).toEqual(['patika']);
    expect(deck[0]?.card?.word).toBe('patika');
  });

  it('gives a card the spoken form of its word', () => {
    const deck = warmupDeck([card('1923', { dueOn: today })], today, chapterFourSource());

    expect(deck[0]?.spoken).toBe('bin dokuz yüz yirmi üç');
  });
});

describe('isWarmupCorrect', () => {
  it('takes a word read without a counted error as correct', () => {
    expect(isWarmupCorrect('correct')).toBe(true);
    expect(isWarmupCorrect('repeated')).toBe(true);
    expect(isWarmupCorrect('inserted')).toBe(true);
    expect(isWarmupCorrect('selfCorrected')).toBe(true);
    expect(isWarmupCorrect('misread')).toBe(false);
    expect(isWarmupCorrect('suffix')).toBe(false);
    expect(isWarmupCorrect('skipped')).toBe(false);
    expect(isWarmupCorrect('helped')).toBe(false);
  });
});

describe('warmupItems', () => {
  function demoCards(): StuckWord[] {
    const chains = chapterFour().chains;
    return demoProfile.modes['cocuk-sabahi'].stuckWords.map((seedCard) =>
      card(seedCard.word, {
        chain: chains[seedCard.word] ?? [],
        misses: seedCard.misses,
        status: asStatus(seedCard.status),
        correctStreak: seedCard.correctStreak,
        dueOn: addDays(today, seedCard.dueDay),
      }),
    );
  }

  const deckWords = ['kıvrılıyordu', 'ağaçlarının', 'belirdiğinde'];

  it('rebuilds the stored deck as the deck dealt it', () => {
    const cards = demoCards();

    const items = warmupItems(deckWords, cards, chapterFourSource());

    expect(items).toEqual(warmupDeck(cards, today, chapterFourSource()));
    expect(items[0]?.syllables).toEqual(['kıv', 'rı', 'lı', 'yor', 'du']);
    expect(items[0]?.card?.correctStreak).toBe(1);
  });

  it('keeps the whole deck after its first card is answered, with the card as it is now', () => {
    const cards = demoCards();
    const answered = cards.map((each) =>
      each.word === 'kıvrılıyordu' ? applyWarmupResult(each, true, today) : each,
    );

    const items = warmupItems(deckWords, answered, chapterFourSource());

    expect(items.map((item) => item.word)).toEqual(deckWords);
    expect(items[0]?.card?.correctStreak).toBe(2);
    expect(items[0]?.card?.dueOn).toBe('2026-11-25');
  });

  it('rebuilds a word of the text as an item without a card', () => {
    const items = warmupItems(['belirdiğinde'], [], chapterFourSource());

    expect(items).toEqual([
      {
        word: 'belirdiğinde',
        spoken: 'belirdiğinde',
        syllables: ['be', 'lir', 'di', 'ğin', 'de'],
        chain: ['belir', 'belirdi', 'belirdiğinde'],
        card: null,
      },
    ]);
  });
});

describe('tamedWords', () => {
  it('lists the tamed cards in the Turkish alphabet’s order', () => {
    const cards = [
      card('kıvrılıyordu', { status: 'tamed' }),
      card('çam', { status: 'practicing' }),
      card('ışık', { status: 'tamed' }),
      card('ağaçlarının', { status: 'tamed' }),
      card('İkisi', { status: 'tamed' }),
      card('ceviz', { status: 'tamed' }),
      card('patika', { status: 'wild' }),
    ];

    // c < ç, ı < i, and İ is i's capital (docs/mimari.md, Türkçe metin).
    expect(tamedWords(cards)).toEqual(['ağaçlarının', 'ceviz', 'ışık', 'İkisi', 'kıvrılıyordu']);
  });

  it('is empty without a tamed card', () => {
    expect(tamedWords([card('patika', { status: 'practicing' })])).toEqual([]);
  });
});

describe('drillCards', () => {
  const drill = {
    suffixes: ['‑yordu', '‑diğinde'],
    words: [
      'kıvrılıyordu',
      'güneşleniyordu',
      'bulamıyordu',
      'parlıyordu',
      'belirdiğinde',
      'geldiğinde',
    ],
    days: 3,
  };
  const card = (word: string, status: StuckWordStatus): StuckWord => ({
    word,
    syllables: syllabify(word),
    chain: [],
    misses: 3,
    status,
    correctStreak: 0,
    dueOn: status === 'tamed' ? null : '2026-11-17',
  });

  it('makes new cards of the suggested words, two a day from tomorrow', () => {
    const cards = drillCards(drill, [], {}, '2026-11-15');
    expect(cards.map((each) => [each.word, each.dueOn])).toEqual([
      ['kıvrılıyordu', '2026-11-16'],
      ['güneşleniyordu', '2026-11-16'],
      ['bulamıyordu', '2026-11-17'],
      ['parlıyordu', '2026-11-17'],
      ['belirdiğinde', '2026-11-18'],
      ['geldiğinde', '2026-11-18'],
    ]);
    expect(cards.find((each) => each.word === 'geldiğinde')).toEqual({
      word: 'geldiğinde',
      syllables: ['gel', 'di', 'ğin', 'de'],
      chain: [],
      misses: 0,
      status: 'wild',
      correctStreak: 0,
      dueOn: '2026-11-18',
    });
  });

  it('leaves out the words that already have a card, whatever their case', () => {
    const cards = drillCards(
      drill,
      [card('kıvrılıyordu', 'tamed'), card('Belirdiğinde', 'practicing')],
      {},
      '2026-11-15',
    );
    expect(cards.map((each) => [each.word, each.dueOn])).toEqual([
      ['güneşleniyordu', '2026-11-16'],
      ['bulamıyordu', '2026-11-16'],
      ['parlıyordu', '2026-11-17'],
      ['geldiğinde', '2026-11-17'],
    ]);
  });

  it('takes a word’s chain from the series when it has one', () => {
    const chains = { parlıyordu: ['parla', 'parlıyor', 'parlıyordu'] };
    const cards = drillCards(drill, [], chains, '2026-11-15');
    expect(cards.find((each) => each.word === 'parlıyordu')?.chain).toEqual([
      'parla',
      'parlıyor',
      'parlıyordu',
    ]);
  });
});
