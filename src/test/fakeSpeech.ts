// A SpeechPort for tests: every utterance is kept, and the test plays its events.
import type { SpeechPort } from '../services/narrator/SpeechSynthesisNarrator';
import { notifyAll } from '../services/notify';
import type { Unsubscribe } from '../services/types';

export interface SpokenUnit {
  text: string;
  options: { voiceName: string; lang: string; rate: number };
  handlers: { onStart(): void; onEnd(): void; onError(): void };
}

export class FakeSpeechPort implements SpeechPort {
  readonly spoken: SpokenUnit[] = [];
  cancels = 0;
  private voiceList: { name: string; lang: string }[];
  private readonly voiceListeners = new Set<() => void>();

  constructor(voices: { name: string; lang: string }[] = []) {
    this.voiceList = voices;
  }

  voices(): { name: string; lang: string }[] {
    return this.voiceList;
  }

  onVoicesChanged(callback: () => void): Unsubscribe {
    this.voiceListeners.add(callback);
    return () => {
      this.voiceListeners.delete(callback);
    };
  }

  setVoices(voices: { name: string; lang: string }[]): void {
    this.voiceList = voices;
    notifyAll<undefined>(this.voiceListeners, undefined);
  }

  speak(text: string, options: SpokenUnit['options'], handlers: SpokenUnit['handlers']): void {
    this.spoken.push({ text, options, handlers });
  }

  cancel(): void {
    this.cancels += 1;
  }

  /** The utterance spoken last. */
  last(): SpokenUnit {
    const unit = this.spoken.at(-1);
    if (unit === undefined) {
      throw new Error('Nothing has been spoken.');
    }
    return unit;
  }
}
