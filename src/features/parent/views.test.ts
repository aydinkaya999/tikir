import { describe, expect, it } from 'vitest';
import demoProfile from '../../../seed/demo-profil.json';
import type { TrialComparison } from '../../domain/readingStyle';
import { stuckKey } from '../../domain/stuckWords';
import { chapterTokens } from '../../domain/text';
import type { Grade, ReadingStyle, WordResult } from '../../domain/types';
import type { RecordingEntry } from '../../services/recorder/Recorder';
import type { Repository } from '../../services/repository/Repository';
import { demoSessionStore } from '../../test/sessionStore';
import type { SessionData } from '../session/sessionStore';
import {
  assessmentView,
  readingPreview,
  recordingRows,
  styleName,
  stuckView,
  summaryView,
  trialSentence,
} from './views';

const current: ReadingStyle = { font: 'clear', sizeStep: 1, spacingStep: 0, trialEnabled: true };
const tried: ReadingStyle = { ...current, spacingStep: 1 };

function comparison(
  state: TrialComparison['state'],
  averages: [number | null, number | null],
  count: number,
  better: TrialComparison['better'] = null,
): TrialComparison {
  return {
    current: { style: current, average: averages[0], count },
    trial: { style: tried, average: averages[1], count },
    state,
    remaining: Math.max(0, 4 - count),
    better,
  };
}

describe('styleName', () => {
  it('names a style by its letters and its spacing, as V4 does', () => {
    expect(styleName(current)).toBe('Net harfler, normal aralık');
    expect(styleName(tried)).toBe('Net harfler, açık aralık');
    expect(styleName({ ...current, font: 'school', spacingStep: 2 })).toBe(
      'Okul harfleri, daha açık aralık',
    );
  });
});

describe('trialSentence', () => {
  it('says there is nothing to compare yet', () => {
    expect(trialSentence(comparison('none', [null, null], 0))).toBe(
      'Henüz iki ayarla ölçüm yapılmadı. İlk ölçümlerden sonra sonuçlar burada görünür.',
    );
  });

  it('says how many measurements a decision still needs, as the design does', () => {
    expect(trialSentence(comparison('collecting', [69, 72], 2))).toBe(
      'Doğru kelime / dk, 2 ölçümün ortalaması. Fark henüz küçük; karar için 2 ölçüm daha gerekiyor.',
    );
  });

  it('does not call a large difference small while it still collects', () => {
    expect(trialSentence(comparison('collecting', [64, 72], 2))).toBe(
      'Doğru kelime / dk, 2 ölçümün ortalaması. Karar için 2 ölçüm daha gerekiyor.',
    );
  });

  it('calls a difference under five words small after four measurements', () => {
    expect(trialSentence(comparison('smallDifference', [70, 73], 4))).toBe(
      'Doğru kelime / dk, 4 ölçümün ortalaması. Fark küçük; iki ayar da uygun.',
    );
  });

  it('recommends the tried style when it reads better', () => {
    expect(trialSentence(comparison('recommend', [70, 76], 4, 'trial'))).toBe(
      'Net harfler, açık aralık ile ortalama 6 doğru kelime daha fazla okuyor. Bu ayara geçebilirsiniz.',
    );
  });

  it('only names the current style when it reads better', () => {
    expect(trialSentence(comparison('recommend', [77, 70], 4, 'current'))).toBe(
      'Net harfler, normal aralık ile ortalama 7 doğru kelime daha fazla okuyor.',
    );
  });
});

describe('readingPreview', () => {
  it('takes the first two sentences of the chapter read last, with the book’s title', async () => {
    const { store } = await demoSessionStore({ mode: 'veli-haftasonu' });
    await store.getState().load();
    const data = store.getState().data;
    if (data === null) {
      throw new Error('The demo profile did not load.');
    }

    const shown = readingPreview(data);

    expect(shown.title).toBe('Kayıp Fenerin İzinde');
    expect(shown.page).toHaveLength(2);
    expect(shown.page.map((sentence) => sentence.join(' '))).toEqual([
      'Deniz sırt çantasını omzuna aldı.',
      'Tıkır kulaklarını dikti ve rüzgârı dinledi.',
    ]);
  });

  it('takes the first chapter before any reading', async () => {
    const { store } = await demoSessionStore();
    await store.getState().load();
    const data = store.getState().data;
    if (data === null) {
      throw new Error('The demo profile did not load.');
    }

    const shown = readingPreview({ ...data, sessions: [] });

    expect(shown.page).toEqual(data.series.chapters[0]?.pages.flat().slice(0, 2));
  });
});

