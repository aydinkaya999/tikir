import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { FakeAudioCapture } from '../../test/fakeCapture';
import { testDevices } from '../../test/sessionDevices';
import { SessionRoot } from './SessionRoot';
import { createSessionStore } from './sessionStore';

function renderRoot(path: string) {
  const audio = new FakeAudioCapture();
  const devices = testDevices({ audio });
  const store = createSessionStore({
    repository: () => new Promise(() => undefined),
    recorder: devices.recorder,
    today: () => '2026-11-21',
    now: () => new Date(),
    createId: () => 'kimlik',
  });
  const router = createMemoryRouter(
    [
      {
        element: <SessionRoot store={store} devices={devices} />,
        children: [
          { path: '/', element: <p>yol</p> },
          { path: '/seans/oku', element: <p>oku</p> },
          { path: '/seans/kayit', element: <p>kayit</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  return { audio, router };
}

describe('SessionRoot', () => {
  it('keeps the microphone open on a listening step, StrictMode included', async () => {
    const { audio } = renderRoot('/seans/oku');

    await screen.findByText('oku');

    expect(audio.stop).not.toHaveBeenCalled();
  });

  it('closes the microphone once when the address leaves the listening steps', async () => {
    const { audio, router } = renderRoot('/seans/oku');
    await screen.findByText('oku');

    await act(() => router.navigate('/seans/kayit'));

    await screen.findByText('kayit');
    expect(audio.stop).toHaveBeenCalledTimes(1);
  });

  it('does not close it again while the address stays', async () => {
    const { audio, router } = renderRoot('/seans/kayit');
    await screen.findByText('kayit');
    const calls = audio.stop.mock.calls.length;

    await act(() => router.navigate('/seans/kayit?yeniden=1'));

    expect(audio.stop).toHaveBeenCalledTimes(calls);
  });
});
