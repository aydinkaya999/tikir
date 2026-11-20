// The parent area's views. V1–V3 and the recordings (docs/planlar/faz-4.md, kararlar 11–27 and
// 36): the numbers as numbers, the sentences ready to show. V4 (docs/planlar/faz-3.md, karar 24):
// the preview's text, a style's name and the comparison's sentence.
import { gradeAverageWcpm, hesitationMarkMs, trialSmallDifference } from '../../domain/config';
import { daysBetween, localDateOf, weekStart } from '../../domain/date';
import { lastMeasurement, nextMeasurementOn } from '../../domain/measurement';
import type { TrialComparison } from '../../domain/readingStyle';
import {
  type DayMark,
  goalUpdate,
  reportErrorTypes,
  type ReportErrorType,
  reportWeeks,
  sessionDays,
  targetForWeek,
  weekComment,
  type WeekComment,
  weekErrors,
  weekMeasurement,
  weekNumber,
} from '../../domain/report';
import { stuckKey } from '../../domain/stuckWords';
import {
  type ChapterToken,
  chapterTokens,
  passageChapter,
  readCardinal,
  tokenize,
  toUpperTr,
  withAblativeSuffix,
  withDativeSuffix,
  withGenitiveSuffix,
  withPossessiveLocativeSuffix,
} from '../../domain/text';
import type {
  Grade,
  Id,
  LocalDate,
  Page,
  ProsodyScore,
  ReadingLevel,
  ReadingStyle,
  StuckWordStatus,
  WordResult,
} from '../../domain/types';
import { tr } from '../../i18n/tr';
import type { RecordingApproval, RecordingEntry } from '../../services/recorder/Recorder';
import { formatClock } from '../session/format';
import type { SessionData } from '../session/sessionStore';
import { formatDayMonth, formatLongDate, formatWeekRange } from './format';

const copy = tr.readingStyle;
const report = tr.report;

/** V1's chart shows this many measured weeks, up to the week shown (the design's six). */
const chartWeekCount = 6;
/** V2 lists this many words; the phone design shows the first three. */
const listedWordCount = 4;
/** A word's sound starts a little before and ends a little after its times (V2). */
const wordPlaybackPaddingMs = 200;
/** V3's excerpt: the measurement text's first sentences. */
const excerptSentences = 4;

// V1 Haftalık özet.

export interface SummaryDay {
  label: string;
  mark: DayMark;
}

export interface SummaryChart {
  points: number[];
  labels: string[];
  target: number | null;
  average: number | null;
  yTicks: number[];
  /** The chart's accessible name. */
  label: string;
}

export interface SummaryView {
  title: string;
  range: string;
  previousWeek: LocalDate | null;
  nextWeek: LocalDate | null;
  /** The week's measurement; null when the week has none. */
  wcpm: number | null;
  /** Over the previous measured week; only a rise is shown, as on G7. */
  gain: number | null;
  accuracyPercent: number | null;
  prosody: ProsodyScore | null;
  sessionDayCount: number;
  days: SummaryDay[];
  daysLabel: string;
  unheardDays: string | null;
  chart: SummaryChart | null;
  comment: string;
  /** The target "Hedefi güncelle" offers; null when the button is not shown (karar 2). */
  goalUpdate: number | null;
}

export type SummaryState = { kind: 'empty' } | { kind: 'week'; week: LocalDate; view: SummaryView };

function capitalized(text: string): string {
  return toUpperTr(text.slice(0, 1)) + text.slice(1);
}

/** Tens around the values, at most seven lines: 50 60 70 80 90. */
function chartTicks(values: readonly number[]): number[] {
  const low = Math.floor(Math.min(...values) / 10) * 10;
  const high = Math.max(low + 10, Math.ceil(Math.max(...values) / 10) * 10);
  const step = 10 * Math.max(1, Math.ceil((high - low) / 60));
  const count = Math.ceil((high - low) / step);
  return Array.from({ length: count + 1 }, (_, tick) => low + tick * step);
}

