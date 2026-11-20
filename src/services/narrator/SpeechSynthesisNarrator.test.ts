import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import seriesBook from '../../../seed/kayip-fenerin-izinde.json';
import { splitPhraseUnits } from '../../domain/text';
import type { Page } from '../../domain/types';
import { FakeSpeechPort } from '../../test/fakeSpeech';
import { unitDurationMs } from './Narrator';
import { SpeechSynthesisNarrator } from './SpeechSynthesisNarrator';

const voice = { name: 'Yelda', lang: 'tr-TR', localService: true };
const page: Page = [
  ['Deniz sırt çantasını', 'omzuna aldı.'],
  ['Tıkır kulaklarını dikti', 've rüzgârı dinledi.'],
];

/** The G3 design page: pages 1 and 2 of chapter 4, 18 phrase units, 47.0 s slow. */
const designPage: Page = (() => {
  const chapter = seriesBook.chapters.find((item) => item.number === 4);
  if (chapter === undefined) {
    throw new Error('seed chapter 4 is missing');
  }
  return chapter.pages.slice(0, 2).flat().map(splitPhraseUnits);
})();

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

  it('times the rest of the page silently once a unit does not start in 1.5 s', async () => {
    const { port, narrator, units } = setup();
    let ended: string | null = null;
    void narrator
      .speakPage(designPage, (unit) => units.push(unit))
      .then((end) => {
        ended = end;
      });

    // 1.5 s of waiting, then the 47.0 s of silent timing: one try, no 1.5 s per unit.
    await vi.advanceTimersByTimeAsync(48_480);
    expect(ended).toBeNull();
    await vi.advanceTimersByTimeAsync(40);
    expect(ended).toBe('completed');

    expect(port.spoken).toHaveLength(1);
    expect(units).toEqual(Array.from({ length: 18 }, (_, unit) => unit));
  });

  it('times the rest of the page silently after a unit fails', async () => {
    const { port, narrator, units } = setup();
    const end = narrator.speakPage(designPage, (unit) => units.push(unit));
    for (let unit = 0; unit < 3; unit += 1) {
      port.last().handlers.onStart();
      port.last().handlers.onEnd();
    }

    port.last().handlers.onError();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(port.spoken).toHaveLength(4);
    expect(units).toEqual(Array.from({ length: 18 }, (_, unit) => unit));
    await expect(end).resolves.toBe('completed');
  });

  it('tries the voice again on the next page and for a word', async () => {
    const { port, narrator } = setup();
    void narrator.speakPage(designPage, () => undefined);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(port.spoken).toHaveLength(1);

    void narrator.speakPage(page, () => undefined);
    expect(port.spoken).toHaveLength(2);
    expect(port.last().text).toBe('Deniz sırt çantasını');

    void narrator.speakWord('ağaçlarının');
    expect(port.spoken).toHaveLength(3);
    expect(port.last().text).toBe('ağaçlarının');
  });

  it('stays silent through a pause in the silent rest of a page', async () => {
    const { port, narrator, units } = setup();
    const end = narrator.speakPage(designPage, (unit) => units.push(unit));
    await vi.advanceTimersByTimeAsync(2500);
    expect(units).toEqual([0]);

    narrator.pause();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(units).toEqual([0]);

    narrator.resume();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(port.spoken).toHaveLength(1);
    await expect(end).resolves.toBe('completed');
  });

  it('ends a unit whose speech started but never ended, and goes on to the next', async () => {
    const { port, narrator, units } = setup();
    const end = narrator.speakPage(page, (unit) => units.push(unit));
    port.last().handlers.onStart();

    vi.advanceTimersByTime(Math.ceil(unitDurationMs('Deniz sırt çantasını', 'slow') * 2 + 2000));

    expect(port.cancels).toBe(1);
    expect(port.spoken).toHaveLength(2);
    for (let unit = 1; unit < 4; unit += 1) {
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
