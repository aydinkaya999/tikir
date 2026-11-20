import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { companionImages } from '../../components/illustrations';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';
import { testToday } from '../../test/sessionStore';

async function openDone(options: RenderAppOptions = {}) {
  const app = await renderApp('/seans/bitti', { step: 'done', ...options });
  await screen.findByRole('heading', { level: 1, name: 'Bugünlük bitti' });
  return app;
}

/** Every session before today read its third reading at the given pace. */
function previousPace(wcpm: number): RenderAppOptions['before'] {
  return async ({ repository }) => {
    for (const session of await repository.listSessions('0000-01-01', '2026-11-20')) {
      await repository.saveSession({
        ...session,
        readings: session.readings.map((reading) =>
          reading.attempt === 3 ? { ...reading, wcpm } : reading,
        ),
      });
    }
  };
}

describe('DonePage (G7)', () => {
  it('sums up the day', async () => {
    await openDone();

    expect(screen.getByText('12 dakika')).toBeInTheDocument();
    expect(screen.getByText('71')).toBeInTheDocument();
    expect(screen.getByText('doğru kelime')).toBeInTheDocument();
    expect(screen.getByText('bir dakikada')).toBeInTheDocument();
    expect(screen.getByText('Dünkü senden 4 fazla')).toBeInTheDocument();
    const tamed = screen.getByRole('list', { name: 'Evcilleşen kelimeler' });
    expect(within(tamed).getByText('ağaçlarının')).toBeInTheDocument();
    expect(within(tamed).getByText('evcilleşti')).toBeInTheDocument();
    expect(screen.getByText('Yarın: Yıldız Tepesi')).toBeInTheDocument();
    expect(screen.getByText('5. bölüm yarın açılır')).toBeInTheDocument();
    expect(screen.getByText('Seansın özeti veline gitti.')).toBeInTheDocument();
    expect(screen.getByText('Bugünlük bu kadar. Yarın görüşürüz, Deniz.')).toBeInTheDocument();
    expect(
      [...document.querySelectorAll('img')].some(
        (image) => image.getAttribute('src') === companionImages.sleep,
      ),
    ).toBe(true);
  });

  it.each([71, 80])(
    'shows the gain over the previous session only when it is positive (previously %i)',
    async (wcpm) => {
      await openDone({ before: previousPace(wcpm) });

      expect(screen.getByText('71')).toBeInTheDocument();
      expect(screen.queryByText(/fazla/)).toBeNull();
      // No difference anywhere: today's pace is the only bare number.
      expect(screen.getAllByText(/^[-−+]?\d+$/).map((element) => element.textContent)).toEqual([
        '71',
      ]);
    },
  );

  it('shows no pace and no tamed words after an unheard session', async () => {
    await openDone({ consent: false });

    expect(screen.queryByText('doğru kelime')).toBeNull();
    expect(screen.queryByText(/fazla/)).toBeNull();
    expect(screen.queryByRole('list', { name: 'Evcilleşen kelimeler' })).toBeNull();
    expect(screen.getByText('Seansın özeti veline gitti.')).toBeInTheDocument();
    expect(screen.getByText('Yarın: Yıldız Tepesi')).toBeInTheDocument();
  });

  it('says new chapters are on the way after the last written one', async () => {
    await openDone({
      before: async ({ repository }) => {
        const session = await repository.getSession(testToday);
        if (!session) {
          throw new Error('No session today.');
        }
        await repository.saveSession({
          ...session,
          chapterRef: { ...session.chapterRef, chapter: 5 },
        });
      },
    });

    expect(screen.getByText('Yeni bölümler yolda.')).toBeInTheDocument();
    expect(screen.queryByText(/^Yarın:/)).toBeNull();
  });

  it('closes to the road', async () => {
    const user = userEvent.setup();
    const app = await openDone();

    await user.click(screen.getByRole('button', { name: 'Kapat' }));

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/');
    });
  });

  it("closes to the road from the shell's exit too, without asking", async () => {
    const user = userEvent.setup();
    const app = await openDone();

    await user.click(screen.getAllByRole('link', { name: 'Seanstan çık' })[0] as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/');
    });
    expect(document.querySelector('dialog[open]')).toBeNull();
  });
});
