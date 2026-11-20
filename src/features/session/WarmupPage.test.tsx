import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StuckWord } from '../../domain/types';
import { FakeListener } from '../../services/listener/FakeListener';
import { ControlledNarrator } from '../../test/controlledNarrator';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';

/**
 * Manual listeners, so the test says how each word was read. StrictMode makes a screen's state
 * twice and keeps one: the listener that counts is the one the screen starts.
 */
function manualListeners() {
  const started: FakeListener[] = [];
  return {
    started,
    factory: () => {
      const listener = new FakeListener({ kind: 'manual' });
      const start = listener.start.bind(listener);
      listener.start = (words, audio) => {
        started.push(listener);
        return start(words, audio);
      };
      return {
        listener,
        mark: (mark: Parameters<FakeListener['mark']>[0]) => {
          listener.mark(mark);
        },
      };
    },
    last: () => {
      const listener = started.at(-1);
      if (listener === undefined) {
        throw new Error('No listener has started.');
      }
      return listener;
    },
  };
}

async function openWarmup(options: RenderAppOptions = {}) {
  const listeners = manualListeners();
  const narrator = new ControlledNarrator();
  const app = await renderApp('/seans/isinma', {
    step: 'warmup',
    ...options,
    devices: { listener: listeners.factory, narrator, ...options.devices },
  });
  await screen.findByText('Canavar kelime 1 / 3');
  return { ...app, listeners, narrator };
}

/** Lets started readings and finished narrations run their promise steps. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** The microphone starts listening; the first try begins. */
async function listen(app: Awaited<ReturnType<typeof openWarmup>>) {
  await act(async () => {
    app.devices.audio.setState('capturing');
    await Promise.resolve();
  });
  await waitFor(() => {
    expect(app.listeners.started.length).toBeGreaterThan(0);
  });
  await settle();
}

function cardOf(cards: readonly StuckWord[], word: string): StuckWord | undefined {
  return cards.find((card) => card.word === word);
}

