import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RecordingEntry } from '../../services/recorder/Recorder';
import { renderApp, type RenderAppOptions } from '../../test/renderApp';
import { testRecorder } from '../../test/sessionDevices';

/** The developer's open gate (`&kapi=acik`): these tests are about the account page. */
beforeEach(() => {
  sessionStorage.setItem('tikir.gelistirme.kapi', 'acik');
});

afterEach(() => {
  sessionStorage.clear();
});

const voiceConsent = 'Çocuğumun ses kaydının okuma geri bildirimi için işlenmesine izin veriyorum.';
const weeklyEmail = 'Haftalık özet e-postası almak istiyorum.';

const entry = (id: string, day: string, seconds: number): RecordingEntry => ({
  id,
  createdAt: `${day}T12:00:00.000Z`,
  seconds,
  levels: [],
});

/** A recorder over the given recordings that the store shares, as in the app. */
function recorderOver(entries: RecordingEntry[]) {
  const recorder = testRecorder();
  let kept = entries;
  recorder.list.mockImplementation(() => Promise.resolve(kept));
  recorder.remove.mockImplementation((id) => {
    kept = kept.filter((each) => each.id !== id);
    return Promise.resolve();
  });
  return recorder;
}

/** Saturday's third reading and Sunday's measurement were recorded. */
const recorded: RenderAppOptions['before'] = async ({ repository }) => {
  const saturday = await repository.getSession('2026-11-14');
  if (saturday !== null) {
    await repository.saveSession({
      ...saturday,
      readings: saturday.readings.map((reading) =>
        reading.attempt === 3 ? { ...reading, recordingId: 'kayit-1' } : reading,
      ),
    });
  }
  const measured = (await repository.listAssessments()).find(
    (assessment) => assessment.date === '2026-11-15' && assessment.trial !== true,
  );
  if (measured !== undefined) {
    await repository.saveAssessment({
      ...measured,
      result: { ...measured.result, recordingId: 'kayit-2' },
    });
  }
};

async function openAccount(options: RenderAppOptions = {}) {
  const app = await renderApp('/veli/hesap', { mode: 'veli-haftasonu', ...options });
  await screen.findByRole('heading', { level: 1, name: 'Hesap' });
  return app;
}

describe('AccountSettingsPage', () => {
  it('shows the consents, the recordings and the way to delete the account', async () => {
    const recorder = recorderOver([
      entry('kayit-2', '2026-11-15', 60),
      entry('kayit-1', '2026-11-14', 52),
    ]);
    await openAccount({ before: recorded, recorder, devices: { recorder } });

    expect(screen.getByRole('heading', { level: 2, name: 'Onaylar' })).toBeVisible();
    expect(screen.getByRole('switch', { name: voiceConsent })).toBeChecked();
    expect(screen.getByRole('switch', { name: weeklyEmail })).toBeChecked();
    const recordings = await screen.findByRole('list', { name: 'Kayıtlar' });
    expect(
      within(recordings)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual([
      expect.stringContaining('1 dakikalık ölçüm, 15 Kasım1:00') as unknown,
      expect.stringContaining('4. bölüm, 14 Kasım0:52') as unknown,
    ]);
    expect(screen.getByRole('heading', { level: 2, name: 'Hesabı sil' })).toBeVisible();
    expect(
      within(screen.getByRole('region', { name: 'Hesabı sil' })).getByText(
        'Hesap, okuyucu, okumalar, ölçümler ve kayıtlar bu cihazdan silinir. Geri alınamaz.',
      ),
    ).toBeInTheDocument();
  });

  it('changes the consents and keeps them', async () => {
    const { repository } = await openAccount();
    const user = userEvent.setup();

    await user.click(screen.getByRole('switch', { name: voiceConsent }));
    await waitFor(async () => {
      expect((await repository.getParent())?.consent.voiceProcessing).toBe(false);
    });
    expect(screen.getByRole('switch', { name: voiceConsent })).not.toBeChecked();

    await user.click(screen.getByRole('switch', { name: weeklyEmail }));
    await waitFor(async () => {
      expect((await repository.getParent())?.consent).toEqual({
        voiceProcessing: false,
        weeklyEmail: false,
      });
    });

    await user.click(screen.getByRole('switch', { name: voiceConsent }));
    await waitFor(async () => {
      expect((await repository.getParent())?.consent.grantedAt).toBe('2026-11-21T09:20:00.000Z');
    });
  });

  it('plays a recording and deletes it after asking', async () => {
    const recorder = recorderOver([entry('kayit-1', '2026-11-14', 52)]);
    const { repository } = await openAccount({
      before: recorded,
      recorder,
      devices: { recorder },
    });
    const user = userEvent.setup();
    const recordings = await screen.findByRole('list', { name: 'Kayıtlar' });

    await user.click(within(recordings).getByRole('button', { name: 'Dinle' }));
    expect(recorder.play).toHaveBeenCalledWith('kayit-1');

    await user.click(within(recordings).getByRole('button', { name: 'Sil' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Kayıt silinsin mi?' })).getByRole(
        'button',
        { name: 'Sil' },
      ),
    );

    expect(await screen.findByText('Henüz kayıt yok.')).toBeInTheDocument();
    expect(recorder.remove).toHaveBeenCalledWith('kayit-1');
    expect(
      (await repository.getSession('2026-11-14'))?.readings.map((reading) => reading.recordingId),
    ).toEqual([undefined, undefined, undefined]);
  });

  it('deletes the account after asking and opens the setup', async () => {
    const { repository } = await openAccount();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Hesabı sil' }));
    const dialog = await screen.findByRole('dialog', { name: 'Hesap silinsin mi?' });
    await user.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));
    expect(await repository.getParent()).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Hesabı sil' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Hesap silinsin mi?' })).getByRole(
        'button',
        { name: 'Hesabı sil' },
      ),
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Veli hesabı' })).toBeVisible();
    expect(await repository.getParent()).toBeNull();
    expect(await repository.listAssessments()).toEqual([]);
  });

  it('is reached from the rail, the sidebar and the phone strip', async () => {
    await renderApp('/veli', { mode: 'veli-haftasonu' });
    await screen.findByRole('heading', { level: 1, name: 'Deniz’in haftası' });

    const links = screen.getAllByRole('link', { name: 'Hesap' });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/veli/hesap');
    }
    expect(
      within(screen.getByRole('navigation', { name: 'Veli gezinmesi' })).getByRole('link', {
        name: 'Hesap',
      }),
    ).toBeInTheDocument();
  });
});
