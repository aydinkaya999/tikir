// Picks the narrator (docs/kararlar.md T8): the speaking one with a Turkish voice of the device,
// otherwise the silent one. An online voice would send the text to a third party (T12), so it is
// never used. The voice list can arrive late, so an empty list is given a moment to load.
import type { Narrator } from './Narrator';
import { narrationTiming } from './Narrator';
import { SilentNarrator } from './SilentNarrator';
import {
  browserSpeechPort,
  type SpeechPort,
  SpeechSynthesisNarrator,
  type SpeechVoice,
} from './SpeechSynthesisNarrator';

/** A Turkish voice on the device: 'tr-TR', 'tr_TR' (Android) or 'tr'; never an online voice (T12). */
function turkish(voices: readonly SpeechVoice[]): SpeechVoice | null {
  return voices.find((voice) => voice.localService && /^tr(?:[-_]|$)/i.test(voice.lang)) ?? null;
}

function turkishVoice(port: SpeechPort): Promise<SpeechVoice | null> {
  const voices = port.voices();
  if (voices.length > 0) {
    return Promise.resolve(turkish(voices));
  }
  return new Promise((resolve) => {
    const release = port.onVoicesChanged(() => {
      const found = turkish(port.voices());
      if (found !== null) {
        clearTimeout(timer);
        release();
        resolve(found);
      }
    });
    const timer = setTimeout(() => {
      release();
      resolve(null);
    }, narrationTiming.voiceWaitMs);
  });
}

export async function createNarrator(
  port: SpeechPort | null = browserSpeechPort(),
): Promise<Narrator> {
  if (port === null) {
    return new SilentNarrator();
  }
  const voice = await turkishVoice(port);
  return voice === null ? new SilentNarrator() : new SpeechSynthesisNarrator(port, voice);
}