const expected = demoProfile.expected['veli-haftasonu'];

/** The weekend profile's data (V1–V4's designs), after an optional change to the repository. */
async function weekendData(
  change?: (repository: Repository) => Promise<void>,
): Promise<SessionData> {
  const { repository, store } = await demoSessionStore({ mode: 'veli-haftasonu' });
  await change?.(repository);
  await store.getState().load();
  const data = store.getState().data;
  if (data === null) {
    throw new Error('The demo profile did not load.');
  }
  return data;
}

function withGrade(grade: Grade) {
  return async (repository: Repository) => {
    const child = await repository.getChild();
    if (child !== null) {
      await repository.saveChild({ ...child, grade });
    }
  };
}

function weekOf(data: SessionData, week?: string) {
  const state = summaryView(data, week);
  if (state.kind !== 'week') {
    throw new Error('No week to show.');
  }
  return state;
}

describe('summaryView', () => {
  it('shows the weekend profile’s week with the expected numbers (V1)', async () => {
    const state = weekOf(await weekendData());
    const { view } = state;

    expect(state.week).toBe('2026-11-09');
    expect(view.title).toBe('Deniz’in haftası');
    expect(view.range).toBe('9–15 Kasım');
    expect([view.previousWeek, view.nextWeek]).toEqual(['2026-11-02', null]);
    expect(view.wcpm).toBe(expected.V1.wcpm);
    expect(view.gain).toBe(expected.V1.deltaFromLastWeek);
    expect(view.accuracyPercent).toBe(expected.V1.accuracyPercent);
    expect(view.prosody).toBe(expected.V1.prosodyScore);
    expect(view.sessionDayCount).toBe(expected.V1.sessionDays);
    expect(view.days.filter((day) => day.mark === 'done').map((day) => day.label)).toEqual(
      expected.V1.sessionWeekdays,
    );
    expect(view.daysLabel).toBe('Bu hafta 7 günün 5’inde seans yapıldı');
    expect(view.unheardDays).toBeNull();
    expect(view.chart).toEqual({
      points: expected.V1.chart,
      labels: ['1. hafta', '2. hafta', '3. hafta', '4. hafta', '5. hafta', '6. hafta'],
      target: expected.V1.goalLine,
      average: expected.V1.gradeAverage,
      yTicks: [50, 60, 70, 80, 90],
      label: 'Altı haftada doğru kelime sayısı 58’den 71’e çıktı; hedef 70, 3. sınıf ortalaması 90',
    });
    expect(view.comment).toBe(expected.V1.comment);
    expect(view.goalUpdate).toBe(78);
  });

  it('goes back to an earlier week with its own numbers and no goal update', async () => {
    const { view } = weekOf(await weekendData(), '2026-11-02');

    expect(view.range).toBe('2–8 Kasım');
    expect([view.previousWeek, view.nextWeek]).toEqual(['2026-10-26', '2026-11-09']);
    expect([view.wcpm, view.gain]).toEqual([67, 2]);
    expect(view.chart?.points).toEqual([58, 60, 63, 65, 67]);
    expect(view.sessionDayCount).toBe(0);
    expect(view.daysLabel).toBe('Bu hafta seans yapılmadı.');
    expect(view.comment).toBe('Deniz hedefe 3 kelime uzakta.');
    expect(view.goalUpdate).toBeNull();
  });

  it('draws the grade average for grades 3 and 4 only (docs/urun.md section 2)', async () => {
    const fourth = weekOf(await weekendData(withGrade(4))).view.chart;
    expect([fourth?.average, fourth?.yTicks]).toEqual([98, [50, 60, 70, 80, 90, 100]]);
    for (const grade of [1, 2] as const) {
      const chart = weekOf(await weekendData(withGrade(grade))).view.chart;
      expect(chart?.average).toBeNull();
      expect(chart?.label).toBe('Altı haftada doğru kelime sayısı 58’den 71’e çıktı; hedef 70');
    }
  });

  it('marks and counts the days read without listening', async () => {
    const data = await weekendData();
    const sessions = data.sessions.map((session) =>
      session.date === '2026-11-12' ? { ...session, unheard: true as const } : session,
    );

    const { view } = weekOf({ ...data, sessions });

    expect(view.days.map((day) => day.mark)).toEqual([
      'done',
      'done',
      'none',
      'unheard',
      'done',
      'done',
      'none',
    ]);
    expect(view.sessionDayCount).toBe(5);
    expect(view.unheardDays).toBe('1 gün dinlemeden okundu.');
  });

  it('says why a week of sessions has no measurement', async () => {
    const data = await weekendData();
    const assessments = data.assessments.filter((assessment) => assessment.date !== '2026-11-15');

    const { view } = weekOf({ ...data, assessments });
    expect([view.wcpm, view.gain, view.accuracyPercent, view.prosody]).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect(view.comment).toBe('Bu hafta ölçüm yapılmadı.');
    expect(view.chart?.points).toEqual([58, 60, 63, 65, 67]);

    const parent = { ...data.parent, consent: { voiceProcessing: false, weeklyEmail: true } };
    expect(weekOf({ ...data, assessments, parent }).view.comment).toBe(
      'Dinleme kapalı olduğu için ölçüm yapılmıyor.',
    );
  });

  it('is empty without a session or a measurement', async () => {
    const data = await weekendData();
    expect(summaryView({ ...data, sessions: [], assessments: [] })).toEqual({ kind: 'empty' });
  });
});

