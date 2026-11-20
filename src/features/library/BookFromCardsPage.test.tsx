import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MockBookGenerator } from '../../services/books/MockBookGenerator';
import { renderApp } from '../../test/renderApp';

/** The design's choice (design/ekranlar/U3-kartlarla-kitap-*.html). */
const designChoice = ['Deniz ve Tıkır', 'Uzay istasyonu', 'Gizemli ses'];

function pressed(group: string): string[] {
  return within(screen.getByRole('group', { name: group }))
    .getAllByRole('button')
    .filter((card) => card.getAttribute('aria-pressed') === 'true')
    .map((card) => card.textContent);
}

describe('BookFromCardsPage (U3)', () => {
  it('shows three groups of three cards, the first hero named for the child', async () => {
    await renderApp('/kitaplik/kur');

    expect(await screen.findByRole('heading', { level: 1, name: 'Kitabını kur' })).toBeVisible();
    const names = (group: string) =>
      within(screen.getByRole('group', { name: group }))
        .getAllByRole('button')
        .map((card) => card.textContent);
    expect(names('Kahraman')).toEqual(['Deniz ve Tıkır', 'Kâşif kedi', 'Robot Bip']);
    expect(names('Mekân')).toEqual(['Orman', 'Deniz altı', 'Uzay istasyonu']);
    expect(names('Olay')).toEqual(['Kayıp harita', 'Gizemli ses', 'Büyük yarış']);
    expect(pressed('Kahraman')).toEqual([]);
    // Before three picks Tıkır asks for them, as the subtitle does from 700 px.
    expect(screen.getAllByText('Her sıradan bir kart seç.')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Kitabımı yap' })).toBeDisabled();
  });

  it('takes one card of each group and sums the choice up in Tıkır’s words', async () => {
    const user = userEvent.setup();
    await renderApp('/kitaplik/kur');

    await user.click(await screen.findByRole('button', { name: 'Deniz ve Tıkır' }));
    await user.click(screen.getByRole('button', { name: 'Kâşif kedi' }));
    await user.click(screen.getByRole('button', { name: 'Orman' }));
    expect(pressed('Kahraman')).toEqual(['Kâşif kedi']);
    expect(screen.getByRole('button', { name: 'Kitabımı yap' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Büyük yarış' }));
    expect(screen.getByText('Kâşif kedi, ormanda büyük bir yarışa katılıyor.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kitabımı yap' })).toBeEnabled();

    for (const card of designChoice) {
      await user.click(screen.getByRole('button', { name: card }));
    }
    expect(
      screen.getByText('Deniz ve Tıkır, uzay istasyonunda gizemli bir sesin peşine düşüyor.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Her sıradan bir kart seç.')).toHaveLength(1);
  });

  it('makes the book once, saves it and opens it ready', async () => {
    const user = userEvent.setup();
    const books = new MockBookGenerator({ delayMs: 0 });
    const making = vi.spyOn(books, 'fromCards');
    const { router, store } = await renderApp('/kitaplik/kur', { devices: { books } });
    for (const card of designChoice) {
      await user.click(await screen.findByRole('button', { name: card }));
    }

    const make = screen.getByRole('button', { name: 'Kitabımı yap' });
    fireEvent.click(make);
    fireEvent.click(make);

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/kitaplik\/[^/]+\/hazir$/);
    });
    const [book] = store.getState().data?.books ?? [];
    expect(book).toMatchObject({
      title: 'Uzay İstasyonunda Gizemli Ses',
      source: 'cards',
      grade: 3,
    });
    expect(router.state.location.pathname).toBe(`/kitaplik/${book?.id ?? ''}/hazir`);
    expect(store.getState().data?.books).toHaveLength(3);
    expect(making).toHaveBeenCalledTimes(1);
    expect(making.mock.calls[0]?.[0]).toEqual({
      choice: { hero: 'cocuk-ve-tikir', place: 'uzay-istasyonu', event: 'gizemli-ses' },
      childName: 'Deniz',
      grade: 3,
    });
  });

  it('waits with Tıkır, and gives up when asked: nothing is saved, the cards come back', async () => {
    const user = userEvent.setup();
    const { router, store } = await renderApp('/kitaplik/kur', {
      devices: { books: new MockBookGenerator({ delayMs: 60_000 }) },
    });
    for (const card of designChoice) {
      await user.click(await screen.findByRole('button', { name: card }));
    }

    await user.click(screen.getByRole('button', { name: 'Kitabımı yap' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Kitabın yazılıyor');
    expect(screen.queryByRole('group', { name: 'Kahraman' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Vazgeç' }));

    expect(await screen.findByRole('group', { name: 'Kahraman' })).toBeInTheDocument();
    expect(pressed('Mekân')).toEqual(['Uzay istasyonu']);
    expect(router.state.location.pathname).toBe('/kitaplik/kur');
    expect(store.getState().data?.books).toHaveLength(2);
  });

  it('saves nothing when the page is left while the book is made', async () => {
    const user = userEvent.setup();
    const books = new MockBookGenerator({ delayMs: 60_000 });
    const making = vi.spyOn(books, 'fromCards');
    const { router, store } = await renderApp('/kitaplik/kur', { devices: { books } });
    for (const card of designChoice) {
      await user.click(await screen.findByRole('button', { name: card }));
    }
    await user.click(screen.getByRole('button', { name: 'Kitabımı yap' }));
    await screen.findByRole('status');

    await user.click(screen.getByRole('link', { name: 'Geri dön' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/kitaplik');
    });
    await expect(making.mock.results[0]?.value).rejects.toMatchObject({ name: 'AbortError' });
    expect(store.getState().data?.books).toHaveLength(2);
  });
});
