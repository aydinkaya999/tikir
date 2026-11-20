import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';

async function openReader(options: RenderAppOptions = {}) {
  const app = await renderApp('/kurulum/okuyucu', { setup: 'okuyucu', ...options });
  await screen.findByRole('heading', { level: 1, name: 'Okuyucuyu tanıyalım' });
  return app;
}

async function fillIn(name: string, grade: string, interests: readonly string[] = []) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Okuyucunun adı'), name);
  await user.click(screen.getByRole('radio', { name: grade }));
  for (const interest of interests) {
    await user.click(screen.getByRole('button', { name: interest }));
  }
  await user.click(screen.getByRole('button', { name: 'Devam et' }));
}

describe('ReaderPage (K2)', () => {
  it('asks for the reader as the design draws it', async () => {
    await openReader();

    expect(
      screen.getByText('Metinleri seviyesine ve ilgisine göre seçmek için.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Okuyucunun adı')).toHaveAttribute('placeholder', 'Deniz');
    const grades = screen.getByRole('radiogroup', { name: 'Sınıfı' });
    expect(grades).toBeInTheDocument();
    for (const grade of ['1. sınıf', '2. sınıf', '3. sınıf', '4. sınıf']) {
      expect(screen.getByRole('radio', { name: grade })).not.toBeChecked();
    }
    expect(screen.getByRole('group', { name: 'Nelerden hoşlanır?' })).toBeInTheDocument();
    for (const interest of [
      'Uzay',
      'Hayvanlar',
      'Futbol',
      'Deniz',
      'Dinozorlar',
      'Robotlar',
      'Doğa',
      'Bilmece',
    ]) {
      expect(screen.getByRole('button', { name: interest })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }
    expect(screen.getByText('0 / 3 seçildi')).toBeInTheDocument();
    expect(
      screen.getByText('Sevdiği konuları seçin, hikâyeleri ona göre kurarım.'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('takes three interests at most', async () => {
    const user = userEvent.setup();
    await openReader();

    for (const interest of ['Uzay', 'Futbol', 'Dinozorlar']) {
      await user.click(screen.getByRole('button', { name: interest }));
    }

    expect(screen.getByText('3 / 3 seçildi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Robotlar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('asks for the name and the grade, and writes nothing without them', async () => {
    const user = userEvent.setup();
    const app = await openReader();

    await user.click(screen.getByRole('button', { name: 'Devam et' }));

    expect(screen.getByText('Okuyucunun adını yazın.')).toBeInTheDocument();
    expect(screen.getByText('Sınıfını seçin.')).toBeInTheDocument();
    expect(screen.getByLabelText('Okuyucunun adı')).toHaveFocus();
    expect(await app.repository.getChild()).toBeNull();
  });

  it('takes the focus to the grades when only the grade is missing', async () => {
    const user = userEvent.setup();
    await openReader();

    await user.type(screen.getByLabelText('Okuyucunun adı'), 'Deniz');
    await user.click(screen.getByRole('button', { name: 'Devam et' }));

    expect(screen.queryByText('Okuyucunun adını yazın.')).toBeNull();
    expect(screen.getByText('Sınıfını seçin.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1. sınıf' })).toHaveFocus();
  });

  it('keeps the name to 30 letters and takes a name of spaces as empty', async () => {
    const user = userEvent.setup();
    await openReader();
    const name = screen.getByLabelText('Okuyucunun adı');

    await user.type(name, 'a'.repeat(35));
    expect(name).toHaveValue('a'.repeat(30));

    await user.clear(name);
    await user.type(name, '   ');
    await user.click(screen.getByRole('button', { name: 'Devam et' }));
    expect(screen.getByText('Okuyucunun adını yazın.')).toBeInTheDocument();
  });

  it('opens the microphone in the tap and goes on to the level check with the consent', async () => {
    const app = await openReader();

    await fillIn('  Deniz ', '3. sınıf', ['Uzay', 'Futbol']);

    expect(app.devices.audio.start).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/kurulum/seviye');
    });
    // The level check listens: the address rule leaves the microphone open there (T22).
    expect(app.devices.audio.state).toBe('capturing');
    expect(await app.repository.getChild()).toMatchObject({
      name: 'Deniz',
      grade: 3,
      interests: ['Uzay', 'Futbol'],
      readingStyle: { font: 'clear', sizeStep: 1, spacingStep: 0, trialEnabled: false },
    });
  });

  it('goes on to meeting Tıkır without the consent, the microphone closed', async () => {
    const app = await openReader({ consent: false });

    await fillIn('Deniz', '3. sınıf');

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/kurulum/tanisma');
    });
    expect(app.devices.audio.start).not.toHaveBeenCalled();
  });

  it('gives a first grader the school letters', async () => {
    const app = await openReader();

    await fillIn('Ali', '1. sınıf');

    await waitFor(async () => {
      expect((await app.repository.getChild())?.readingStyle.font).toBe('school');
    });
  });
});
