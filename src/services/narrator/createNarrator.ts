// Picks the narrator (docs/kararlar.md T8): the speaking one with a Turkish voice, otherwise the
// silent one. The voice list can arrive late, so an empty list is given a moment to load.
import type { Narrator } from './Narrator';
import { narrationTiming } from './Narrator';
import { SilentNarrator } from './SilentNarrator';
import {
  browserSpeechPort,
  type SpeechPort,
  SpeechSynthesisNarrator,
} from './SpeechSynthesisNarrator';

type Voice = { name: string; lang: string };

/** 'tr-TR', 'tr_TR' (Android) or 'tr'. */
function turkish(voices: readonly Voice[]): Voice | null {
  return voices.find((voice) => /^tr(?:[-_]|$)/i.test(voice.lang)) ?? null;
}

function turkishVoice(port: SpeechPort): Promise<Voice | null> {
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
