import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ReadingOutcome, WordStatus } from '../../domain/types';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';

const greeting = 'Merhaba Deniz! Sen okurken ben dinlerim, takılırsan yardım ederim.';

async function openMeet(options: RenderAppOptions = {}) {
  const app = await renderApp('/kurulum/tanisma', { setup: 'tanisma', ...options });
  await screen.findByRole('heading', { level: 1, name: 'Tıkır ile tanış' });
  return app;
}

type App = Awaited<ReturnType<typeof renderApp>>;

/** Reaches K4 from K3 through the store's own level check actions. */
async function meetAfter(levelCheck: (app: App) => Promise<void>) {
  const app = await renderApp('/kurulum/seviye', { setup: 'seviye' });
  await screen.findByRole('heading', { level: 1, name: '1 dakikalık okuma' });
  await act(async () => {
    await levelCheck(app);
  });
  await screen.findByRole('heading', { level: 1, name: 'Tıkır ile tanış' });
  return app;
}

/** A minute that read `read` words, the first `wrong` of them wrongly. */
function minute(read: number, wrong: number): ReadingOutcome {
  return {
    seconds: 60,
    words: Array.from({ length: read }, (_, index) => {
      const status: WordStatus = index < wrong ? 'misread' : 'correct';
      return { index, status, tStart: index * 900, tEnd: index * 900 + 800 };
    }),
  };
}

const measured = (outcome: ReadingOutcome) => (app: App) =>
  app.store.getState().saveBaseline(outcome, {
    startedAt: '2026-11-21T09:00:00.000Z',
    recordingId: null,
  });

describe('MeetPage (K4)', () => {
  it('shows the first measurement and the first goal as the design draws them', async () => {
    await openMeet();

    expect(screen.getByText('Deniz’in başlangıç noktası belli oldu.')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
    expect(screen.getByText('doğru kelime')).toBeInTheDocument();
    expect(screen.getByText('bir dakikada')).toBeInTheDocument();
    expect(screen.getByText('Doğruluk %91')).toBeInTheDocument();
    expect(screen.getByText('Öğretim düzeyi')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'İlk hedef: 6 haftada 70' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Bugün 58')).toBeInTheDocument();
    expect(screen.getByText('6. hafta 70')).toBeInTheDocument();
    for (const item of [
      'Her gün 12 dakikalık bir bölüm',
      'Takıldığı kelimeler ertesi günün ısınmasına gelir',
      'Haftada bir 1 dakikalık ölçüm, sonucu size',
    ]) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    // The panel's bubble, and on phones the same words beside Tıkır in the content.
    expect(screen.getAllByText(greeting)).toHaveLength(2);
    expect(screen.getByText('4 / 4')).toBeInTheDocument();
  });

  it('names the independent level as docs/urun.md does', async () => {
    await meetAfter(measured(minute(60, 0)));

    expect(screen.getByText('Doğruluk %100')).toBeInTheDocument();
    expect(screen.getByText('Serbest düzey')).toBeInTheDocument();
    expect(screen.queryByText('Öğretim düzeyi')).toBeNull();
  });

  it('shows the child no level name at the frustration level', async () => {
    await meetAfter(measured(minute(50, 10)));

    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('Doğruluk %80')).toBeInTheDocument();
    expect(screen.queryByText('Öğretim düzeyi')).toBeNull();
    expect(screen.queryByText('Serbest düzey')).toBeNull();
  });

  it('meets Tıkır without numbers and without “ben dinlerim” when the parent gave no consent', async () => {
    await openMeet({ consent: false });

    expect(
      screen.getAllByText('Merhaba Deniz! Her gün birlikte bir bölüm okuyacağız.').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(greeting)).toBeNull();
    expect(screen.getByText('Her gün 12 dakikalık bir bölüm')).toBeInTheDocument();
    expect(screen.queryByText('Deniz’in başlangıç noktası belli oldu.')).toBeNull();
    expect(screen.queryByText('doğru kelime')).toBeNull();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.queryByText('Takıldığı kelimeler ertesi günün ısınmasına gelir')).toBeNull();
    expect(screen.queryByText('Haftada bir 1 dakikalık ölçüm, sonucu size')).toBeNull();
  });

  it('keeps the design’s greeting without numbers after a skipped level check', async () => {
    await meetAfter((app) => app.store.getState().skipBaseline());

    expect(screen.getAllByText(greeting).length).toBeGreaterThan(0);
    expect(screen.queryByText('doğru kelime')).toBeNull();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.getByText('Her gün 12 dakikalık bir bölüm')).toBeInTheDocument();
    expect(screen.queryByText('Takıldığı kelimeler ertesi günün ısınmasına gelir')).toBeNull();
  });

  it('finishes the setup and opens the road', async () => {
    const user = userEvent.setup();
    const app = await openMeet();

    await user.click(screen.getByRole('button', { name: 'İlk bölüme başla' }));

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/');
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Merhaba Deniz' })).toBeVisible();
    expect((await app.repository.getParent())?.setup).toBeUndefined();
  });
});