function chartLabel(
  points: readonly number[],
  target: number | null,
  average: number | null,
  grade: Grade,
): string {
  const words = report.summary.chartLabel;
  const first = points[0] ?? 0;
  const last = points.at(-1) ?? 0;
  const weeks = capitalized(readCardinal(String(points.length)));
  const trend =
    points.length < 2
      ? words.single(last)
      : last > first
        ? words.rose(weeks, withAblativeSuffix(first), withDativeSuffix(last))
        : last < first
          ? words.fell(weeks, withAblativeSuffix(first), withDativeSuffix(last))
          : words.same(weeks, last);
  const lines = [
    ...(target === null ? [] : [words.target(target)]),
    ...(average === null ? [] : [words.average(grade, average)]),
  ];
  return lines.length === 0 ? trend : `${trend}; ${lines.join(', ')}`;
}

function commentText(comment: WeekComment, name: string): string {
  const words = report.summary.comment;
  switch (comment.kind) {
    case 'passed':
      return words.passed(name, comment.nextTarget);
    case 'below':
      return words.below(name, comment.gap);
    case 'baseline':
      return words.baseline(name, comment.target);
    case 'noMeasurement':
      return words.noMeasurement;
    case 'listeningOff':
      return words.listeningOff;
  }
}

/**
 * V1 for a week, the latest week with a finished session or a measurement unless one is given
 * (kararlar 11–16); empty before the first session and measurement.
 */
export function summaryView(data: SessionData, week?: LocalDate): SummaryState {
  const weeks = reportWeeks(data.sessions, data.assessments);
  const shown = week ?? weeks.at(-1);
  if (shown === undefined) {
    return { kind: 'empty' };
  }
  const { assessments, child } = data;
  const measurement = weekMeasurement(assessments, shown);
  const measuredWeeks = weeks.filter(
    (each) => each <= shown && weekMeasurement(assessments, each) !== null,
  );
  const earlier = measuredWeeks.filter((each) => each < shown).at(-1);
  const earlierWcpm =
    earlier === undefined ? null : weekMeasurement(assessments, earlier)?.result.wcpm;
  const gain =
    measurement === null || earlierWcpm === null || earlierWcpm === undefined
      ? null
      : measurement.result.wcpm - earlierWcpm;

  const marks = sessionDays(data.sessions, shown);
  const sessionDayCount = marks.filter((mark) => mark !== 'none').length;
  const unheard = marks.filter((mark) => mark === 'unheard').length;

  const target = targetForWeek(assessments, child.goals, shown);
  const average = gradeAverageWcpm[child.grade] ?? null;
  const charted = measuredWeeks.slice(-chartWeekCount);
  const points = charted.map((each) => weekMeasurement(assessments, each)?.result.wcpm ?? 0);
  const chart: SummaryChart | null =
    charted.length === 0
      ? null
      : {
          points,
          labels: charted.map((each) =>
            report.summary.weekLabel(weekNumber(assessments, each) ?? 0),
          ),
          target,
          average,
          yTicks: chartTicks([
            ...points,
            ...(target === null ? [] : [target]),
            ...(average === null ? [] : [average]),
          ]),
          label: chartLabel(points, target, average, child.grade),
        };

  const last = lastMeasurement(assessments);
  return {
    kind: 'week',
    week: shown,
    view: {
      title: report.summary.title(withGenitiveSuffix(child.name)),
      range: formatWeekRange(shown),
      previousWeek: weeks.filter((each) => each < shown).at(-1) ?? null,
      nextWeek: weeks.find((each) => each > shown) ?? null,
      wcpm: measurement?.result.wcpm ?? null,
      gain: gain !== null && gain > 0 ? gain : null,
      accuracyPercent: measurement === null ? null : Math.round(measurement.result.accuracy * 100),
      prosody: measurement?.result.prosodyScore ?? null,
      sessionDayCount,
      days: marks.map((mark, day) => ({ label: tr.dates.weekdaysShort[day] ?? '', mark })),
      daysLabel:
        sessionDayCount === 0
          ? report.summary.noDays
          : report.summary.daysLabel(withPossessiveLocativeSuffix(sessionDayCount)),
      unheardDays: unheard === 0 ? null : report.summary.unheardDays(unheard),
      chart,
      comment: commentText(
        weekComment(assessments, child.goals, shown, data.parent.consent.voiceProcessing),
        child.name,
      ),
      goalUpdate:
        last !== null && weekStart(last.date) === shown
          ? goalUpdate(assessments, child.goals)
          : null,
    },
  };
}

