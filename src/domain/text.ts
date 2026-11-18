// Turkish text rules: docs/mimari.md, "Türkçe metin kuralları ve sınama örnekleri".

const LOCALE = 'tr-TR';
const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü', 'â', 'î', 'û']);
const APOSTROPHES = new Set(["'", '’']);
/** A word is a run of letters; a suffix joined with an apostrophe belongs to it. */
const WORD = /\p{L}+(?:['’]\p{L}+)*/gu;
/** Sentence-closing marks, optionally followed by closing quotes or brackets. */
const SENTENCE_END = /[.!?…]+[”"’»)]*/gu;
/** Whitespace, optional opening quotes or brackets, then a capital letter. */
const NEXT_SENTENCE_START = /^\s+[“"‘«(]*\p{Lu}/u;
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

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let pendingLeading = '';

  for (const chunk of text.matchAll(/(\S+)(\s*)/gu)) {
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

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;

  for (const mark of text.matchAll(SENTENCE_END)) {
    const end = mark.index + mark[0].length;
    const rest = text.slice(end);
    if (rest.trim() === '' || NEXT_SENTENCE_START.test(rest)) {
      sentences.push(text.slice(start, end));
      start = end;
    }
  }
  sentences.push(text.slice(start));

  return sentences.map((sentence) => sentence.trim()).filter((sentence) => sentence !== '');
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
