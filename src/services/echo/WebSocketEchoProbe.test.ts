import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AudioCapture, CaptureDiagnostics, CaptureState } from '../audio/AudioCapture';
import { defaultCaptureSettings } from '../audio/AudioCapture';
import { type EchoSocket, WebSocketEchoProbe } from './WebSocketEchoProbe';

class FakeSocket implements EchoSocket {
  readonly sent: ArrayBuffer[] = [];
  closed = false;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  send(data: ArrayBuffer): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
  }

  /** The server sends the n-th message back. */
  echo(index: number): void {
    const message = this.sent[index];
    if (message !== undefined) {
      this.onmessage?.({ data: message.slice(0) });
    }
  }
}

class FakeCapture implements AudioCapture {
  state: CaptureState = 'capturing';
  private readonly frameListeners = new Set<(pcm16: Int16Array) => void>();
  private readonly stateListeners = new Set<(state: CaptureState) => void>();

  start(): Promise<void> {
    return Promise.resolve();
  }

  stop(): Promise<void> {
    this.setState('idle');
    return Promise.resolve();
  }

  onFrame(callback: (pcm16: Int16Array) => void) {
    this.frameListeners.add(callback);
    return () => {
      this.frameListeners.delete(callback);
    };
  }

  onLevel() {
    return () => undefined;
  }

  onStateChange(callback: (state: CaptureState) => void) {
    this.stateListeners.add(callback);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  diagnostics(): CaptureDiagnostics {
    return {
      requested: defaultCaptureSettings,
      applied: null,
      deviceLabel: null,
      inputSampleRate: null,
      framesDelivered: 0,
      framesDropped: 0,
      framesSilent: 0,
      failure: null,
    };
  }

  emitFrame(value: number): void {
    const frame = new Int16Array(320).fill(value);
    this.frameListeners.forEach((listener) => {
      listener(frame);
    });
  }

  setState(state: CaptureState): void {
    this.state = state;
    this.stateListeners.forEach((listener) => {
      listener(state);
    });
  }
}

function setup(frames = 3) {
  let clock = 0;
  const socket = new FakeSocket();
  const capture = new FakeCapture();
  const urls: string[] = [];
  const probe = new WebSocketEchoProbe({
    createSocket: (url) => {
      urls.push(url);
      return socket;
    },
    now: () => clock,
  });
  const result = probe.run({ url: 'ws://localhost/gelistirme/yanki', capture, frames });
  return {
    socket,
    capture,
    probe,
    result,
    urls,
    at: (ms: number) => {
      clock = ms;
    },
  };
}

describe('WebSocketEchoProbe', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends each frame as an 8-byte header and its PCM, numbered from 0', () => {
    const { socket, capture, urls } = setup();
    socket.onopen?.();

    capture.emitFrame(7);
    capture.emitFrame(-3);

    expect(urls).toEqual(['ws://localhost/gelistirme/yanki']);
    expect(socket.sent).toHaveLength(2);
    const [first, second] = socket.sent;
    expect(first?.byteLength).toBe(8 + 640);
    expect(new DataView(first ?? new ArrayBuffer(8)).getUint32(0, true)).toBe(0);
    expect(new DataView(first ?? new ArrayBuffer(8)).getUint32(4, true)).toBe(0);
    expect(Array.from(new Int16Array(first ?? new ArrayBuffer(8), 8).slice(0, 2))).toEqual([7, 7]);
    expect(new DataView(second ?? new ArrayBuffer(8)).getUint32(0, true)).toBe(1);
  });

  it('completes when every frame comes back and summarizes the round trips', async () => {
    const { socket, capture, result, at } = setup(3);
    socket.onopen?.();

    at(0);
    capture.emitFrame(1);
    at(10);
    capture.emitFrame(2);
    at(20);
    capture.emitFrame(3);
    at(5);
    socket.echo(0); // 5 ms
    at(17);
    socket.echo(1); // 7 ms
    at(29);
    socket.echo(2); // 9 ms

    await expect(result).resolves.toEqual({
      outcome: 'completed',
      summary: { sent: 3, received: 3, lost: 0, medianMs: 7, p95Ms: 9, minMs: 5, maxMs: 9 },
    });
    expect(socket.closed).toBe(true);
  });

  it('waits two seconds for stragglers, then counts the rest as lost', async () => {
    const { socket, capture, result } = setup(2);
    socket.onopen?.();
    capture.emitFrame(1);
    capture.emitFrame(2);
    socket.echo(0);

    await vi.advanceTimersByTimeAsync(1999);
    let settled = false;
    void result.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toMatchObject({
      outcome: 'completed',
      summary: { sent: 2, received: 1, lost: 1 },
    });
  });

  it('is unreachable when the socket cannot even be created (a CSP refusal)', async () => {
    const capture = new FakeCapture();
    const probe = new WebSocketEchoProbe({
      createSocket: () => {
        throw new DOMException('Refused by the content security policy', 'SecurityError');
      },
    });

    await expect(
      probe.run({ url: 'ws://127.0.0.1:1/', capture, frames: 3 }),
    ).resolves.toMatchObject({ outcome: 'unreachable', summary: { sent: 0 } });
  });

  it('is unreachable when the connection does not open within five seconds', async () => {
    const { socket, result } = setup();

    await vi.advanceTimersByTimeAsync(5000);

    await expect(result).resolves.toMatchObject({ outcome: 'unreachable' });
    expect(socket.closed).toBe(true);
  });

  it('is unreachable when the connection is refused', async () => {
    const { socket, result } = setup();

    socket.onerror?.();
    socket.onclose?.();

    await expect(result).resolves.toMatchObject({ outcome: 'unreachable' });
  });

  it('reports a dropped connection, from what came back until then', async () => {
    const { socket, capture, result } = setup(5);
    socket.onopen?.();
    capture.emitFrame(1);
    capture.emitFrame(2);
    socket.echo(0);

    socket.onclose?.();

    await expect(result).resolves.toMatchObject({
      outcome: 'closed',
      summary: { sent: 2, received: 1, lost: 1 },
    });
  });

  it('stops sending and closes the socket when cancelled', async () => {
    const { socket, capture, probe, result } = setup(5);
    socket.onopen?.();
    capture.emitFrame(1);

    probe.cancel();
    capture.emitFrame(2);

    await expect(result).resolves.toMatchObject({ outcome: 'stopped', summary: { sent: 1 } });
    expect(socket.sent).toHaveLength(1);
    expect(socket.closed).toBe(true);
  });

  it('stops when the microphone closes mid-run', async () => {
    const { socket, capture, result } = setup(5);
    socket.onopen?.();
    capture.emitFrame(1);

    capture.setState('idle');

    await expect(result).resolves.toMatchObject({ outcome: 'stopped', summary: { sent: 1 } });
    expect(socket.closed).toBe(true);
  });
});