// The recordings (V2's approvals, the account page).

export interface RecordingRow {
  id: Id;
  /** Which reading it is: "4. bölüm, 14 Kasım", "1 dakikalık ölçüm, 15 Kasım". */
  label: string;
  /** "0:52". */
  duration: string;
  approval: RecordingApproval | null;
}

/** Each recording named by the reading it belongs to, in the order given (newest first). */
export function recordingRows(
  data: SessionData,
  recordings: readonly RecordingEntry[],
): RecordingRow[] {
  return recordings.map((recording) => {
    const session = data.sessions.find((each) =>
      each.readings.some((reading) => reading.recordingId === recording.id),
    );
    const assessment = data.assessments.find((each) => each.result.recordingId === recording.id);
    const label =
      session !== undefined
        ? report.recordings.chapter(session.chapterRef.chapter, formatDayMonth(session.date))
        : assessment !== undefined
          ? report.recordings.measurement(formatDayMonth(assessment.date))
          : formatDayMonth(localDateOf(new Date(recording.createdAt)));
    return {
      id: recording.id,
      label,
      duration: formatClock(recording.seconds * 1000),
      approval: recording.approval ?? null,
    };
  });
}

// V2 Takılınan yerler.

export interface ErrorRow {
  type: ReportErrorType;
  count: number;
  /** "geliyordu yerine geliyor": only the suffix row, and only when the reading heard the word. */
  example: string | null;
}

export interface WordPlayback {
  recordingId: Id;
  fromMs: number;
  toMs: number;
}

export interface StuckWordRow {
  word: string;
  /** "kıv-rı-lı-yor-du". */
  syllables: string;
  misses: number;
  status: StuckWordStatus;
  /** Where the latest recorded reading has the word; null hides the button. */
  playback: WordPlayback | null;
}

export interface StuckView {
  week: LocalDate;
  /**
   * "Bu hafta 30 hata, 5 türde"; "Bu hafta takılma yok." only when the week was listened to;
   * otherwise its days read without listening, or that no session was read.
   */
  lead: string;
  totalErrors: number;
  /** How many of the five types occurred. */
  errorTypes: number;
  errors: ErrorRow[];
  words: StuckWordRow[];
  /** The suffix drill's card; null without a suggestion. */
  drill: { suffixes: string; words: number; days: number } | null;
  /** The recordings the child sent, waiting for the parent. */
  pending: RecordingRow[];
}

function chapterOfSession(data: SessionData, bookId: Id, chapter: number) {
  return bookId === data.series.id
    ? data.series.chapters.find((each) => each.number === chapter)
    : undefined;
}

/** The latest suffix error of the week whose reading heard what the child said. */
function suffixExample(data: SessionData, week: LocalDate): string | null {
  for (const session of [...data.sessions].reverse()) {
    if (weekStart(session.date) !== week) {
      continue;
    }
    const chapter = chapterOfSession(data, session.chapterRef.bookId, session.chapterRef.chapter);
    const tokens = chapter === undefined ? [] : chapterTokens(chapter);
    for (const reading of [...session.readings].reverse()) {
      const word = reading.words.findLast(
        (each) => each.status === 'suffix' && each.heard !== undefined,
      );
      const written = word === undefined ? undefined : tokens[word.index]?.word;
      if (word?.heard !== undefined && written !== undefined) {
        return report.stuckWords.example(written, word.heard);
      }
    }
  }
  return null;
}

/** The word in the latest recorded reading that has it, a skipped word aside (it has no sound). */
function wordPlayback(data: SessionData, word: string, kept: ReadonlySet<Id>): WordPlayback | null {
  const key = stuckKey(word);
  for (const session of [...data.sessions].reverse()) {
    const chapter = chapterOfSession(data, session.chapterRef.bookId, session.chapterRef.chapter);
    const indexes = new Set(
      (chapter === undefined ? [] : chapterTokens(chapter))
        .filter((token) => stuckKey(token.word) === key)
        .map((token) => token.index),
    );
    if (indexes.size === 0) {
      continue;
    }
    for (const reading of [...session.readings].reverse()) {
      if (reading.recordingId === undefined || !kept.has(reading.recordingId)) {
        continue;
      }
      const said = reading.words.findLast(
        (each) => indexes.has(each.index) && each.status !== 'skipped',
      );
      if (said !== undefined) {
        return {
          recordingId: reading.recordingId,
          fromMs: Math.max(0, said.tStart - wordPlaybackPaddingMs),
          toMs: said.tEnd + wordPlaybackPaddingMs,
        };
      }
    }
  }
  return null;
}

