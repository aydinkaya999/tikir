// Stuck words ("canavar kelimeler"): docs/urun.md sections 3 and 4, docs/planlar/faz-2a.md
// karar 7. A word the child stumbles on becomes a card; correct warmups on spaced days tame it.
import { drillCardsPerDay, tamingIntervalsDays, warmupCardLimit } from './config';
import { addDays, daysBetween } from './date';
import { isCountedError } from './scoring';
import { syllabify, toLowerTr, tokenize } from './text';
import type { DrillSuggestion, LocalDate, StuckWord, WordStatus } from './types';

const LETTER = /\p{L}/gu;
const tamingStreak = tamingIntervalsDays.length;

/** One card per word whatever its case: "Gökyüzünde" and "gökyüzünde" share a key. */
export function stuckKey(word: string): string {
  return toLowerTr(word.normalize('NFC'));
}

function isLowerCase(word: string): boolean {
  return word.normalize('NFC') === stuckKey(word);
}

/** A word the child stumbled on in a reading, with the chain of its chapter if it has one. */
export interface MissedWord {
  word: string;
  spoken: string;
  chain: readonly string[];
}

function daysAfter(today: LocalDate, streak: number): LocalDate {
  return addDays(today, tamingIntervalsDays[streak] ?? tamingIntervalsDays[0]);
}

function earlier(date: LocalDate | null, other: LocalDate): LocalDate {
  return date !== null && daysBetween(date, other) > 0 ? date : other;
}

/** The miss of one reading: a word counts once, and a lower-case occurrence names the card. */
function uniqueMisses(missed: readonly MissedWord[]): MissedWord[] {
  const byKey = new Map<string, MissedWord>();
  for (const word of missed) {
    const key = stuckKey(word.word);
    const seen = byKey.get(key);
    if (seen === undefined || (!isLowerCase(seen.word) && isLowerCase(word.word))) {
      byKey.set(key, word);
    }
  }
  return [...byKey.values()];
}

function shown(card: StuckWord, miss: MissedWord): Pick<StuckWord, 'word' | 'syllables'> {
  if (card.word !== miss.word && !isLowerCase(card.word) && isLowerCase(miss.word)) {
    return { word: miss.word, syllables: syllabify(miss.spoken) };
  }
  return { word: card.word, syllables: card.syllables };
}

/**
 * The cards after a reading. A new word becomes a wild card due tomorrow. A wild or practicing
 * card starts its streak again and is due tomorrow (or sooner, if it already was). A tamed card
 * stays tamed: the album never loses a word; only its miss count grows.
 */
export function recordMisses(
  cards: readonly StuckWord[],
  missed: readonly MissedWord[],
  today: LocalDate,
): StuckWord[] {
  const next = cards.map((card) => ({ ...card }));
  for (const miss of uniqueMisses(missed)) {
    const key = stuckKey(miss.word);
    const position = next.findIndex((card) => stuckKey(card.word) === key);
    const card = next[position];
    if (card === undefined) {
      next.push({
        word: miss.word,
        syllables: syllabify(miss.spoken),
        chain: [...miss.chain],
        misses: 1,
        status: 'wild',
        correctStreak: 0,
        dueOn: daysAfter(today, 0),
      });
      continue;
    }
    const updated: StuckWord = {
      ...card,
      ...shown(card, miss),
      chain: card.chain.length > 0 ? card.chain : [...miss.chain],
      misses: card.misses + 1,
    };
    if (card.status !== 'tamed') {
      updated.correctStreak = 0;
      updated.dueOn = earlier(card.dueOn, daysAfter(today, 0));
    }
    next[position] = updated;
  }
  return next;
}

/** The first attempt of a warmup counts; a second try after Tıkır reads it does not. */
export function applyWarmupResult(card: StuckWord, correct: boolean, today: LocalDate): StuckWord {
  if (!correct) {
    return { ...card, status: 'practicing', correctStreak: 0, dueOn: daysAfter(today, 0) };
  }
  const streak = Math.min(card.correctStreak + 1, tamingStreak);
  if (streak >= tamingStreak) {
    return { ...card, status: 'tamed', correctStreak: streak, dueOn: null };
  }
  return { ...card, status: 'practicing', correctStreak: streak, dueOn: daysAfter(today, streak) };
}

export function remainingToTame(card: StuckWord): number {
  return Math.max(0, tamingStreak - card.correctStreak);
}

export interface WarmupItem {
  word: string;
  spoken: string;
  syllables: string[];
  chain: string[];
  /** null for a word picked from the text: it does not become a card. */
  card: StuckWord | null;
}

/** Today's chapter: its words in reading order and its suffix chains. */
export interface WarmupSource {
  words: readonly { word: string; spoken: string }[];
  chains: Readonly<Record<string, readonly string[]>>;
}

