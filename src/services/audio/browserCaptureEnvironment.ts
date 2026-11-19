// The browser side of WebAudioCapture: getUserMedia, an AudioContext and the 'tikir-capture'
// AudioWorklet (docs/dinleme-hatti.md, section 1; docs/planlar/faz-1.md, decision 5).
import type { Unsubscribe } from '../types';
import type { AppliedTrackSettings, CaptureFailure, CaptureSettings } from './AudioCapture';
import type { CaptureEnvironment, CaptureGraph, WorkletMessage } from './captureEnvironment';
import workletUrl from './capture.worklet.ts?worker&url';

function appliedSettings(track: MediaStreamTrack | undefined): AppliedTrackSettings {
  if (track === undefined) {
    return {};
  }
  // `latency` is in the spec and Chrome reports it, but TypeScript's DOM types leave it out.
  const settings: MediaTrackSettings & { latency?: number } = track.getSettings();
  return {
    // Kept as reported: 'remote-only' is not full echo cancellation, and the trial is there to
    // learn what each device applies.
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
    sampleRate: settings.sampleRate,
    channelCount: settings.channelCount,
    latency: settings.latency,
  };
}

class BrowserCaptureGraph implements CaptureGraph {
  readonly sampleRate: number;
  readonly trackSettings: AppliedTrackSettings;
  readonly deviceLabel: string;
  private readonly stream: MediaStream;
  private readonly context: AudioContext;
  private readonly source: MediaStreamAudioSourceNode;
  private readonly node: AudioWorkletNode;
  private closing = false;

  constructor(
    stream: MediaStream,
    context: AudioContext,
    source: MediaStreamAudioSourceNode,
    node: AudioWorkletNode,
  ) {
    this.stream = stream;
    this.context = context;
    this.source = source;
    this.node = node;
    this.sampleRate = context.sampleRate;
    const track = stream.getAudioTracks()[0];
    this.trackSettings = appliedSettings(track);
    this.deviceLabel = track?.label ?? '';
  }

  onMessage(callback: (message: WorkletMessage) => void): void {
    this.node.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
      callback(event.data);
    };
  }

  onInterrupted(callback: (failure: CaptureFailure) => void): void {
    for (const track of this.stream.getTracks()) {
      track.addEventListener('ended', () => {
        if (!this.closing) {
          callback({ name: 'TrackEnded', message: 'The microphone track ended' });
        }
      });
    }
    this.context.addEventListener('statechange', () => {
      // Safari adds 'interrupted' (a phone call, another app taking the audio session).
      const state: string = this.context.state;
      if (!this.closing && (state === 'interrupted' || state === 'closed')) {
        callback({ name: 'ContextInterrupted', message: `The audio context is ${state}` });
      }
    });
  }

  async close(): Promise<void> {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.node.port.onmessage = null;
    this.source.disconnect();
    this.node.disconnect();
    for (const track of this.stream.getTracks()) {
      track.stop();
    }
    if (this.context.state !== 'closed') {
      await this.context.close();
    }
  }
}

async function open(settings: CaptureSettings): Promise<CaptureGraph> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: settings.autoGainControl,
    },
  });
  // The context comes after the microphone: on iPhone the hardware rate is settled once the
  // microphone is on, and Safari lets a page that is capturing start audio.
  let context: AudioContext | null = null;
  try {
    context = new AudioContext({ latencyHint: 'interactive' });
    await context.audioWorklet.addModule(workletUrl);
    const source = context.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(context, 'tikir-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      // The browser mixes a stereo microphone down to one channel.
      channelCount: 1,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
    });
    source.connect(node);
    // The node outputs silence; being connected keeps it processed in every browser.
    node.connect(context.destination);
    await context.resume();
    return new BrowserCaptureGraph(stream, context, source, node);
  } catch (error) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    if (context !== null && context.state !== 'closed') {
      await context.close().catch(() => undefined);
    }
    throw error;
  }
}

function onPageHidden(callback: () => void): Unsubscribe {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      callback();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', callback);
  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', callback);
  };
}

export function browserCaptureEnvironment(): CaptureEnvironment {
  return {
    get supported() {
      // Missing outside a secure context (a page served over plain http to another device).
      const devices = navigator.mediaDevices as MediaDevices | undefined;
      return typeof devices?.getUserMedia === 'function';
    },
    open,
    onPageHidden,
  };
}