/** "‑yordu ve ‑diğinde"; "‑a, ‑b ve ‑c". */
function joinedWithAnd(items: readonly string[]): string {
  const last = items.at(-1) ?? '';
  return items.length < 2
    ? last
    : `${items.slice(0, -1).join(', ')} ${report.stuckWords.drill.and} ${last}`;
}

/** The most missed first; at equal misses a word still practiced before a tamed one, as V2 lists. */
function byMisses(
  a: { word: string; misses: number; status: StuckWordStatus },
  b: { word: string; misses: number; status: StuckWordStatus },
): number {
  const tamed = (status: StuckWordStatus) => (status === 'tamed' ? 1 : 0);
  return (
    b.misses - a.misses ||
    tamed(a.status) - tamed(b.status) ||
    a.word.localeCompare(b.word, 'tr-TR')
  );
}

/** V2 for V1's opening week (kararlar 17–21). */
export function stuckView(data: SessionData, recordings: readonly RecordingEntry[]): StuckView {
  const week = reportWeeks(data.sessions, data.assessments).at(-1) ?? weekStart(data.today);
  const counts = weekErrors(data.sessions, week);
  const errors = reportErrorTypes.map((type) => ({
    type,
    count: counts[type],
    example: type === 'suffix' ? suffixExample(data, week) : null,
  }));
  const kept = new Set(recordings.map((recording) => recording.id));
  const totalErrors = errors.reduce((sum, row) => sum + row.count, 0);
  const errorTypes = errors.filter((row) => row.count > 0).length;
  const heard = data.sessions.some(
    (session) => weekStart(session.date) === week && session.readings.length > 0,
  );
  const unheardDays = sessionDays(data.sessions, week).filter((mark) => mark === 'unheard').length;
  return {
    week,
    lead:
      totalErrors > 0
        ? report.stuckWords.lead(totalErrors, errorTypes)
        : heard
          ? report.stuckWords.noErrors
          : unheardDays > 0
            ? report.summary.unheardDays(unheardDays)
            : report.summary.noDays,
    totalErrors,
    errorTypes,
    errors,
    words: data.cards
      .filter((card) => card.misses > 0)
      .sort(byMisses)
      .slice(0, listedWordCount)
      .map((card) => ({
        word: card.word,
        syllables: card.syllables.join('-'),
        misses: card.misses,
        status: card.status,
        playback: wordPlayback(data, card.word, kept),
      })),
    drill:
      data.drill === null
        ? null
        : {
            suffixes: joinedWithAnd(data.drill.suffixes),
            words: data.drill.words.length,
            days: data.drill.days,
          },
    pending: recordingRows(data, recordings).filter((row) => row.approval === 'pending'),
  };
}

// V3 Ölçüm sonucu.

export type ExcerptMark = 'error' | 'stumble';

export interface ExcerptToken extends Pick<
  ChapterToken,
  'word' | 'leading' | 'trailing' | 'spaceAfter'
> {
  mark: ExcerptMark | null;
}

export interface AssessmentView {
  /** "16 Kasım Pazar". */
  date: string;
  wcpm: number;
  wordsRead: number;
  errors: number;
  accuracyPercent: number;
  level: ReadingLevel;
  levelSentence: string;
  /** "Sıradaki ölçüm 23 Kasım Pazar", or "… bugün" once it is due. */
  next: string;
  nextInDays: number;
  excerpt: ExcerptToken[];
  recordingId: Id | null;
  /** What "Öğretmenle paylaş" sends: no sound, no address (karar 26). */
  share: { title: string; text: string };
}

export type AssessmentState = { kind: 'empty' } | { kind: 'result'; view: AssessmentView };

/** A wrong reading (misread, suffix, skipped) or a stumble (help, a pause of a second or more). */
function markOf(word: WordResult | undefined): ExcerptMark | null {
  if (word === undefined) {
    return null;
  }
  if (word.status === 'misread' || word.status === 'suffix' || word.status === 'skipped') {
    return 'error';
  }
  return word.status === 'helped' || (word.hesitationMs ?? 0) >= hesitationMarkMs
    ? 'stumble'
    : null;
}