/** The weekend profile with its Saturday's third reading recorded. */
async function recordedSaturday() {
  const data = await weekendData();
  const sessions = data.sessions.map((session) =>
    session.date === '2026-11-14'
      ? {
          ...session,
          readings: session.readings.map((reading) =>
            reading.attempt === 3 ? { ...reading, recordingId: 'kayit-1' } : reading,
          ),
        }
      : session,
  );
  const recordings: RecordingEntry[] = [
    {
      id: 'kayit-1',
      createdAt: '2026-11-14T12:00:00.000Z',
      seconds: 52,
      levels: [],
      approval: 'pending',
    },
  ];
  return { data: { ...data, sessions }, recordings };
}

describe('stuckView', () => {
  it('counts the weekend profile’s errors and lists its words (V2)', async () => {
    const view = stuckView(await weekendData(), []);

    expect(view.totalErrors).toBe(expected.V2.totalErrors);
    expect(view.errorTypes).toBe(5);
    expect(view.errors.map((row) => row.type)).toEqual([
      'misread',
      'suffix',
      'skipped',
      'repeated',
      'inserted',
    ]);
    expect(Object.fromEntries(view.errors.map((row) => [row.type, row.count]))).toEqual(
      expected.V2.byType,
    );
    expect(view.errors.every((row) => row.example === null)).toBe(true);
    // As the design lists them: the most missed first, a word still practiced before a tamed one.
    expect(view.words.map((word) => [word.word, word.syllables, word.misses, word.status])).toEqual(
      [
        ['kıvrılıyordu', 'kıv-rı-lı-yor-du', 4, 'tamed'],
        ['belirdiğinde', 'be-lir-di-ğin-de', 3, 'practicing'],
        ['ağaçlarının', 'a-ğaç-la-rı-nın', 3, 'tamed'],
        ['tırmanmaya', 'tır-man-ma-ya', 2, 'practicing'],
      ],
    );
    expect(view.words.every((word) => word.playback === null)).toBe(true);
    expect(view.drill).toEqual({ suffixes: '‑yordu ve ‑diğinde', words: 6, days: 3 });
    expect(view.pending).toEqual([]);
  });

  it('plays a word from the latest recorded reading and lists the recordings to approve', async () => {
    const { data, recordings } = await recordedSaturday();
    const saturday = data.sessions.find((session) => session.date === '2026-11-14');
    const chapter = data.series.chapters.find(
      (each) => each.number === saturday?.chapterRef.chapter,
    );
    const index = (chapter === undefined ? [] : chapterTokens(chapter)).find(
      (token) => token.word === 'belirdiğinde',
    )?.index;
    const word = saturday?.readings
      .find((reading) => reading.attempt === 3)
      ?.words.findLast((each) => each.index === index);
    if (word === undefined) {
      throw new Error('Saturday’s chapter has no “belirdiğinde”.');
    }

    const view = stuckView(data, recordings);

    expect(view.words.find((each) => each.word === 'belirdiğinde')?.playback).toEqual({
      recordingId: 'kayit-1',
      fromMs: Math.max(0, word.tStart - 200),
      toMs: word.tEnd + 200,
    });
    // A word Saturday's chapter does not have has nothing to play.
    const saturdayWords = new Set(
      (chapter === undefined ? [] : chapterTokens(chapter)).map((token) => stuckKey(token.word)),
    );
    for (const each of view.words) {
      expect(each.playback === null).toBe(!saturdayWords.has(stuckKey(each.word)));
    }
    expect(stuckView(data, []).words.every((each) => each.playback === null)).toBe(true);
    expect(view.pending).toEqual([
      { id: 'kayit-1', label: '4. bölüm, 14 Kasım', duration: '0:52', approval: 'pending' },
    ]);
  });

  it('shows what the child said for a suffix error when the reading heard it', async () => {
    const data = await weekendData();
    // Monday's session read a library book; the report looks into the series' chapters only.
    const found = data.sessions
      .filter((session) => session.chapterRef.bookId === data.series.id)
      .flatMap((session) =>
        session.readings.map((reading) => ({
          session,
          reading,
          word: reading.words.find((each) => each.status === 'suffix'),
        })),
      )
      .find((each) => each.word !== undefined);
    const chapter = data.series.chapters.find(
      (each) => each.number === found?.session.chapterRef.chapter,
    );
    const written = (chapter === undefined ? [] : chapterTokens(chapter))[found?.word?.index ?? -1]
      ?.word;
    if (found?.word === undefined || written === undefined) {
      throw new Error('The week has no suffix error.');
    }
    const suffixed = found.word;
    const heard: WordResult = { ...suffixed, heard: 'geliyor' };
    const sessions = data.sessions.map((session) =>
      session === found.session
        ? {
            ...session,
            readings: session.readings.map((reading) =>
              reading === found.reading
                ? {
                    ...reading,
                    words: reading.words.map((word) => (word === suffixed ? heard : word)),
                  }
                : reading,
            ),
          }
        : session,
    );

    const view = stuckView({ ...data, sessions }, []);

    expect(view.errors.find((row) => row.type === 'suffix')?.example).toBe(
      `${written} yerine geliyor`,
    );
  });
});

