import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Attempt } from '../../domain/types';
import { FakeListener } from '../../services/listener/FakeListener';
import { type ScenarioName, scenarioSets } from '../../services/listener/scenarios';
import { ControlledNarrator } from '../../test/controlledNarrator';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';
import { testRecorder } from '../../test/sessionDevices';

/** Listeners of a ready scenario; the ones the screen starts are kept (StrictMode makes two). */
function scenarioListeners(name: ScenarioName | 'manual') {
  const started: FakeListener[] = [];
  return {
    started,
    factory: (_kind: 'warmup' | 'reading', attempt: Attempt) => {
      const listener =
        name === 'manual'
          ? new FakeListener({ kind: 'manual' })
          : new FakeListener({
              kind: 'scenario',
              scenario: scenarioSets[name].readings[attempt - 1],
            });
      const start = listener.start.bind(listener);
      listener.start = (words, audio) => {
        started.push(listener);
        return start(words, audio);
      };
      return {
        listener,
        mark:
          name === 'manual'
            ? (mark: Parameters<FakeListener['mark']>[0]) => {
                listener.mark(mark);
              }
            : undefined,
      };
    },
  };
}

interface OpenReadOptions extends RenderAppOptions {
  listen?: ScenarioName | 'manual';
}

async function openRead(options: OpenReadOptions = {}) {
  const listeners = scenarioListeners(options.listen ?? 'typical');
  const narrator = new ControlledNarrator();
  const recorder = testRecorder();
  const app = await renderApp('/seans/oku', {
    step: 'read-1',
    ...options,
    devices: { listener: listeners.factory, narrator, recorder, ...options.devices },
  });
  await screen.findByRole('heading', { level: 1, name: 'Oku' });
  // The controls come with Tıkır's voice, a moment after the title.
  await screen.findAllByRole('button', { name: 'Okumayı bitir' });
  return { ...app, listeners, narrator, recorder };
}

type ReadApp = Awaited<ReturnType<typeof openRead>>;

