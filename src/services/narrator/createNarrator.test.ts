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
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Yelda', lang: 'tr-TR' },
    ]);

    await expect(createNarrator(port)).resolves.toBeInstanceOf(SpeechSynthesisNarrator);
  });

  it('stays silent without a Turkish voice', async () => {
    const port = new FakeSpeechPort([{ name: 'Samantha', lang: 'en-US' }]);

    const narrator = await createNarrator(port);

    expect(narrator).toBeInstanceOf(SilentNarrator);
    expect(narrator).not.toBeInstanceOf(SpeechSynthesisNarrator);
  });

  it('waits a second for the voices to load', async () => {
    const port = new FakeSpeechPort([]);
    const pending = createNarrator(port);

    vi.advanceTimersByTime(500);
    port.setVoices([{ name: 'Turkish', lang: 'tr_TR' }]);

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
