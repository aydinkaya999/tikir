import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';

async function openAlbum(options: RenderAppOptions = {}) {
  const app = await renderApp('/album', options);
  await screen.findByRole('heading', { level: 1, name: 'Albüm' });
  return app;
}

describe('AlbumPage', () => {
  it('shows the tamed words in the alphabet’s order, each with its tamed monster', async () => {
    await openAlbum({ mode: 'veli-haftasonu' });

    const list = screen.getByRole('list', { name: 'Evcilleşen kelimeler' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'ağaçlarınınevcilleşti',
      'kıvrılıyorduevcilleşti',
    ]);
  });

  it('says where the tamed words will gather and leads back to the road', async () => {
    const user = userEvent.setup();
    const app = await openAlbum();

    expect(screen.getByText('Evcilleşen kelimelerin burada toplanır.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yola dön' }));

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/');
    });
  });
});
