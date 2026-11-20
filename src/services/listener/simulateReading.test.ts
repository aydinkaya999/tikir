import { describe, expect, it } from 'vitest';
import seriesBook from '../../../seed/kayip-fenerin-izinde.json';
import demoProfile from '../../../seed/demo-profil.json';
import assessmentPassages from '../../../seed/olcum-metinleri.json';
import { scoreReading } from '../../domain/scoring';
import { splitPhraseUnits, tokenize } from '../../domain/text';
import type { MiscueType } from '../../domain/types';
import { scenarioNames, scenarioSets } from './scenarios';
import { simulateReading, toWordResults } from './simulateReading';
import type { FakeScenario } from './types';

function chapterWords(number: number): string[] {
  const chapter = seriesBook.chapters.find((item) => item.number === number);
  if (chapter === undefined) {
    throw new Error(`seed chapter ${number} is missing`);
  }
  return chapter.pages
    .flat()
    .flatMap((sentence) => tokenize(splitPhraseUnits(sentence).join(' ')))
    .map((token) => token.spoken);
}

function passageWords(id: string): string[] {
  const passage = assessmentPassages.passages.find((item) => item.id === id);
  if (passage === undefined) {
    throw new Error(`seed passage ${id} is missing`);
  }
  return passage.sentences.flatMap((sentence) => tokenize(sentence)).map((token) => token.spoken);
}

const miscueTypes: readonly MiscueType[] = [
  'misread',
  'suffix',
  'skipped',
  'repeated',
  'inserted',
  'selfCorrected',
  'helped',
];

function asMiscue(value: string): MiscueType {
  const found = miscueTypes.find((type) => type === value);
  if (found === undefined) {
    throw new Error(`Not a miscue type: ${value}`);
  }
  return found;
}

function scenario(fields: Partial<FakeScenario>): FakeScenario {
  return { miscues: [], hesitations: [], ...fields };
}

describe('simulateReading', () => {
  it('reproduces the wcpm of every reading of every scenario on chapters 4 and 5', () => {
    for (const chapter of [4, 5]) {
      const words = chapterWords(chapter);
      for (const name of scenarioNames) {
        for (const reading of scenarioSets[name].readings) {
          const simulation = simulateReading(words, reading);
          const score = scoreReading(toWordResults(simulation), simulation.seconds);
          expect(score.wcpm, `${name} on chapter ${chapter}`).toBe(reading.wcpm);
        }
      }
    }
    const typicalThird = simulateReading(chapterWords(4), scenarioSets.typical.readings[2]);
    expect(typicalThird.seconds).toBe((99 * 60) / 71);
  });

  it('gives each word time in proportion to its syllables', () => {
    const simulation = simulateReading(['ve', 'kıvrılıyordu'], scenarioSets.smooth.readings[0]);
    const [first, second] = simulation.words;
    if (first === undefined || second === undefined) {
      throw new Error('two words expected');
    }

    expect(second.endMs - second.startMs).toBeCloseTo((first.endMs - first.startMs) * 5, 6);
  });

  it('puts a hesitation before its word and reports it from the mark threshold on', () => {
    const simulation = simulateReading(chapterWords(4), scenarioSets.typical.readings[1]);
    const before = simulation.words[5];
    const hesitant = simulation.words[6];

    expect((hesitant?.startMs ?? 0) - (before?.endMs ?? 0)).toBeCloseTo(1800, 6);
    expect(toWordResults(simulation)[6]?.hesitationMs).toBe(1800);
    expect(toWordResults(simulation)[5]).not.toHaveProperty('hesitationMs');
  });

  it('turns a hesitation at the help threshold into a helped word without reading time', () => {
    const simulation = simulateReading(
      ['Deniz', 'sırt', 'çantasını'],
      scenario({ wcpm: 20, hesitations: [{ index: 1, ms: 3500 }] }),
    );
    const helped = simulation.words[1];

    expect(helped?.status).toBe('helped');
    expect(helped?.hesitationMs).toBe(3000);
    expect(helped?.startMs).toBe(helped?.endMs);
    expect(toWordResults(simulation)[1]?.hesitationMs).toBe(3000);
  });

  it('stops a timed reading after the words read', () => {
    const day1 = demoProfile.timeline.assessments.find(
      (assessment) => assessment.day === 1 && assessment.passageId === 'olcum-3b',
    );
    if (day1 === undefined) {
      throw new Error('the day 1 assessment is missing');
    }
    const timed = scenario({
      timed: { seconds: 60, wordsRead: 76 },
      miscues: day1.miscues.map(({ index, type }) => ({ index, type: asMiscue(type) })),
      hesitations: [{ index: 21, ms: 1800 }],
    });

    const simulation = simulateReading(passageWords('olcum-3b'), timed);
    const score = scoreReading(toWordResults(simulation), simulation.seconds);

    expect(simulation.words).toHaveLength(76);
    expect(simulation.seconds).toBe(60);
    expect(score.correctWords).toBe(71);
    expect(score.wcpm).toBe(71);

    const whole = simulateReading(
      passageWords('olcum-3b'),
      scenario({ timed: { seconds: 60, wordsRead: 500 } }),
    );
    expect(whole.words).toHaveLength(passageWords('olcum-3b').length);
  });

  it('repeats itself for the same seed and varies the timing, not the score, across seeds', () => {
    const words = chapterWords(4);
    const jittered = (seed: number) =>
      scenario({ wcpm: 64, jitter: 0.3, seed, miscues: [{ index: 15, type: 'suffix' }] });

    expect(simulateReading(words, jittered(1))).toEqual(simulateReading(words, jittered(1)));

    const one = simulateReading(words, jittered(1));
    const two = simulateReading(words, jittered(2));
    expect(one.words.map((word) => word.startMs)).not.toEqual(
      two.words.map((word) => word.startMs),
    );
    expect(one.seconds).toBe(two.seconds);
    expect(scoreReading(toWordResults(one), one.seconds).wcpm).toBe(
      scoreReading(toWordResults(two), two.seconds).wcpm,
    );
  });

  it('ignores positions past the end of the text', () => {
    const simulation = simulateReading(['kıvrılıyordu'], scenarioSets.typical.readings[0]);

    expect(simulation.words.map((word) => word.status)).toEqual(['correct']);
  });

  it('rejects a scenario it cannot time', () => {
    expect(() =>
      simulateReading(
        ['Deniz', 'sırt'],
        scenario({ wcpm: 120, hesitations: [{ index: 1, ms: 2500 }] }),
      ),
    ).toThrow(RangeError);
    expect(() => simulateReading(['Deniz'], scenario({}))).toThrow(TypeError);
  });

  it('passes the prosody score through', () => {
    expect(simulateReading(['Deniz'], scenario({ wcpm: 60, prosodyScore: 3 })).prosodyScore).toBe(
      3,
    );
  });
});
