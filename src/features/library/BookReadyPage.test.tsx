import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { BookRequest } from '../../domain/types';
import { MockBookGenerator } from '../../services/books/MockBookGenerator';
import { renderApp, type RenderAppOptions } from '../../test/renderApp';
import { testToday } from '../../test/sessionStore';

const sample = '/kitaplik/uzay-istasyonunda-gizemli-ses/hazir';

/** One sentence of 17 words and 50 syllables: over grade 2's 2.4 syllables and 6 words. */
const hardText =
  'Kocaman dinozorlar ormanda yavaş yavaş yürüyerek yiyecek arıyorlardı ve çok uzun boylu ağaçların en tepesindeki yaprakları yiyorlardı.';
const hardRequest: Extract<BookRequest, { kind: 'text' }> = {
  kind: 'text',
  text: hardText,
  grade: 2,
  length: 'medium',
  insertStuckWords: true,
  addQuestions: true,
};

/** A parent's hard text, made and saved before the app opens. */
const withHardBook: RenderAppOptions['before'] = async ({ repository }) => {
  const book = await new MockBookGenerator({ delayMs: 0, createId: () => 'zor-metin' }).fromText(
    hardRequest,
  );
  await repository.saveBook({ ...book, createdAt: '2026-11-21T08:00:00.000Z' });
};

function lines(region: string): string[] {
  return within(screen.getByRole('region', { name: region }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

describe('BookReadyPage (U4)', () => {
  it('shows the sample book as on the design, with its real numbers', async () => {
    await renderApp(sample);

    expect(await screen.findByRole('heading', { level: 1, name: 'Kitabın hazır' })).toBeVisible();
    expect(screen.getByText('Denetimden geçti, okunmaya hazır.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Uzay İstasyonunda Gizemli Ses' }),
    ).toBeInTheDocument();
    expect(screen.getByText('6 sayfa, 176 kelime, yaklaşık 3 dakika')).toBeInTheDocument();
    expect(screen.getByText('2 soru')).toBeInTheDocument();
    // The mock makes no pictures and no voice (karar 23).
    expect(screen.queryByText('Resimli')).toBeNull();
    expect(screen.queryByText('Seslendirildi')).toBeNull();
    expect(lines('Seviye denetimi')).toEqual([
      '3. sınıf düzeyine uygun',
      'Kelime başına ortalama 2,5 hece',
      'Cümle başına ortalama 5,9 kelime',
    ]);
    const inserted = screen.getByRole('region', { name: 'İçine eklenen kelimeler' });
    expect(
      within(inserted)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['kıvrılıyordu', 'belirdiğinde', 'ağaçlarının']);
    expect(
      within(inserted).getByText(
        'Deniz’in bu hafta takıldığı kelimeler hikâyede üçer kez geçiyor.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Kitabın hazır. Önce ben okuyayım, sonra sıra sende.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Okumaya başla' })).toBeEnabled();
    // A book of the content was not made from a request: nothing to make again.
    expect(screen.queryByRole('button', { name: 'Yeniden üret' })).toBeNull();
    expect(screen.queryByText('Kelime yerleştirme ve sorular arka uçla gelecek.')).toBeNull();
    expect(screen.getByRole('link', { name: 'Geri dön' })).toHaveAttribute('href', '/kitaplik');
  });

  it('warns about a text over the grade’s limits, and still lets it be read (P20)', async () => {
    await renderApp('/kitaplik/zor-metin/hazir', { before: withHardBook });

    expect(await screen.findByText('Seviye denetiminden geçmedi.')).toBeInTheDocument();
    expect(screen.queryByText('Denetimden geçti, okunmaya hazır.')).toBeNull();
    expect(lines('Seviye denetimi')).toEqual([
      '2. sınıf düzeyinin üstünde',
      'Kelime başına ortalama 2,9 hece (en çok 2,4)',
      'Cümle başına ortalama 17 kelime (en çok 6)',
    ]);
    expect(screen.getByText('1 sayfa, 17 kelime, yaklaşık 1 dakika')).toBeInTheDocument();
    expect(screen.queryByText(/soru$/)).toBeNull();
    expect(screen.queryByRole('region', { name: 'İçine eklenen kelimeler' })).toBeNull();
    // The parent asked for stuck words and questions; the backend will bring them (karar 26).
    expect(
      screen.getByText('Kelime yerleştirme ve sorular arka uçla gelecek.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Okumaya başla' })).toBeEnabled();
  });

  it('starts the day with the book, opens the microphone in the tap and goes to the warmup', async () => {
    const user = userEvent.setup();
    const { router, repository, devices } = await renderApp(sample);

    await user.click(await screen.findByRole('button', { name: 'Okumaya başla' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/seans/isinma');
    });
    expect((await repository.getSession(testToday))?.chapterRef).toEqual({
      bookId: 'uzay-istasyonunda-gizemli-ses',
      chapter: 1,
    });
    expect(devices.audio.start).toHaveBeenCalledTimes(1);
  });

  it('keeps the book for tomorrow once today’s session has started', async () => {
    await renderApp(sample, { step: 'read-1' });

    expect(await screen.findByRole('button', { name: 'Okumaya başla' })).toBeDisabled();
    expect(screen.getByText('Yarın okuyabilirsin.')).toBeInTheDocument();
  });

  it('makes a book from a request again under its own id, and stays on it', async () => {
    const user = userEvent.setup();
    const books = new MockBookGenerator({ delayMs: 0 });
    const making = vi.spyOn(books, 'fromText');
    const { router, store } = await renderApp('/kitaplik/zor-metin/hazir', {
      before: withHardBook,
      devices: { books },
    });

    const [remake] = await screen.findAllByRole('button', { name: 'Yeniden üret' });
    if (remake === undefined) {
      throw new Error('No "Yeniden üret".');
    }
    await user.click(remake);

    await waitFor(() => {
      expect(making).toHaveBeenCalledTimes(1);
    });
    expect(making.mock.calls[0]?.[0]).toEqual(hardRequest);
    expect(await screen.findByRole('heading', { level: 1, name: 'Kitabın hazır' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/kitaplik/zor-metin/hazir');
    const library = store.getState().data?.books ?? [];
    expect(library.filter((book) => book.id === 'zor-metin')).toHaveLength(1);
    expect(library).toHaveLength(3);
  });

  it('keeps a book the child has read as it was: no "Yeniden üret"', async () => {
    await renderApp('/kitaplik/zor-metin/hazir', {
      before: async (session) => {
        await withHardBook(session);
        await session.store.getState().load();
        await session.store.getState().startWithBook('zor-metin');
      },
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Kitabın hazır' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Yeniden üret' })).toBeNull();
  });

  it('opens the library for a book it does not know', async () => {
    const { router } = await renderApp('/kitaplik/yok/hazir');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/kitaplik');
    });
  });
});
