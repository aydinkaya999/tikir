// An AudioCapture for tests: the state is set by hand and frames are pushed by hand.
import { vi } from 'vitest';
import type {
  AudioCapture,
  CaptureDiagnostics,
  CaptureState,
} from '../services/audio/AudioCapture';
import { defaultCaptureSettings } from '../services/audio/AudioCapture';
import { notifyAll } from '../services/notify';
import type { Unsubscribe } from '../services/types';

export class FakeAudioCapture implements AudioCapture {
  state: CaptureState = 'idle';
  readonly start = vi.fn(() => {
    this.setState('capturing');
    return Promise.resolve();
  });
  readonly stop = vi.fn(() => {
    if (this.state === 'starting' || this.state === 'capturing') {
      this.setState('idle');
    }
    return Promise.resolve();
  });
  private readonly frameListeners = new Set<(pcm16: Int16Array) => void>();
  private readonly levelListeners = new Set<(rms: number) => void>();
  private readonly stateListeners = new Set<(state: CaptureState) => void>();

  setState(state: CaptureState): void {
    if (state === this.state) {
      return;
    }
    this.state = state;
    notifyAll(this.stateListeners, state);
  }

  emitFrame(pcm16: Int16Array): void {
    notifyAll(this.frameListeners, pcm16);
  }

  emitLevel(rms: number): void {
    notifyAll(this.levelListeners, rms);
  }

  onFrame(callback: (pcm16: Int16Array) => void): Unsubscribe {
    return subscribe(this.frameListeners, callback);
  }

  onLevel(callback: (rms: number) => void): Unsubscribe {
    return subscribe(this.levelListeners, callback);
  }

  onStateChange(callback: (state: CaptureState) => void): Unsubscribe {
    return subscribe(this.stateListeners, callback);
  }

  diagnostics(): CaptureDiagnostics {
    return {
      requested: { ...defaultCaptureSettings },
      applied: null,
      deviceLabel: null,
      inputSampleRate: null,
      framesDelivered: 0,
      framesDropped: 0,
      framesSilent: 0,
      failure: null,
    };
  }
}

function subscribe<T>(listeners: Set<T>, callback: T): Unsubscribe {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
