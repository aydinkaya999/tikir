import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ControlledNarrator } from '../../test/controlledNarrator';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';
import { schoolLargest, schoolLargestShown, shownStyle } from '../../test/readingStyle';
import { testToday } from '../../test/sessionStore';

const designPages = { ghostWpm: 40, layout: 'design' as const };

async function openListen(options: RenderAppOptions = {}) {
  const app = await renderApp('/seans/dinle', { step: 'listen', ...options });
  await screen.findByText('Tıkır okuyor');
  return app;
}

/** The narrator ends each page by hand; the design layout has two pages. */
async function openWithControlledNarrator(options: RenderAppOptions = {}) {
  const narrator = new ControlledNarrator();
  const app = await openListen({
    ...options,
    devices: { narrator, scenario: designPages, ...options.devices },
  });
  await waitFor(() => {
    expect(narrator.speaking).toBe(true);
  });
  return { ...app, narrator };
}

async function finishNarration(narrator: ControlledNarrator) {
  for (let page = 0; page < 2; page += 1) {
    await waitFor(() => {
      expect(narrator.speaking).toBe(true);
    });
    act(() => {
      narrator.finish();
    });
  }
}

function startButtons() {
  return screen.getAllByRole('button', { name: 'Sıra sende' });
}

describe('ListenPage (G3)', () => {
  it('shows the text in the child’s reading style', async () => {
    await openListen({ readingStyle: schoolLargest });

    expect(shownStyle(document.querySelector('[data-unit-index]'))).toEqual(schoolLargestShown);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the design's page unit by unit with the time", async () => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });
    await openListen({ devices: { scenario: designPages } });

    expect(screen.getByText('Kayıp Fenerin İzinde, 4. bölüm')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(18_000);
    });

    // Unit 6, "yukarıya kıvrılıyordu.", runs from 16.5 to 20.0 s at the slow pace.
    const current = document.querySelector('[data-current]');
    expect(current?.getAttribute('data-unit-index')).toBe('6');
    expect(screen.getByText('0:18 / 0:47')).toBeInTheDocument();
  });

  it('lets the child read only after Tıkır has read every page once', async () => {
    const user = userEvent.setup();
    const app = await openWithControlledNarrator();
    for (const button of startButtons()) {
      expect(button).toBeDisabled();
    }

    await finishNarration(app.narrator);
    await waitFor(() => {
      expect(startButtons()[0]).toBeEnabled();
    });
    await user.click(startButtons()[0] as HTMLElement);

    expect(app.devices.audio.start).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/oku');
    });
  });

  it('pauses and resumes the narration', async () => {
    const user = userEvent.setup();
    const app = await openWithControlledNarrator();

    await user.click(
      screen.getAllByRole('button', { name: 'Seslendirmeyi duraklat' })[0] as HTMLElement,
    );
    expect(app.narrator.pause).toHaveBeenCalled();
    await user.click(
      screen.getAllByRole('button', { name: 'Seslendirmeyi sürdür' })[0] as HTMLElement,
    );

    expect(app.narrator.resume).toHaveBeenCalled();
    expect(
      screen.getAllByRole('button', { name: 'Seslendirmeyi duraklat' }).length,
    ).toBeGreaterThan(0);
  });

  it('starts over from the first page and keeps the way to the reading open', async () => {
    const user = userEvent.setup();
    const app = await openWithControlledNarrator();
    await finishNarration(app.narrator);
    await waitFor(() => {
      expect(startButtons()[0]).toBeEnabled();
    });

    await user.click(screen.getAllByRole('button', { name: 'Baştan dinle' })[0] as HTMLElement);

    await waitFor(() => {
      expect(app.narrator.speaking).toBe(true);
    });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(startButtons()[0]).toBeEnabled();
  });

  it("keeps the child's narration pace", async () => {
    const user = userEvent.setup();
    const app = await openWithControlledNarrator();

    await user.click(screen.getByRole('button', { name: 'Normal' }));

    expect(app.narrator.rate).toBe('normal');
    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(async () => {
      expect((await app.repository.getChild())?.narrationRate).toBe('normal');
    });
  });

  it('holds the narration while the exit dialog is open', async () => {
    const user = userEvent.setup();
    const app = await openWithControlledNarrator();

    await user.click(screen.getAllByRole('button', { name: 'Seanstan çık' })[0] as HTMLElement);
    expect(app.narrator.pause).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Seansa dön' }));

    expect(app.narrator.resume).toHaveBeenCalled();
  });

  it('goes on to the reading without opening the microphone when there is no consent', async () => {
    const user = userEvent.setup();
    const app = await openWithControlledNarrator({ consent: false });
    await finishNarration(app.narrator);
    await waitFor(() => {
      expect(startButtons()[0]).toBeEnabled();
    });

    await user.click(startButtons()[0] as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/oku');
    });
    expect(app.devices.audio.start).not.toHaveBeenCalled();
  });

  it('goes on to the reading without opening the microphone once the day went unheard (P14)', async () => {
    const user = userEvent.setup();
    const app = await openWithControlledNarrator({
      before: async ({ repository }) => {
        const session = await repository.getSession(testToday);
        if (session !== null) {
          await repository.saveSession({ ...session, unheard: true });
        }
      },
    });
    await finishNarration(app.narrator);
    await waitFor(() => {
      expect(startButtons()[0]).toBeEnabled();
    });

    await user.click(startButtons()[0] as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/oku');
    });
    expect(app.devices.audio.start).not.toHaveBeenCalled();
  });

  it('names the page by the library book the day is read from (karar 32)', async () => {
    await renderApp('/seans/dinle', { step: 'listen', book: 'uzay-istasyonunda-gizemli-ses' });

    expect(await screen.findByText('Uzay İstasyonunda Gizemli Ses')).toBeInTheDocument();
    expect(screen.queryByText(/Kayıp Fenerin İzinde/)).toBeNull();
  });
});
