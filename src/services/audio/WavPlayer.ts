// Plays a WAV file through Web Audio (docs/planlar/faz-1.md, decision 10): decoding in the page
// needs no `media-src` in the content security policy, unlike an <audio> element on a blob URL.

export interface WavPlayer {
  /** Resolves when playback ends or is stopped, including a stop that comes while decoding. */
  play(wav: ArrayBuffer): Promise<void>;
  stop(): void;
}

export class WebAudioWavPlayer implements WavPlayer {
  private readonly createContext: () => AudioContext;
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private settle: (() => void) | null = null;
  /** Bumped by every play and stop, so a play still decoding knows it was cancelled. */
  private generation = 0;

  /** The context is created on the first play, inside the user's gesture. */
  constructor(createContext: () => AudioContext = () => new AudioContext()) {
    this.createContext = createContext;
  }

  async play(wav: ArrayBuffer): Promise<void> {
    this.stop();
    const generation = this.generation;
    this.context ??= this.createContext();
    const context = this.context;
    await context.resume();
    // decodeAudioData takes ownership of the buffer; the caller keeps its copy.
    const audio = await context.decodeAudioData(wav.slice(0));
    if (generation !== this.generation) {
      return; // stopped while decoding
    }
    const source = context.createBufferSource();
    source.buffer = audio;
    source.connect(context.destination);

    await new Promise<void>((resolve) => {
      this.source = source;
      this.settle = resolve;
      source.onended = () => {
        this.finish(source);
      };
      source.start();
    });
  }

  stop(): void {
    this.generation += 1;
    const source = this.source;
    if (source === null) {
      return;
    }
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
    this.finish(source);
  }

  private finish(source: AudioBufferSourceNode): void {
    if (this.source !== source) {
      return;
    }
    source.onended = null;
    source.disconnect();
    this.source = null;
    const settle = this.settle;
    this.settle = null;
    settle?.();
  }
}
