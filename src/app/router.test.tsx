import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { appRoutes } from './router';

function renderAt(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('appRoutes', () => {
  it('sends an unknown address to the road (G1)', async () => {
    const router = renderAt('/olmayan-sayfa');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('serves the showcase outside the production build', async () => {
    renderAt('/gelistirme/vitrin');

    expect(await screen.findByRole('heading', { level: 1, name: 'Vitrin' })).toBeInTheDocument();
  });
});
