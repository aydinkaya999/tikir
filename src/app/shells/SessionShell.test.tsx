import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import type { DevStep } from '../../features/dev/params/devParams';
import { testDevices } from '../../test/sessionDevices';
import { demoSessionStore } from '../../test/sessionStore';
import { appRoutes } from '../router';

async function renderAt(path: string, step: DevStep) {
  const { store } = await demoSessionStore({ step });
  const router = createMemoryRouter(appRoutes({ store, devices: testDevices() }), {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('SessionShell', () => {
  it('asks before leaving the session and stays on "Seansa dön"', async () => {
    const user = userEvent.setup();
    const router = await renderAt('/seans/oku', 'read-1');
    await screen.findByRole('heading', { level: 1, name: 'Oku' });

    const [exit] = screen.getAllByRole('button', { name: 'Seanstan çık' });
    if (exit === undefined) {
      throw new Error('no exit button');
    }
    await user.click(exit);
    const dialog = screen.getByRole('dialog', { name: 'Seanstan çıkılsın mı?' });
    expect(within(dialog).getByText('Kaldığın yerden sürdürebilirsin.')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Seansa dön' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(router.state.location.pathname).toBe('/seans/oku');
  });

  it('goes back to the road on "Çık"', async () => {
    const user = userEvent.setup();
    const router = await renderAt('/seans/oku', 'read-1');
    await screen.findByRole('heading', { level: 1, name: 'Oku' });

    const [exit] = screen.getAllByRole('button', { name: 'Seanstan çık' });
    if (exit === undefined) {
      throw new Error('no exit button');
    }
    await user.click(exit);
    await user.click(screen.getByRole('button', { name: 'Çık' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('closes the done screen without asking', async () => {
    await renderAt('/seans/bitti', 'done');
    await screen.findByRole('heading', { level: 1, name: 'Bugünlük bitti' });

    const links = screen.getAllByRole('link', { name: 'Seanstan çık' });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/');
    }
    expect(screen.queryByRole('button', { name: 'Seanstan çık' })).toBeNull();
  });
});