describe('WarmupPage (G2)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the first card as the design does: the word, its syllables and its growing word', async () => {
    const app = await openWarmup();
    await listen(app);

    expect(screen.getByRole('heading', { level: 1, name: 'Isınma' })).toBeInTheDocument();
    expect(screen.getByText('3 kelime')).toBeInTheDocument();
    expect(screen.getByText('Evcilleşmesine 2 doğru okuma kaldı')).toBeInTheDocument();
    const syllables = screen.getByRole('list', { name: 'Heceler' });
    expect(
      within(syllables)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['kıv', 'rı', 'lı', 'yor', 'du']);
    const chain = screen.getByText('Büyüyen kelime').nextElementSibling;
    expect(chain?.querySelectorAll('[data-known]')).toHaveLength(2);
    expect(chain?.textContent).toContain('kıvrılıyordu');
    expect(document.querySelectorAll('[data-filled]')).toHaveLength(1);
    expect(screen.getByText('Önce hecele, sonra bir nefeste söyle.')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Dinliyor. Duraklatmak için dokun' }).length,
    ).toBeGreaterThan(0);
  });

  it('moves to the next card after a correct reading and scores the card', async () => {
    const app = await openWarmup();
    await listen(app);

    act(() => {
      app.listeners.last().mark('correct');
    });

    expect(await screen.findByText('Canavar kelime 2 / 3')).toBeInTheDocument();
    expect(screen.getAllByText('ağaçlarının').length).toBeGreaterThan(0);
    expect(cardOf(await app.repository.listStuckWords(), 'kıvrılıyordu')?.correctStreak).toBe(2);
  });

  it('reads the word after a wrong first try, gives one more try and scores only the first', async () => {
    const app = await openWarmup();
    await listen(app);
    const saveStuckWords = vi.spyOn(app.repository, 'saveStuckWords');

    act(() => {
      app.listeners.last().mark('misread');
    });
    await waitFor(() => {
      expect(app.narrator.words).toContain('kıvrılıyordu');
    });
    const firstTry = app.listeners.last();
    act(() => {
      app.narrator.finish();
    });
    await waitFor(() => {
      expect(app.listeners.last()).not.toBe(firstTry);
    });
    act(() => {
      app.listeners.last().mark('misread');
    });

    expect(await screen.findByText('Canavar kelime 2 / 3')).toBeInTheDocument();
    expect(saveStuckWords).toHaveBeenCalledTimes(1);
    expect(cardOf(await app.repository.listStuckWords(), 'kıvrılıyordu')).toMatchObject({
      status: 'practicing',
      correctStreak: 0,
    });
  });

  it('lights the syllables in turn while Tıkır reads the word', async () => {
    const app = await openWarmup();
    await listen(app);
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
    const [listenButton] = screen.getAllByRole('button', { name: 'Kelimeyi dinle' });

    act(() => {
      listenButton?.click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    const states = within(screen.getByRole('list', { name: 'Heceler' }))
      .getAllByRole('listitem')
      .map((item) => item.getAttribute('data-state'));
    expect(states).toEqual(['read', 'read', 'read', 'current', 'next']);
  });

  it('opens the help after three seconds and gives the second try at once', async () => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'],
    });
    const app = await openWarmup();
    await listen(app);
    const firstTry = app.listeners.last();

    act(() => {
      firstTry.mark('hesitate');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(app.narrator.words).toEqual(['kıvrılıyordu']);
    act(() => {
      app.narrator.finish();
    });

    await waitFor(() => {
      expect(app.listeners.last()).not.toBe(firstTry);
    });
    expect(app.narrator.words).toEqual(['kıvrılıyordu']);
    expect(cardOf(await app.repository.listStuckWords(), 'kıvrılıyordu')?.correctStreak).toBe(0);
  });

  it('holds the listening while Tıkır reads the word on "Kelimeyi dinle"', async () => {
    const user = userEvent.setup();
    const app = await openWarmup();
    await listen(app);
    const [listenButton] = screen.getAllByRole('button', { name: 'Kelimeyi dinle' });

    if (listenButton !== undefined) {
      await user.click(listenButton);
    }
    act(() => {
      app.listeners.last().mark('correct');
    });
    expect(screen.getByText('Canavar kelime 1 / 3')).toBeInTheDocument();
    act(() => {
      app.narrator.finish();
    });
    await settle();
    act(() => {
      app.listeners.last().mark('correct');
    });

    expect(await screen.findByText('Canavar kelime 2 / 3')).toBeInTheDocument();
  });

  it('skips the rest of the warmup to the listen step, leaving the cards alone', async () => {
    const user = userEvent.setup();
    const app = await openWarmup();
    const before = await app.repository.listStuckWords();

    await user.click(
      screen.getAllByRole('button', { name: 'Dinle adımına geç' })[0] as HTMLElement,
    );

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/dinle');
    });
    expect(await app.repository.listStuckWords()).toEqual(before);
  });

  it('goes to the listen step after the last card', async () => {
    const app = await openWarmup();
    await listen(app);

    for (const [card, tries] of [
      ['2 / 3', 2],
      ['3 / 3', 3],
    ] as const) {
      act(() => {
        app.listeners.last().mark('correct');
      });
      await screen.findByText(`Canavar kelime ${card}`);
      await waitFor(() => {
        expect(app.listeners.started).toHaveLength(tries);
      });
      await settle();
    }
    act(() => {
      app.listeners.last().mark('correct');
    });

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/dinle');
    });
  });

  it('shows the cards without listening when the parent has not consented', async () => {
    const user = userEvent.setup();
    const app = await openWarmup({ consent: false });
    const before = await app.repository.listStuckWords();

    const micButtons = screen.getAllByRole('button', { name: 'Dinleme kapalı' });
    expect(micButtons[0]).toHaveAttribute('aria-disabled', 'true');
    await user.click(micButtons[0] as HTMLElement);
    expect(
      screen.getByText('Dinleme kapalı. Kelimeyi sesli oku, sonra sıradakine geç.'),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Sıradaki kelime' })[0] as HTMLElement);
    await screen.findByText('Canavar kelime 2 / 3');
    await user.click(screen.getAllByRole('button', { name: 'Sıradaki kelime' })[0] as HTMLElement);
    await screen.findByText('Canavar kelime 3 / 3');
    await user.click(
      screen.getAllByRole('button', { name: 'Dinle adımına geç' })[0] as HTMLElement,
    );

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/dinle');
    });
    expect(app.devices.audio.start).not.toHaveBeenCalled();
    expect(await app.repository.listStuckWords()).toEqual(before);
  });

  it('explains a refused, missing or failed microphone and tries again', async () => {
    const user = userEvent.setup();
    const app = await openWarmup();

    act(() => {
      app.devices.audio.setState('denied');
    });
    expect(
      screen.getByText(
        'Seni duyamıyorum, mikrofon izni kapalı. Velinden izni açmasını iste, sonra Yeniden dene’ye dokun.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yeniden dene' }));
    expect(app.devices.audio.start).toHaveBeenCalledTimes(1);

    act(() => {
      app.devices.audio.setState('unavailable');
    });
    expect(
      screen.getByText(
        'Mikrofonu bulamadım. Velinden bir mikrofon bağlamasını iste, sonra Yeniden dene’ye dokun.',
      ),
    ).toBeInTheDocument();
    act(() => {
      app.devices.audio.setState('error');
    });
    expect(screen.getByText('Mikrofon durdu. Yeniden dene’ye dokun.')).toBeInTheDocument();
  });

  it('opens a closed microphone from its button', async () => {
    const user = userEvent.setup();
    const app = await openWarmup();

    const [mic] = screen.getAllByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' });
    await user.click(mic as HTMLElement);

    expect(app.devices.audio.start).toHaveBeenCalledTimes(1);
  });

  it('marks words from the keyboard in the manual mode', async () => {
    const user = userEvent.setup();
    const app = await openWarmup();
    await listen(app);

    await user.keyboard(' ');
    await screen.findByText('Canavar kelime 2 / 3');
    await waitFor(() => {
      expect(app.listeners.started).toHaveLength(2);
    });
    await settle();
    await user.keyboard('e');

    await waitFor(() => {
      expect(app.narrator.words).toContain('ağaçlarının');
    });
  });

  it('resumes a card in its second try without scoring it again', async () => {
    const app = await openWarmup({
      before: async ({ repository }) => {
        const session = await repository.getSession('2026-11-21');
        if (session?.warmup !== undefined) {
          await repository.saveSession({ ...session, warmup: { ...session.warmup, scored: 1 } });
        }
      },
    });
    const saveStuckWords = vi.spyOn(app.repository, 'saveStuckWords');
    await act(async () => {
      app.devices.audio.setState('capturing');
      await Promise.resolve();
    });

    // Tıkır reads the word again before the second try (StrictMode's first reading is cut short).
    await waitFor(() => {
      expect(app.narrator.speaking).toBe(true);
    });
    expect(new Set(app.narrator.words)).toEqual(new Set(['kıvrılıyordu']));
    expect(app.listeners.started).toHaveLength(0);
    act(() => {
      app.narrator.finish();
    });
    await waitFor(() => {
      expect(app.listeners.started).toHaveLength(1);
    });
    await settle();
    act(() => {
      app.listeners.last().mark('correct');
    });

    expect(await screen.findByText('Canavar kelime 2 / 3')).toBeInTheDocument();
    expect(saveStuckWords).not.toHaveBeenCalled();
  });
});
