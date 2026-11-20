import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';

async function openAccount() {
  const app = await renderApp('/kurulum/hesap', { setup: 'hesap' });
  await screen.findByRole('heading', { level: 1, name: 'Veli hesabı' });
  return app;
}

const password = 'gizli-parola-1';

async function fillIn(consent: boolean) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('E-posta'), 'veli@ornek.com');
  await user.type(screen.getByLabelText('Parola'), password);
  if (consent) {
    await user.click(
      screen.getByRole('checkbox', {
        name: 'Çocuğumun ses kaydının okuma geri bildirimi için işlenmesine izin veriyorum.',
      }),
    );
  }
  await user.click(screen.getByRole('button', { name: 'Hesabı oluştur' }));
}

describe('AccountPage (K1)', () => {
  it('asks for the parent’s account as the design draws it, both boxes unticked', async () => {
    await openAccount();

    expect(
      screen.getByText('Önce siz kaydolun. Çocuğunuzun profilini bir sonraki adımda kurarız.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('E-posta')).toHaveAttribute('placeholder', 'ad@ornek.com');
    expect(screen.getByLabelText('Parola')).toHaveAttribute('placeholder', 'En az 8 karakter');
    expect(
      screen.getByText(
        'Kayıtlar yalnızca okumayı değerlendirmek için kullanılır. İstediğiniz zaman dinleyebilir ya da silebilirsiniz.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ses verisi nasıl kullanılır?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: 'Çocuğumun ses kaydının okuma geri bildirimi için işlenmesine izin veriyorum.',
      }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Haftalık özet e-postası almak istiyorum.' }),
    ).not.toBeChecked();
    expect(screen.getByText('Merhaba! Çocuğunuz okurken ben dinlerim.')).toBeInTheDocument();
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('explains a wrong e-mail and a short password, focuses the first and writes nothing', async () => {
    const user = userEvent.setup();
    const app = await openAccount();

    await user.type(screen.getByLabelText('E-posta'), 'veli@ornek');
    await user.type(screen.getByLabelText('Parola'), 'kisa123');
    await user.click(screen.getByRole('button', { name: 'Hesabı oluştur' }));

    expect(screen.getByText('Geçerli bir e-posta adresi yazın.')).toBeInTheDocument();
    expect(screen.getByText('Parola en az 8 karakter olmalı.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-posta')).toHaveFocus();
    expect(await app.repository.getParent()).toBeNull();
  });

  it('says what happens without the consent only while the box is unticked', async () => {
    const user = userEvent.setup();
    await openAccount();
    const note = 'Onay vermezseniz Tıkır dinlemez: okumalar ölçülmez, seviye tespiti atlanır.';
    expect(screen.getByText(note)).toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Çocuğumun ses kaydının okuma geri bildirimi için işlenmesine izin veriyorum.',
      }),
    );

    expect(screen.queryByText(note)).toBeNull();
  });

  it('opens and closes the voice data note', async () => {
    const user = userEvent.setup();
    await openAccount();

    await user.click(screen.getByRole('button', { name: 'Ses verisi nasıl kullanılır?' }));
    const dialog = screen.getByRole('dialog', { name: 'Ses verisi nasıl kullanılır?' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveTextContent('Kayıtlar bu cihazda kalır, başka bir yere gönderilmez.');
    await user.click(screen.getByRole('button', { name: 'Kapat' }));

    expect(dialog).not.toHaveAttribute('open');
  });

  it('creates the account with the consent, goes on to the reader and keeps no password', async () => {
    const app = await openAccount();

    await fillIn(true);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/kurulum/okuyucu');
    });
    const parent = await app.repository.getParent();
    expect(parent).toMatchObject({
      email: 'veli@ornek.com',
      consent: { voiceProcessing: true, weeklyEmail: false },
      setup: 'reader',
    });
    expect(JSON.stringify(parent)).not.toContain(password);
  });

  it('creates the account without the consent', async () => {
    const app = await openAccount();

    await fillIn(false);

    await waitFor(async () => {
      expect((await app.repository.getParent())?.consent).toEqual({
        voiceProcessing: false,
        weeklyEmail: false,
      });
    });
  });
});