/** V3: the last measurement that is not a trial reading (kararlar 22–27). */
export function assessmentView(data: SessionData): AssessmentState {
  const measurement = lastMeasurement(data.assessments);
  if (measurement === null) {
    return { kind: 'empty' };
  }
  const { result, level } = measurement;
  const { name, grade } = data.child;
  const words = report.assessment;
  const errors = result.wordsAttempted - result.correctWords;
  const accuracyPercent = Math.round(result.accuracy * 100);
  const nextOn = nextMeasurementOn(data.assessments) ?? measurement.date;
  const date = formatLongDate(measurement.date);

  const passage = data.passages.find((each) => each.id === measurement.passageId);
  const byIndex = new Map(result.words.map((word) => [word.index, word]));
  const excerptLength = (passage?.sentences ?? [])
    .slice(0, excerptSentences)
    .reduce((count, sentence) => count + tokenize(sentence).length, 0);
  const excerpt = (passage === undefined ? [] : chapterTokens(passageChapter(passage)))
    .slice(0, excerptLength)
    .map((token) => ({
      word: token.word,
      leading: token.leading,
      trailing: token.trailing,
      spaceAfter: token.spaceAfter,
      mark: markOf(byIndex.get(token.index)),
    }));

  return {
    kind: 'result',
    view: {
      date,
      wcpm: result.wcpm,
      wordsRead: result.wordsAttempted,
      errors,
      accuracyPercent,
      level,
      levelSentence: words.levelSentence[level](name),
      // Without the parent's consent no measurement opens (P13): none is promised.
      next: !data.parent.consent.voiceProcessing
        ? report.summary.comment.listeningOff
        : daysBetween(data.today, nextOn) <= 0
          ? words.nextToday
          : words.next(formatLongDate(nextOn)),
      nextInDays: daysBetween(measurement.date, nextOn),
      excerpt,
      recordingId: result.recordingId ?? null,
      share: {
        title: words.shared.title(name),
        text: [
          tr.nav.parent.childLabel(name, grade),
          words.shared.measured(date),
          words.shared.pace(result.wcpm),
          words.shared.counts(result.wordsAttempted, errors, accuracyPercent),
          words.levelNames[level],
        ].join('\n'),
      },
    },
  };
}

// V4 Yazı ayarı.

/** "Net harfler, normal aralık". */
export function styleName(style: ReadingStyle): string {
  const spacing = copy.spacings[style.spacingStep];
  return copy.trial.styleName(copy.fonts[style.font].label, spacing.toLocaleLowerCase('tr-TR'));
}

/** The sentence under the two styles' rows, for each state of the comparison. */
export function trialSentence(comparison: TrialComparison): string {
  const { current, trial, state, remaining, better } = comparison;
  const difference =
    current.average === null || trial.average === null ? 0 : trial.average - current.average;
  switch (state) {
    case 'none':
      return copy.trial.none;
    case 'collecting':
      // The design's sentence calls the difference small: a large one is not called so.
      return Math.abs(difference) < trialSmallDifference
        ? copy.trial.collecting(current.count, remaining)
        : copy.trial.collectingApart(current.count, remaining);
    case 'smallDifference':
      return copy.trial.small(current.count);
    case 'recommend': {
      const gain = Math.round(Math.abs(difference));
      // Only the tried style is one to switch to.
      return better === 'trial'
        ? `${copy.trial.better(styleName(trial.style), gain)} ${copy.trial.switchTo}`
        : copy.trial.better(styleName(current.style), gain);
    }
  }
}

/**
 * The preview (karar 24): the book's title and the first two sentences of the chapter the child
 * read last; before any reading, of the first chapter.
 */
export function readingPreview(data: SessionData): { title: string; page: Page } {
  const lastRead = [...data.sessions]
    .reverse()
    .find((session) => session.readings.length > 0 && session.chapterRef.bookId === data.series.id);
  const chapter =
    data.series.chapters.find((each) => each.number === lastRead?.chapterRef.chapter) ??
    data.series.chapters[0];
  return { title: data.series.title, page: (chapter?.pages.flat() ?? []).slice(0, 2) };
}
