import { describe, expect, it, vi } from 'vitest';
import { chapterTokens } from '../../domain/text';
import type { WordResult } from '../../domain/types';
import { FakeAudioCapture } from '../../test/fakeCapture';
import { FakeListener } from '../../services/listener/FakeListener';
import { scenarioSets } from '../../services/listener/scenarios';
import { seriesBook } from '../../services/repository/seedContent';
import type { ListenerEvent } from '../../services/listener/types';
import {
  initialReadingView,
  readingCounters,
  reduceReading,
  type ReadingView,
  wordMarks,
} from './readingState';

function word(index: number, status: WordResult['status'], hesitationMs?: number): ListenerEvent {
  const result: WordResult = { index, status, tStart: 0, tEnd: 0 };
  if (hesitationMs !== undefined) {
    result.hesitationMs = hesitationMs;
  }
  return { type: 'word', result };
}

function reduce(events: readonly ListenerEvent[]): ReadingView {
  return events.reduce(reduceReading, initialReadingView);
}

describe('reduceReading', () => {
  it('moves the position and keeps the word results', () => {
    const view = reduce([
      { type: 'position', index: 0 },
      word(0, 'correct'),
      { type: 'position', index: 1 },
    ]);

    expect(view.position).toBe(1);
    expect(view.results.get(0)?.status).toBe('correct');
  });

  it('keeps a hesitation only for the current word', () => {
    const view = reduce([
      { type: 'position', index: 3 },
      { type: 'hesitation', index: 2, ms: 500 },
    ]);
    expect(view.hesitation).toBeNull();

    const current = reduceReading(view, { type: 'hesitation', index: 3, ms: 1000 });
    expect(current.hesitation).toEqual({ index: 3, ms: 1000 });
    expect(reduceReading(current, { type: 'position', index: 4 }).hesitation).toBeNull();
  });

  it('opens the help at the threshold and closes it when the word comes', () => {
    const helping = reduce([
      { type: 'position', index: 14 },
      { type: 'hesitation', index: 14, ms: 2500 },
      { type: 'hesitation', index: 14, ms: 3000 },
    ]);
    expect(helping.helpIndex).toBe(14);

    expect(reduceReading(helping, word(14, 'helped', 3000)).helpIndex).toBeNull();
  });

  it('records how the reading ended', () => {
    expect(reduce([{ type: 'end', reason: 'stopped' }]).ended).toBe('stopped');
  });

  it('reaches the G4 moment of the design scenario', async () => {
    vi.useFakeTimers();
    const chapter = seriesBook().chapters.find((item) => item.number === 4);
    if (chapter === undefined) {
      throw new Error('chapter 4 is missing');
    }
    const audio = new FakeAudioCapture();
    audio.setState('capturing');
    const listener = new FakeListener(
      { kind: 'scenario', scenario: scenarioSets.design.readings[1] },
      { now: () => Date.now() },
    );
    let view = initialReadingView;
    listener.on((event) => {
      view = reduceReading(view, event);
    });

    await listener.start(
      chapterTokens(chapter).map((token) => token.spoken),
      audio,
    );
    vi.advanceTimersByTime(19500);
    vi.useRealTimers();

    expect(view.position).toBe(14);
    expect(view.helpIndex).toBe(14);
    expect(readingCounters(view)).toEqual({ correct: 13, stuck: 1 });
    expect(wordMarks(view)).toEqual({ 6: 'hesitation', 9: 'error' });
  });
});

describe('wordMarks', () => {
  it('dots a helped word, leaves a repetition unmarked and lets an error win', () => {
    const view = reduce([word(0, 'helped', 3000), word(1, 'repeated'), word(2, 'misread', 1500)]);

    expect(wordMarks(view)).toEqual({ 0: 'hesitation', 2: 'error' });
    expect(readingCounters(view)).toEqual({ correct: 1, stuck: 1 });
  });
});
