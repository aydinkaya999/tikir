// Turkish text rules: docs/mimari.md, "Türkçe metin kuralları ve sınama örnekleri".
import type { Page } from './types';

const LOCALE = 'tr-TR';
const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü', 'â', 'î', 'û']);
const APOSTROPHES = new Set(["'", '’']);
/** A word is a run of letters; a suffix joined with an apostrophe belongs to it. */
const WORD = /\p{L}+(?:['’]\p{L}+)*/gu;
/** Sentence-closing marks, optionally followed by closing quotes or brackets. */
const SENTENCE_END = /[.!?…]+[”"’»)]*/gu;
/**
 * Whitespace, then optional opening quotes, brackets or a dialogue dash, then a capital letter
 * or a number.
 */
const NEXT_SENTENCE_START = /^\s+[“"‘«(—–-]*\s*[\p{Lu}\p{N}]/u;
const LETTER = /\p{L}/u;
const graphemeSegmenter = new Intl.Segmenter(LOCALE, { granularity: 'grapheme' });

export interface Token {
  /** Letters only (with an apostrophe suffix); what the reader is expected to say. */
  word: string;
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

/** Text is read in NFC: pasted text often spells ğ, ş, ö, ü, ç and İ with combining marks. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let pendingLeading = '';

  for (const chunk of text.normalize('NFC').matchAll(/(\S+)(\s*)/gu)) {
    const body = chunk[1] ?? '';
    const chunkSpaceAfter = (chunk[2] ?? '').length > 0;
    const words = [...body.matchAll(WORD)];

    if (words.length === 0) {
      // No letters (a dash, a number, a stray mark): keep it visible next to its neighbour.
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
 * it is, so the syllables always join back into the (NFC) word.
 */
export function syllabify(word: string): string[] {
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

/** One syllable per vowel; the apostrophe is ignored. */
export function countSyllables(word: string): number {
  return letters(word).filter(isVowel).length;
}
