// The demo profile (seed/demo-profil.json; docs/mimari.md, "Depolama ve örnek veri"): the designs'
// sample child, Deniz, in one of two modes. Readings and assessments are fake listener scenarios,
// run through the same simulation as FakeListener. Developer pages only.
import demoJson from '../../../../seed/demo-profil.json';
import sampleBooksJson from '../../../../seed/ornek-kitaplar.json';
import { addDays, weekdayOf } from '../../../domain/date';
import { readingLevel, toReadingResult } from '../../../domain/scoring';
import { chapterTokens, syllabify, tokenize } from '../../../domain/text';
import type {
  Assessment,
  Attempt,
  Book,
  Child,
  Grade,
  LocalDate,
  MiscueType,
  Parent,
  ProsodyScore,
  ReadingResult,
  ReadingStyle,
  Session,
  StuckWord,
  StuckWordStatus,
} from '../../../domain/types';
import { createId } from '../../../services/id';
import { simulateReading, toWordResults } from '../../../services/listener/simulateReading';
import type { FakeScenario } from '../../../services/listener/types';
import type { Repository } from '../../../services/repository/Repository';
import { bookFromSeed, seedPassages, seriesBook } from '../../../services/repository/seedContent';

export const demoModes = ['cocuk-sabahi', 'veli-haftasonu'] as const;

export type DemoMode = (typeof demoModes)[number];

export interface DemoSummary {
  mode: DemoMode;
  /** The date of the mode's anchor day. */
  anchor: LocalDate;
  sessions: number;
  stuckWords: number;
  assessments: number;
}

interface SeedReading {
  attempt: number;
  wcpm: number;
  miscues: readonly { index: number; type: string }[];
  hesitations: readonly { index: number; ms: number }[];
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
const attempts: readonly Attempt[] = [1, 2, 3];
const prosodyScores: readonly ProsodyScore[] = [1, 2, 3, 4];
const grades: readonly Grade[] = [1, 2, 3, 4];
const cardStatuses: readonly StuckWordStatus[] = ['wild', 'practicing', 'tamed'];
const fonts: readonly ReadingStyle['font'][] = ['clear', 'school'];
const sizeSteps: readonly ReadingStyle['sizeStep'][] = [0, 1, 2, 3];
const spacingSteps: readonly ReadingStyle['spacingStep'][] = [0, 1, 2];

/** The value from the list that equals the seed's, or an error naming what was wrong. */
function oneOf<T extends string | number>(values: readonly T[], value: unknown, what: string): T {
  const found = values.find((item) => item === value);
  if (found === undefined) {
    throw new Error(`demo-profil.json: ${String(value)} is not a ${what}.`);
  }
  return found;
}

/** "day < 0", "day <= 1": which timeline days a mode loads. */
function dayFilter(rule: string): (day: number) => boolean {
  const match = /^day (<|<=) (-?\d+)$/.exec(rule);
  if (match === null) {
    throw new Error(`demo-profil.json: cannot read the load rule "${rule}".`);
  }
  const limit = Number(match[2]);
  return match[1] === '<' ? (day) => day < limit : (day) => day <= limit;
}

/** The anchor day's date: today, or the last Sunday on or before today. */
export function anchorDate(mode: DemoMode, today: LocalDate): LocalDate {
  const to = demoJson.modes[mode].anchor.to;
  if (to === 'today') {
    return today;
  }
  if (to === 'lastSunday') {
    return addDays(today, -weekdayOf(today));
  }
  throw new Error(`demo-profil.json: unknown anchor "${to}".`);
}

/** Local 09:00 of a calendar day. */
function morningOf(date: LocalDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 9, 0, 0);
}

function scenarioOf(
  reading: Omit<SeedReading, 'attempt'>,
): Pick<FakeScenario, 'miscues' | 'hesitations'> {
  return {
    miscues: reading.miscues.map(({ index, type }) => ({
      index,
      type: oneOf(miscueTypes, type, 'miscue type'),
    })),
    hesitations: reading.hesitations.map(({ index, ms }) => ({ index, ms })),
  };
}

