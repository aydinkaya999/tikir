import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';

/** The developer's open gate (`&kapi=acik`): these tests are about V4, not the gate. */
beforeEach(() => {
  sessionStorage.setItem('tikir.gelistirme.kapi', 'acik');
});

afterEach(() => {
  sessionStorage.clear();
});

async function openStyle() {
  const app = await renderApp('/veli/yazi', { mode: 'veli-haftasonu' });
  await screen.findByRole('heading', { level: 1, name: 'Yazı ayarı' });
  return app;
}

function preview(): HTMLElement {
  return screen.getByRole('region', { name: 'Önizleme' });
}

function shownStyle() {
  const scope = preview().querySelector('[data-reading-font]');
  return {
    font: scope?.getAttribute('data-reading-font'),
    size: scope?.getAttribute('data-reading-size'),
    spacing: scope?.getAttribute('data-reading-spacing'),
  };
}

describe('ReadingStylePage (V4)', () => {
  it('shows the reading style as the design draws it', async () => {
    await openStyle();

    expect(screen.getByText('Deniz’in okuma metinleri bu ayarla görünür.')).toBeInTheDocument();
    expect(within(preview()).getByText('Kayıp Fenerin İzinde')).toBeInTheDocument();
    // The first two sentences of the chapter Deniz read last (chapter 4).
    const words =
      preview().querySelector('[data-reading-font]')?.querySelectorAll('[data-word-index]') ?? [];
    expect(words).toHaveLength(11);
    expect(words[0]).toHaveTextContent('Deniz');
    expect(words[10]).toHaveTextContent('dinledi.');
    expect(shownStyle()).toEqual({ font: 'clear', size: '1', spacing: '0' });

    expect(screen.getByRole('button', { name: /Net harfler/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Okul harfleri/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    const sizes = screen.getByRole('radiogroup', { name: 'Harf boyutu' });
    expect(
      within(sizes)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['0', '1', '2', '3']);
    expect(within(sizes).getByRole('radio', { name: 'Orta' })).toBeChecked();
    const spacings = screen.getByRole('radiogroup', { name: 'Harf aralığı' });
    expect(within(spacings).getAllByRole('radio')).toHaveLength(3);
    expect(within(spacings).getByRole('radio', { name: 'Normal' })).toBeChecked();

    expect(screen.getByRole('heading', { level: 2, name: 'Hangi ayar daha iyi?' })).toBeVisible();
    expect(
      screen.getByText(
        'Haftalık ölçümde iki ayar arka arkaya denenir. Dört ölçümden sonra Deniz’in daha iyi okuduğu ayar önerilir.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Ölçümlerde iki ayarı dene' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('shows and keeps the school letters at once', async () => {
    const user = userEvent.setup();
    const app = await openStyle();

    await user.click(screen.getByRole('button', { name: /Okul harfleri/ }));

    expect(shownStyle().font).toBe('school');
    expect(screen.getByRole('button', { name: /Okul harfleri/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(async () => {
      expect((await app.repository.getChild())?.readingStyle.font).toBe('school');
    });
  });

  it('shows and keeps the size and the spacing at once', async () => {
    const user = userEvent.setup();
    const app = await openStyle();

    await user.click(screen.getByRole('radio', { name: 'En büyük' }));
    await user.click(screen.getByRole('radio', { name: 'Daha açık' }));

    expect(shownStyle()).toEqual({ font: 'clear', size: '3', spacing: '2' });
    await waitFor(async () => {
      expect((await app.repository.getChild())?.readingStyle).toEqual({
        font: 'clear',
        sizeStep: 3,
        spacingStep: 2,
        trialEnabled: true,
      });
    });
  });

  it('compares the two styles while the trial is on, and hides the rows when it is off', async () => {
    const user = userEvent.setup();
    const app = await openStyle();

    const rows = screen.getByRole('list', { name: 'Denenen ayarlar ve sonuçları' });
    const [current, tried] = within(rows).getAllByRole('listitem');
    expect(current).toHaveTextContent('Net harfler, normal aralık');
    expect(current).toHaveTextContent('Şu anki ayar');
    expect(current).toHaveTextContent('69');
    expect(tried).toHaveTextContent('Net harfler, açık aralık');
    expect(tried).toHaveTextContent('Denenen ayar');
    expect(tried).toHaveTextContent('72');
    expect(
      screen.getByText(
        'Doğru kelime / dk, 2 ölçümün ortalaması. Fark henüz küçük; karar için 2 ölçüm daha gerekiyor.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Ölçümlerde iki ayarı dene' }));

    expect(screen.queryByRole('list', { name: 'Denenen ayarlar ve sonuçları' })).toBeNull();
    expect(screen.queryByText(/ölçümün ortalaması/)).toBeNull();
    await waitFor(async () => {
      expect((await app.repository.getChild())?.readingStyle.trialEnabled).toBe(false);
    });
  });
});
