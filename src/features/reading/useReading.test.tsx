import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chapterTokens } from '../../domain/text';
import { FakeListener } from '../../services/listener/FakeListener';
import { scenarioSets } from '../../services/listener/scenarios';
import type { FakeScenario } from '../../services/listener/types';
import { SilentNarrator } from '../../services/narrator/SilentNarrator';
import { seriesBook } from '../../services/repository/seedContent';
import { FakeAudioCapture } from '../../test/fakeCapture';
import { useReading } from './useReading';

const now = () => Date.now();

function chapterFour() {
  const chapter = seriesBook().chapters.find((item) => item.number === 4);
  if (chapter === undefined) {
    throw new Error('chapter 4 is missing');
  }
  return chapterTokens(chapter);
}

const threeWords = chapterFour().slice(0, 3);

function setup(scenario: FakeScenario, ghostPaceWpm: number | null, tokens = chapterFour()) {
  const audio = new FakeAudioCapture();
  audio.setState('capturing');
  const listener = new FakeListener({ kind: 'scenario', scenario }, { now });
  const narrator = new SilentNarrator({ now });
  const speakWord = vi.spyOn(narrator, 'speakWord');
  const stopNarration = vi.spyOn(narrator, 'stop');
  const onFinish = vi.fn();
  const hook = renderHook(() =>
    useReading({ listener, audio, narrator, tokens, ghostPaceWpm, onFinish, now }),
  );
  return { audio, listener, narrator, speakWord, stopNarration, onFinish, ...hook };
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('useReading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reaches the G4 moment of the design scenario and reads the word for the child', async () => {
    const { result, speakWord } = setup(scenarioSets.design.readings[1], 40);
    await act(async () => {
      await result.current.start();
    });

    await advance(19500);

    const moment = result.current;
    expect(moment.helpIndex).toBe(14);
    expect(moment.helpSyllables).toEqual(['a', 'ğaç', 'la', 'rı', 'nın']);
    expect(moment.elapsedMs).toBeGreaterThan(19000);
    expect(moment.elapsedMs).toBeLessThan(19500);
    expect(moment.ghostIndex).toBe(12);
    expect(moment.raceLead).toBe(2);
    expect(moment.counters).toEqual({ correct: 13, stuck: 1 });
    expect(speakWord).toHaveBeenCalledWith('ağaçlarının');

    await advance(1000);
    expect(result.current.elapsedMs).toBe(moment.elapsedMs);

    await advance(1000);
    expect(result.current.view.results.get(14)?.status).toBe('helped');
    expect(result.current.view.position).toBe(15);
    expect(result.current.helpIndex).toBeNull();
    await advance(1000);
    expect(result.current.elapsedMs).toBeGreaterThan(moment.elapsedMs);
  });

  it('lets the reading go on when the help narration is cut short', async () => {
    const { result, narrator } = setup(scenarioSets.design.readings[1], 40);
    await act(async () => {
      await result.current.start();
    });
    await advance(19500);
    expect(result.current.helpIndex).toBe(14);

    narrator.stop();
    await advance(0);

    expect(result.current.helpIndex).toBeNull();
    expect(result.current.view.results.get(14)?.status).toBe('helped');
    expect(result.current.view.position).toBe(15);
  });

  it('keeps one reading when the words come as a fresh array on every render', async () => {
    const audio = new FakeAudioCapture();
    audio.setState('capturing');
    const listener = new FakeListener(
      { kind: 'scenario', scenario: { wcpm: 60, miscues: [], hesitations: [] } },
      { now },
    );
    const narrator = new SilentNarrator({ now });
    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useReading({
        listener,
        audio,
        narrator,
        tokens: [...threeWords],
        ghostPaceWpm: 40,
        onFinish,
        now,
      }),
    );

    await act(async () => {
      await result.current.start();
    });
    await advance(5000);

    expect(result.current.view.position).toBe(2);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('starts once when start() is called twice, and again after a refused microphone', async () => {
    const { result, audio, listener } = setup(scenarioSets.typical.readings[0], 40);
    const start = vi.spyOn(listener, 'start');
    audio.setState('idle');
    await act(async () => {
      await expect(result.current.start()).rejects.toThrow('The microphone is not capturing');
    });

    audio.setState('capturing');
    await act(async () => {
      await Promise.all([result.current.start(), result.current.start()]);
    });
    await advance(3000);

    expect(start).toHaveBeenCalledTimes(2);
    expect(result.current.view.position).toBeGreaterThan(0);
  });

  it('freezes the clock, the ghost and the events while paused', async () => {
    const { result } = setup(scenarioSets.typical.readings[0], 40);
    await act(async () => {
      await result.current.start();
    });
    await advance(5000);

    act(() => {
      result.current.pause();
    });
    const paused = result.current;
    await advance(10000);

    expect(result.current.paused).toBe(true);
    expect(result.current.elapsedMs).toBe(paused.elapsedMs);
    expect(result.current.ghostIndex).toBe(paused.ghostIndex);
    expect(result.current.view).toBe(paused.view);

    act(() => {
      result.current.resume();
    });
    await advance(2000);
    expect(result.current.elapsedMs).toBeGreaterThan(paused.elapsedMs);
    expect(result.current.view.position).toBeGreaterThan(paused.view.position);
  });

  it('freezes while the microphone is away and goes on when it returns', async () => {
    const { result, audio } = setup(scenarioSets.typical.readings[0], 40);
    await act(async () => {
      await result.current.start();
    });
    await advance(3000);

    act(() => {
      audio.setState('idle');
    });
    const away = result.current;
    await advance(5000);
    expect(result.current.elapsedMs).toBe(away.elapsedMs);
    expect(result.current.view.position).toBe(away.view.position);

    act(() => {
      audio.setState('capturing');
    });
    await advance(2000);
    expect(result.current.elapsedMs).toBeGreaterThan(away.elapsedMs);
  });

  it('goes on after the help when the microphone dropped out while Tıkır was reading', async () => {
    const { result, audio } = setup(scenarioSets.design.readings[1], 40);
    await act(async () => {
      await result.current.start();
    });
    await advance(19500);
    act(() => {
      audio.setState('idle');
    });

    await advance(3000);
    expect(result.current.view.results.get(14)?.status).toBe('helped');
    const stillAway = result.current.view.position;
    await advance(3000);
    expect(result.current.view.position).toBe(stillAway);

    act(() => {
      audio.setState('capturing');
    });
    await advance(3000);
    expect(result.current.view.position).toBeGreaterThan(stillAway);
  });

  it('ends once on finish(), with the words read so far', async () => {
    const { result, onFinish } = setup(scenarioSets.typical.readings[0], 40);
    await act(async () => {
      await result.current.start();
    });
    await advance(5000);
    const position = result.current.view.position;

    await act(async () => {
      await result.current.finish();
      await result.current.finish();
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    const outcome = onFinish.mock.calls[0]?.[0] as { words: { index: number }[] };
    expect(outcome.words.map((word) => word.index)).toEqual(
      Array.from({ length: position }, (_, index) => index),
    );
  });

  it('ends once when the whole text is read', async () => {
    const { result, onFinish } = setup({ wcpm: 60, miscues: [], hesitations: [] }, 40, threeWords);
    await act(async () => {
      await result.current.start();
    });

    await advance(5000);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0]?.[0]).toMatchObject({ seconds: 3 });
  });

  it('has no ghost without an earlier reading', async () => {
    const { result } = setup(scenarioSets.typical.readings[0], null);
    await act(async () => {
      await result.current.start();
    });
    await advance(5000);

    expect(result.current.ghostIndex).toBeNull();
    expect(result.current.raceLead).toBeNull();
  });

  it('stops the listener, the narration and every timer when the screen goes', async () => {
    const { result, stopNarration, unmount, onFinish } = setup(scenarioSets.design.readings[1], 40);
    await act(async () => {
      await result.current.start();
    });
    await advance(19500);

    unmount();

    expect(stopNarration).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(onFinish).not.toHaveBeenCalled();
  });
});
