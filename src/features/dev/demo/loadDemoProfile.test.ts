import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import demoProfile from '../../../../seed/demo-profil.json';
import { weekdayOf } from '../../../domain/date';
import { previousReading } from '../../../domain/ghost';
import { firstTarget } from '../../../domain/goals';
import {
  completedSeriesChapters,
  deltaFromPrevious,
  nextSeriesChapter,
  streakDays,
} from '../../../domain/progress';
import { countMiscues, scoreReading } from '../../../domain/scoring';
import { remainingToTame, warmupDeck } from '../../../domain/stuckWords';
import { chapterTokens } from '../../../domain/text';
import type { MiscueType } from '../../../domain/types';
import { scenarioSets } from '../../../services/listener/scenarios';
import { simulateReading, toWordResults } from '../../../services/listener/simulateReading';
import { IndexedDbRepository } from '../../../services/repository/IndexedDbRepository';
import { anchorDate, loadDemoProfile } from './loadDemoProfile';

const today = '2026-11-19';
const seriesId = 'kayip-fenerin-izinde';
const everyDay = ['2000-01-01', '2100-12-31'] as const;

async function loaded(mode: 'cocuk-sabahi' | 'veli-haftasonu') {
  const repository = await IndexedDbRepository.open();
  const summary = await loadDemoProfile(repository, mode, today);
  return { repository, summary };
}

describe('anchorDate', () => {
  it("puts the child's morning on today and the parent's weekend on the last Sunday", () => {
    expect(anchorDate('cocuk-sabahi', '2026-11-19')).toBe('2026-11-19');
    expect(anchorDate('veli-haftasonu', '2026-11-19')).toBe('2026-11-15');
    expect(anchorDate('veli-haftasonu', '2026-11-22')).toBe('2026-11-22');
    expect(demoProfile.modes['cocuk-sabahi'].load).toBe('day < 0');
    expect(demoProfile.modes['veli-haftasonu'].load).toBe('day <= 1');
  });
});

