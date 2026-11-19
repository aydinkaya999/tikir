// AudioCapture over getUserMedia and an AudioWorklet (docs/dinleme-hatti.md, section 1). The
// browser work sits behind a CaptureEnvironment; this class owns the states, the counters and the
// rule that a microphone is never left open: a stop or a hidden page wins over a late permission.
import type { Unsubscribe } from '../types';
import {
  type AppliedTrackSettings,
  type AudioCapture,
  type CaptureDiagnostics,
  type CaptureFailure,
  type CaptureSettings,
  type CaptureState,
  toFailure,
} from './AudioCapture';
import { captureFormat } from './captureChain';
import type { CaptureEnvironment, CaptureGraph, WorkletMessage } from './captureEnvironment';
import { isSilent } from './pcm';

const deniedNames = new Set(['NotAllowedError', 'SecurityError']);
const unavailableNames = new Set(['NotFoundError', 'OverconstrainedError', 'NotSupportedError']);

function errorName(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    return typeof error.name === 'string' ? error.name : '';
  }
  return '';
}

/** Which state a getUserMedia (or audio graph) failure leads to. */
export function classifyCaptureError(error: unknown): 'denied' | 'unavailable' | 'error' {
  const name = errorName(error);
  if (deniedNames.has(name)) {
    return 'denied';
  }
  return unavailableNames.has(name) ? 'unavailable' : 'error';
}

export class WebAudioCapture implements AudioCapture {
  private readonly settings: CaptureSettings;
  private readonly environment: CaptureEnvironment;
  private current: CaptureState = 'idle';
  private graph: CaptureGraph | null = null;
  /** Bumped by every start and stop, so an open that resolves late knows it is stale. */
  private attempt = 0;
  private releasePageHidden: Unsubscribe | null = null;
  private readonly frameListeners = new Set<(pcm16: Int16Array) => void>();
  private readonly levelListeners = new Set<(rms: number) => void>();
  private readonly stateListeners = new Set<(state: CaptureState) => void>();
  private inputSampleRate: number | null = null;
  private applied: AppliedTrackSettings | null = null;
  private deviceLabel: string | null = null;
  private failure: CaptureFailure | null = null;
  private framesDelivered = 0;
  private framesDropped = 0;
  private framesSilent = 0;
  private expectedSeq = 0;
  private missedSamples = 0;

  constructor(settings: CaptureSettings, environment: CaptureEnvironment) {
    this.settings = { ...settings };
    this.environment = environment;
  }

  get state(): CaptureState {
    return this.current;
  }

  async start(): Promise<void> {
    if (this.current === 'starting' || this.current === 'capturing') {
      return;
    }
    if (!this.environment.supported) {
      this.failure = {
        name: 'MediaDevicesMissing',
        message: 'navigator.mediaDevices.getUserMedia is not available',
      };
      this.setState('unavailable');
      return;
    }

    this.attempt += 1;
    const attempt = this.attempt;
    this.failure = null;
    // Listen from the start: hiding the tab while the permission prompt is open cancels too.
    this.releasePageHidden = this.environment.onPageHidden(() => {
      void this.stop();
    });
    this.setState('starting');

    let graph: CaptureGraph;
    try {
      graph = await this.environment.open(this.settings);
    } catch (error) {
      if (attempt === this.attempt) {
        this.stopListeningForHiddenPage();
        this.failure = toFailure(error);
        this.setState(classifyCaptureError(error));
      }
      return;
    }

    if (attempt !== this.attempt) {
      await this.closeQuietly(graph); // stopped while the prompt was open
      return;
    }
    this.graph = graph;
    this.resetCounters();
    this.inputSampleRate = graph.sampleRate;
    this.applied = { ...graph.trackSettings };
    this.deviceLabel = graph.deviceLabel;
    graph.onMessage((message) => {
      if (this.graph === graph) {
        this.handle(message);
      }
    });
    graph.onInterrupted((failure) => {
      if (this.graph === graph) {
        void this.interrupt(failure);
      }
    });
    this.setState('capturing');
  }

  async stop(): Promise<void> {
    this.attempt += 1;
    const graph = this.graph;
    this.graph = null;
    this.stopListeningForHiddenPage();
    if (this.current === 'starting' || this.current === 'capturing') {
      this.setState('idle');
    }
    if (graph !== null) {
      await this.closeQuietly(graph);
    }
  }

  onFrame(callback: (pcm16: Int16Array) => void): Unsubscribe {
    return this.subscribe(this.frameListeners, callback);
  }

  onLevel(callback: (rms: number) => void): Unsubscribe {
    return this.subscribe(this.levelListeners, callback);
  }

  onStateChange(callback: (state: CaptureState) => void): Unsubscribe {
    return this.subscribe(this.stateListeners, callback);
  }

  diagnostics(): CaptureDiagnostics {
    return {
      requested: { ...this.settings },
      applied: this.applied === null ? null : { ...this.applied },
      deviceLabel: this.deviceLabel,
      inputSampleRate: this.inputSampleRate,
      framesDelivered: this.framesDelivered,
      framesDropped: this.framesDropped,
      framesSilent: this.framesSilent,
      failure: this.failure === null ? null : { ...this.failure },
    };
  }

  private handle(message: WorkletMessage): void {
    switch (message.type) {
      case 'frame': {
        if (message.seq > this.expectedSeq) {
          this.framesDropped += message.seq - this.expectedSeq;
        }
        this.expectedSeq = message.seq + 1;
        this.framesDelivered += 1;
        if (isSilent(message.samples)) {
          this.framesSilent += 1;
        }
        this.frameListeners.forEach((listener) => {
          listener(message.samples);
        });
        break;
      }
      case 'level': {
        this.levelListeners.forEach((listener) => {
          listener(message.rms);
        });
        break;
      }
      case 'missed': {
        this.missedSamples += message.samples;
        const frames = Math.floor(this.missedSamples / captureFormat.frameSamples);
        this.framesDropped += frames;
        this.missedSamples -= frames * captureFormat.frameSamples;
        break;
      }
    }
  }

  private async interrupt(failure: CaptureFailure): Promise<void> {
    this.attempt += 1;
    const graph = this.graph;
    this.graph = null;
    this.stopListeningForHiddenPage();
    this.failure = { ...failure };
    this.setState('error');
    if (graph !== null) {
      await this.closeQuietly(graph);
    }
  }

  private async closeQuietly(graph: CaptureGraph): Promise<void> {
    try {
      await graph.close();
    } catch {
      // Closing is best effort: the track and context are already being torn down.
    }
  }

  private stopListeningForHiddenPage(): void {
    this.releasePageHidden?.();
    this.releasePageHidden = null;
  }

  private resetCounters(): void {
    this.framesDelivered = 0;
    this.framesDropped = 0;
    this.framesSilent = 0;
    this.expectedSeq = 0;
    this.missedSamples = 0;
  }

  private setState(state: CaptureState): void {
    if (state === this.current) {
      return;
    }
    this.current = state;
    this.stateListeners.forEach((listener) => {
      listener(state);
    });
  }

  private subscribe<T>(listeners: Set<T>, callback: T): Unsubscribe {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }
}
