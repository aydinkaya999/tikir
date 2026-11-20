// Narration with the device's Turkish voice (docs/kararlar.md T8; docs/planlar/faz-2a.md, karar
// 11). One utterance per phrase unit. A pause cancels and later speaks the unit again, because
// speechSynthesis.pause() is unreliable on Android. A unit whose speech does not start in time,
// or fails, is timed silently, so G3 never hangs.
import type { Unsubscribe } from '../types';
import { narrationTiming, unitDurationMs } from './Narrator';
import { type NarrationJob, SilentNarrator } from './SilentNarrator';

/**
 * A voice of the device. localService is false for a voice served online: it would send the text
 * to a third party (docs/kararlar.md T12), so it is never used.
 */
export interface SpeechVoice {
  name: string;
  lang: string;
  localService: boolean;
}

/** The seam over window.speechSynthesis. */
export interface SpeechPort {
  voices(): SpeechVoice[];
  onVoicesChanged(callback: () => void): Unsubscribe;
  speak(
    text: string,
    options: { voiceName: string; lang: string; rate: number },
    handlers: { onStart(): void; onEnd(): void; onError(): void },
  ): void;
  cancel(): void;
}

export function browserSpeechPort(): SpeechPort | null {
  if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
    return null;
  }
  const synthesis = speechSynthesis;
  // Kept until it ends: some engines drop the events of an utterance nothing refers to.
  const speaking = new Set<SpeechSynthesisUtterance>();
  return {
    voices: () =>
      synthesis.getVoices().map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
      })),
    onVoicesChanged(callback) {
      synthesis.addEventListener('voiceschanged', callback);
      return () => {
        synthesis.removeEventListener('voiceschanged', callback);
      };
    },
    speak(text, options, handlers) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang;
      utterance.rate = options.rate;
      utterance.voice =
        synthesis.getVoices().find((voice) => voice.name === options.voiceName) ?? null;
      utterance.onstart = () => {
        handlers.onStart();
      };
      utterance.onend = () => {
        speaking.delete(utterance);
        handlers.onEnd();
      };
      utterance.onerror = () => {
        speaking.delete(utterance);
        handlers.onError();
      };
      speaking.add(utterance);
      synthesis.speak(utterance);
    },
    cancel() {
      synthesis.cancel();
      speaking.clear();
    },
  };
}

/** The unit being spoken: its start timeout, and once it started, its end timeout. */
interface CurrentSpeech {
  job: NarrationJob;
  startTimer: ReturnType<typeof setTimeout>;
  endTimer: ReturnType<typeof setTimeout> | undefined;
}

export class SpeechSynthesisNarrator extends SilentNarrator {
  private readonly port: SpeechPort;
  private readonly voice: { name: string; lang: string };
  /** Bumped for every utterance and every cancel: events of an older utterance are ignored. */
  private utterance = 0;
  /** The current unit's speech, while it is pending or speaking. */
  private speech: CurrentSpeech | null = null;
  /** The held unit was being spoken: resume() speaks it again. */
  private heldSpeech = false;

  constructor(
    port: SpeechPort,
    voice: { name: string; lang: string },
    options: { now?: () => number } = {},
  ) {
    super(options);
    this.port = port;
    this.voice = voice;
  }

  protected override playUnit(job: NarrationJob): void {
    this.utterance += 1;
    const token = this.utterance;
    const current = () => token === this.utterance && this.job === job;
    const startTimer = setTimeout(() => {
      if (current()) {
        this.quiet();
        this.playSilently(job);
      }
    }, narrationTiming.startTimeoutMs);
    const speech: CurrentSpeech = { job, startTimer, endTimer: undefined };
    this.speech = speech;
    const text = job.units[job.index] ?? '';
    this.port.speak(
      text,
      { voiceName: this.voice.name, lang: 'tr-TR', rate: narrationTiming.speechRate[this.rate] },
      {
        onStart: () => {
          if (current()) {
            clearTimeout(startTimer);
            clearTimeout(speech.endTimer);
            speech.endTimer = setTimeout(
              () => {
                if (current()) {
                  this.quiet();
                  this.nextUnit(job);
                }
              },
              unitDurationMs(text, 'slow') * narrationTiming.endGraceFactor +
                narrationTiming.endGraceMs,
            );
            this.announce(job);
          }
        },
        onEnd: () => {
          if (current()) {
            this.release();
            this.nextUnit(job);
          }
        },
        onError: () => {
          if (current()) {
            this.release();
            this.playSilently(job);
          }
        },
      },
    );
  }

  protected override holdUnit(job: NarrationJob): void {
    if (this.speech?.job === job) {
      this.quiet();
      this.heldSpeech = true;
      return;
    }
    this.heldSpeech = false;
    super.holdUnit(job);
  }

  protected override continueUnit(job: NarrationJob): void {
    if (this.heldSpeech) {
      this.heldSpeech = false;
      this.playUnit(job);
      return;
    }
    super.continueUnit(job);
  }

  protected override finish(end: Parameters<SilentNarrator['finish']>[0]): void {
    if (this.speech !== null) {
      this.quiet();
    }
    this.heldSpeech = false;
    super.finish(end);
  }

  /** Forgets the current utterance without stopping the engine (it has ended by itself). */
  private release(): void {
    if (this.speech !== null) {
      clearTimeout(this.speech.startTimer);
      clearTimeout(this.speech.endTimer);
      this.speech = null;
    }
    this.utterance += 1;
  }

  /** Stops the engine and ignores whatever the cancelled utterance still reports. */
  private quiet(): void {
    this.release();
    this.port.cancel();
  }
}
