import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  type AudioCapture,
  type CaptureDiagnostics,
  type CaptureState,
  defaultCaptureSettings,
} from '../../../services/audio/AudioCapture';
import type { WavPlayer } from '../../../services/audio/WavPlayer';
import { RecordingSection } from './RecordingSection';
import type { CaptureHandle } from './useCapture';

class FakeCapture implements AudioCapture {
  state: CaptureState = 'capturing';
  private readonly events: string[];
  private readonly frameListeners = new Set<(pcm16: Int16Array) => void>();
  private readonly stateListeners = new Set<(state: CaptureState) => void>();

  constructor(events: string[]) {
    this.events = events;
  }

  start(): Promise<void> {
    return Promise.resolve();
  }

  stop(): Promise<void> {
    this.events.push('stop');
    this.state = 'idle';
    this.stateListeners.forEach((listener) => {
      listener('idle');
    });
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

  emitFrames(count: number): void {
    for (let index = 0; index < count; index += 1) {
      const frame = new Int16Array(320).fill(1000);
      this.frameListeners.forEach((listener) => {
        listener(frame);
      });
    }
  }
}

class FakePlayer implements WavPlayer {
  private readonly events: string[];
  private readonly failure: Error | null;

  constructor(events: string[], failure: Error | null = null) {
    this.events = events;
    this.failure = failure;
  }

  prepare(): void {
    this.events.push('prepare');
  }

  play(): Promise<void> {
    this.events.push('play');
    return this.failure === null ? new Promise(() => undefined) : Promise.reject(this.failure);
  }

  stop(): void {
    this.events.push('player stop');
  }
}

function renderSection(capture: FakeCapture, player: FakePlayer) {
  const handle: CaptureHandle = {
    capture,
    state: 'capturing',
    level: 0,
    settings: { ...defaultCaptureSettings },
    changeSettings: () => undefined,
  };
  render(
    <RecordingSection
      handle={handle}
      player={player}
      saveFile={() => undefined}
      onRecorded={() => undefined}
    />,
  );
}

async function recordTake(capture: FakeCapture): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: '10 saniye kaydet' }));
  act(() => {
    capture.emitFrames(500);
  });
  await screen.findByText('Kayıt hazır: 10,0 sn');
}

describe('RecordingSection', () => {
  // iPhone plays audio only from inside a user gesture, and the gesture is gone once the
  // microphone has finished closing. The player has to be unlocked first.
  it('unlocks playback inside the click, before the microphone closes', async () => {
    const events: string[] = [];
    const capture = new FakeCapture(events);
    renderSection(capture, new FakePlayer(events));
    await recordTake(capture);

    await userEvent.click(screen.getByRole('button', { name: 'Kaydı çal' }));

    await waitFor(() => {
      expect(events).toContain('play');
    });
    expect(events).toEqual(['prepare', 'stop', 'play']);
  });

  it('says why playback failed and lets the take be played again', async () => {
    const events: string[] = [];
    const capture = new FakeCapture(events);
    renderSection(
      capture,
      new FakePlayer(events, new DOMException('Playback was not allowed', 'NotAllowedError')),
    );
    await recordTake(capture);

    await userEvent.click(screen.getByRole('button', { name: 'Kaydı çal' }));

    expect(
      await screen.findByText('Ayrıntı: NotAllowedError: Playback was not allowed'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kaydı çal' })).toBeEnabled();
  });
});
