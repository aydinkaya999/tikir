import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockBookGenerator } from '../../services/books/MockBookGenerator';
import { renderApp } from '../../test/renderApp';

/** The developer's open gate (`&kapi=acik`): these tests are about the page. */
beforeEach(() => {
  sessionStorage.setItem('tikir.gelistirme.kapi', 'acik');
});

afterEach(() => {
  sessionStorage.clear();
});

/** The text on U2's design. */
const designText =
  'Dinozorlar milyonlarca yıl önce yaşadı. Bazıları bir otobüsten uzundu, bazıları ise bir tavuk kadar küçüktü. Bilim insanları, kemiklerini inceleyerek onların nasıl yaşadığını anlamaya çalışıyor.';

function choices(group: string): [string, boolean][] {
  return within(screen.getByRole('radiogroup', { name: group }))
    .getAllByRole('radio')
    .map((radio) => [
      radio.closest('label')?.textContent ?? '',
      (radio as HTMLInputElement).checked,
    ]);
}

describe('BookFromTextPage (U2)', () => {
  it('lays the form out as on the design, the child’s grade chosen', async () => {
    await renderApp('/veli/kitap');

    expect(await screen.findByRole('heading', { level: 1, name: 'Metinden kitap' })).toBeVisible();
    expect(
      screen.getByText('Metni verin, Deniz’in seviyesinde bir kitaba dönüşsün.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Metninizden Deniz’e göre bir kitap.')).toBeInTheDocument();
    // Only the text source in the first version (docs/ekranlar.md, U2).
    expect(choices('Kaynak')).toEqual([['Metin yapıştır', true]]);
    expect(screen.getByRole('textbox', { name: 'Metin' })).toHaveValue('');
    expect(screen.getByText('0 kelime')).toBeInTheDocument();
    expect(choices('Sınıf düzeyi')).toEqual([
      ['2', false],
      ['3', true],
      ['4', false],
    ]);
    expect(choices('Uzunluk')).toEqual([
      ['Kısa', false],
      ['Orta', true],
      ['Uzun', false],
    ]);
    expect(
      screen.getByRole('checkbox', { name: 'Takıldığı kelimeleri metne yerleştir' }),
    ).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Sonuna 2 anlama sorusu ekle' })).toBeChecked();
    const howTo = screen.getByRole('region', { name: 'Kitap böyle hazırlanır' });
    expect(
      within(howTo)
        .getAllByRole('listitem')
        .map((step) => step.textContent),
    ).toEqual([
      '1Deniz’in seviyesine indirilir',
      '2Sayfalara ve anlam ünitelerine bölünür',
      '3Resimlenir ve seslendirilir',
      '4Seviye denetiminden geçer',
    ]);
    expect(screen.getByRole('button', { name: 'Kitabı üret' })).toBeDisabled();
  });

  it('counts the words as the parent writes, and makes nothing of an empty text', async () => {
    const user = userEvent.setup();
    await renderApp('/veli/kitap');
    const text = await screen.findByRole('textbox', { name: 'Metin' });

    await user.type(text, 'Kediler 3 kez uyur.');
    expect(screen.getByText('4 kelime')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kitabı üret' })).toBeEnabled();

    await user.clear(text);
    await user.type(text, '   ');
    expect(screen.getByText('0 kelime')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kitabı üret' })).toBeDisabled();

    await user.clear(text);
    await user.click(text);
    await user.paste(designText);
    expect(screen.getByText('24 kelime')).toBeInTheDocument();
  });

  it('offers grade 1 and chooses it for a first grader', async () => {
    await renderApp('/veli/kitap', {
      before: async ({ repository }) => {
        const child = await repository.getChild();
        if (child !== null) {
          await repository.saveChild({ ...child, grade: 1 });
        }
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Metinden kitap' });
    expect(choices('Sınıf düzeyi')).toEqual([
      ['1', true],
      ['2', false],
      ['3', false],
      ['4', false],
    ]);
  });

  it('makes the book from the text, keeps what was asked and opens it ready', async () => {
    const user = userEvent.setup();
    const books = new MockBookGenerator({ delayMs: 0 });
    const making = vi.spyOn(books, 'fromText');
    const { router, store } = await renderApp('/veli/kitap', { devices: { books } });
    await user.click(await screen.findByRole('textbox', { name: 'Metin' }));
    await user.paste(designText);
    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Sınıf düzeyi' })).getByRole('radio', {
        name: '4',
      }),
    );
    await user.click(screen.getByRole('radio', { name: 'Kısa' }));
    await user.click(screen.getByRole('checkbox', { name: 'Sonuna 2 anlama sorusu ekle' }));

    await user.click(screen.getByRole('button', { name: 'Kitabı üret' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/kitaplik\/[^/]+\/hazir$/);
    });
    const request = {
      kind: 'text',
      text: designText,
      grade: 4,
      length: 'short',
      insertStuckWords: true,
      addQuestions: false,
    };
    expect(making).toHaveBeenCalledTimes(1);
    expect(making.mock.calls[0]?.[0]).toEqual(request);
    const [book] = store.getState().data?.books ?? [];
    expect(book).toMatchObject({
      title: 'Dinozorlar milyonlarca yıl önce yaşadı',
      source: 'parentText',
      grade: 4,
      request,
    });
    expect(router.state.location.pathname).toBe(`/kitaplik/${book?.id ?? ''}/hazir`);
  });

  it('waits with Tıkır, and gives up when asked with the text kept', async () => {
    const user = userEvent.setup();
    const { router, store } = await renderApp('/veli/kitap', {
      devices: { books: new MockBookGenerator({ delayMs: 60_000 }) },
    });
    await user.click(await screen.findByRole('textbox', { name: 'Metin' }));
    await user.paste(designText);

    await user.click(screen.getByRole('button', { name: 'Kitabı üret' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Kitabın yazılıyor');
    await user.click(screen.getByRole('button', { name: 'Vazgeç' }));

    expect(await screen.findByRole('textbox', { name: 'Metin' })).toHaveValue(designText);
    expect(router.state.location.pathname).toBe('/veli/kitap');
    expect(store.getState().data?.books).toHaveLength(2);
  });
});
