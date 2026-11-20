import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import seriesBook from '../../../seed/kayip-fenerin-izinde.json';
import { scoreReading } from '../../domain/scoring';
import { splitPhraseUnits, tokenize } from '../../domain/text';
import { FakeAudioCapture } from '../../test/fakeCapture';
import { FakeListener, type FakeListenerMode } from './FakeListener';
import { scenarioSets } from './scenarios';
import type { ListenerEvent } from './types';

function chapterFourWords(): string[] {
  const chapter = seriesBook.chapters.find((item) => item.number === 4);
  if (chapter === undefined) {
    throw new Error('seed chapter 4 is missing');
  }
  return chapter.pages
    .flat()
    .flatMap((sentence) => tokenize(splitPhraseUnits(sentence).join(' ')))
    .map((token) => token.spoken);
}

function label(event: ListenerEvent): string {
  switch (event.type) {
    case 'position':
      return `position ${event.index}`;
    case 'word':
      return `word ${event.result.index} ${event.result.status}`;
    case 'hesitation':
      return `hesitation ${event.index} ${event.ms}`;
    case 'end':
      return `end ${event.reason}`;
  }
}

function setup(mode?: FakeListenerMode) {
  const audio = new FakeAudioCapture();
  audio.setState('capturing');
  const listener = new FakeListener(mode, { now: () => Date.now() });
  const events: ListenerEvent[] = [];
  listener.on((event) => events.push(event));
  const labels = () => events.map(label);
  return { audio, listener, events, labels };
}

const designSecond = { kind: 'scenario', scenario: scenarioSets.design.readings[1] } as const;

/** Runs the design scenario's second reading to the help on "ağaçlarının" (word 14). */
async function reachHelp() {
  const run = setup(designSecond);
  await run.listener.start(chapterFourWords(), run.audio);
  vi.advanceTimersByTime(19500);
  return run;
}

