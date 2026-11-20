import { describe, expect, it, vi } from 'vitest';
import {
  defaultCaptureSettings,
  type AppliedTrackSettings,
  type CaptureFailure,
  type CaptureState,
} from './AudioCapture';
import type { CaptureEnvironment, CaptureGraph, WorkletMessage } from './captureEnvironment';
import { classifyCaptureError, WebAudioCapture } from './WebAudioCapture';

const appliedSettings: AppliedTrackSettings = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false,
  sampleRate: 48_000,
  channelCount: 1,
  latency: 0.01,
};

/** A capture graph that records what the capture asks of it and lets the test drive it. */
class FakeGraph implements CaptureGraph {
  readonly sampleRate = 48_000;
  readonly trackSettings = appliedSettings;
  readonly deviceLabel = 'Test microphone';
  closeCalls = 0;
  private readonly messageListeners: ((message: WorkletMessage) => void)[] = [];
  private readonly interruptListeners: ((failure: CaptureFailure) => void)[] = [];

  onMessage(callback: (message: WorkletMessage) => void): void {
    this.messageListeners.push(callback);
  }

  onInterrupted(callback: (failure: CaptureFailure) => void): void {
    this.interruptListeners.push(callback);
  }

  close(): Promise<void> {
    this.closeCalls += 1;
    return Promise.resolve();
  }

  emit(message: WorkletMessage): void {
    this.messageListeners.forEach((listener) => {
      listener(message);
    });
  }

  interrupt(failure: CaptureFailure): void {
    this.interruptListeners.forEach((listener) => {
      listener(failure);
    });
  }
}

class FakeEnvironment implements CaptureEnvironment {
  supported = true;
  openCalls = 0;
  graph = new FakeGraph();
  /** Replaced by tests that need a refusal or a slow permission prompt. */
  open: CaptureEnvironment['open'] = () => {
    this.openCalls += 1;
    return Promise.resolve(this.graph);
  };
  private hiddenListeners: (() => void)[] = [];

  onPageHidden(callback: () => void): () => void {
    this.hiddenListeners.push(callback);
    return () => {
      this.hiddenListeners = this.hiddenListeners.filter((listener) => listener !== callback);
    };
  }

  hide(): void {
    this.hiddenListeners.forEach((listener) => {
      listener();
    });
  }
}

function setup() {
  const environment = new FakeEnvironment();
  const capture = new WebAudioCapture(defaultCaptureSettings, environment);
  const states: CaptureState[] = [];
  capture.onStateChange((state) => states.push(state));
  return { environment, capture, states, graph: environment.graph };
}

function frame(seq: number, value: number): WorkletMessage {
  return { type: 'frame', seq, samples: new Int16Array(320).fill(value) };
}

