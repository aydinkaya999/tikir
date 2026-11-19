import { describe, expect, it } from 'vitest';
import seriesBook from '../../../seed/kayip-fenerin-izinde.json';
import demoProfile from '../../../seed/demo-profil.json';
import { ghostIndex } from '../../domain/ghost';
import { isCountedError } from '../../domain/scoring';
import { splitPhraseUnits, tokenize } from '../../domain/text';
import { scenarioSets } from './scenarios';
import { simulateReading, toWordResults } from './simulateReading';

function chapterFourWords(): string[] {
  const chapter = seriesBook.chapters.find((item) => item.number === 4);
  if (chapter === undefined) {
    throw new Error('seed chapter 4 is missing');
  }
  return chapter.pages
    .flat()
    .flatMap((sentence) => tokenize(splitPhraseUnits(sentence).join(' ')))
    .map((token) => token.spoken);
}

describe('scenarioSets', () => {
  it("makes the typical readings the demo profile's readings of day 0", () => {
    const today = demoProfile.timeline.sessions.find((session) => session.day === 0);
    const fromSeed = today?.readings.map((reading) => ({
      wcpm: reading.wcpm,
      miscues: reading.miscues.map(({ index, type }) => ({ index, type })),
      hesitations: reading.hesitations.map(({ index, ms }) => ({ index, ms })),
    }));

    expect(scenarioSets.typical.readings).toEqual(fromSeed);
  });

  it('opens the help of the design scenario at the moment the G4 design shows', () => {
    const design = scenarioSets.design;
    const simulation = simulateReading(chapterFourWords(), design.readings[1]);
    const helped = simulation.words[14];
    const helpOpensMs = helped?.startMs ?? 0;

    expect(helped?.status).toBe('helped');
    expect(helpOpensMs).toBeGreaterThan(19000);
    expect(helpOpensMs).toBeLessThan(19500);
    expect(design.ghostWpm).toBe(40);
    expect(design.layout).toBe('design');
    expect(ghostIndex(design.ghostWpm ?? 0, helpOpensMs, 99)).toBe(12);

    const before = toWordResults(simulation).slice(0, 14);
    expect(before.filter((word) => !isCountedError(word.status))).toHaveLength(13);
    expect(
      before.filter((word) => (word.hesitationMs ?? 0) >= 1000).map((word) => word.index),
    ).toEqual([6]);
  });

  it('keeps the first and third design readings the typical ones', () => {
    expect(scenarioSets.design.readings[0]).toEqual(scenarioSets.typical.readings[0]);
    expect(scenarioSets.design.readings[2]).toEqual(scenarioSets.typical.readings[2]);
  });
});
