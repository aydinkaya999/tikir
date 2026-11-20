import { describe, expect, it } from 'vitest';
import type { Session } from '../../domain/types';
import { testReading } from '../../test/sessions';
import {
  afterAnswer,
  afterListen,
  afterReading,
  afterRecord,
  afterUnheardReading,
  afterWarmupCard,
  afterWarmupScore,
  createSession,
  finishSession,
  placeOf,
  redoRecording,
  sessionRedirect,
  skipWarmup,
} from './sessionMachine';

const words = ['kıvrılıyordu', 'ağaçlarının', 'belirdiğinde'];

function newSession(warmupWords: string[] = words): Session {
  return createSession({
    id: 'seans-1',
    childId: 'cocuk',
    date: '2026-11-21',
    chapterRef: { bookId: 'kayip-fenerin-izinde', chapter: 4 },
    warmupWords,
    startedAt: '2026-11-21T09:00:00.000Z',
  });
}

function at(step: Session['step'], fields: Partial<Session> = {}): Session {
  return { ...newSession(), step, ...fields };
}

describe('createSession', () => {
  it('opens at the warmup with the deck stored and nothing read', () => {
    const session = newSession();

    expect(session.step).toBe('warmup');
    expect(session.warmup).toEqual({ words, done: 0, scored: 0 });
    expect(session.readings).toEqual([]);
    expect(session.answers).toEqual([]);
    expect(placeOf(session)).toEqual({ step: 'warmup', card: 0, secondAttempt: false });
  });

  it('opens at the listen step when there is no warmup word', () => {
    expect(newSession([]).step).toBe('listen');
  });
});

describe('the warmup', () => {
  it('moves to the next card on a correct first attempt, and to the listen step after the last', () => {
    let session = afterWarmupScore(newSession(), true);
    expect(session.warmup).toEqual({ words, done: 1, scored: 1 });

    session = afterWarmupScore(afterWarmupScore(session, true), true);
    expect(session.step).toBe('listen');
  });

  it('keeps a wrongly read card for its second attempt, then moves on', () => {
    const scored = afterWarmupScore(newSession(), false);
    expect(scored.warmup).toEqual({ words, done: 0, scored: 1 });
    expect(placeOf(scored)).toEqual({ step: 'warmup', card: 0, secondAttempt: true });

    const next = afterWarmupCard(scored);
    expect(next.warmup).toEqual({ words, done: 1, scored: 1 });
    expect(placeOf(next)).toEqual({ step: 'warmup', card: 1, secondAttempt: false });
  });

  it('never scores a card twice', () => {
    const scored = afterWarmupScore(newSession(), false);

    expect(() => afterWarmupScore(scored, true)).toThrow('Not at an unscored warmup card');
  });

  it('goes through the deck unscored when the session is unheard', () => {
    let session = newSession();
    session = afterWarmupCard(session);
    expect(session.warmup).toEqual({ words, done: 1, scored: 1 });
    session = afterWarmupCard(afterWarmupCard(session));
    expect(session.step).toBe('listen');
    expect(session.warmup).toEqual({ words, done: 3, scored: 3 });
  });

  it('skips the rest of the deck to the listen step', () => {
    const session = skipWarmup(newSession());

    expect(session.step).toBe('listen');
    expect(session.warmup).toEqual({ words, done: 0, scored: 0 });
  });
});

describe('the readings', () => {
  it('reads three times after the listen step, then records', () => {
    let session = afterListen(at('listen'));
    expect(placeOf(session)).toEqual({ step: 'read', attempt: 1, redo: false });

    session = afterReading(afterReading(session, testReading(1)), testReading(2));
    expect(placeOf(session)).toEqual({ step: 'read', attempt: 3, redo: false });

    session = afterReading(session, testReading(3, { recordingId: 'kayit-1' }));
    expect(session.readings).toHaveLength(3);
    expect(placeOf(session)).toEqual({ step: 'record' });
  });

  it('records the third reading again in place of the first take', () => {
    const recorded = at('record', {
      readings: [testReading(1), testReading(2), testReading(3, { recordingId: 'kayit-1' })],
    });

    const redo = redoRecording(recorded);
    expect(placeOf(redo)).toEqual({ step: 'read', attempt: 3, redo: true });

    const again = afterReading(redo, testReading(3, { recordingId: 'kayit-2', wcpm: 75 }));
    expect(again.readings).toHaveLength(3);
    expect(again.readings[2]?.recordingId).toBe('kayit-2');
    expect(placeOf(again)).toEqual({ step: 'record' });
  });

  it('passes the unheard readings without a result and skips the record step', () => {
    const reading = at('read');

    expect(afterUnheardReading(reading, 1)).toEqual(reading);
    expect(afterUnheardReading(reading, 2)).toEqual(reading);
    const after = afterUnheardReading(reading, 3);
    expect(after.step).toBe('wrapUp');
    expect(after.readings).toEqual([]);
  });
});

describe('the questions', () => {
  it('asks after the record step and finishes the session', () => {
    let session = afterRecord(at('record'));
    expect(placeOf(session)).toEqual({ step: 'wrapUp', question: 0 });

    session = afterAnswer(session, 2);
    expect(session.answers).toEqual([2]);
    expect(placeOf(session)).toEqual({ step: 'wrapUp', question: 1 });

    const done = finishSession(afterAnswer(session, 0), '2026-11-21T09:12:00.000Z');
    expect(done.step).toBe('done');
    expect(done.completedAt).toBe('2026-11-21T09:12:00.000Z');
    expect(placeOf(done)).toEqual({ step: 'done' });
  });
});

describe('sessionRedirect', () => {
  it('opens the current step only', () => {
    const table: [Session | null, string, string | null][] = [
      [null, '/seans/oku', '/'],
      [at('warmup'), '/seans/isinma', null],
      [at('warmup'), '/seans/oku', '/seans/isinma'],
      [at('read'), '/seans/isinma', '/seans/oku'],
      [at('record'), '/seans/bitti', '/seans/kayit'],
      [at('done'), '/seans/oku', '/seans/bitti'],
      [at('done'), '/seans/bitti', null],
      [at('read'), '/kitaplik', null],
      [null, '/', null],
    ];
    for (const [session, pathname, expected] of table) {
      expect(sessionRedirect(session, pathname)).toBe(expected);
    }
  });
});

describe('a step out of order', () => {
  it('is refused', () => {
    expect(() => afterListen(at('warmup'))).toThrow('Not at listen');
    expect(() => afterReading(at('listen'), testReading(1))).toThrow('Not at read');
    expect(() => finishSession(at('record'), '2026-11-21T09:12:00.000Z')).toThrow('Not at wrapUp');
  });
});