async function startListening(app: ReadApp) {
  await act(async () => {
    app.devices.audio.setState('capturing');
    await Promise.resolve();
  });
  await waitFor(() => {
    expect(app.listeners.started.length).toBeGreaterThan(0);
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

describe('ReadPage (G4)', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reaches the moment the design shows on the second reading of the design scenario', async () => {
    const app = await openRead({
      step: 'read-2',
      scenario: 'design',
      listen: 'design',
      devices: { scenario: { ghostWpm: 40, layout: 'design' } },
    });
    await startListening(app);

    await advance(19_300);

    expect(screen.getByText('2. okuma / 3')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(wordAt(14)).toHaveAttribute('data-current');
    expect(wordAt(12)).toHaveAttribute('data-ghost');
    expect(wordAt(6)).toHaveAttribute('data-mark', 'hesitation');
    expect(wordAt(9)).toHaveAttribute('data-mark', 'error');
    expect(screen.getByText('Süre 0:19')).toBeInTheDocument();
    expect(screen.getByText('Doğru 13')).toBeInTheDocument();
    expect(screen.getByText('Takılma 1')).toBeInTheDocument();
    expect(screen.getByText('Takıldın mı? Hecele:')).toBeInTheDocument();
    expect(screen.getByText('a-ğaç-la-rı-nın')).toBeInTheDocument();
    expect(screen.getByText('Dünkü senin 2 kelime önündesin.')).toBeInTheDocument();
    expect(app.narrator.words).toEqual(['ağaçlarının']);
  });

  it('opens the help at three seconds and saves the word as helped', async () => {
    const app = await openRead({
      step: 'read-2',
      scenario: 'design',
      listen: 'design',
      devices: { scenario: { ghostWpm: 40, layout: 'design' } },
    });
    await startListening(app);
    await advance(19_300);

    act(() => {
      app.narrator.finish();
    });
    await advance(500);
    expect(wordAt(14)).toHaveAttribute('data-mark', 'hesitation');
    expect(screen.queryByText('Takıldın mı? Hecele:')).toBeNull();
    await advance(120_000);

    await waitFor(async () => {
      const session = await app.repository.getSession('2026-11-21');
      expect(session?.readings).toHaveLength(2);
    });
    const session = await app.repository.getSession('2026-11-21');
    expect(session?.readings[1]?.words.find((word) => word.index === 14)?.status).toBe('helped');
  });

  it('reads three times, the third with the recorder, then goes to the recording', async () => {
    const app = await openRead();
    await startListening(app);

    await advance(95_000);
    expect(await screen.findByText('2. okuma / 3')).toBeInTheDocument();
    await waitFor(() => {
      expect(app.listeners.started).toHaveLength(2);
    });
    await advance(90_000);
    expect(await screen.findByText('3. okuma / 3')).toBeInTheDocument();
    await waitFor(() => {
      expect(app.recorder.start).toHaveBeenCalledTimes(1);
    });
    // The step tile is called "Kayıt" too; the mark is in the main content.
    expect(within(screen.getByRole('main')).getByText('Kayıt')).toBeInTheDocument();
    await advance(90_000);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/kayit');
    });
    expect(app.recorder.stop).toHaveBeenCalledTimes(1);
    const session = await app.repository.getSession('2026-11-21');
    expect(session?.readings.map((reading) => reading.wcpm)).toEqual([64, 68, 71]);
    expect(session?.readings[2]?.recordingId).toBe('kayit');
  });

  it('never shows a race sentence when the child is behind or level', async () => {
    const app = await openRead({ devices: { scenario: { ghostWpm: 300, layout: 'content' } } });
    await startListening(app);

    await advance(10_000);

    expect(document.body.textContent).not.toContain('önündesin');
    expect(document.body.textContent).not.toContain('gerisinde');
  });

  it('shows no ghost and no race sentence on a first reading with nothing earlier', async () => {
    const app = await openRead({
      before: async ({ repository }) => {
        for (const session of await repository.listSessions('0000-01-01', '2026-11-20')) {
          await repository.saveSession({ ...session, readings: [] });
        }
      },
    });
    await startListening(app);

    await advance(10_000);

    expect(document.querySelector('[data-ghost]')).toBeNull();
    expect(document.body.textContent).not.toContain('önündesin');
  });

  it('pauses and resumes the reading from its button and from the Space key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openRead();
    await startListening(app);
    await advance(5_000);

    await user.click(screen.getAllByRole('button', { name: 'Duraklat' })[0] as HTMLElement);
    const frozen = screen.getByText(/^Süre /).textContent;
    await advance(5_000);
    expect(screen.getByText(/^Süre /).textContent).toBe(frozen);
    expect(screen.getAllByRole('button', { name: 'Sürdür' }).length).toBeGreaterThan(0);

    await user.click(document.body);
    await user.keyboard(' ');
    expect(screen.getAllByRole('button', { name: 'Duraklat' }).length).toBeGreaterThan(0);
    await user.keyboard(' ');
    expect(screen.getAllByRole('button', { name: 'Sürdür' }).length).toBeGreaterThan(0);

    // On a focused button Space presses the button only: one toggle, not two.
    const [resume] = screen.getAllByRole('button', { name: 'Sürdür' });
    resume?.focus();
    await user.keyboard(' ');
    expect(screen.getAllByRole('button', { name: 'Duraklat' }).length).toBeGreaterThan(0);
  });

  it('pauses from the microphone button and opens a closed microphone', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openRead();

    const [closed] = screen.getAllByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' });
    await user.click(closed as HTMLElement);
    expect(app.devices.audio.start).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(app.listeners.started.length).toBeGreaterThan(0);
    });

    await user.click(
      screen.getAllByRole('button', { name: 'Dinliyor. Duraklatmak için dokun' })[0] as HTMLElement,
    );
    expect(
      screen.getAllByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }).length,
    ).toBeGreaterThan(0);
    await user.click(
      screen.getAllByRole('button', {
        name: 'Duraklatıldı. Sürdürmek için dokun',
      })[0] as HTMLElement,
    );
    expect(
      screen.getAllByRole('button', { name: 'Dinliyor. Duraklatmak için dokun' }).length,
    ).toBeGreaterThan(0);
  });

  it('ends a reading early with what was read, once', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openRead();
    await startListening(app);
    await advance(10_000);

    const [finish] = screen.getAllByRole('button', { name: 'Okumayı bitir' });
    await user.click(finish as HTMLElement);
    await user.click(finish as HTMLElement);

    expect(await screen.findByText('2. okuma / 3')).toBeInTheDocument();
    const session = await app.repository.getSession('2026-11-21');
    expect(session?.readings).toHaveLength(1);
    expect(session?.readings[0]?.wordsAttempted).toBeLessThan(99);
    expect(session?.readings[0]?.wordsAttempted).toBeGreaterThan(0);
  });

  it('holds the help while the exit dialog is open, then finishes it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openRead({
      step: 'read-2',
      scenario: 'design',
      listen: 'design',
      devices: { scenario: { ghostWpm: 40, layout: 'design' } },
    });
    await startListening(app);
    await advance(19_300);

    await user.click(screen.getAllByRole('button', { name: 'Seanstan çık' })[0] as HTMLElement);
    expect(app.narrator.pause).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Seansa dön' }));
    expect(app.narrator.resume).toHaveBeenCalled();
    act(() => {
      app.narrator.finish();
    });
    await advance(500);

    expect(wordAt(15)).toHaveAttribute('data-current');
  });

  it('drops a third reading cut short by leaving, with its recording', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openRead({ step: 'read-3' });
    await startListening(app);
    await waitFor(() => {
      expect(app.recorder.start).toHaveBeenCalledTimes(1);
    });
    await advance(10_000);

    await user.click(screen.getAllByRole('button', { name: 'Seanstan çık' })[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Çık' }));

    await waitFor(() => {
      expect(app.recorder.remove).toHaveBeenCalledWith('kayit');
    });
    expect(app.recorder.stop).toHaveBeenCalledTimes(1);
    expect((await app.repository.getSession('2026-11-21'))?.readings).toHaveLength(2);
  });

  it('freezes the third reading while the microphone is away and keeps one recording', async () => {
    const app = await openRead({ step: 'read-3' });
    await startListening(app);
    await advance(10_000);
    const before = screen.getByText(/^Süre /).textContent;

    await act(async () => {
      app.devices.audio.setState('idle');
      await Promise.resolve();
    });
    await advance(5_000);
    expect(screen.getByText(/^Süre /).textContent).toBe(before);
    await act(async () => {
      app.devices.audio.setState('capturing');
      await Promise.resolve();
    });
    await advance(90_000);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/kayit');
    });
    expect(app.recorder.start).toHaveBeenCalledTimes(1);
    expect(app.recorder.stop).toHaveBeenCalledTimes(1);
  });

  it('shows the whole text unheard and goes on reading by reading without the parent consent', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openRead({ consent: false });

    expect(document.querySelectorAll('[data-word-index]')).toHaveLength(99);
    expect(document.querySelector('[data-current]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Duraklat' })).toBeNull();
    expect(screen.queryByText(/^Süre /)).toBeNull();
    expect(
      screen.getByText('Dinleme kapalı. Metni sesli oku, bitince Okumayı bitir’e dokun.'),
    ).toBeInTheDocument();
    for (const attempt of ['2', '3']) {
      await user.click(screen.getAllByRole('button', { name: 'Okumayı bitir' })[0] as HTMLElement);
      expect(await screen.findByText(`${attempt}. okuma / 3`)).toBeInTheDocument();
    }
    await user.click(screen.getAllByRole('button', { name: 'Okumayı bitir' })[0] as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/kapanis');
    });
    expect(app.listeners.started).toHaveLength(0);
    expect(app.devices.audio.start).not.toHaveBeenCalled();
  });

  it('explains a refused microphone and does not start the reading', async () => {
    const app = await openRead();

    await act(async () => {
      app.devices.audio.setState('denied');
      await Promise.resolve();
    });

    expect(
      screen.getByText(
        'Seni duyamıyorum, mikrofon izni kapalı. Velinden izni açmasını iste, sonra Yeniden dene’ye dokun.',
      ),
    ).toBeInTheDocument();
    expect(app.listeners.started).toHaveLength(0);
  });

  it('turns the page when the reading reaches the next one', async () => {
    const app = await openRead();
    await startListening(app);
    expect(screen.getByText('1 / 6')).toBeInTheDocument();

    await advance(30_000);

    expect(screen.getByText('2 / 6')).toBeInTheDocument();
  });

  it('marks the word with Space in the manual mode instead of pausing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openRead({ listen: 'manual' });
    await startListening(app);

    await user.keyboard(' ');

    expect(wordAt(1)).toHaveAttribute('data-current');
    expect(screen.getAllByRole('button', { name: 'Duraklat' }).length).toBeGreaterThan(0);
  });
});