describe('FakeListener', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('refuses to start while the microphone is not capturing', async () => {
    const { audio, listener, events } = setup();
    audio.setState('idle');

    await expect(listener.start(['bir'], audio)).rejects.toThrow('The microphone is not capturing');
    vi.advanceTimersByTime(5000);
    expect(events).toEqual([]);
  });

  it('reports positions and words in order, and the reading time', async () => {
    const { audio, listener, labels } = setup({
      kind: 'scenario',
      scenario: { wcpm: 60, miscues: [], hesitations: [] },
    });

    await listener.start(['bir', 'iki', 'üç'], audio);
    vi.advanceTimersByTime(3000);

    expect(labels()).toEqual([
      'position 0',
      'word 0 correct',
      'position 1',
      'word 1 correct',
      'position 2',
      'word 2 correct',
      'end completed',
    ]);
    const outcome = await listener.stop();
    expect(outcome.words).toHaveLength(3);
    expect(outcome.seconds).toBe(3);
  });

  it('reports a hesitation every half second, then the word', async () => {
    const { audio, listener, events, labels } = setup({
      kind: 'scenario',
      scenario: scenarioSets.typical.readings[1],
    });

    await listener.start(chapterFourWords(), audio);
    vi.advanceTimersByTime(30000);

    const aroundSix = labels().filter((item) => / 6( |$)/.test(item));
    expect(aroundSix).toEqual([
      'position 6',
      'hesitation 6 500',
      'hesitation 6 1000',
      'hesitation 6 1500',
      'word 6 correct',
    ]);
    const six = events.find((event) => event.type === 'word' && event.result.index === 6);
    expect(six?.type === 'word' ? six.result.hesitationMs : undefined).toBe(1800);
  });

  it('waits at the help until Tıkır has read the word', async () => {
    const { listener, labels } = await reachHelp();

    expect(labels().slice(-6)).toEqual([
      'hesitation 14 500',
      'hesitation 14 1000',
      'hesitation 14 1500',
      'hesitation 14 2000',
      'hesitation 14 2500',
      'hesitation 14 3000',
    ]);
    const before = labels().length;
    vi.advanceTimersByTime(5000);
    listener.help(14);
    expect(labels()).toHaveLength(before);

    listener.resume();
    expect(labels().slice(before)).toEqual(['word 14 helped', 'position 15']);

    vi.advanceTimersByTime(200000);
    expect(labels().at(-1)).toBe('end completed');
    const outcome = await listener.stop();
    expect(scoreReading(outcome.words, outcome.seconds).wcpm).toBe(50);
  });

  it('stops the clock and the events while paused', async () => {
    const { audio, listener, labels } = setup({
      kind: 'scenario',
      scenario: { wcpm: 60, miscues: [], hesitations: [] },
    });
    await listener.start(['bir', 'iki', 'üç'], audio);
    vi.advanceTimersByTime(1000);
    listener.pause();
    const before = labels().length;

    vi.advanceTimersByTime(10000);
    expect(labels()).toHaveLength(before);

    const outcome = await listener.stop();
    expect(outcome.seconds).toBe(1);
  });

  it('carries on after a pause', async () => {
    const { audio, listener, labels } = setup({
      kind: 'scenario',
      scenario: { wcpm: 60, miscues: [], hesitations: [] },
    });
    await listener.start(['bir', 'iki', 'üç'], audio);
    vi.advanceTimersByTime(1000);
    listener.pause();
    vi.advanceTimersByTime(10000);

    listener.resume();
    vi.advanceTimersByTime(2000);

    expect(labels().at(-1)).toBe('end completed');
    expect((await listener.stop()).seconds).toBe(3);
  });

  it('freezes while the microphone is away and goes on when it returns', async () => {
    const { audio, listener, labels } = setup({
      kind: 'scenario',
      scenario: { wcpm: 60, miscues: [], hesitations: [] },
    });
    await listener.start(['bir', 'iki', 'üç'], audio);
    vi.advanceTimersByTime(500);
    audio.setState('idle');
    vi.advanceTimersByTime(10000);
    expect(labels()).toEqual(['position 0']);

    audio.setState('capturing');
    vi.advanceTimersByTime(2500);
    expect(labels().at(-1)).toBe('end completed');
  });

  it('still waits for resume() when the user paused before the microphone returned', async () => {
    const { audio, listener, labels } = setup({
      kind: 'scenario',
      scenario: { wcpm: 60, miscues: [], hesitations: [] },
    });
    await listener.start(['bir', 'iki', 'üç'], audio);
    listener.pause();
    audio.setState('idle');
    audio.setState('capturing');
    vi.advanceTimersByTime(5000);
    expect(labels()).toEqual(['position 0']);

    listener.resume();
    vi.advanceTimersByTime(3000);
    expect(labels().at(-1)).toBe('end completed');
  });

  it('gives the helped word on resume() even if the microphone went away during the help', async () => {
    const { audio, listener, labels } = await reachHelp();
    listener.help(14);
    audio.setState('idle');
    audio.setState('capturing');

    listener.resume();

    expect(labels().slice(-2)).toEqual(['word 14 helped', 'position 15']);
  });

  it('ends early on stop(): only finished words, no more timers, the same outcome twice', async () => {
    const { audio, listener, labels } = setup({
      kind: 'scenario',
      scenario: { wcpm: 60, miscues: [], hesitations: [] },
    });
    await listener.start(['bir', 'iki', 'üç'], audio);
    vi.advanceTimersByTime(1000);

    const outcome = await listener.stop();
    vi.advanceTimersByTime(10000);

    expect(labels()).toEqual(['position 0', 'word 0 correct', 'position 1', 'end stopped']);
    expect(outcome.words.map((word) => word.index)).toEqual([0]);
    expect(await listener.stop()).toEqual(outcome);
  });

  it('counts a helped word once when stopped during the help', async () => {
    const { listener } = await reachHelp();
    listener.help(14);

    const outcome = await listener.stop();

    expect(outcome.words.filter((word) => word.index === 14)).toEqual([
      expect.objectContaining({ status: 'helped', hesitationMs: 3000 }),
    ]);
    expect(scoreReading(outcome.words, outcome.seconds).wordsAttempted).toBe(15);
  });

  it('gives the same events on every run', async () => {
    async function run(): Promise<string> {
      const { listener, events } = await reachHelp();
      listener.help(14);
      listener.resume();
      vi.advanceTimersByTime(200000);
      return JSON.stringify(events);
    }

    expect(await run()).toBe(await run());
  });

  it('keeps reading when a listener throws', async () => {
    vi.stubGlobal('reportError', vi.fn());
    const { audio, listener, labels } = setup({
      kind: 'scenario',
      scenario: { wcpm: 60, miscues: [], hesitations: [] },
    });
    listener.on(() => {
      throw new Error('listener failed');
    });

    await listener.start(['bir'], audio);
    vi.advanceTimersByTime(1000);

    expect(labels()).toEqual(['position 0', 'word 0 correct', 'end completed']);
  });

  it('lets a person mark the words in the manual mode', async () => {
    const { audio, listener, labels } = setup({ kind: 'manual' });
    await listener.start(['bir', 'iki', 'üç', 'dört'], audio);

    listener.mark('correct');
    listener.mark('misread');
    listener.mark('hesitate');
    vi.advanceTimersByTime(8000);
    expect(labels()).toEqual([
      'position 0',
      'word 0 correct',
      'position 1',
      'word 1 misread',
      'position 2',
      'hesitation 2 500',
      'hesitation 2 1000',
      'hesitation 2 1500',
      'hesitation 2 2000',
      'hesitation 2 2500',
      'hesitation 2 3000',
    ]);

    listener.help(2);
    listener.resume();
    listener.mark('skipped');

    expect(labels().slice(-4)).toEqual([
      'word 2 helped',
      'position 3',
      'word 3 skipped',
      'end completed',
    ]);
  });

  it('refuses marks outside the manual mode', async () => {
    const { audio, listener } = setup();
    await listener.start(['bir'], audio);

    expect(() => {
      listener.mark('correct');
    }).toThrow();
  });

  it('reads at 60 words a minute by default', async () => {
    const audio = new FakeAudioCapture();
    audio.setState('capturing');
    const listener = new FakeListener();
    const labels: string[] = [];
    listener.on((event) => labels.push(label(event)));

    await listener.start(['kıvrılıyordu'], audio);
    vi.advanceTimersByTime(1000);

    expect(labels).toContain('word 0 correct');
  });
});