function readingStyleOf(seed: {
  font: string;
  sizeStep: number;
  spacingStep: number;
}): Omit<ReadingStyle, 'trialEnabled'> {
  return {
    font: oneOf(fonts, seed.font, 'font'),
    sizeStep: oneOf(sizeSteps, seed.sizeStep, 'size step'),
    spacingStep: oneOf(spacingSteps, seed.spacingStep, 'spacing step'),
  };
}

function checkWcpm(result: ReadingResult, wcpm: number, what: string): void {
  if (result.wcpm !== wcpm) {
    throw new Error(`demo-profil.json: ${what} simulates to ${result.wcpm} wcpm, not ${wcpm}.`);
  }
}

/**
 * Clears the repository and sets up the mode: the parent and the child, the two library books,
 * the sessions and assessments up to the mode's day, its stuck word cards and its drill. Throws
 * if a simulated reading does not give the seed's wcpm.
 */
/** The demo profile's parent, reader and first measurement, for the setup steps (Faz 3, karar 5). */
export interface DemoSetupSeed {
  email: string;
  weeklyEmail: boolean;
  reader: { name: string; grade: Grade; interests: string[] };
  /** The level check's reading: its text and the timed scenario that reads it. */
  firstMeasurement: { passageId: string; scenario: FakeScenario };
}

export function demoSetupSeed(): DemoSetupSeed {
  const first = demoJson.timeline.assessments[0];
  if (first === undefined) {
    throw new Error('demo-profil.json: no assessment.');
  }
  return {
    email: demoJson.parent.email,
    weeklyEmail: demoJson.parent.consent.weeklyEmail,
    reader: {
      name: demoJson.child.name,
      grade: oneOf(grades, demoJson.child.grade, 'grade'),
      interests: [...demoJson.child.interests],
    },
    firstMeasurement: {
      passageId: first.passageId,
      scenario: {
        timed: { seconds: first.seconds, wordsRead: first.wordsRead },
        ...scenarioOf(first),
        prosodyScore: oneOf(prosodyScores, first.prosodyScore, 'prosody score'),
      },
    },
  };
}

