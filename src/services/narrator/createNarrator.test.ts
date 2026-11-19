import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSpeechPort } from '../../test/fakeSpeech';
import { createNarrator } from './createNarrator';
import { SilentNarrator } from './SilentNarrator';
import { SpeechSynthesisNarrator } from './SpeechSynthesisNarrator';

describe('createNarrator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('speaks with a Turkish voice', async () => {
    const port = new FakeSpeechPort([
      { name: 'Samantha', lang: 'en-US', localService: true },
      { name: 'Yelda', lang: 'tr-TR', localService: true },
    ]);

    await expect(createNarrator(port)).resolves.toBeInstanceOf(SpeechSynthesisNarrator);
  });

  it('stays silent without a Turkish voice', async () => {
    const port = new FakeSpeechPort([{ name: 'Samantha', lang: 'en-US', localService: true }]);

    const narrator = await createNarrator(port);

    expect(narrator).toBeInstanceOf(SilentNarrator);
    expect(narrator).not.toBeInstanceOf(SpeechSynthesisNarrator);
  });

  it('never speaks with an online voice, which would send the text to a third party', async () => {
    const port = new FakeSpeechPort([
      { name: 'Google Türkçe', lang: 'tr-TR', localService: false },
    ]);

    const narrator = await createNarrator(port);

    expect(narrator).not.toBeInstanceOf(SpeechSynthesisNarrator);
  });

  it("picks the device's Turkish voice over an online one", async () => {
    const port = new FakeSpeechPort([
      { name: 'Google Türkçe', lang: 'tr-TR', localService: false },
      { name: 'Yelda', lang: 'tr-TR', localService: true },
    ]);

    const narrator = await createNarrator(port);
    void narrator.speakWord('patika');

    expect(narrator).toBeInstanceOf(SpeechSynthesisNarrator);
    expect(port.last().options.voiceName).toBe('Yelda');
    narrator.stop();
  });

  it('waits a second for the voices to load', async () => {
    const port = new FakeSpeechPort([]);
    const pending = createNarrator(port);

    vi.advanceTimersByTime(500);
    port.setVoices([{ name: 'Turkish', lang: 'tr_TR', localService: true }]);

    await expect(pending).resolves.toBeInstanceOf(SpeechSynthesisNarrator);
  });

  it('stays silent when no voice comes in a second', async () => {
    const port = new FakeSpeechPort([]);
    const pending = createNarrator(port);

    vi.advanceTimersByTime(1000);

    const narrator = await pending;
    expect(narrator).not.toBeInstanceOf(SpeechSynthesisNarrator);
  });

  it('stays silent where the browser has no speech synthesis', async () => {
    const narrator = await createNarrator(null);

    expect(narrator).toBeInstanceOf(SilentNarrator);
    expect(narrator).not.toBeInstanceOf(SpeechSynthesisNarrator);
  });
});
