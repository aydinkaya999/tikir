// Turkish text rules: docs/mimari.md, "Türkçe metin kuralları ve sınama örnekleri".
import type { Chapter, Page } from './types';

const LOCALE = 'tr-TR';
const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü', 'â', 'î', 'û']);
const APOSTROPHES = new Set(["'", '’']);
/**
 * A word is a run of letters or a run of digits (docs/kararlar.md C5); a suffix joined with an
 * apostrophe belongs to it.
 */
const WORD = /(?:\p{L}+|\p{Nd}+)(?:['’]\p{L}+)*/gu;
const LEADING_DIGITS = /^\p{Nd}+/u;
const ONLY_DIGITS = /^\p{Nd}+$/u;
const DECIMAL_DIGIT = /^\p{Nd}$/u;
const APOSTROPHE_MARKS = /['’]/gu;
const LOWER_CASE_START = /^\p{Ll}/u;
/** Sentence-closing marks, optionally followed by closing quotes or brackets. */
const SENTENCE_END = /[.!?…]+[”"’»)]*/gu;
/**
 * Whitespace, then optional opening quotes, brackets or a dialogue dash, then a capital letter
 * or a number.
 */
const NEXT_SENTENCE_START = /^\s+[“"‘«(—–-]*\s*[\p{Lu}\p{N}]/u;
const LETTER = /\p{L}/u;
const graphemeSegmenter = new Intl.Segmenter(LOCALE, { granularity: 'grapheme' });

const DIGIT_NAMES = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS_NAMES = [
  '',
  'on',
  'yirmi',
  'otuz',
  'kırk',
  'elli',
  'altmış',
  'yetmiş',
  'seksen',
  'doksan',
];
const SCALE_NAMES = ['', 'bin', 'milyon', 'milyar'];
/** Longer runs (and runs with a leading zero) are read digit by digit, like a phone number. */
const MAX_NUMBER_DIGITS = 12;
/** The vowel of the ordinal suffix, from the word's last vowel (four-way vowel harmony). */
const ORDINAL_VOWEL: Readonly<Record<string, string>> = {
  a: 'ı',
  ı: 'ı',
  â: 'ı',
  e: 'i',
  i: 'i',
  î: 'i',
  o: 'u',
  u: 'u',
  û: 'u',
  ö: 'ü',
  ü: 'ü',
};

export interface Token {
  /** As written, without the punctuation around it: 'Tıkır’ın', '3', '100’ü'. */
  word: string;
  /** What the reader is expected to say: 'Tıkır’ın', 'üç', 'yüzü' (docs/kararlar.md C5). */
  spoken: string;
  /** Quotes or punctuation shown glued to the front of the word. */
  leading: string;
  /** Punctuation shown glued to the end of the word. */
  trailing: string;
  /** Whether a space follows this token on screen. */
  spaceAfter: boolean;
}

export function toUpperTr(text: string): string {
  return text.toLocaleUpperCase(LOCALE);
}

export function toLowerTr(text: string): string {
  return text.toLocaleLowerCase(LOCALE);
}

function isVowel(character: string): boolean {
  return VOWELS.has(toLowerTr(character));
}

/** User-perceived letters, composed (NFC) so that "a" + U+0302 is the single letter "â". */
function letters(word: string): string[] {
  return Array.from(graphemeSegmenter.segment(word.normalize('NFC')), (part) => part.segment);
}

function nameOf(names: readonly string[], value: number): string {
  return names[value] ?? '';
}

/**
 * Unicode assigns decimal digits only in runs of ten, from 0 to 9, so a digit's value is its
 * distance from the start of its run, modulo ten. This reads ASCII and other scripts alike.
 */
function digitValue(digit: string): number {
  const code = digit.codePointAt(0) ?? 0;
  let start = code;
  while (DECIMAL_DIGIT.test(String.fromCodePoint(start - 1))) {
    start -= 1;
  }
  return (code - start) % 10;
}

/** 1 to 999. */
function readHundreds(value: number): string[] {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;
  const words: string[] = [];
  if (hundreds > 1) {
    words.push(nameOf(DIGIT_NAMES, hundreds));
  }
  if (hundreds > 0) {
    words.push('yüz');
  }
  if (tens > 0) {
    words.push(nameOf(TENS_NAMES, tens));
  }
  if (ones > 0) {
    words.push(nameOf(DIGIT_NAMES, ones));
  }
  return words;
}

/** The Turkish reading of a run of digits: '1923' → 'bin dokuz yüz yirmi üç'. */
export function readCardinal(digits: string): string {
  if (!ONLY_DIGITS.test(digits)) {
    throw new RangeError(`Not a run of digits: "${digits}"`);
  }
  const values = Array.from(digits, digitValue);
  if (values.length > MAX_NUMBER_DIGITS || (values.length > 1 && values[0] === 0)) {
    return values.map((value) => nameOf(DIGIT_NAMES, value)).join(' ');
  }

  const words: string[] = [];
  const groups = Math.ceil(values.length / 3);
  for (let group = groups - 1; group >= 0; group -= 1) {
    const end = values.length - group * 3;
    const value = values
      .slice(Math.max(0, end - 3), end)
      .reduce((sum, digit) => sum * 10 + digit, 0);
    if (value === 0) {
      continue;
    }
    // "bin", not "bir bin"; but "bir milyon".
    if (!(value === 1 && group === 1)) {
      words.push(...readHundreds(value));
    }
    if (group > 0) {
      words.push(nameOf(SCALE_NAMES, group));
    }
  }
  return words.length === 0 ? nameOf(DIGIT_NAMES, 0) : words.join(' ');
}

function ordinalOf(word: string): string {
  const characters = letters(word);
  const lastVowel = characters.findLast(isVowel) ?? 'i';
  const vowel = ORDINAL_VOWEL[toLowerTr(lastVowel)] ?? 'i';
  // "dört" is the only number word whose final consonant softens before the suffix.
  const stem = word === 'dört' ? 'dörd' : word;
  return isVowel(characters.at(-1) ?? '') ? `${stem}nc${vowel}` : `${stem}${vowel}nc${vowel}`;
}

/** The ordinal reading of a run of digits: '3' → 'üçüncü', '21' → 'yirmi birinci'. */
export function readOrdinal(digits: string): string {
  const words = readCardinal(digits).split(' ');
  const last = words.pop() ?? '';
  return [...words, ordinalOf(last)].join(' ');
}

type WrittenToken = Omit<Token, 'spoken'>;

/**
 * A digit run is read as a number, its apostrophe suffix appended ('100’ü' → 'yüzü'). Followed
 * by a full stop and a lower-case word it is an ordinal ('3. sınıf' → 'üçüncü').
 */
function spokenOf(token: WrittenToken, next: WrittenToken | undefined): string {
  const digits = LEADING_DIGITS.exec(token.word)?.[0];
  if (digits === undefined) {
    return token.word;
  }
  const suffix = token.word.slice(digits.length).replace(APOSTROPHE_MARKS, '');
  const ordinal =
    suffix === '' &&
    token.trailing === '.' &&
    next !== undefined &&
    LOWER_CASE_START.test(next.leading + next.word);
  return (ordinal ? readOrdinal(digits) : readCardinal(digits)) + suffix;
}

/** Text is read in NFC: pasted text often spells ğ, ş, ö, ü, ç and İ with combining marks. */
export function tokenize(text: string): Token[] {
  const tokens: WrittenToken[] = [];
  let pendingLeading = '';

  for (const chunk of text.normalize('NFC').matchAll(/(\S+)(\s*)/gu)) {
    const body = chunk[1] ?? '';
    const chunkSpaceAfter = (chunk[2] ?? '').length > 0;
    const words = [...body.matchAll(WORD)];

    if (words.length === 0) {
      // No letters or digits (a dash, a stray mark): keep it visible next to its neighbour.
      const previous = tokens.at(-1);
      if (previous) {
        previous.trailing += (previous.spaceAfter ? ' ' : '') + body;
        previous.spaceAfter = chunkSpaceAfter;
      } else {
        pendingLeading += body + (chunkSpaceAfter ? ' ' : '');
      }
      continue;
    }

    words.forEach((match, position) => {
      const start = match.index;
      const end = start + match[0].length;
      const next = words[position + 1];
      const isLast = next === undefined;
      tokens.push({
        word: match[0],
        leading: position === 0 ? pendingLeading + body.slice(0, start) : '',
        trailing: body.slice(end, isLast ? body.length : next.index),
        spaceAfter: isLast ? chunkSpaceAfter : false,
      });
    });
    pendingLeading = '';
  }

  return tokens.map((token, position) => ({
    ...token,
    spoken: spokenOf(token, tokens[position + 1]),
  }));
}

/** A word of a chapter: index counts from the chapter's first word; page is 0-based. */
export interface ChapterToken extends Token {
  index: number;
  page: number;
}

/** Every word of a chapter in reading order, numbered across its pages. */
export function chapterTokens(chapter: Chapter): ChapterToken[] {
  const tokens: ChapterToken[] = [];
  chapter.pages.forEach((page, pageIndex) => {
    for (const token of tokenizePage(page)) {
      tokens.push({ ...token, index: tokens.length, page: pageIndex });
    }
  });
  return tokens;
}

/** The words of a page in reading order; sentences are separated by a space. */
export function tokenizePage(page: Page): Token[] {
  return page.flatMap((sentence, sentenceIndex) => {
    const tokens = tokenize(sentence.join(' '));
    const last = tokens.at(-1);
    if (last && sentenceIndex < page.length - 1) {
      last.spaceAfter = true;
    }
    return tokens;
  });
}

export function splitSentences(text: string): string[] {
  const composed = text.normalize('NFC');
  const pieces: string[] = [];
  let start = 0;

  for (const mark of composed.matchAll(SENTENCE_END)) {
    const end = mark.index + mark[0].length;
    const rest = composed.slice(end);
    if (rest.trim() === '' || NEXT_SENTENCE_START.test(rest)) {
      pieces.push(composed.slice(start, end));
      start = end;
    }
  }
  pieces.push(composed.slice(start));

  // A piece without a single letter ("...") is not a sentence: it joins the next one.
  const sentences: string[] = [];
  let carried = '';
  for (const piece of pieces.map((part) => part.trim()).filter((part) => part !== '')) {
    if (LETTER.test(piece)) {
      sentences.push(carried === '' ? piece : `${carried} ${piece}`);
      carried = '';
    } else {
      carried = carried === '' ? piece : `${carried} ${piece}`;
    }
  }
  if (carried !== '') {
    const last = sentences.pop();
    sentences.push(last === undefined ? carried : `${last} ${carried}`);
  }
  return sentences;
}

/** Seed sentences mark phrase-unit boundaries with " | " (docs/mimari.md). */
export function splitPhraseUnits(sentence: string): string[] {
  return sentence
    .split('|')
    .map((unit) => unit.trim())
    .filter((unit) => unit !== '');
}

/**
 * Every syllable has exactly one vowel. Of the consonants between two vowels only the last
 * moves to the right; with none between them the vowels are split. An apostrophe stays where
 * it is, so the syllables always join back into the (NFC) word. A spoken form of several words
 * ('bin dokuz yüz') is syllabified word by word.
 */
export function syllabify(word: string): string[] {
  if (/\s/u.test(word.trim())) {
    return word
      .trim()
      .split(/\s+/u)
      .flatMap((part) => syllabify(part));
  }
  const characters = letters(word);
  const vowelPositions = characters.flatMap((character, index) =>
    isVowel(character) ? [index] : [],
  );
  if (vowelPositions.length <= 1) {
    return [characters.join('')];
  }

  const cuts = vowelPositions.slice(1).map((next, index) => {
    const previous = vowelPositions[index] ?? 0;
    let cut = next;
    for (let position = next - 1; position > previous; position -= 1) {
      if (!APOSTROPHES.has(characters[position] ?? '')) {
        cut = position;
        break;
      }
    }
    return cut;
  });

  const syllables: string[] = [];
  let start = 0;
  for (const cut of cuts) {
    syllables.push(characters.slice(start, cut).join(''));
    start = cut;
  }
  syllables.push(characters.slice(start).join(''));
  return syllables;
}

/** One syllable per vowel; the apostrophe and the spaces of a spoken form are ignored. */
export function countSyllables(word: string): number {
  return letters(word).filter(isVowel).length;
}
