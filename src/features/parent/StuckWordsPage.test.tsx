import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RecordingEntry } from '../../services/recorder/Recorder';
import { renderApp, type RenderAppOptions } from '../../test/renderApp';
import { heldPlaybackRecorder, testRecorder } from '../../test/sessionDevices';

/** The developer's open gate (`&kapi=acik`): these tests are about V2, not the gate. */
beforeEach(() => {
  sessionStorage.setItem('tikir.gelistirme.kapi', 'acik');
});

afterEach(() => {
  sessionStorage.clear();
});

const sent = (id: string, day: string): RecordingEntry => ({
  id,
  createdAt: `${day}T12:00:00.000Z`,
  seconds: 52,
  levels: [],
  approval: 'pending',
});

/**
 * A recorder over the given recordings that the store shares, as in the app: what it removes
 * leaves the list, what it approves waits no more.
 */
function recorderOver(entries: RecordingEntry[]) {
  const recorder = testRecorder();
  let kept = entries;
  recorder.list.mockImplementation(() => Promise.resolve(kept));
  recorder.remove.mockImplementation((id) => {
    kept = kept.filter((entry) => entry.id !== id);
    return Promise.resolve();
  });
  recorder.approve.mockImplementation((id) => {
    kept = kept.map((entry) => (entry.id === id ? { ...entry, approval: 'approved' } : entry));
    return Promise.resolve();
  });
  return recorder;
}

/** Saturday's third reading and Friday's were recorded, and the child sent both. */
const recordedReadings: RenderAppOptions['before'] = async ({ repository }) => {
  for (const [date, id] of [
    ['2026-11-14', 'kayit-1'],
    ['2026-11-13', 'kayit-2'],
  ] as const) {
    const session = await repository.getSession(date);
    if (session !== null) {
      await repository.saveSession({
        ...session,
        readings: session.readings.map((reading) =>
          reading.attempt === 3 ? { ...reading, recordingId: id } : reading,
        ),
      });
    }
  }
};

async function openStuck(options: RenderAppOptions = {}) {
  const app = await renderApp('/veli/takilinan', { mode: 'veli-haftasonu', ...options });
  await screen.findByRole('heading', { level: 1, name: 'Takılınan yerler' });
  return app;
}

