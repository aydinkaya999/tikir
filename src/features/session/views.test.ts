import { describe, expect, it } from 'vitest';
import { seriesBook } from '../../services/repository/seedContent';
import { testSession } from '../../test/sessions';
import { demoSessionStore, testToday } from '../../test/sessionStore';
import type { SessionData } from './sessionStore';
import { doneView, roadView, sessionListens, studioRows } from './views';

async function dataAt(options: Parameters<typeof demoSessionStore>[0] = {}): Promise<SessionData> {
  const { store } = await demoSessionStore(options);
  await store.getState().load();
  const { data } = store.getState();
  if (data === null) {
    throw new Error('no session data');
  }
  return data;
}

describe('roadView', () => {
  it("shows the child's morning: chapter 4 to start, three done, two days in a row", async () => {
    const view = roadView(await dataAt());

    expect(view).toMatchObject({
      state: 'start',
      childName: 'Deniz',
      streak: 2,
      chapter: { number: 4, title: 'Dar Patika' },
      tomorrow: null,
      completed: 3,
      totalChapters: 12,
      bookTitle: 'Kayıp Fenerin İzinde',
    });
    expect(view.tiles.slice(0, 5)).toEqual([
      { chapter: 1, state: 'done', pattern: 1 },
      { chapter: 2, state: 'done', pattern: 2 },
      { chapter: 3, state: 'done', pattern: 3 },
      { chapter: 4, state: 'today', pattern: 4 },
      { chapter: 5, state: 'locked', pattern: 5 },
    ]);
    expect(view.tiles).toHaveLength(12);
    expect(view.tiles[6]).toEqual({ chapter: 7, state: 'locked', pattern: 1 });
  });

  it('resumes a session in progress', async () => {
    expect(roadView(await dataAt({ step: 'read-1' })).state).toBe('resume');
  });

  it("shows a finished day with tomorrow's chapter and no tile for today", async () => {
    const view = roadView(await dataAt({ step: 'done' }));

    expect(view).toMatchObject({
      state: 'done',
      streak: 3,
      chapter: { number: 4, title: 'Dar Patika' },
      tomorrow: { number: 5, title: 'Yıldız Tepesi' },
      completed: 4,
    });
    expect(view.tiles[3]).toEqual({ chapter: 4, state: 'done', pattern: 4 });
    expect(view.tiles.some((tile) => tile.state === 'today')).toBe(false);
  });

  it('ends the road when every written chapter is read', async () => {
    const data = await dataAt();
    const sessions = [...data.sessions, testSession('2026-11-10', 4), testSession('2026-11-11', 5)];

    const view = roadView({ ...data, sessions, chapter: null });

    expect(view.state).toBe('seriesEnd');
    expect(view.chapter).toBeNull();
  });

  it('hides a run of a single day', async () => {
    const data = await dataAt();
    const yesterday = testSession('2026-11-20', 3);

    const view = roadView({
      ...data,
      sessions: [yesterday],
      series: seriesBook(),
      today: testToday,
    });

    expect(view.streak).toBeNull();
  });
});

describe('doneView', () => {
  /** Today's data with every earlier session's third reading at the given pace. */
  async function withPreviousPace(wcpm: number): Promise<SessionData> {
    const data = await dataAt({ step: 'done' });
    const sessions = data.sessions.map((session) =>
      session.date === data.today
        ? session
        : {
            ...session,
            readings: session.readings.map((reading) =>
              reading.attempt === 3 ? { ...reading, wcpm } : reading,
            ),
          },
    );
    return { ...data, sessions };
  }

  it('sums up a typical finished session', async () => {
    expect(doneView(await dataAt({ step: 'done' }))).toEqual({
      minutes: 12,
      wcpm: 71,
      delta: 4,
      tamed: ['ağaçlarının'],
      tomorrow: { number: 5, title: 'Yıldız Tepesi' },
      childName: 'Deniz',
    });
  });

  it.each([71, 80])('shows no gain over a previous third reading of %i', async (wcpm) => {
    expect(doneView(await withPreviousPace(wcpm)).delta).toBeNull();
  });

  it('shows no gain without an earlier session', async () => {
    const data = await dataAt({ step: 'done' });
    const sessions = data.sessions.filter((session) => session.date === data.today);

    expect(doneView({ ...data, sessions }).delta).toBeNull();
  });

  it('has no pace, no gain and no tamed words after an unheard session', async () => {
    const view = doneView(await dataAt({ step: 'done', consent: false }));

    expect(view.wcpm).toBeNull();
    expect(view.delta).toBeNull();
    expect(view.tamed).toEqual([]);
  });

  it('has no tomorrow after the last written chapter', async () => {
    const data = await dataAt({ step: 'done' });
    if (data.session === null) {
      throw new Error('No session today.');
    }
    const session = { ...data.session, chapterRef: { ...data.session.chapterRef, chapter: 5 } };
    const sessions = data.sessions.map((each) => (each.date === data.today ? session : each));

    expect(doneView({ ...data, session, sessions }).tomorrow).toBeNull();
  });
});

describe('studioRows', () => {
  it('lists the recorded chapters of the series in chapter order, each with its latest take', async () => {
    const data = await dataAt({ step: 'done' });
    const today = data.session;
    const take = today?.readings[2]?.recordingId;
    if (today === null || take === undefined) {
      throw new Error('No recorded session today.');
    }
    const earlier = (date: string, chapter: number, recordingId: string) => ({
      ...today,
      date,
      chapterRef: { ...today.chapterRef, chapter },
      readings: today.readings.map((reading, index) =>
        index === 2 ? { ...reading, recordingId } : reading,
      ),
    });
    const otherBook = {
      ...earlier('2026-11-17', 1, 'baska'),
      chapterRef: { bookId: 'baska-kitap', chapter: 1 },
    };
    const sessions = [
      earlier('2026-11-18', 2, 'ilk'),
      otherBook,
      earlier('2026-11-19', 2, 'son'),
      earlier('2026-11-20', 1, 'bir'),
      today,
    ];
    const title = (number: number) =>
      data.series.chapters.find((chapter) => chapter.number === number)?.title;

    expect(studioRows({ ...data, sessions })).toEqual([
      { chapter: 1, title: title(1), recordingId: 'bir' },
      { chapter: 2, title: title(2), recordingId: 'son' },
      { chapter: 4, title: 'Dar Patika', recordingId: take },
    ]);
  });
});

describe('sessionListens', () => {
  it('listens with the consent unless the session went on unheard (P13, P14)', async () => {
    const data = await dataAt({ step: 'read-1' });
    const session = data.session;
    if (session === null) {
      throw new Error('No session today.');
    }
    const without = { ...data.parent, consent: { ...data.parent.consent, voiceProcessing: false } };

    expect(sessionListens(data)).toBe(true);
    expect(sessionListens({ ...data, session: null })).toBe(true);
    expect(sessionListens({ ...data, session: { ...session, unheard: true } })).toBe(false);
    expect(sessionListens({ ...data, parent: without })).toBe(false);
  });
});