describe('assessmentView', () => {
  function resultOf(data: SessionData) {
    const state = assessmentView(data);
    if (state.kind !== 'result') {
      throw new Error('No measurement to show.');
    }
    return state.view;
  }

  it('shows the weekend profile’s measurement with the expected numbers (V3)', async () => {
    const view = resultOf(await weekendData());

    expect(view.date).toBe('15 Kasım Pazar');
    expect(view.wordsRead).toBe(expected.V3.wordsRead);
    expect(view.errors).toBe(expected.V3.countedErrors);
    expect(view.wcpm).toBe(expected.V3.correctWords);
    expect(view.accuracyPercent).toBe(expected.V3.accuracyPercent);
    expect(view.level).toBe(expected.V3.level);
    expect(view.levelSentence).toBe(
      'Öğretim düzeyi: Deniz bu zorluktaki metni biraz yardımla okuyabiliyor.',
    );
    expect(view.nextInDays).toBe(expected.V3.nextAssessmentInDays);
    expect(view.next).toBe('Sıradaki ölçüm 22 Kasım Pazar');
    expect(view.excerpt.map((token) => token.leading + token.word + token.trailing).join(' ')).toBe(
      'Tepeye vardıklarında rüzgâr durmuştu. Deniz feneri eline aldı ve camını sildi. ' +
        'İçindeki ışık önce titredi, sonra bütün vadiyi aydınlattı. Tıkır sevinçle kulaklarını salladı.',
    );
    expect(view.recordingId).toBeNull();
    expect(view.share).toEqual({
      title: 'Deniz için ölçüm sonucu',
      text: [
        'Deniz, 3. sınıf',
        '1 dakikalık ölçüm, 15 Kasım Pazar',
        '71 doğru kelime bir dakikada',
        '76 kelime okudu, 5 hata, doğruluk %93',
        'Öğretim düzeyi',
      ].join('\n'),
    });
  });

  it('marks wrong readings and stumbles in the excerpt', async () => {
    const data = await weekendData();
    const marked = (word: WordResult): WordResult =>
      word.index === 1
        ? { ...word, status: 'misread' }
        : word.index === 2
          ? { ...word, status: 'skipped' }
          : word.index === 3
            ? { ...word, status: 'correct', hesitationMs: 1500 }
            : word.index === 5
              ? { ...word, status: 'helped' }
              : word.index === 7
                ? { ...word, status: 'repeated' }
                : { ...word, status: 'correct', hesitationMs: undefined };
    const assessments = data.assessments.map((assessment) =>
      assessment.date === '2026-11-15' && assessment.trial !== true
        ? {
            ...assessment,
            result: { ...assessment.result, words: assessment.result.words.map(marked) },
          }
        : assessment,
    );

    const marks = resultOf({ ...data, assessments })
      .excerpt.slice(0, 8)
      .map((token) => token.mark);

    expect(marks).toEqual([null, 'error', 'error', 'stumble', null, 'stumble', null, null]);
  });

  it('names every reading level', async () => {
    const data = await weekendData();
    const sentences = (['frustration', 'independent'] as const).map((level) =>
      resultOf({
        ...data,
        assessments: data.assessments.map((assessment) => ({ ...assessment, level })),
      }),
    );

    expect(
      sentences.map((view) => [view.levelSentence, view.share.text.split('\n').at(-1)]),
    ).toEqual([
      ['Endişe düzeyi: bu zorluktaki metin Deniz için şimdilik zor.', 'Endişe düzeyi'],
      ['Serbest düzey: Deniz bu zorluktaki metni yardımsız okuyabiliyor.', 'Serbest düzey'],
    ]);
  });

  it('says the next measurement is today once it is due', async () => {
    const data = await weekendData();
    expect(resultOf({ ...data, today: '2026-11-22' }).next).toBe('Sıradaki ölçüm bugün');
    expect(resultOf({ ...data, today: '2026-11-24' }).next).toBe('Sıradaki ölçüm bugün');
  });

  it('is empty without a measurement', async () => {
    const data = await weekendData();
    expect(assessmentView({ ...data, assessments: [] })).toEqual({ kind: 'empty' });
  });
});

describe('recordingRows', () => {
  it('names each recording by the reading it belongs to, with its length', async () => {
    const { data } = await recordedSaturday();
    const assessments = data.assessments.map((assessment) =>
      assessment.date === '2026-11-15' && assessment.trial !== true
        ? { ...assessment, result: { ...assessment.result, recordingId: 'kayit-2' } }
        : assessment,
    );
    const entry = (id: string, createdAt: string, seconds: number): RecordingEntry => ({
      id,
      createdAt,
      seconds,
      levels: [],
    });

    expect(
      recordingRows({ ...data, assessments }, [
        entry('kayit-2', '2026-11-15T12:00:00.000Z', 60),
        entry('kayit-1', '2026-11-14T12:00:00.000Z', 52),
        entry('kayit-3', '2026-11-13T12:00:00.000Z', 75),
      ]),
    ).toEqual([
      { id: 'kayit-2', label: '1 dakikalık ölçüm, 15 Kasım', duration: '1:00', approval: null },
      { id: 'kayit-1', label: '4. bölüm, 14 Kasım', duration: '0:52', approval: null },
      { id: 'kayit-3', label: '13 Kasım', duration: '1:15', approval: null },
    ]);
  });
});
