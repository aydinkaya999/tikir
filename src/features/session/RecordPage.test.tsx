import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { companionImages } from '../../components/illustrations';
import type { ReadingResult } from '../../domain/types';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';
import { heldPlaybackRecorder, type TestRecorder } from '../../test/sessionDevices';
import { testToday } from '../../test/sessionStore';

const levels = Array.from({ length: 64 }, (_, index) => ((index * 7) % 10) / 10 + 0.05);

function playbackRecorder(
  recording: Parameters<typeof heldPlaybackRecorder>[0] = { seconds: 52, levels },
) {
  return heldPlaybackRecorder(recording);
}

async function openRecord(
  options: RenderAppOptions = {},
  recorder: TestRecorder = playbackRecorder(),
) {
  const app = await renderApp('/seans/kayit', {
    step: 'record',
    ...options,
    devices: { recorder, ...options.devices },
  });
  await screen.findByRole('heading', { level: 1, name: 'Kayıt' });
  return { ...app, recorder };
}

type RecordApp = Awaited<ReturnType<typeof openRecord>>;

async function recordingIdOf(app: RecordApp) {
  return (await app.repository.getSession(testToday))?.readings[2]?.recordingId;
}

/** Changes today's third reading before the app starts. */
function changeThirdReading(
  change: (reading: ReadingResult) => ReadingResult,
): RenderAppOptions['before'] {
  return async ({ repository }) => {
    const session = await repository.getSession(testToday);
    if (!session) {
      throw new Error('No session today.');
    }
    await repository.saveSession({
      ...session,
      readings: session.readings.map((reading, index) => (index === 2 ? change(reading) : reading)),
    });
  };
}

function buttons(name: string) {
  return screen.getAllByRole('button', { name });
}

describe('RecordPage (G5)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the recording, the audio book and Tıkır’s comment', async () => {
    await openRecord();

    expect(await screen.findByText('Kayıt bitti')).toBeInTheDocument();
    expect(screen.getByText('0:52')).toBeInTheDocument();
    expect(screen.getByText('Son okuma')).toBeInTheDocument();
    expect(screen.getByText('Dar Patika, 3. okuma')).toBeInTheDocument();
    expect(screen.getByText('Sesli kitabına eklendi')).toBeInTheDocument();
    expect(screen.getByText('12 bölümün 1’i kayıtlı')).toBeInTheDocument();
    const squares = within(
      screen.getByRole('list', { name: 'Kayıtlı bölümler: 12 bölümün 1’i' }),
    ).getAllByRole('listitem');
    expect(squares.map((square) => square.hasAttribute('data-recorded'))).toEqual(
      squares.map((_, index) => index === 3),
    );
    expect(screen.getByText('Ailene dinlet')).toBeInTheDocument();
    expect(screen.getByText('Göndermeden önce velin onaylar')).toBeInTheDocument();
    expect(screen.getByText('Bu, bugünkü en akıcı okuman oldu.')).toBeInTheDocument();
    expect(
      [...document.querySelectorAll('img')].some(
        (image) => image.getAttribute('src') === companionImages.happy,
      ),
    ).toBe(true);
  });

  it('says only that the recording is ready when the third reading was not the most fluent', async () => {
    await openRecord({ before: changeThirdReading((reading) => ({ ...reading, wcpm: 68 })) });

    expect(await screen.findByText('Kaydın hazır.')).toBeInTheDocument();
    expect(screen.queryByText('Bu, bugünkü en akıcı okuman oldu.')).toBeNull();
  });

  it('plays the recording, colours the played bars and stops on a tap', async () => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const app = await openRecord();
    const id = await recordingIdOf(app);

    await user.click(await screen.findByRole('button', { name: 'Kaydı dinle' }));
    expect(app.recorder.play).toHaveBeenCalledWith(id);
    expect(screen.getByRole('button', { name: 'Duraklat' })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(22_500);
    });

    // The design's moment: 11 of the phone's 26 bars and 16 of the 36 (22.4 to 23 s of 52).
    expect(document.querySelectorAll('[data-bars="36"] [data-played]')).toHaveLength(16);
    expect(document.querySelectorAll('[data-bars="26"] [data-played]')).toHaveLength(11);
    await user.click(screen.getByRole('button', { name: 'Duraklat' }));
    expect(app.recorder.stopPlayback).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Kaydı dinle' })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-played]')).toHaveLength(0);
  });

  it('sends the recording for the parent’s approval, also after reopening', async () => {
    const user = userEvent.setup();
    const recorder = playbackRecorder();
    const app = await openRecord({}, recorder);
    const id = await recordingIdOf(app);

    await user.click(await screen.findByRole('button', { name: 'Gönder' }));

    expect(recorder.requestApproval).toHaveBeenCalledWith(id);
    expect(await screen.findByRole('button', { name: 'Veli onayı bekliyor' })).toBeDisabled();
    cleanup();
    await openRecord({}, recorder);
    expect(await screen.findByRole('button', { name: 'Veli onayı bekliyor' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Gönder' })).toBeNull();
  });

  it('records again from the third reading with the microphone open', async () => {
    const user = userEvent.setup();
    const app = await openRecord();
    await screen.findByText('Kayıt bitti');

    await user.click(buttons('Baştan kaydet')[0] as HTMLElement);

    expect(app.devices.audio.start).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/oku');
    });
    expect(await screen.findByText('3. okuma / 3')).toBeInTheDocument();
  });

  it('goes on to the closing questions without the microphone', async () => {
    const user = userEvent.setup();
    const app = await openRecord();
    await screen.findByText('Kayıt bitti');

    await user.click(buttons('Devam et')[0] as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/kapanis');
    });
    expect(app.devices.audio.start).not.toHaveBeenCalled();
  });

  it('stops the playback when the child goes on', async () => {
    const user = userEvent.setup();
    const app = await openRecord();

    await user.click(await screen.findByRole('button', { name: 'Kaydı dinle' }));
    await user.click(buttons('Devam et')[0] as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/kapanis');
    });
    expect(app.recorder.stopPlayback).toHaveBeenCalled();
  });

  it('explains a recording that cannot be found and still goes on', async () => {
    const user = userEvent.setup();
    const app = await openRecord({}, playbackRecorder(null));

    expect(
      await screen.findByText('Kaydın alınamadı. Baştan kaydet’e dokunup bir daha oku.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kaydı dinle' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Gönder' })).toBeNull();
    await user.click(buttons('Devam et')[0] as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/kapanis');
    });
  });

  it('explains a recording that never started and records again', async () => {
    const user = userEvent.setup();
    const app = await openRecord({
      before: changeThirdReading((reading) => {
        const changed = { ...reading };
        delete changed.recordingId;
        return changed;
      }),
    });

    expect(
      await screen.findByText('Kaydın alınamadı. Baştan kaydet’e dokunup bir daha oku.'),
    ).toBeInTheDocument();
    expect(app.recorder.get).not.toHaveBeenCalled();
    await user.click(buttons('Baştan kaydet')[0] as HTMLElement);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/seans/oku');
    });
  });

  it('keeps a library book’s recording out of the series’ audio book (P19)', async () => {
    await openRecord({ book: 'uzay-istasyonunda-gizemli-ses' });

    expect(screen.queryByText('Sesli kitabına eklendi')).toBeNull();
    expect(screen.queryByRole('list', { name: /Kayıtlı bölümler/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Baştan kaydet' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Gönder' })).toBeInTheDocument();
  });
});
