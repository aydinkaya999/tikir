// Books the child and the parent make (docs/urun.md section 6; docs/mimari.md, "MockBookGenerator";
// docs/planlar/faz-5.md, kararlar 3–4 and 22): the cards' title and summary, a parent's text cut
// into a chapter, the child's name in the sample text, the reading time and the chapter to read.
import { bookPageSentences, bookTitleWords, fallbackReadingWpm } from './config';
import { splitSentences } from './text';
import type { Book, Chapter, Id, Page, Question, Sentence, Session } from './types';

export interface HeroCard {
  id: Id;
  /** "{childName} ve Tıkır" for the first hero. */
  label: string;
  subject: string;
}

export interface PlaceCard {
  id: Id;
  label: string;
  /** "uzay istasyonunda": the summary's place. */
  locative: string;
  /** "Uzay İstasyonunda": the title's place. */
  titleLocative: string;
}

export interface EventCard {
  id: Id;
  label: string;
  /** "gizemli bir sesin peşine düşüyor". */
  clause: string;
  title: string;
}

/** U3's cards and the templates of the title and of Tıkır's summary (seed/ornek-kitaplar.json). */
export interface CardSet {
  titleTemplate: string;
  summaryTemplate: string;
  hero: HeroCard[];
  place: PlaceCard[];
  event: EventCard[];
}

/** One card of each group. */
export interface CardChoice {
  hero: Id;
  place: Id;
  event: Id;
}

const CHILD_NAME = /\{childName\}/gu;
const PLACEHOLDER = /\{(\w+)\.(\w+)\}/gu;

/** A card's text with the child's name: "Deniz ve Tıkır". */
export function cardLabel(text: string, childName: string): string {
  return text.replace(CHILD_NAME, childName);
}

function chosen<T extends { id: Id }>(cards: readonly T[], id: Id): T {
  const card = cards.find((each) => each.id === id);
  if (card === undefined) {
    throw new RangeError(`No card ${id}.`);
  }
  return card;
}

/** Fills "{group.field}" from the chosen cards; the content carries every suffix. */
function fill(template: string, cards: CardSet, choice: CardChoice, childName: string): string {
  const groups: Record<string, Record<string, string>> = {
    hero: { ...chosen(cards.hero, choice.hero) },
    place: { ...chosen(cards.place, choice.place) },
    event: { ...chosen(cards.event, choice.event) },
  };
  return template.replace(PLACEHOLDER, (whole, group: string, field: string) =>
    cardLabel(groups[group]?.[field] ?? whole, childName),
  );
}

/** "Uzay İstasyonunda Gizemli Ses". */
export function cardsTitle(cards: CardSet, choice: CardChoice): string {
  return fill(cards.titleTemplate, cards, choice, '');
}

/** Tıkır's sentence on U3: "Deniz ve Tıkır, uzay istasyonunda gizemli bir sesin peşine düşüyor." */
export function cardsSummary(cards: CardSet, choice: CardChoice, childName: string): string {
  return fill(cards.summaryTemplate, cards, choice, childName);
}

/** A sentence's phrase units: the commas end them, and each comma stays with its unit. */
function phraseUnits(sentence: string): Sentence {
  return sentence
    .split(/(?<=,)\s+/u)
    .map((unit) => unit.trim())
    .filter((unit) => unit !== '');
}

/**
 * A parent's text as a chapter (karar 4): the text is kept as written, cut into sentences, at most
 * four sentences a page, each sentence into phrase units at its commas. No questions, no chains.
 */
export function bookChapterFromText(text: string, title: string): Chapter {
  const sentences = splitSentences(text.replace(/\s+/gu, ' ')).map(phraseUnits);
  const pages: Page[] = [];
  for (let start = 0; start < sentences.length; start += bookPageSentences) {
    pages.push(sentences.slice(start, start + bookPageSentences));
  }
  return { number: 1, title, pages, questions: [], chains: {} };
}

/** The chapter's sentences as text, for the level check. */
export function chapterSentences(chapter: Chapter): string[] {
  return chapter.pages.flatMap((page) => page.map((sentence) => sentence.join(' ')));
}

/** At most six words of the first sentence, without the marks that close it (karar 4). */
export function bookTitleFromText(text: string): string {
  const first = splitSentences(text.replace(/\s+/gu, ' '))[0] ?? '';
  return first
    .split(' ')
    .slice(0, bookTitleWords)
    .join(' ')
    .replace(/[\s.,;:!?…"'’”»)–—-]+$/u, '');
}

/** "Deniz" as a whole word with no suffix; "Denizaltı" and "Deniz’in" are left as they are. */
const SAMPLE_NAME = /(?<![\p{L}])Deniz(?![\p{L}'’])/gu;

function named(text: string, childName: string): string {
  return text.replace(SAMPLE_NAME, childName);
}

/** The sample text's hero gets the child's name (docs/kararlar.md C9). */
export function withChildName(chapter: Chapter, childName: string): Chapter {
  const question = (each: Question): Question => ({
    ...each,
    prompt: named(each.prompt, childName),
    options: each.options.map((option) => named(option, childName)),
  });
  return {
    ...chapter,
    pages: chapter.pages.map((page) =>
      page.map((sentence) => sentence.map((unit) => named(unit, childName))),
    ),
    questions: chapter.questions.map(question),
  };
}

/** U4's "yaklaşık {n} dakika": the words over the child's last pace, rounded up (karar 22). */
export function readingMinutes(words: number, wcpm: number | null): number {
  const pace = wcpm !== null && wcpm > 0 ? wcpm : fallbackReadingWpm;
  return Math.max(1, Math.ceil(words / pace));
}

/** The book's chapter after the last one read; a book read through starts again (karar 7). */
export function nextBookChapter(sessions: readonly Session[], book: Book): number {
  const read = sessions
    .filter((session) => session.completedAt !== undefined && session.chapterRef.bookId === book.id)
    .map((session) => session.chapterRef.chapter);
  const next = Math.max(0, ...read) + 1;
  return book.chapters.some((chapter) => chapter.number === next) ? next : 1;
}