describe('StuckWordsPage (V2)', () => {
  it('shows the weekend profile’s errors, drill and words as the design draws them', async () => {
    await openStuck();

    expect(screen.getByText('Bu hafta 30 hata, 5 türde')).toBeInTheDocument();
    const errors = screen.getByRole('list', { name: 'Hata türleri' });
    expect(
      within(errors)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['Yanlış okuma9', 'Ek hatası7', 'Atlama6', 'Tekrar5', 'Ekleme3']);
    expect(screen.getAllByText('Önerilen çalışma: ek zinciri')).not.toHaveLength(0);
    expect(
      screen.getByText('‑yordu ve ‑diğinde ile biten 6 kelime, 3 gün boyunca ısınmaya gelir.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Isınmaya ekle' })).toBeEnabled();
    const words = screen.getByRole('list', { name: 'En çok takıldığı kelimeler' });
    expect(
      within(words)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual([
      'kıvrılıyordukıv-rı-lı-yor-du, 4 kezEvcilleşti',
      'belirdiğindebe-lir-di-ğin-de, 3 kezÇalışılıyor',
      'ağaçlarınına-ğaç-la-rı-nın, 3 kezEvcilleşti',
      'tırmanmayatır-man-ma-ya, 2 kezÇalışılıyor',
    ]);
    // The demo's old sessions have no recording: nothing to play, nothing to approve.
    expect(screen.queryByRole('button', { name: /okuyuşunu dinle/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Onay bekleyen kayıtlar' }),
    ).not.toBeInTheDocument();
  });

  it('plays a word from the latest recorded reading', async () => {
    const recorder = recorderOver([sent('kayit-1', '2026-11-14')]);
    await openStuck({ before: recordedReadings, recorder, devices: { recorder } });
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole('button', {
        name: 'belirdiğinde kelimesinde Deniz’in okuyuşunu dinle',
      }),
    );

    expect(recorder.play).toHaveBeenCalledWith('kayit-1', {
      fromMs: expect.any(Number) as unknown,
      toMs: expect.any(Number) as unknown,
    });
  });

  it('adds the suggested drill to the warmup and says how many words came', async () => {
    const { repository } = await openStuck();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Isınmaya ekle' }));

    expect(await screen.findByText('4 kelime ısınmaya eklendi.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Isınmaya ekle' })).not.toBeInTheDocument();
    expect(await repository.getDrillSuggestion()).toBeNull();
    expect((await repository.listStuckWords()).map((card) => card.word)).toContain('geldiğinde');
  });

  it('lets the parent listen to, approve and delete the recordings the child sent', async () => {
    const recorder = recorderOver([sent('kayit-1', '2026-11-14'), sent('kayit-2', '2026-11-13')]);
    const { repository } = await openStuck({
      before: recordedReadings,
      recorder,
      devices: { recorder },
    });
    const user = userEvent.setup();
    const pending = () => screen.getByRole('list', { name: 'Onay bekleyen kayıtlar' });
    const row = (label: string) =>
      within(pending())
        .getAllByRole('listitem')
        .find((item) => item.textContent.includes(label)) as HTMLElement;

    await screen.findByRole('heading', { name: 'Onay bekleyen kayıtlar' });
    expect(
      within(pending())
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('4. bölüm, 14 Kasım0:52') as unknown,
      expect.stringContaining('3. bölüm, 13 Kasım0:52') as unknown,
    ]);

    await user.click(within(row('14 Kasım')).getByRole('button', { name: 'Dinle' }));
    expect(recorder.play).toHaveBeenCalledWith('kayit-1');

    await user.click(within(row('14 Kasım')).getByRole('button', { name: 'Onayla' }));
    await waitFor(() => {
      expect(within(pending()).getAllByRole('listitem')).toHaveLength(1);
    });
    expect(recorder.approve).toHaveBeenCalledWith('kayit-1');

    await user.click(within(row('13 Kasım')).getByRole('button', { name: 'Sil' }));
    const dialog = await screen.findByRole('dialog', { name: 'Kayıt silinsin mi?' });
    expect(within(dialog).getByText('Kayıt bu cihazdan silinir, geri alınamaz.')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));
    expect(recorder.remove).not.toHaveBeenCalled();

    await user.click(within(row('13 Kasım')).getByRole('button', { name: 'Sil' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Kayıt silinsin mi?' })).getByRole(
        'button',
        { name: 'Sil' },
      ),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Onay bekleyen kayıtlar' }),
      ).not.toBeInTheDocument();
    });
    expect(recorder.remove).toHaveBeenCalledWith('kayit-2');
    const friday = await repository.getSession('2026-11-13');
    expect(friday?.readings.map((reading) => reading.recordingId)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('stops a recording that plays, and stops it before deleting it', async () => {
    const recorder = heldPlaybackRecorder();
    let kept = [sent('kayit-1', '2026-11-14')];
    recorder.list.mockImplementation(() => Promise.resolve(kept));
    recorder.remove.mockImplementation((id) => {
      kept = kept.filter((entry) => entry.id !== id);
      return Promise.resolve();
    });
    await openStuck({ before: recordedReadings, recorder, devices: { recorder } });
    const user = userEvent.setup();
    const pending = await screen.findByRole('list', { name: 'Onay bekleyen kayıtlar' });

    await user.click(within(pending).getByRole('button', { name: 'Dinle' }));
    await user.click(await within(pending).findByRole('button', { name: 'Duraklat' }));
    expect(recorder.stopPlayback).toHaveBeenCalledTimes(1);
    expect(await within(pending).findByRole('button', { name: 'Dinle' })).toBeVisible();

    await user.click(within(pending).getByRole('button', { name: 'Dinle' }));
    await within(pending).findByRole('button', { name: 'Duraklat' });
    await user.click(within(pending).getByRole('button', { name: 'Sil' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Kayıt silinsin mi?' })).getByRole(
        'button',
        { name: 'Sil' },
      ),
    );

    await waitFor(() => {
      expect(recorder.remove).toHaveBeenCalledWith('kayit-1');
    });
    expect(recorder.stopPlayback).toHaveBeenCalledTimes(2);
  });

  it('says there is nothing yet before the first session', async () => {
    await renderApp('/veli/takilinan', {
      setup: 'tanisma',
      consent: false,
      before: async ({ store }) => {
        await store.getState().load();
        await store.getState().finishSetup();
      },
    });

    expect(await screen.findByText('Bu hafta seans yapılmadı.')).toBeInTheDocument();
    expect(screen.getByText('Henüz takılınan kelime yok.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Hata türleri' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Isınmaya ekle' })).not.toBeInTheDocument();
  });
});
