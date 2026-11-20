// Domain types (docs/mimari.md, "Tipler"). The names are binding; fields grow phase by phase.

export type Grade = 1 | 2 | 3 | 4;

/** Phrase units; joined, they make the sentence. */
export type Sentence = string[];

export type Page = Sentence[];

export type Id = string;

/** A calendar day, 'YYYY-MM-DD', in the device's local calendar (docs/planlar/faz-2a.md, karar 16). */
export type LocalDate = string;

export type ProsodyScore = 1 | 2 | 3 | 4;

/** Which of the session's three readings. */
export type Attempt = 1 | 2 | 3;

export interface Consent {
  voiceProcessing: boolean;
  weeklyEmail: boolean;
  grantedAt?: string;
}

/** The setup step still ahead (docs/planlar/faz-3.md, karar 1); none once the setup is done. */
export type SetupStep = 'reader' | 'level' | 'meet';

export interface Parent {
  id: Id;
  email: string;
  consent: Consent;
  setup?: SetupStep;
}

export interface ReadingStyle {
  font: 'clear' | 'school';
  sizeStep: 0 | 1 | 2 | 3;
  spacingStep: 0 | 1 | 2;
  trialEnabled: boolean;
}

/** Tıkır's reading pace on G3. */
export type NarrationRate = 'slow' | 'normal';

export interface Child {
  id: Id;
  name: string;
  grade: Grade;
  interests: string[];
  readingStyle: ReadingStyle;
  /** The child's last choice on G3; slow when missing (docs/ekranlar.md, G3). */
  narrationRate?: NarrationRate;
}

export interface Question {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface Chapter {
  number: number;
  title: string;
  pages: Page[];
  questions: Question[];
  chains: Record<string, string[]>;
}

export interface Book {
  id: Id;
  title: string;
  grade: Grade;
  source: 'series' | 'cards' | 'parentText';
  totalChapters: number;
  chapters: Chapter[];
}

/** A one-minute assessment text. */
export interface Passage {
  id: Id;
  grade: Grade;
  title: string;
  sentences: string[];
}

export type MiscueType =
  'misread' | 'suffix' | 'skipped' | 'repeated' | 'inserted' | 'selfCorrected' | 'helped';

export type WordStatus = 'correct' | MiscueType;

/**
 * One word of a reading. Times are milliseconds from the start of the reading, pauses excluded;
 * hesitationMs is written only when it is at least config.hesitationMarkMs.
 */
export interface WordResult {
  index: number;
  status: WordStatus;
  tStart: number;
  tEnd: number;
  heard?: string;
  hesitationMs?: number;
}

/** What a listener reports when a reading ends. */
export interface ReadingOutcome {
  words: WordResult[];
  seconds: number;
  prosodyScore?: ProsodyScore;
}

export interface ChapterRef {
  bookId: Id;
  chapter: number;
}

/** chapterRef and attempt are missing on an assessment reading. */
export interface ReadingResult {
  chapterRef?: ChapterRef;
  attempt?: Attempt;
  startedAt: string;
  seconds: number;
  words: WordResult[];
  wordsAttempted: number;
  correctWords: number;
  wcpm: number;
  accuracy: number;
  prosodyScore?: ProsodyScore;
  recordingId?: Id;
  readingStyle: ReadingStyle;
}

export type SessionStep = 'warmup' | 'listen' | 'read' | 'record' | 'wrapUp' | 'done';

/**
 * The warmup deck chosen when the session started, as shown (docs/planlar/faz-2b.md, karar 2):
 * done cards are finished; scored cards had their first attempt scored (done ≤ scored ≤ done + 1),
 * so a reload in the second attempt never scores the card again.
 */
export interface SessionWarmup {
  words: string[];
  done: number;
  scored: number;
}

export interface Session {
  id: Id;
  childId: Id;
  date: LocalDate;
  chapterRef: ChapterRef;
  step: SessionStep;
  readings: ReadingResult[];
  answers: number[];
  tamedToday: string[];
  startedAt: string;
  completedAt?: string;
  /** P14: the microphone could not be used and the child read on unheard (docs/kararlar.md). */
  unheard?: true;
  /** Missing on sessions that never had a warmup deck stored (the demo profile's past days). */
  warmup?: SessionWarmup;
}

export type StuckWordStatus = 'wild' | 'practicing' | 'tamed';

/** A tamed card has no due day. */
export interface StuckWord {
  word: string;
  syllables: string[];
  chain: string[];
  misses: number;
  status: StuckWordStatus;
  correctStreak: number;
  dueOn: LocalDate | null;
}

/** The suffix-chain suggestion on V2. */
export interface DrillSuggestion {
  suffixes: string[];
  words: string[];
  days: number;
}

export type ReadingLevel = 'frustration' | 'instructional' | 'independent';

/** trial: the second reading, made with the reading style being tried. */
export interface Assessment {
  id: Id;
  childId: Id;
  date: LocalDate;
  passageId: Id;
  result: ReadingResult;
  level: ReadingLevel;
  trial?: boolean;
}
