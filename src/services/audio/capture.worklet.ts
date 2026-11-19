// AudioWorklet processor 'tikir-capture' (docs/dinleme-hatti.md, section 1). Runs the capture
// chain on every 128-sample render quantum and posts 20 ms frames of 16 kHz PCM, levels, and the
// input it never received, to the main thread. Loaded with `?worker&url` (vite.config.ts builds
// workers as ES modules, which is what audioWorklet.addModule expects).
import { CaptureChain, captureFormat } from './captureChain';
import type { WorkletMessage } from './captureEnvironment';

// TypeScript ships no AudioWorkletGlobalScope library. These module-local declarations describe
// the globals that scope provides; they do not leak into the rest of the app.
declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}
declare function registerProcessor(
  name: string,
  processorConstructor: new () => AudioWorkletProcessor,
): void;

const renderQuantum = 128;

class CaptureProcessor extends AudioWorkletProcessor {
  private readonly chain = new CaptureChain(sampleRate);
  private seq = 0;
  /** 16 kHz samples not produced while the input was missing, not yet reported. */
  private missed = 0;

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    if (channel === undefined) {
      // No source is feeding the node (the track ended or stalled): count the gap.
      this.missed += (renderQuantum * captureFormat.sampleRate) / sampleRate;
      const whole = Math.floor(this.missed);
      if (whole > 0) {
        this.missed -= whole;
        this.post({ type: 'missed', samples: whole });
      }
      return true;
    }
    const { frames, levels } = this.chain.process(channel);
    for (const samples of frames) {
      this.post({ type: 'frame', seq: this.seq, samples }, [samples.buffer]);
      this.seq += 1;
    }
    for (const rms of levels) {
      this.post({ type: 'level', rms });
    }
    return true;
  }

  private post(message: WorkletMessage, transfer: Transferable[] = []): void {
    this.port.postMessage(message, transfer);
  }
}

registerProcessor('tikir-capture', CaptureProcessor);
