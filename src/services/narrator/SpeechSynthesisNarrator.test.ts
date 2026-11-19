import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '../../domain/types';
import { FakeSpeechPort } from '../../test/fakeSpeech';
import { unitDurationMs } from './Narrator';
import { SpeechSynthesisNarrator } from './SpeechSynthesisNarrator';

const voice = { name: 'Yelda', lang: 'tr-TR' };
const page: Page = [
  ['Deniz sırt çantasını', 'omzuna aldı.'],
  ['Tıkır kulaklarını dikti', 've rüzgârı dinledi.'],
];

function setup() {
  const port = new FakeSpeechPort([voice]);
  const narrator = new SpeechSynthesisNarrator(port, voice, { now: () => Date.now() });
  const units: number[] = [];
  return { port, narrator, units };
}

describe('SpeechSynthesisNarrator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('speaks one utterance per phrase unit with the Turkish voice', async () => {
    const { port, narrator, units } = setup();

    const end = narrator.speakPage(page, (unit) => units.push(unit));

    expect(port.spoken).toHaveLength(1);
    expect(port.last().text).toBe('Deniz sırt çantasını');
    expect(port.last().options).toEqual({ voiceName: 'Yelda', lang: 'tr-TR', rate: 0.85 });
    expect(units).toEqual([]);

    for (let unit = 0; unit < 4; unit += 1) {
      port.last().handlers.onStart();
      expect(units.at(-1)).toBe(unit);
      port.last().handlers.onEnd();
    }

    await expect(end).resolves.toBe('completed');
    expect(port.spoken.map((spoken) => spoken.text)).toEqual(page.flat());
  });

  it('cancels on pause and speaks the same unit again on resume', () => {
    const { port, narrator, units } = setup();
    void narrator.speakPage(page, (unit) => units.push(unit));
    port.last().handlers.onStart();
    port.last().handlers.onEnd();
    port.last().handlers.onStart();

    narrator.pause();
    expect(port.cancels).toBe(1);
    port.last().handlers.onEnd();
    expect(port.spoken).toHaveLength(2);

    narrator.resume();
    expect(port.spoken).toHaveLength(3);
    expect(port.last().text).toBe('omzuna aldı.');
    port.last().handlers.onStart();
    expect(units).toEqual([0, 1]);
  });

  it('times a unit silently when speech does not start in 1.5 s, then speaks the next', async () => {
    const { port, narrator, units } = setup();
    const end = narrator.speakPage(page, (unit) => units.push(unit));

    vi.advanceTimersByTime(1500);
    expect(port.cancels).toBe(1);
    expect(units).toEqual([0]);
    expect(port.spoken).toHaveLength(1);

    vi.advanceTimersByTime(Math.ceil(unitDurationMs('Deniz sırt çantasını', 'slow')));
    expect(port.spoken).toHaveLength(2);
    port.last().handlers.onError();
    vi.advanceTimersByTime(Math.ceil(unitDurationMs('omzuna aldı.', 'slow')));
    expect(units).toEqual([0, 1]);

    for (let unit = 2; unit < 4; unit += 1) {
      port.last().handlers.onStart();
      port.last().handlers.onEnd();
    }
    await expect(end).resolves.toBe('completed');
    expect(units).toEqual([0, 1, 2, 3]);
  });

  it('ignores the events of an utterance it cancelled', () => {
    const { port, narrator, units } = setup();
    void narrator.speakPage(page, (unit) => units.push(unit));
    const first = port.last();

    narrator.stop();
    first.handlers.onStart();
    first.handlers.onEnd();

    expect(units).toEqual([]);
    expect(port.spoken).toHaveLength(1);
  });

  it('reads a word and ends when it is spoken', async () => {
    const { port, narrator } = setup();

    const end = narrator.speakWord('ağaçlarının');
    expect(port.last().text).toBe('ağaçlarının');
    port.last().handlers.onStart();
    port.last().handlers.onEnd();

    await expect(end).resolves.toBe('completed');
  });
});
