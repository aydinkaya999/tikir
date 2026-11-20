import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/renderApp';
import { testToday } from '../../test/sessionStore';

describe('LibraryPage (U1)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the series, the child’s books and the ways to make one, as on the design', async () => {
    await renderApp('/kitaplik');

    expect(await screen.findByRole('heading', { level: 1, name: 'Kitaplık' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Yeni kitap' })).toHaveAttribute(
      'href',
      '/kitaplik/kur',
    );
    const series = screen.getByRole('region', { name: 'Kayıp Fenerin İzinde' });
    const progress = within(series).getByRole('progressbar', { name: 'Hikâyedeki ilerleme' });
    expect(progress).toHaveAttribute('aria-valuenow', '3');
    expect(progress).toHaveAttribute('aria-valuemax', '12');
    expect(within(series).getByText('12 bölümün 3’ü tamam')).toBeInTheDocument();
    expect(within(series).getByRole('link', { name: 'Sürdür' })).toHaveAttribute('href', '/');

    const books = screen.getByRole('region', { name: 'Senin kitapların' });
    const [cards, made] = [
      within(books).getAllByRole('button'),
      within(books).getAllByRole('link'),
    ];
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAccessibleName('Uzay İstasyonunda Gizemli Ses');
    expect(cards[0]).toHaveAccessibleDescription('Kartlarla yaptın');
    expect(cards[1]).toHaveAccessibleName('Dinozorlar Neden Büyüktü?');
    expect(cards[1]).toHaveAccessibleDescription('Velin ekledi');
    expect(cards[0]).toBeEnabled();
    expect(made.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Kartlarla kitap yap', '/kitaplik/kur'],
    ]);
    expect(
      screen.getByRole('link', { name: 'Veli bir metinden kitap ekleyebilir' }),
    ).toHaveAttribute('href', '/veli/kitap');
  });

  it('starts the day with a book, opens the microphone in the tap and goes to the warmup', async () => {
    const user = userEvent.setup();
    const { router, repository, devices } = await renderApp('/kitaplik');

    await user.click(await screen.findByRole('button', { name: 'Uzay İstasyonunda Gizemli Ses' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/seans/isinma');
    });
    expect((await repository.getSession(testToday))?.chapterRef).toEqual({
      bookId: 'uzay-istasyonunda-gizemli-ses',
      chapter: 1,
    });
    expect(devices.audio.start).toHaveBeenCalledTimes(1);
  });

  it('never opens the microphone without the consent', async () => {
    const user = userEvent.setup();
    const { router, repository, devices } = await renderApp('/kitaplik', { consent: false });

    await user.click(await screen.findByRole('button', { name: 'Dinozorlar Neden Büyüktü?' }));

    await waitFor(() => {
      expect(router.state.location.pathname).not.toBe('/kitaplik');
    });
    expect((await repository.getSession(testToday))?.chapterRef.bookId).toBe(
      'dinozorlar-neden-buyuktu',
    );
    expect(devices.audio.start).not.toHaveBeenCalled();
  });

  it('keeps the books for tomorrow once today’s session has started', async () => {
    await renderApp('/kitaplik', { step: 'read-1' });

    const card = await screen.findByRole('button', { name: 'Uzay İstasyonunda Gizemli Ses' });
    expect(card).toBeDisabled();
    expect(card).toHaveAccessibleDescription('Kartlarla yaptın Yarın okuyabilirsin.');
    expect(screen.getByRole('button', { name: 'Dinozorlar Neden Büyüktü?' })).toBeDisabled();
  });

  it('lets the book read today resume the session, the others wait for tomorrow', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/kitaplik', { book: 'uzay-istasyonunda-gizemli-ses' });

    const today = await screen.findByRole('button', { name: 'Uzay İstasyonunda Gizemli Ses' });
    expect(today).toBeEnabled();
    expect(today).toHaveAccessibleDescription('Kartlarla yaptın');
    const other = screen.getByRole('button', { name: 'Dinozorlar Neden Büyüktü?' });
    expect(other).toBeDisabled();
    expect(other).toHaveAccessibleDescription('Velin ekledi Yarın okuyabilirsin.');

    await user.click(today);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/seans/isinma');
    });
  });

  it('lets a book start the new day when the library stays open past midnight', async () => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    const clock = { day: '2026-11-21' };
    await renderApp('/kitaplik', { step: 'done', today: () => clock.day });
    expect(
      await screen.findByRole('button', { name: 'Uzay İstasyonunda Gizemli Ses' }),
    ).toBeDisabled();

    clock.day = '2026-11-22';
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Uzay İstasyonunda Gizemli Ses' })).toBeEnabled();
    });
  });

  it('tells a child without a book how to make one', async () => {
    const { store } = await renderApp('/kitaplik');
    await screen.findByRole('heading', { level: 1, name: 'Kitaplık' });

    act(() => {
      const { data } = store.getState();
      if (data !== null) {
        store.setState({ data: { ...data, books: [] } });
      }
    });

    const books = screen.getByRole('region', { name: 'Senin kitapların' });
    expect(within(books).queryAllByRole('button')).toHaveLength(0);
    expect(
      within(books).getByText('Henüz kitabın yok. Kartlarla ilk kitabını yap.'),
    ).toBeInTheDocument();
    // The phone's button and the dashed card of wider screens.
    expect(within(books).getAllByRole('link', { name: 'Kartlarla kitap yap' })).toHaveLength(2);
  });
});
