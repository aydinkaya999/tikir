import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Grade } from '../../domain/types';
import { renderApp, type RenderAppOptions } from '../../test/renderApp';
import { testToday } from '../../test/sessionStore';

/** The developer's open gate (`&kapi=acik`): these tests are about V1, not the gate. */
beforeEach(() => {
  sessionStorage.setItem('tikir.gelistirme.kapi', 'acik');
});

afterEach(() => {
  sessionStorage.clear();
});

/** The number on a stat card, not the chart's own label of the last point. */
function statNumber(text: string): HTMLElement | undefined {
  return screen.getAllByText(text).find((node) => node.closest('svg') === null);
}

async function openSummary(options: RenderAppOptions = {}) {
  const app = await renderApp('/veli', { mode: 'veli-haftasonu', ...options });
  await screen.findByRole('heading', { level: 1, name: 'Deniz’in haftası' });
  return app;
}

function withGrade(grade: Grade): RenderAppOptions['before'] {
  return async ({ repository }) => {
    const child = await repository.getChild();
    if (child !== null) {
      await repository.saveChild({ ...child, grade });
    }
  };
}

describe('SummaryPage (V1)', () => {
  it('shows the weekend profile’s week as the design draws it', async () => {
    await openSummary();

    expect(screen.getByText('9–15 Kasım')).toBeInTheDocument();
    expect(statNumber('71')).toBeDefined();
    expect(screen.getByText('Geçen haftadan 4 fazla')).toBeInTheDocument();
    expect(screen.getByText('%93')).toBeInTheDocument();
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
    expect(screen.getByText('5 / 7')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Doğru kelime, bir dakikada' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('img', {
        name: 'Altı haftada doğru kelime sayısı 58’den 71’e çıktı; hedef 70, 3. sınıf ortalaması 90',
      }),
    ).not.toHaveLength(0);
    expect(screen.getAllByText('3. sınıf ortalaması 90')).not.toHaveLength(0);
    const days = screen.getByRole('list', { name: 'Bu hafta 7 günün 5’inde seans yapıldı' });
    expect(
      within(days)
        .getAllByRole('listitem')
        .map((day) => [day.textContent, day.getAttribute('data-mark')]),
    ).toEqual([
      ['Pt', 'done'],
      ['Sa', 'done'],
      ['Ça', 'none'],
      ['Pe', 'done'],
      ['Cu', 'done'],
      ['Ct', 'done'],
      ['Pz', 'none'],
    ]);
    expect(
      screen.getAllByText('Deniz bu hafta hedef çizgisini geçti. Sıradaki hedef 78.'),
    ).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Hedefi güncelle' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Önceki hafta' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Sonraki hafta' })).toBeDisabled();
  });

  it('goes back a week and returns', async () => {
    await openSummary();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Önceki hafta' }));

    expect(await screen.findByText('2–8 Kasım')).toBeInTheDocument();
    expect(statNumber('67')).toBeDefined();
    expect(screen.getByText('Geçen haftadan 2 fazla')).toBeInTheDocument();
    expect(screen.getAllByText('Deniz hedefe 3 kelime uzakta.')).not.toHaveLength(0);
    expect(screen.getByRole('list', { name: 'Bu hafta seans yapılmadı.' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hedefi güncelle' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sonraki hafta' }));
    expect(await screen.findByText('9–15 Kasım')).toBeInTheDocument();
  });

  it('updates the goal once the parent confirms it', async () => {
    const { repository } = await openSummary();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Hedefi güncelle' }));
    const dialog = await screen.findByRole('dialog', { name: 'Hedefi güncelle' });
    expect(within(dialog).getByText('Yeni hedef: bir dakikada 78 doğru kelime.')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));
    expect((await repository.getChild())?.goals).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'Hedefi güncelle' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Hedefi güncelle' })).getByRole('button', {
        name: 'Güncelle',
      }),
    );

    await vi.waitFor(async () => {
      expect((await repository.getChild())?.goals).toEqual([{ targetWcpm: 78, setOn: testToday }]);
    });
    expect(screen.queryByRole('button', { name: 'Hedefi güncelle' })).not.toBeInTheDocument();
    // The week keeps its comment: the new target holds from next week.
    expect(
      screen.getAllByText('Deniz bu hafta hedef çizgisini geçti. Sıradaki hedef 78.'),
    ).not.toHaveLength(0);
  });

  it('marks the days read without listening (docs/kararlar.md P14)', async () => {
    await openSummary({
      before: async ({ repository }) => {
        const thursday = await repository.getSession('2026-11-12');
        if (thursday !== null) {
          await repository.saveSession({ ...thursday, unheard: true });
        }
      },
    });

    const days = screen.getByRole('list', { name: 'Bu hafta 7 günün 5’inde seans yapıldı' });
    expect(within(days).getByText('Pe').closest('li')).toHaveAttribute('data-mark', 'unheard');
    expect(screen.getAllByText('1 gün dinlemeden okundu.')).not.toHaveLength(0);
  });

  it('draws no grade average for a first grader', async () => {
    await openSummary({ before: withGrade(1) });

    expect(
      screen.getAllByRole('img', {
        name: 'Altı haftada doğru kelime sayısı 58’den 71’e çıktı; hedef 70',
      }),
    ).not.toHaveLength(0);
    expect(screen.queryAllByText(/ortalaması/)).toHaveLength(0);
  });

  it('shows the empty report before the first session and measurement', async () => {
    await renderApp('/veli', {
      setup: 'tanisma',
      consent: false,
      before: async ({ store }) => {
        await store.getState().load();
        await store.getState().finishSetup();
      },
    });

    expect(
      await screen.findByText(
        'Henüz seans ya da ölçüm yok. İlk seanstan sonra özet burada görünür.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Önceki hafta' })).not.toBeInTheDocument();
  });
});