describe('loadDemoProfile', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it("sets up the child's morning: the G1, G2 and G7 numbers of the designs", async () => {
    const { repository, summary } = await loaded('cocuk-sabahi');
    const expected = demoProfile.expected['cocuk-sabahi'];

    expect(summary).toMatchObject({ sessions: 4, stuckWords: 4, assessments: 6 });
    const sessions = await repository.listSessions(...everyDay);
    expect(sessions.map((session) => session.date)).toEqual([
      '2026-11-14',
      '2026-11-15',
      '2026-11-17',
      '2026-11-18',
    ]);
    const seedReadings = demoProfile.timeline.sessions
      .filter((session) => session.day < 0)
      .map((session) => session.readings.map((reading) => reading.wcpm));
    expect(sessions.map((session) => session.readings.map((reading) => reading.wcpm))).toEqual(
      seedReadings,
    );
    expect(await repository.getSession(today)).toBeNull();
    expect((await repository.getParent())?.consent.voiceProcessing).toBe(true);
    expect(await repository.getChild()).toMatchObject({ name: 'Deniz', grade: 3 });

    const series = await repository.getBook(seriesId);
    if (series === null) {
      throw new Error('the series book is missing');
    }
    expect(nextSeriesChapter(sessions, series)).toBe(expected.G1.todayChapter);
    expect(completedSeriesChapters(sessions, seriesId)).toEqual([1, 2, 3]);
    expect(
      streakDays(
        sessions.map((session) => session.date),
        today,
      ),
    ).toBe(expected.G1.streakDays);

    const chapter = series.chapters.find((item) => item.number === 4);
    if (chapter === undefined) {
      throw new Error('chapter 4 is missing');
    }
    const cards = await repository.listStuckWords();
    const deck = warmupDeck(cards, today, {
      words: chapterTokens(chapter),
      chains: chapter.chains,
    });
    expect(deck.map((item) => item.word)).toEqual(expected.G2.cards);
    const first = deck[0]?.card;
    expect(first ? remainingToTame(first) : null).toBe(expected.G2.firstCardRemaining);
    expect(cards.find((card) => card.word === 'tırmanmaya')?.dueOn).toBe('2026-11-20');

    const words = chapterTokens(chapter).map((token) => token.spoken);
    const third = simulateReading(words, scenarioSets.typical.readings[2]);
    const wcpm = scoreReading(toWordResults(third), third.seconds).wcpm;
    expect(wcpm).toBe(expected.G7.wcpm);
    const yesterday = previousReading(sessions, today, 3);
    expect(yesterday?.wcpm).toBe(67);
    expect(deltaFromPrevious(wcpm, yesterday?.wcpm ?? null)).toBe(expected.G7.deltaFromYesterday);
  });

  it("sets up the parent's weekend: the V1–V4 numbers of the designs", async () => {
    const { repository, summary } = await loaded('veli-haftasonu');
    const expected = demoProfile.expected['veli-haftasonu'];

    expect(summary).toMatchObject({ anchor: '2026-11-15', sessions: 5, assessments: 8 });
    const sessions = await repository.listSessions(...everyDay);
    expect(sessions.map((session) => session.date)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
    ]);
    expect(sessions.map((session) => weekdayOf(session.date))).toEqual([1, 2, 4, 5, 6]);

    const assessments = await repository.listAssessments();
    const seedAssessments = demoProfile.timeline.assessments;
    expect(assessments).toHaveLength(8);
    for (const seed of seedAssessments) {
      const match = assessments.find(
        (item) => item.passageId === seed.passageId && item.result.wcpm === seed.wcpm,
      );
      expect(match?.result).toMatchObject({
        wcpm: seed.wcpm,
        correctWords: seed.correctWords,
        wordsAttempted: seed.wordsRead,
      });
      expect(Math.round((match?.result.accuracy ?? 0) * 100)).toBe(seed.accuracyPercent);
    }
    const regular = assessments.filter((item) => item.trial !== true);
    const trials = assessments.filter((item) => item.trial === true);
    expect(regular.at(-1)?.level).toBe(expected.V3.level);
    expect(regular.map((item) => item.result.wcpm)).toEqual(expected.V1.chart);

    const totals: Record<MiscueType, number> = {
      misread: 0,
      suffix: 0,
      skipped: 0,
      repeated: 0,
      inserted: 0,
      selfCorrected: 0,
      helped: 0,
    };
    for (const reading of sessions.flatMap((session) => session.readings)) {
      const counts = countMiscues(reading.words);
      for (const type of Object.keys(totals) as MiscueType[]) {
        totals[type] += counts[type];
      }
    }
    expect(totals).toMatchObject(expected.V2.byType);
    expect(Object.values(totals).reduce((sum, count) => sum + count, 0)).toBe(
      expected.V2.totalErrors,
    );

    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(average(regular.slice(-2).map((item) => item.result.wcpm))).toBe(
      expected.V4.currentAverage,
    );
    expect(average(trials.slice(-2).map((item) => item.result.wcpm))).toBe(
      expected.V4.trialAverage,
    );
    expect(firstTarget(demoProfile.goal.baselineWcpm)).toBe(demoProfile.goal.targetWcpm);
    expect(await repository.getDrillSuggestion()).toEqual({
      suffixes: ['‑yordu', '‑diğinde'],
      words: demoProfile.modes['veli-haftasonu'].suggestedDrill.words,
      days: 3,
    });
  });

  it('gives the same numbers when a mode is loaded twice', async () => {
    const { repository, summary } = await loaded('cocuk-sabahi');

    const again = await loadDemoProfile(repository, 'cocuk-sabahi', today);

    expect(again).toEqual(summary);
    expect(await repository.listSessions(...everyDay)).toHaveLength(4);
    expect(await repository.getDrillSuggestion()).toBeNull();
  });
});
