import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionStore } from '../features/session/sessionStore';
import { RepositoryUnavailableError } from '../services/repository/Repository';
import { testDevices } from '../test/sessionDevices';
import { type DemoSessionOptions, demoSessionStore } from '../test/sessionStore';
import { appRoutes } from './router';

async function renderAt(path: string, options?: DemoSessionOptions) {
  const { store } = await demoSessionStore(options);
  const router = createMemoryRouter(appRoutes({ store, devices: testDevices() }), {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

function renderWithStore(path: string, repository: () => Promise<never>) {
  const store = createSessionStore({
    repository,
    recorder: { remove: vi.fn(() => Promise.resolve()) },
    today: () => '2026-11-21',
    now: () => new Date(),
    createId: () => 'kimlik',
  });
  const router = createMemoryRouter(appRoutes({ store, devices: testDevices() }), {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
}

describe('appRoutes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends an unknown address to the road (G1)', async () => {
    const router = await renderAt('/olmayan-sayfa');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('opens the setup on an empty store', async () => {
    const router = await renderAt('/', { setup: 'hesap' });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/kurulum/hesap');
    });
  });

  it.each(['/seans/oku', '/veli', '/kitaplik'])(
    'sends %s to the setup step still ahead',
    async (path) => {
      const router = await renderAt(path, { setup: 'seviye' });

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/kurulum/seviye');
      });
    },
  );

  it('sends the setup addresses to the road once the setup is done', async () => {
    const router = await renderAt('/kurulum/hesap');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('keeps the setup in order: a later step goes back to the current one', async () => {
    const router = await renderAt('/kurulum/tanisma', { setup: 'okuyucu' });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/kurulum/okuyucu');
    });
  });

  it('opens the developer pages on an empty store', async () => {
    await renderAt('/gelistirme/vitrin', { setup: 'hesap' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Vitrin' })).toBeInTheDocument();
  });

  it('decides nothing while the store loads', async () => {
    renderWithStore('/kurulum/hesap', () => new Promise<never>(() => undefined));

    expect(await screen.findByText('Hazırlanıyor…')).toBeInTheDocument();
  });

  it('serves the showcase outside the production build', async () => {
    await renderAt('/gelistirme/vitrin');

    expect(await screen.findByRole('heading', { level: 1, name: 'Vitrin' })).toBeInTheDocument();
  });

  it('sends a session address to the road when there is no session today', async () => {
    const router = await renderAt('/seans/oku');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('opens every session address at the done screen once the session is done', async () => {
    const router = await renderAt('/seans/oku', { step: 'done' });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/seans/bitti');
    });
  });

  it('sends a passed step to the current one', async () => {
    const router = await renderAt('/seans/isinma', { step: 'read-1' });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/seans/oku');
    });
    // The step's title is drawn again once Tıkır's voice is ready: wait for the one that stays.
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Oku' })).toBeInTheDocument();
    });
  });

  it('shows Tıkır thinking while the session loads', async () => {
    renderWithStore('/seans/oku', () => new Promise<never>(() => undefined));

    expect(await screen.findByText('Hazırlanıyor…')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tıkır' })).toBeInTheDocument();
  });

  it('says what to do when the data cannot be opened', async () => {
    renderWithStore('/seans/oku', () =>
      Promise.reject(new RepositoryUnavailableError('IndexedDB is missing.')),
    );

    expect(
      await screen.findByText('Bilgilerin açılamadı. Sayfayı yenileyip yeniden dene.'),
    ).toBeInTheDocument();
  });
});