export async function loadDemoProfile(
  repository: Repository,
  mode: DemoMode,
  today: LocalDate,
): Promise<DemoSummary> {
  const modeJson = demoJson.modes[mode];
  const anchor = anchorDate(mode, today);
  const dateOf = (day: number) => addDays(anchor, day - modeJson.anchor.day);
  const loads = dayFilter(modeJson.load);

  await repository.clearAll();

  const parent: Parent = {
    id: createId(),
    email: demoJson.parent.email,
    consent: {
      voiceProcessing: demoJson.parent.consent.voiceProcessing,
      weeklyEmail: demoJson.parent.consent.weeklyEmail,
    },
  };
  const readingStyle: ReadingStyle = {
    ...readingStyleOf(demoJson.child.readingStyle),
    trialEnabled: demoJson.child.readingStyle.trialEnabled,
  };
  const child: Child = {
    id: createId(),
    name: demoJson.child.name,
    grade: oneOf(grades, demoJson.child.grade, 'grade'),
    interests: [...demoJson.child.interests],
    readingStyle,
  };
  await repository.saveParent(parent);
  await repository.saveChild(child);

  const books: Book[] = [seriesBook(), ...sampleBooksJson.books.map((book) => bookFromSeed(book))];
  for (const book of books.slice(1)) {
    await repository.saveBook(book);
  }

  const sessions = demoJson.timeline.sessions.filter((session) => loads(session.day));
  for (const seed of sessions) {
    const date = dateOf(seed.day);
    const chapter = books
      .find((book) => book.id === seed.bookId)
      ?.chapters.find((item) => item.number === seed.chapter);
    if (chapter === undefined) {
      throw new Error(`demo-profil.json: no chapter ${seed.chapter} of ${seed.bookId}.`);
    }
    const words = chapterTokens(chapter).map((token) => token.spoken);
    const startedAt = morningOf(date);
    const chapterRef = { bookId: seed.bookId, chapter: seed.chapter };
    const readings = seed.readings.map((reading: SeedReading) => {
      const simulation = simulateReading(words, { wcpm: reading.wcpm, ...scenarioOf(reading) });
      const result = toReadingResult(
        { words: toWordResults(simulation), seconds: simulation.seconds },
        {
          chapterRef,
          attempt: oneOf(attempts, reading.attempt, 'reading attempt'),
          startedAt: startedAt.toISOString(),
          readingStyle,
        },
      );
      checkWcpm(result, reading.wcpm, `day ${seed.day}, reading ${reading.attempt}`);
      return result;
    });
    const session: Session = {
      id: createId(),
      childId: child.id,
      date,
      chapterRef,
      step: 'done',
      readings,
      answers: [...seed.answers],
      tamedToday: [],
      startedAt: startedAt.toISOString(),
      completedAt: new Date(startedAt.getTime() + seed.minutes * 60_000).toISOString(),
    };
    await repository.saveSession(session);
  }

  const chains = new Map<string, string[]>();
  for (const chapter of books.flatMap((book) => book.chapters)) {
    for (const [word, chain] of Object.entries(chapter.chains)) {
      chains.set(word, chain);
    }
  }
  const cards: StuckWord[] = modeJson.stuckWords.map((seed) => ({
    word: seed.word,
    syllables: syllabify(seed.word),
    chain: [...(chains.get(seed.word) ?? [])],
    misses: seed.misses,
    status: oneOf(cardStatuses, seed.status, 'card status'),
    correctStreak: seed.correctStreak,
    dueOn: seed.dueDay === null ? null : dateOf(seed.dueDay),
  }));
  await repository.saveStuckWords(cards);

  const passages = seedPassages();
  const assessments = demoJson.timeline.assessments.filter((assessment) => loads(assessment.day));
  for (const seed of assessments) {
    const passage = passages.find((item) => item.id === seed.passageId);
    if (passage === undefined) {
      throw new Error(`demo-profil.json: no passage ${seed.passageId}.`);
    }
    const words = passage.sentences
      .flatMap((sentence) => tokenize(sentence))
      .map((token) => token.spoken);
    const prosodyScore = oneOf(prosodyScores, seed.prosodyScore, 'prosody score');
    const simulation = simulateReading(words, {
      timed: { seconds: seed.seconds, wordsRead: seed.wordsRead },
      ...scenarioOf(seed),
      prosodyScore,
    });
    const trial = 'trial' in seed && seed.trial === true;
    // A trial assessment reads with the style being tried, over the child's own.
    const trialStyle = 'readingStyle' in seed ? seed.readingStyle : undefined;
    const style =
      trialStyle === undefined ? readingStyle : { ...readingStyle, ...readingStyleOf(trialStyle) };
    const date = dateOf(seed.day);
    const result = toReadingResult(
      { words: toWordResults(simulation), seconds: simulation.seconds, prosodyScore },
      { startedAt: morningOf(date).toISOString(), readingStyle: style },
    );
    checkWcpm(result, seed.wcpm, `the assessment of day ${seed.day} (${seed.passageId})`);
    const assessment: Assessment = {
      id: createId(),
      childId: child.id,
      date,
      passageId: seed.passageId,
      result,
      level: readingLevel(result.accuracy),
    };
    if (trial) {
      assessment.trial = true;
    }
    await repository.saveAssessment(assessment);
  }

  await repository.saveDrillSuggestion(
    'suggestedDrill' in modeJson
      ? {
          suffixes: [...modeJson.suggestedDrill.suffixes],
          words: [...modeJson.suggestedDrill.words],
          days: modeJson.suggestedDrill.days,
        }
      : null,
  );

  return {
    mode,
    anchor,
    sessions: sessions.length,
    stuckWords: cards.length,
    assessments: assessments.length,
  };
}
