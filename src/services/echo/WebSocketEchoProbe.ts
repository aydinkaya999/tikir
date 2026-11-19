// EchoProbe over a browser WebSocket. Each message is an 8-byte header (sequence number, uint32
// little-endian, then 4 zero bytes) and the frame's 640 bytes of PCM (docs/planlar/faz-1.md,
// decision 11). The server returns it unchanged; the header says which send it answers.
import type { AudioCapture } from '../audio/AudioCapture';
import { type EchoOutcome, type EchoProbe, type EchoResult, webSocketUrlFor } from './EchoProbe';
import { summarizeRoundTrips } from './roundTrip';

/** The part of a WebSocket the probe uses; tests pass a fake. */
export interface EchoSocket {
  send(data: ArrayBuffer): void;
  close(): void;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
}

const headerBytes = 8;

function browserSocket(url: string): EchoSocket {
  const socket = new WebSocket(url);
  socket.binaryType = 'arraybuffer';
  const adapter: EchoSocket = {
    send: (data) => {
      socket.send(data);
    },
    close: () => {
      socket.close();
    },
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
  };
  socket.onopen = () => adapter.onopen?.();
  socket.onmessage = (event: MessageEvent<unknown>) => adapter.onmessage?.({ data: event.data });
  socket.onerror = () => adapter.onerror?.();
  socket.onclose = () => adapter.onclose?.();
  return adapter;
}

/** The WebSocket address of `path` on this page's host; only a service reads `location`. */
export function pageWebSocketUrl(path: string): string {
  return webSocketUrlFor(location.href, path);
}

export class WebSocketEchoProbe implements EchoProbe {
  private readonly createSocket: (url: string) => EchoSocket;
  private readonly now: () => number;
  private readonly connectTimeoutMs: number;
  private readonly graceMs: number;
  private cancelActive: (() => void) | null = null;

  constructor(
    options: {
      createSocket?: (url: string) => EchoSocket;
      now?: () => number;
      connectTimeoutMs?: number;
      graceMs?: number;
    } = {},
  ) {
    this.createSocket = options.createSocket ?? browserSocket;
    this.now = options.now ?? (() => performance.now());
    this.connectTimeoutMs = options.connectTimeoutMs ?? 5000;
    this.graceMs = options.graceMs ?? 2000;
  }

  run({
    url,
    capture,
    frames,
    onProgress,
  }: {
    url: string;
    capture: AudioCapture;
    frames: number;
    onProgress?: (sent: number) => void;
  }): Promise<EchoResult> {
    this.cancel();
    return new Promise((resolve) => {
      const sentAt = new Map<number, number>();
      const roundTrips: number[] = [];
      let sent = 0;
      let opened = false;
      let settled = false;
      let socket: EchoSocket | null = null;
      let connectTimer: ReturnType<typeof setTimeout> | undefined = undefined;
      let graceTimer: ReturnType<typeof setTimeout> | undefined;
      const unsubscribers: (() => void)[] = [];

      const finish = (outcome: EchoOutcome) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(connectTimer);
        clearTimeout(graceTimer);
        unsubscribers.forEach((unsubscribe) => {
          unsubscribe();
        });
        if (this.cancelActive === cancel) {
          this.cancelActive = null;
        }
        if (socket !== null) {
          socket.onopen = null;
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close();
        }
        resolve({ outcome, summary: summarizeRoundTrips(roundTrips, sent) });
      };
      const cancel = () => {
        finish('stopped');
      };
      this.cancelActive = cancel;

      const sendFrame = (pcm: Int16Array) => {
        if (socket === null || sent >= frames) {
          return;
        }
        const message = new ArrayBuffer(headerBytes + pcm.byteLength);
        const header = new DataView(message);
        header.setUint32(0, sent, true);
        header.setUint32(4, 0, true);
        new Int16Array(message, headerBytes).set(pcm);
        sentAt.set(sent, this.now());
        socket.send(message);
        sent += 1;
        onProgress?.(sent);
        if (sent === frames) {
          // Stragglers get a grace period; whatever is still out then counts as lost.
          graceTimer = setTimeout(() => {
            finish('completed');
          }, this.graceMs);
        }
      };

      try {
        socket = this.createSocket(url);
      } catch {
        finish('unreachable'); // e.g. a SecurityError from the content security policy
        return;
      }
      connectTimer = setTimeout(() => {
        finish('unreachable');
      }, this.connectTimeoutMs);

      socket.onopen = () => {
        opened = true;
        clearTimeout(connectTimer);
        if (capture.state !== 'capturing') {
          finish('stopped');
          return;
        }
        unsubscribers.push(capture.onFrame(sendFrame));
        unsubscribers.push(
          capture.onStateChange((state) => {
            if (state !== 'capturing') {
              finish('stopped');
            }
          }),
        );
      };
      socket.onmessage = (event) => {
        if (!(event.data instanceof ArrayBuffer) || event.data.byteLength < headerBytes) {
          return;
        }
        const seq = new DataView(event.data).getUint32(0, true);
        const at = sentAt.get(seq);
        if (at === undefined) {
          return;
        }
        sentAt.delete(seq);
        roundTrips.push(this.now() - at);
        if (sent === frames && sentAt.size === 0) {
          finish('completed');
        }
      };
      socket.onerror = () => {
        if (!opened) {
          finish('unreachable');
        }
      };
      socket.onclose = () => {
        finish(opened ? 'closed' : 'unreachable');
      };
    });
  }

  cancel(): void {
    this.cancelActive?.();
  }
}
