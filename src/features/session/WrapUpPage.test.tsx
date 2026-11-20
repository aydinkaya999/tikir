import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { companionImages } from '../../components/illustrations';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';
import { prepareSessionStep } from '../dev/params/prepareSessionStep';
import { schoolLargest, schoolLargestShown, shownStyle } from '../../test/readingStyle';
import { testToday } from '../../test/sessionStore';

async function openWrapUp(options: RenderAppOptions = {}) {
  const app = await renderApp('/seans/kapanis', { step: 'wrapUp', ...options });
  await screen.findByRole('heading', { level: 1, name: 'Kapanış' });
  return app;
}

type WrapUpApp = Awaited<ReturnType<typeof openWrapUp>>;

function optionOrder() {
  return screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent);
}

async function answer(option: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('radio', { name: option }));
  await user.click(screen.getByRole('button', { name: 'Cevabı gönder' }));
}

async function sessionOf(app: WrapUpApp) {
  return app.repository.getSession(testToday);
}

describe('WrapUpPage (G6)', () => {
  it('asks the first question with its options in a shuffled order', async () => {
    await openWrapUp();

    expect(screen.getByText('2 soru')).toBeInTheDocument();
    expect(screen.getByText('Soru 1 / 2')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Deniz, fenerin nerede olduğunu düşünüyor?' }),
    ).toBeInTheDocument();
    // random() = 0 turns [0, 1, 2] into [1, 2, 0].
    expect(optionOrder()).toEqual([
      'Çam ağaçlarının altında',
      'Patikanın başında',
      'Tepenin ardında',
    ]);
    expect(screen.getByText('Emin değilsen metne geri dönebilirsin.')).toBeInTheDocument();
    expect(
      [...document.querySelectorAll('img')].some(
        (image) => image.getAttribute('src') === companionImages.think,
      ),
    ).toBe(true);
    const submit = screen.getByRole('button', { name: 'Cevabı gönder' });
    expect(submit).toBeDisabled();
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Patikanın başında' }));
    expect(submit).toBeEnabled();
  });

  it('goes on to the next question after a right answer', async () => {
    const app = await openWrapUp();

    await answer('Tepenin ardında');

    expect(await screen.findByText('Soru 2 / 2')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Tıkır’ın kuyruğu neden parladı?' }),
    ).toBeInTheDocument();
    expect((await sessionOf(app))?.answers).toEqual([0]);
  });

  it('marks the right option calmly after a wrong answer, then goes on', async () => {
    const user = userEvent.setup();
    const app = await openWrapUp();

    await answer('Çam ağaçlarının altında');

    const right = await screen.findByRole('radio', { name: /Tepenin ardında/ });
    const label = right.closest('label') as HTMLElement;
    expect(within(label).getByText('Doğru cevap')).toBeInTheDocument();
    expect(label.querySelector('svg')).not.toBeNull();
    expect(right).toBeChecked();
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
    expect(screen.getByText('Doğru cevabı işaretledim.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cevabı gönder' })).toBeNull();
    expect(document.body.textContent.toLocaleLowerCase('tr-TR')).not.toContain('yanlış');
    expect(screen.getByText('Soru 1 / 2')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await sessionOf(app))?.answers).toEqual([1]);
    });

    await user.click(screen.getByRole('button', { name: 'Devam et' }));

    expect(await screen.findByText('Soru 2 / 2')).toBeInTheDocument();
    expect(screen.getByText('Emin değilsen metne geri dönebilirsin.')).toBeInTheDocument();
  });

  it('ends the session after the second answer', async () => {
    const app = await openWrapUp();

    await answer('Tepenin ardında');
    await screen.findByText('Soru 2 / 2');
    await answer('Fener yakın olduğu için');

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/bitti');
    });
    const session = await sessionOf(app);
    expect(session?.answers).toEqual([0, 0]);
    expect(session?.step).toBe('done');
  });

  it('ends the session after a wrong last answer once the child goes on', async () => {
    const user = userEvent.setup();
    const app = await openWrapUp();

    await answer('Tepenin ardında');
    await screen.findByText('Soru 2 / 2');
    await answer('Yıldız çıktığı için');
    await user.click(await screen.findByRole('button', { name: 'Devam et' }));

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/bitti');
    });
    expect((await sessionOf(app))?.answers).toEqual([0, 1]);
  });

  it('ends a session whose last answer is already written when the screen opens', async () => {
    const app = await renderApp('/seans/kapanis', {
      step: 'wrapUp',
      before: async ({ repository }) => {
        const session = await repository.getSession(testToday);
        if (!session) {
          throw new Error('No session today.');
        }
        await repository.saveSession({ ...session, answers: [0, 2] });
      },
    });

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/bitti');
    });
    expect((await sessionOf(app))?.step).toBe('done');
  });

  it('opens the whole chapter to read and closes it without changing the session', async () => {
    const user = userEvent.setup();
    const app = await openWrapUp();

    await user.click(screen.getByRole('button', { name: 'Metne geri dön' }));

    const layer = screen.getByRole('dialog', { name: 'Kayıp Fenerin İzinde, 4. bölüm' });
    expect(
      within(layer).getAllByText((_, element) => element?.hasAttribute('data-word-index') ?? false),
    ).toHaveLength(99);
    await user.click(within(layer).getByRole('button', { name: 'Kapat' }));
    expect(layer).not.toHaveAttribute('open');
    expect(screen.getByText('Soru 1 / 2')).toBeInTheDocument();
    const session = await sessionOf(app);
    expect(session?.answers).toEqual([]);
    expect(session?.step).toBe('wrapUp');
  });

  it('shows the chapter’s layer in the child’s reading style', async () => {
    const user = userEvent.setup();
    await openWrapUp({ readingStyle: schoolLargest });

    await user.click(screen.getByRole('button', { name: 'Metne geri dön' }));

    const layer = screen.getByRole('dialog', { name: 'Kayıp Fenerin İzinde, 4. bölüm' });
    expect(shownStyle(layer.querySelector('[data-word-index]'))).toEqual(schoolLargestShown);
  });

  it('shuffles the options by the random source and writes the answer in the content’s order', async () => {
    const app = await openWrapUp({ devices: { random: () => 0.99 } });

    expect(optionOrder()).toEqual([
      'Tepenin ardında',
      'Çam ağaçlarının altında',
      'Patikanın başında',
    ]);
    await answer('Patikanın başında');

    await waitFor(async () => {
      expect((await sessionOf(app))?.answers).toEqual([2]);
    });
  });

  it('asks a library book’s questions under the book’s name (karar 32)', async () => {
    const user = userEvent.setup();
    await renderApp('/seans/kapanis', { step: 'wrapUp', book: 'uzay-istasyonunda-gizemli-ses' });
    expect(await screen.findByText('Soru 1 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Metne geri dön' }));

    expect(
      screen.getByRole('dialog', { name: 'Uzay İstasyonunda Gizemli Ses' }),
    ).toBeInTheDocument();
  });

  it('goes on to G7 from a library book without questions (karar 34)', async () => {
    const app = await renderApp('/seans/kapanis', {
      // The sample text again, without its questions, read up to the wrap-up.
      before: async ({ repository, services, recordings }) => {
        const sample = await repository.getBook('dinozorlar-neden-buyuktu');
        if (sample === null) {
          throw new Error('No sample book.');
        }
        await repository.saveBook({
          ...sample,
          id: 'sorusuz',
          chapters: sample.chapters.map((chapter) => ({ ...chapter, questions: [] })),
        });
        await prepareSessionStep(services, 'wrapUp', 'typical', recordings, 'sorusuz');
      },
    });

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/bitti');
    });
    expect((await sessionOf(app))?.chapterRef.bookId).toBe('sorusuz');
  });
});
