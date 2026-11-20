import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';
import { heldPlaybackRecorder } from '../../test/sessionDevices';
import { testToday } from '../../test/sessionStore';

async function openStudio(options: RenderAppOptions = {}) {
  const app = await renderApp('/studyo', options);
  await screen.findByRole('heading', { level: 1, name: 'Stüdyo' });
  return app;
}

describe('StudioPage', () => {
  it('lists the recorded chapters and plays one', async () => {
    const user = userEvent.setup();
    const recorder = heldPlaybackRecorder();
    const app = await openStudio({ step: 'record', devices: { recorder } });
    const id = (await app.repository.getSession(testToday))?.readings[2]?.recordingId;

    expect(screen.getByText('Dar Patika, 3. okuma')).toBeInTheDocument();
    expect(await screen.findByText('0:52')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Kaydı dinle' }));
    expect(recorder.play).toHaveBeenCalledWith(id);
    await user.click(screen.getByRole('button', { name: 'Duraklat' }));

    expect(recorder.stopPlayback).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Kaydı dinle' })).toBeInTheDocument();
  });

  it('says what the studio will hold and leads back to the road', async () => {
    const user = userEvent.setup();
    const app = await openStudio();

    expect(screen.getByText('Kaydettiğin bölümler burada sesli kitabın olur.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yola dön' }));

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/');
    });
  });
});
