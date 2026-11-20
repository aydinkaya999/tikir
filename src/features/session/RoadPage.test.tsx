import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';
import { testSession } from '../../test/sessions';

describe('RoadPage (G1)', () => {
  it("greets the child with today's chapter and the road", async () => {
    await renderApp('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Merhaba Deniz' })).toBeVisible();
    expect(screen.getByText('2 gün üst üste')).toBeInTheDocument();
    expect(screen.getByText('Bugünkü bölüm')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Dar Patika' })).toBeInTheDocument();
    expect(screen.getByText('4. bölüm, 12 dakika')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Başla' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Kayıp Fenerin İzinde' }),
    ).toBeInTheDocument();
    expect(screen.getByText('12 bölümün 3’ü tamam')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem', { hidden: false }).length).toBeGreaterThanOrEqual(12);
    expect(
      screen.getByText('Bugün 4. bölümü okuyoruz: Dar Patika. Hazırsan başlayalım.'),
    ).toBeInTheDocument();
  });

  it('starts the session, opens the microphone in the tap and goes to the warmup', async () => {
    const user = userEvent.setup();
    const { router, repository, devices } = await renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Başla' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/seans/isinma');
    });
    expect(devices.audio.start).toHaveBeenCalledTimes(1);
    expect((await repository.getSession('2026-11-21'))?.step).toBe('warmup');
  });

  it('never opens the microphone without the consent', async () => {
    const user = userEvent.setup();
    const { router, devices } = await renderApp('/', { consent: false });

    await user.click(await screen.findByRole('button', { name: 'Başla' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/seans/isinma');
    });
    expect(devices.audio.start).not.toHaveBeenCalled();
  });

  it('resumes a session in progress at its step', async () => {
    const user = userEvent.setup();
    const { router, devices } = await renderApp('/', { step: 'read-1' });

    await user.click(await screen.findByRole('button', { name: 'Sürdür' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/seans/oku');
    });
    expect(devices.audio.start).toHaveBeenCalledTimes(1);
  });

  it("shows a finished day with tomorrow's chapter instead of the start", async () => {
    await renderApp('/', { step: 'done' });

    expect(await screen.findByRole('heading', { level: 2, name: 'Bugünlük bitti' })).toBeVisible();
    expect(screen.getByText('Yarın: Yıldız Tepesi')).toBeInTheDocument();
    expect(screen.getByText('5. bölüm yarın açılır')).toBeInTheDocument();
    expect(screen.getByText('Bugünlük bu kadar. Yarın görüşürüz, Deniz.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull();
  });

  it('points to the library when every written chapter is read', async () => {
    const { repository, store } = await renderApp('/');
    await repository.saveSession(testSession('2026-11-10', 4));
    await repository.saveSession(testSession('2026-11-11', 5));
    await store.getState().load();

    expect(await screen.findByText('Yeni bölümler yolda.')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: 'Kitaplık' })
        .some((link) => link.getAttribute('href') === '/kitaplik'),
    ).toBe(true);
    expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull();
  });
});
