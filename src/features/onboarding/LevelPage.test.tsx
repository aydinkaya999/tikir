import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeListener } from '../../services/listener/FakeListener';
import { scenarioSets } from '../../services/listener/scenarios';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';
import { testRecorder } from '../../test/sessionDevices';

/** The level check's listener reads the typical measurement; any other kind reads the default. */
function assessmentListener(kind: 'warmup' | 'reading' | 'assessment') {
  return {
    listener:
      kind === 'assessment'
        ? new FakeListener({ kind: 'scenario', scenario: scenarioSets.typical.assessment })
        : new FakeListener(),
  };
}

async function openLevel(options: RenderAppOptions = {}) {
  const recorder = testRecorder();
  const app = await renderApp('/kurulum/seviye', {
    setup: 'seviye',
    ...options,
    devices: { listener: assessmentListener, recorder, ...options.devices },
  });
  await screen.findByRole('heading', { level: 1, name: '1 dakikalık okuma' });
  // The controls come with Tıkır's voice, a moment after the title.
  await screen.findByRole('button', { name: 'Okumayı bitir' });
  return { ...app, recorder };
}

type LevelApp = Awaited<ReturnType<typeof openLevel>>;

/** The microphone K2's tap opened starts listening. */
async function listen(app: LevelApp) {
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

function wordAt(index: number): Element | null {
  return document.querySelector(`[data-word-index="${String(index)}"]`);
}

describe('LevelPage (K3)', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the grade’s measurement text and the whole minute as the design draws it', async () => {
    await openLevel();

    expect(
      screen.getByText(
        'Deniz metni sesli okusun. Hata yapması sorun değil; başlangıç noktasını arıyoruz.',
      ),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('[data-word-index]')).toHaveLength(23);
    expect(wordAt(0)).toHaveTextContent('Sabah');
    expect(screen.getByText('1:00 kaldı')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Geçen süre' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    expect(screen.getByText('Hazır olduğunda başla. Dinliyorum.')).toBeInTheDocument();
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
  });

  it('follows the reading as the design draws it: the current word, without marks', async () => {
    const app = await openLevel();
    await listen(app);

    // At 11.5 s the typical reading has read 12 words, "açınca" and "yüzüme" wrongly.
    await advance(11_500);

    expect(wordAt(12)).toHaveAttribute('data-current');
    expect(wordAt(11)).not.toHaveAttribute('data-current');
    expect(document.querySelectorAll('[data-mark]')).toHaveLength(0);
  });

  it('reads the minute of the typical scenario and stores it as the first measurement', async () => {
    const app = await openLevel();
    await listen(app);

    await advance(22_000);
    expect(screen.getByText('0:38 kaldı')).toBeInTheDocument();
    expect(wordAt(23)).toHaveTextContent('Kuyruğunu');
    expect(wordAt(0)).toBeNull();

    await advance(38_000);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/kurulum/tanisma');
    });
    const assessments = await app.repository.listAssessments();
    expect(assessments).toHaveLength(1);
    expect(assessments[0]).toMatchObject({
      passageId: 'olcum-3a',
      level: 'instructional',
      result: { wordsAttempted: 64, correctWords: 58, wcpm: 58, seconds: 60, recordingId: 'kayit' },
    });
    expect(assessments[0]?.result.accuracy).toBeCloseTo(0.906, 3);
    expect(app.recorder.start).toHaveBeenCalledTimes(1);
  });

  it('counts the word the child is finishing as the minute ends', async () => {
    // The 64th word ends 100 ms after the minute.
    const lateLastWord = {
      ...scenarioSets.typical.assessment,
      timed: { seconds: 60.1, wordsRead: 64 },
    };
    const app = await openLevel({
      devices: {
        listener: (kind) => ({
          listener:
            kind === 'assessment'
              ? new FakeListener({ kind: 'scenario', scenario: lateLastWord })
              : new FakeListener(),
        }),
      },
    });
    await listen(app);

    await advance(61_000);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/kurulum/tanisma');
    });
    const [assessment] = await app.repository.listAssessments();
    expect(assessment?.result).toMatchObject({ wordsAttempted: 64, correctWords: 58, seconds: 60 });
  });

  it('ends early only once a word is read, and stores what was read', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openLevel();
    await listen(app);
    expect(screen.getByRole('button', { name: 'Okumayı bitir' })).toBeDisabled();

    await advance(10_000);
    await user.click(screen.getByRole('button', { name: 'Okumayı bitir' }));

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/kurulum/tanisma');
    });
    const [assessment] = await app.repository.listAssessments();
    expect(assessment?.result).toMatchObject({ wordsAttempted: 10, correctWords: 8 });
    expect(assessment?.result.seconds).toBeCloseTo(10, 0);
  });

  it('stops the minute and the recording while paused', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openLevel();
    await listen(app);
    await advance(5_000);
    expect(screen.getByText('0:55 kaldı')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dinliyor. Duraklatmak için dokun' }));
    await advance(10_000);

    expect(screen.getByText('0:55 kaldı')).toBeInTheDocument();
    expect(app.recorder.pause).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }));
    await advance(1_000);
    expect(screen.getByText('0:54 kaldı')).toBeInTheDocument();
    expect(app.recorder.resume).toHaveBeenCalled();
  });

  it('offers to skip the level check only after a retry did not help, and stores nothing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openLevel();
    app.devices.audio.start.mockImplementation(() => {
      app.devices.audio.setState('denied');
      return Promise.resolve();
    });
    await act(async () => {
      app.devices.audio.setState('denied');
      await Promise.resolve();
    });

    expect(
      screen.getAllByText(
        'Seni duyamıyorum, mikrofon izni kapalı. Velinden izni açmasını iste, sonra Yeniden dene’ye dokun.',
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Seviye tespitini atla' })).toBeNull();

    await user.click(screen.getAllByRole('button', { name: 'Yeniden dene' })[0] as HTMLElement);
    expect(app.devices.audio.start).toHaveBeenCalled();
    const [skip] = await screen.findAllByRole('button', { name: 'Seviye tespitini atla' });
    await user.click(skip as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/kurulum/tanisma');
    });
    expect(await app.repository.listAssessments()).toHaveLength(0);
  });
});