describe('classifyCaptureError', () => {
  it.each([
    ['NotAllowedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'unavailable'],
    ['OverconstrainedError', 'unavailable'],
    ['NotSupportedError', 'unavailable'],
    ['NotReadableError', 'error'],
    ['AbortError', 'error'],
  ])('sorts %s as %s', (name, expected) => {
    expect(classifyCaptureError(new DOMException('message', name))).toBe(expected);
  });

  it('sorts anything else as an error', () => {
    expect(classifyCaptureError(new TypeError('bad constraints'))).toBe('error');
    expect(classifyCaptureError(new Error('boom'))).toBe('error');
    expect(classifyCaptureError('a string')).toBe('error');
  });
});

describe('WebAudioCapture', () => {
  it('keeps starting and notifying when a state listener throws', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const environment = new FakeEnvironment();
    const capture = new WebAudioCapture(defaultCaptureSettings, environment);
    capture.onStateChange(() => {
      throw new Error('listener failed');
    });
    const states: CaptureState[] = [];
    capture.onStateChange((state) => states.push(state));

    await expect(capture.start()).resolves.toBeUndefined();

    expect(capture.state).toBe('capturing');
    expect(states).toEqual(['starting', 'capturing']);
    expect(reportError).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('announces starting, then capturing, and reports the device', async () => {
    const { capture, states } = setup();

    await capture.start();

    expect(states).toEqual(['starting', 'capturing']);
    expect(capture.state).toBe('capturing');
    expect(capture.diagnostics()).toMatchObject({
      requested: defaultCaptureSettings,
      applied: appliedSettings,
      deviceLabel: 'Test microphone',
      inputSampleRate: 48_000,
      failure: null,
    });
  });

  it('is unavailable without getUserMedia and never asks for the microphone', async () => {
    const { environment, capture } = setup();
    environment.supported = false;

    await capture.start();

    expect(capture.state).toBe('unavailable');
    expect(capture.diagnostics().failure?.name).toBe('MediaDevicesMissing');
    expect(environment.openCalls).toBe(0);
  });

  it('never rejects: a refusal becomes the denied state, with its reason', async () => {
    const { environment, capture } = setup();
    environment.open = () =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));

    await expect(capture.start()).resolves.toBeUndefined();

    expect(capture.state).toBe('denied');
    expect(capture.diagnostics().failure).toEqual({
      name: 'NotAllowedError',
      message: 'Permission denied',
    });
  });

  it('passes frames on and counts delivered, silent and dropped ones', async () => {
    const { capture, graph } = setup();
    const heard: number[] = [];
    capture.onFrame((samples) => heard.push(samples[0] ?? Number.NaN));
    await capture.start();

    graph.emit(frame(0, 5));
    graph.emit(frame(1, 0));
    graph.emit(frame(3, 7)); // frame 2 never arrived

    expect(heard).toEqual([5, 0, 7]);
    expect(capture.diagnostics()).toMatchObject({
      framesDelivered: 3,
      framesSilent: 1,
      framesDropped: 1,
    });

    graph.emit({ type: 'missed', samples: 640 }); // 40 ms without input: two frames
    expect(capture.diagnostics().framesDropped).toBe(3);
  });

  it('counts missed input across messages until it fills a frame', async () => {
    const { capture, graph } = setup();
    await capture.start();

    graph.emit({ type: 'missed', samples: 200 });
    expect(capture.diagnostics().framesDropped).toBe(0);
    graph.emit({ type: 'missed', samples: 200 });
    expect(capture.diagnostics().framesDropped).toBe(1);
  });

  it('passes levels on', async () => {
    const { capture, graph } = setup();
    const levels: number[] = [];
    capture.onLevel((rms) => levels.push(rms));
    await capture.start();

    graph.emit({ type: 'level', rms: 0.25 });

    expect(levels).toEqual([0.25]);
  });

  it('stop closes the graph once, goes idle and silences the listeners', async () => {
    const { capture, graph, states } = setup();
    const heard: Int16Array[] = [];
    capture.onFrame((samples) => heard.push(samples));
    await capture.start();

    await capture.stop();
    await capture.stop();
    graph.emit(frame(0, 5));

    expect(graph.closeCalls).toBe(1);
    expect(capture.state).toBe('idle');
    expect(states).toEqual(['starting', 'capturing', 'idle']);
    expect(heard).toEqual([]);
  });

  it('closes the microphone when the page is hidden', async () => {
    const { environment, capture, graph } = setup();
    await capture.start();

    environment.hide();
    await Promise.resolve();

    expect(capture.state).toBe('idle');
    expect(graph.closeCalls).toBe(1);
  });

  it('closes a microphone that arrives after a stop and never reports capturing', async () => {
    const { environment, capture, graph, states } = setup();
    let grant: (graph: CaptureGraph) => void = () => undefined;
    environment.open = () =>
      new Promise((resolve) => {
        grant = resolve;
      });

    const starting = capture.start();
    await capture.stop();
    grant(graph);
    await starting;

    expect(graph.closeCalls).toBe(1);
    expect(capture.state).toBe('idle');
    expect(states).toEqual(['starting', 'idle']);
  });

  it('closes a microphone that arrives after the page was hidden during the prompt', async () => {
    const { environment, capture, graph } = setup();
    let grant: (graph: CaptureGraph) => void = () => undefined;
    environment.open = () =>
      new Promise((resolve) => {
        grant = resolve;
      });

    const starting = capture.start();
    environment.hide();
    grant(graph);
    await starting;

    expect(graph.closeCalls).toBe(1);
    expect(capture.state).toBe('idle');
  });

  it('does not open a second microphone while one is open', async () => {
    const { environment, capture } = setup();
    await capture.start();

    await capture.start();

    expect(environment.openCalls).toBe(1);
  });

  it('turns an interruption into an error, keeps its reason and closes the graph', async () => {
    const { capture, graph } = setup();
    await capture.start();

    graph.interrupt({ name: 'Interrupted', message: 'track ended' });
    await Promise.resolve();

    expect(capture.state).toBe('error');
    expect(capture.diagnostics().failure).toEqual({ name: 'Interrupted', message: 'track ended' });
    expect(graph.closeCalls).toBe(1);
  });

  it('tries again after a refusal', async () => {
    const { environment, capture } = setup();
    const grant = environment.open;
    environment.open = () =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    await capture.start();

    environment.open = grant;
    await capture.start();

    expect(capture.state).toBe('capturing');
    expect(capture.diagnostics().failure).toBeNull();
  });

  it('starts counting afresh on a new start', async () => {
    const { capture, graph } = setup();
    await capture.start();
    graph.emit(frame(0, 0));
    graph.emit(frame(2, 0));
    await capture.stop();

    await capture.start();

    expect(capture.diagnostics()).toMatchObject({
      framesDelivered: 0,
      framesDropped: 0,
      framesSilent: 0,
    });
    graph.emit(frame(0, 1)); // sequence numbers restart with the new graph
    expect(capture.diagnostics().framesDropped).toBe(0);
  });

  it('stops calling a listener once it unsubscribes', async () => {
    const { capture, graph } = setup();
    const heard: Int16Array[] = [];
    const unsubscribe = capture.onFrame((samples) => heard.push(samples));
    await capture.start();

    unsubscribe();
    graph.emit(frame(0, 5));

    expect(heard).toEqual([]);
  });
});