function byTurkishKey(a: string, b: string): number {
  return stuckKey(a).localeCompare(stuckKey(b), 'tr');
}

/** The album's words: the tamed cards, in the Turkish alphabet's order. */
export function tamedWords(cards: readonly StuckWord[]): string[] {
  return cards
    .filter((card) => card.status === 'tamed')
    .map((card) => card.word)
    .sort(byTurkishKey);
}

function spokenOfWord(word: string): string {
  const tokens = tokenize(word);
  return tokens.length === 1 ? (tokens[0]?.spoken ?? word) : word;
}

/**
 * "Isınmaya ekle" (V2; docs/planlar/faz-4.md, karar 8): the suggested words without a card become
 * new cards, due two a day from tomorrow. Cards already there stay as they are; the warmup's rules
 * (three cards, the most missed first) put the older cards ahead of these.
 */
export function drillCards(
  drill: DrillSuggestion,
  cards: readonly StuckWord[],
  chains: Readonly<Record<string, readonly string[]>>,
  today: LocalDate,
): StuckWord[] {
  const taken = new Set(cards.map((card) => stuckKey(card.word)));
  const added: StuckWord[] = [];
  for (const word of drill.words) {
    const key = stuckKey(word);
    if (taken.has(key)) {
      continue;
    }
    taken.add(key);
    added.push({
      word,
      syllables: syllabify(spokenOfWord(word)),
      chain: [...(chains[word] ?? chains[key] ?? [])],
      misses: 0,
      status: 'wild',
      correctStreak: 0,
      dueOn: addDays(today, 1 + Math.floor(added.length / drillCardsPerDay)),
    });
  }
  return added;
}

function letterCount(word: string): number {
  return word.match(LETTER)?.length ?? 0;
}

/** The three longest distinct words of the text, ties in Turkish alphabetical order. */
function longestWords(source: WarmupSource): WarmupItem[] {
  const byKey = new Map<string, { word: string; spoken: string }>();
  for (const word of source.words) {
    const key = stuckKey(word.word);
    const seen = byKey.get(key);
    if (seen === undefined || (!isLowerCase(seen.word) && isLowerCase(word.word))) {
      byKey.set(key, word);
    }
  }
  return [...byKey.values()]
    .sort((a, b) => letterCount(b.word) - letterCount(a.word) || byTurkishKey(a.word, b.word))
    .slice(0, warmupCardLimit)
    .map((word) => ({
      word: word.word,
      spoken: word.spoken,
      syllables: syllabify(word.spoken),
      chain: [...(source.chains[word.word] ?? source.chains[stuckKey(word.word)] ?? [])],
      card: null,
    }));
}

/**
 * Today's warmup: the cards due, most missed first (ties in Turkish alphabetical order), at most
 * three. With no card due, the longest words of today's text; a short deck is not filled up.
 */
export function warmupDeck(
  cards: readonly StuckWord[],
  today: LocalDate,
  source: WarmupSource,
): WarmupItem[] {
  const due = cards
    .filter(
      (card) =>
        card.status !== 'tamed' && card.dueOn !== null && daysBetween(card.dueOn, today) >= 0,
    )
    .sort((a, b) => b.misses - a.misses || byTurkishKey(a.word, b.word))
    .slice(0, warmupCardLimit);
  if (due.length === 0) {
    return longestWords(source);
  }
  return due.map((card) => ({
    word: card.word,
    spoken: spokenOfWord(card.word),
    syllables: card.syllables,
    chain: card.chain,
    card,
  }));
}

/** A warmup word counts as read when its result is not a counted error (docs/urun.md section 2). */
export function isWarmupCorrect(status: WordStatus): boolean {
  return !isCountedError(status);
}

/**
 * The deck stored when the session started (Session.warmup.words), rebuilt with the cards as they
 * are now: a card is matched by its key, so an answered card keeps its place in the deck; a word
 * without a card is a word of today's text.
 */
export function warmupItems(
  words: readonly string[],
  cards: readonly StuckWord[],
  source: WarmupSource,
): WarmupItem[] {
  const byKey = new Map(cards.map((card) => [stuckKey(card.word), card]));
  return words.map((word) => {
    const card = byKey.get(stuckKey(word));
    if (card !== undefined) {
      return {
        word: card.word,
        spoken: spokenOfWord(card.word),
        syllables: card.syllables,
        chain: card.chain,
        card,
      };
    }
    const spoken = source.words.find((each) => each.word === word)?.spoken ?? spokenOfWord(word);
    return {
      word,
      spoken,
      syllables: syllabify(spoken),
      chain: [...(source.chains[word] ?? source.chains[stuckKey(word)] ?? [])],
      card: null,
    };
  });
}
