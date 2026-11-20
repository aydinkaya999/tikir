import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp, type RenderAppOptions } from '../../test/renderApp';
import { testRecorder, testShare } from '../../test/sessionDevices';
import { assessmentView } from './views';

/** The developer's open gate (`&kapi=acik`): these tests are about V3, not the gate. */
beforeEach(() => {
  sessionStorage.setItem('tikir.gelistirme.kapi', 'acik');
});

afterEach(() => {
  sessionStorage.clear();
});

async function openResult(options: RenderAppOptions = {}) {
  const app = await renderApp('/veli/olcum', { mode: 'veli-haftasonu', ...options });
  await screen.findByRole('heading', { level: 1, name: '1 dakikalık ölçüm' });
  return app;
}

describe('AssessmentPage (V3)', () => {
  it('shows the weekend profile’s measurement as the design draws it', async () => {
    const app = await openResult();

    expect(screen.getByText('15 Kasım Pazar')).toBeInTheDocument();
    expect(screen.getByText('71')).toBeInTheDocument();
    expect(screen.getByText('76 kelime okudu')).toBeInTheDocument();
    expect(screen.getByText('5 hata')).toBeInTheDocument();
    expect(screen.getByText('Doğruluk %93')).toBeInTheDocument();
    const band = screen.getByRole('list', { name: 'Okuma düzeyi: öğretim' });
    expect(
      within(band)
        .getAllByRole('listitem')
        .map((level) => [level.textContent, level.getAttribute('aria-current')]),
    ).toEqual([
      ['Endişe%90 altı', null],
      ['Öğretim%90–98', 'true'],
      ['Serbest%99 ve üstü', null],
    ]);
    expect(
      screen.getByText('Öğretim düzeyi: Deniz bu zorluktaki metni biraz yardımla okuyabiliyor.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Sıradaki ölçüm 22 Kasım Pazar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Öğretmenle paylaş' })).toBeEnabled();
    // The demo's measurement has no recording.
    expect(screen.queryByRole('button', { name: 'Kaydı dinle' })).not.toBeInTheDocument();

    const excerpt = screen.getByRole('region', { name: 'Ölçüm metninden' });
    const words = excerpt.querySelectorAll('[data-mark]');
    const data = app.store.getState().data;
    const view = data === null ? null : assessmentView(data);
    expect(view?.kind).toBe('result');
    const marks = view?.kind === 'result' ? view.view.excerpt.map((token) => token.mark ?? '') : [];
    expect(words).toHaveLength(23);
    expect(words[0]).toHaveTextContent('Tepeye');
    expect(words[22]).toHaveTextContent('salladı.');
    expect([...words].map((word) => word.getAttribute('data-mark'))).toEqual(marks);
    expect(within(excerpt).getByText('yanlış okuma')).toBeInTheDocument();
    expect(within(excerpt).getByText('takılma')).toBeInTheDocument();
  });

  it('shares the result as a short text, and says so when it went to the clipboard', async () => {
    const share = testShare();
    share.share.mockResolvedValueOnce('copied').mockRejectedValueOnce(new Error('No gesture'));
    await openResult({ devices: { share } });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Öğretmenle paylaş' }));

    expect(share.share).toHaveBeenCalledWith({
      title: 'Deniz için ölçüm sonucu',
      text: [
        'Deniz, 3. sınıf',
        '1 dakikalık ölçüm, 15 Kasım Pazar',
        '71 doğru kelime bir dakikada',
        '76 kelime okudu, 5 hata, doğruluk %93',
        'Öğretim düzeyi',
      ].join('\n'),
    });
    expect(await screen.findByText('Özet panoya kopyalandı.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Öğretmenle paylaş' }));
    expect(await screen.findByText('Paylaşılamadı. Bir daha deneyin.')).toBeInTheDocument();
    expect(screen.queryByText('Özet panoya kopyalandı.')).not.toBeInTheDocument();
  });

  it('offers no sharing on a device that cannot share', async () => {
    const share = testShare();
    share.canShare.mockReturnValue(false);
    await openResult({ devices: { share } });

    expect(screen.queryByRole('button', { name: 'Öğretmenle paylaş' })).not.toBeInTheDocument();
  });

  it('plays the measurement’s recording', async () => {
    const recorder = testRecorder();
    await openResult({
      devices: { recorder },
      before: async ({ repository }) => {
        const measured = (await repository.listAssessments()).find(
          (assessment) => assessment.date === '2026-11-15' && assessment.trial !== true,
        );
        if (measured !== undefined) {
          await repository.saveAssessment({
            ...measured,
            result: { ...measured.result, recordingId: 'kayit-olcum' },
          });
        }
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Kaydı dinle' }));

    expect(recorder.play).toHaveBeenCalledWith('kayit-olcum');
  });

  it('says the next measurement is today once it is due', async () => {
    await openResult({ today: () => '2026-11-22' });

    expect(screen.getByText('Sıradaki ölçüm bugün')).toBeInTheDocument();
  });

  it('shows the empty page before the first measurement', async () => {
    await renderApp('/veli/olcum', {
      setup: 'tanisma',
      consent: false,
      before: async ({ store }) => {
        await store.getState().load();
        await store.getState().finishSetup();
      },
    });

    expect(
      await screen.findByText('Henüz ölçüm yok. Ölçüm, çocuğun yol ekranında açılır.'),
    ).toBeInTheDocument();
  });
});
