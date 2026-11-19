// The echo test: microphone frames go to a WebSocket server that sends them straight back, and
// the round trip is timed (docs/dinleme-hatti.md, section 5). It is the path a real listener
// will use in phase 6, without recognition.
import type { AudioCapture } from '../audio/AudioCapture';
import type { RoundTripSummary } from './roundTrip';

export type EchoOutcome = 'completed' | 'unreachable' | 'closed' | 'stopped';

export interface EchoResult {
  outcome: EchoOutcome;
  summary: RoundTripSummary;
}

export interface EchoProbe {
  /** Sends the microphone's next `frames` frames; never rejects. */
  run(options: {
    url: string;
    capture: AudioCapture;
    frames: number;
    onProgress?: (sent: number) => void;
  }): Promise<EchoResult>;
  cancel(): void;
}

/** Ten seconds of 20 ms frames. */
export const echoFrames = 500;

/** The WebSocket address of `path` on the page's own host: wss on https, ws otherwise. */
export function webSocketUrlFor(pageUrl: string, path: string): string {
  const page = new URL(pageUrl);
  const scheme = page.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${page.host}${path}`;
}
