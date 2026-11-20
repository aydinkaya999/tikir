import { describe, expect, it } from 'vitest';
import { seriesBook } from '../../services/repository/seedContent';
import { testSession } from '../../test/sessions';
import { demoSessionStore, testToday } from '../../test/sessionStore';
import type { SessionData } from './sessionStore';
import { roadView } from './views';

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
