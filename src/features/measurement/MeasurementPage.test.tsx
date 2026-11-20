import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReadingStyle } from '../../domain/types';
import { FakeListener } from '../../services/listener/FakeListener';
import { scenarioSets } from '../../services/listener/scenarios';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';
import { testRecorder } from '../../test/sessionDevices';

// The demo's last measurement was on 2026-11-15 (olcum-3a, with a trial reading of olcum-3b): the
// next opens on 2026-11-22.
const sunday = '2026-11-22';
const trialOff: ReadingStyle = { font: 'clear', sizeStep: 1, spacingStep: 0, trialEnabled: false };

/** Every measurement reading follows the typical one-minute scenario. */
function assessmentListener(kind: 'warmup' | 'reading' | 'assessment') {
  return {
    listener:
      kind === 'assessment'
        ? new FakeListener({ kind: 'scenario', scenario: scenarioSets.typical.assessment })
        : new FakeListener(),
  };
}

async function openMeasurement(options: RenderAppOptions = {}) {
  const recorder = testRecorder();
  const app = await renderApp('/olcum', {
    today: () => sunday,
    ...options,
    devices: { listener: assessmentListener, recorder, ...options.devices },
  });
  await screen.findByRole('heading', { level: 1, name: '1 dakikalık ölçüm' });
  await screen.findByRole('button', { name: 'Okumayı bitir' });
  return { ...app, recorder };
}

type MeasurementApp = Awaited<ReturnType<typeof openMeasurement>>;

/** The microphone the road's tap opened starts listening. */
async function listen(app: MeasurementApp) {
  await act(async () => {
    app.devices.audio.setState('capturing');
    await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function shownSpacing(): string | null | undefined {
  return document.querySelector('[data-reading-spacing]')?.getAttribute('data-reading-spacing');
}

async function measuredOn(app: MeasurementApp, date: string) {
  return (await app.repository.listAssessments()).filter((assessment) => assessment.date === date);
}

describe('MeasurementPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('goes back to the road while no measurement is open', async () => {
    const { router } = await renderApp('/olcum');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('reads one minute and stores it as the week’s measurement, then opens the road', async () => {
    const app = await openMeasurement({ readingStyle: trialOff });

    expect(screen.getByText('Metni sesli oku. Hata yapman sorun değil.')).toBeInTheDocument();
    expect(screen.queryByText(/okuma \/ 2/)).not.toBeInTheDocument();
    await listen(app);
    await advance(61_000);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/');
    });
    const [stored] = await measuredOn(app, sunday);
    expect(stored).toMatchObject({ passageId: 'olcum-3b', result: { recordingId: 'kayit' } });
    expect(stored?.trial).toBeUndefined();
    expect(app.recorder.start).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Ölçüme başla' })).not.toBeInTheDocument();
  });

  it('reads both styles in a trial week, the second after a tap', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openMeasurement();

    // The demo's last week read both styles, so the tried one goes first this week.
    expect(screen.getByText('1. okuma / 2')).toBeInTheDocument();
    expect(shownSpacing()).toBe('1');
    await listen(app);
    await advance(61_000);

    expect(await screen.findByText('2. okuma / 2')).toBeInTheDocument();
    expect(
      screen.getByText('Bir metin daha. Hazır olduğunda mikrofona dokun.'),
    ).toBeInTheDocument();
    expect(shownSpacing()).toBe('0');
    await advance(5_000);
    expect(screen.getByText('1:00 kaldı')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }));
    await advance(61_000);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/');
    });
    const stored = await measuredOn(app, sunday);
    expect(stored.map((each) => [each.passageId, each.trial === true])).toEqual([
      ['olcum-3a', true],
      ['olcum-3b', false],
    ]);
    expect(stored.map((each) => each.result.readingStyle.spacingStep)).toEqual([1, 0]);
  });

  it('stores nothing when the child leaves in the middle of the minute', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openMeasurement({ readingStyle: trialOff });
    await listen(app);
    await advance(10_000);

    await user.click(screen.getByRole('link', { name: 'Geri dön' }));

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/');
    });
    await advance(1_000);
    expect(await measuredOn(app, sunday)).toEqual([]);
    expect(app.recorder.remove).toHaveBeenCalledWith('kayit');
    expect(await screen.findByRole('button', { name: 'Ölçüme başla' })).toBeVisible();
  });

  it('asks only for a retry when the microphone fails: a measurement needs listening', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openMeasurement({ readingStyle: trialOff });

    await act(async () => {
      app.devices.audio.setState('denied');
      await Promise.resolve();
    });
    await user.click(screen.getAllByRole('button', { name: 'Yeniden dene' })[0] as HTMLElement);

    expect(screen.queryByRole('button', { name: 'Seviye tespitini atla' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bugün dinlemeden oku' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Geri dön' })).toBeVisible();
  });
});
