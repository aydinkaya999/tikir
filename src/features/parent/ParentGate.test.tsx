import { act, cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type RenderAppOptions, renderApp } from '../../test/renderApp';

/** Four values a question, so every question is "47 + 38 = ?". */
function fortySevenPlusThirtyEight(): () => number {
  const values = [0.7, 0.75, 0.5, 0.6];
  let next = 0;
  return () => {
    const value = values[next % values.length] ?? 0;
    next += 1;
    return value;
  };
}

async function openGate(path = '/veli', options: RenderAppOptions = {}) {
  const app = await renderApp(path, {
    ...options,
    devices: { random: fortySevenPlusThirtyEight(), ...options.devices },
  });
  await screen.findByRole('heading', { level: 1, name: 'Veli alanı' });
  return app;
}

async function answer(value: string) {
  const user = userEvent.setup(vi.isFakeTimers() ? { advanceTimers: vi.advanceTimersByTime } : {});
  await user.type(screen.getByLabelText('Cevap'), value);
  await user.click(screen.getByRole('button', { name: 'Gir' }));
}

// The gate's wait and the developer's open gate live in the tab: each test starts with a new one.
beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ParentGate', () => {
  it('asks its question before the parent area, which it does not draw', async () => {
    await openGate();

    expect(screen.getByText('Devam etmek için soruyu yanıtlayın.')).toBeInTheDocument();
    expect(screen.getByText('47 + 38 = ?')).toBeInTheDocument();
    expect(screen.getByLabelText('Cevap')).toHaveAttribute('inputmode', 'numeric');
    expect(screen.queryByRole('navigation', { name: 'Veli gezinmesi' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Çocuk ekranı' })).toHaveAttribute('href', '/');
  });

  it('opens on the right answer and stays open while the parent moves inside the area', async () => {
    const user = userEvent.setup();
    const app = await openGate();

    await answer('85');
    const nav = await screen.findByRole('navigation', { name: 'Veli gezinmesi' });
    await user.click(within(nav).getByRole('link', { name: /Takılınan yerler/ }));

    expect(app.router.state.location.pathname).toBe('/veli/takilinan');
    expect(screen.getByRole('navigation', { name: 'Veli gezinmesi' })).toBeInTheDocument();
    expect(screen.queryByText('47 + 38 = ?')).toBeNull();
  });

  it('says a wrong answer is wrong and stays closed', async () => {
    await openGate();

    await answer('84');

    expect(screen.getByText('Olmadı. Bir daha deneyin.')).toBeInTheDocument();
    expect(screen.getByLabelText('Cevap')).toHaveValue('');
    expect(screen.queryByRole('navigation', { name: 'Veli gezinmesi' })).toBeNull();
  });

  it('waits 30 seconds after three wrong answers, across a reload, then asks again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'setInterval', 'Date'] });
    // A value the test changes: 0.7 asks "57 + 37", 0.1 asks "11 + 19".
    let value = 0.7;
    const random = () => value;
    await openGate('/veli', { devices: { random } });
    expect(screen.getByText('57 + 37 = ?')).toBeInTheDocument();

    for (const wrong of ['10', '20', '30']) {
      await answer(wrong);
    }

    expect(screen.getByText('30 saniye sonra yeniden deneyebilirsiniz.')).toBeInTheDocument();
    expect(screen.getByLabelText('Cevap')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Gir' })).toBeDisabled();

    // The page starts again in the same tab: the wait goes on.
    cleanup();
    await openGate('/veli', { devices: { random } });
    expect(screen.getByLabelText('Cevap')).toBeDisabled();

    value = 0.1;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(screen.getByText('11 + 19 = ?')).toBeInTheDocument();
    expect(screen.getByLabelText('Cevap')).toBeEnabled();
    expect(screen.queryByText(/saniye sonra yeniden deneyebilirsiniz/)).toBeNull();
  });

  it('keeps counting wrong answers across leaving the gate and coming back', async () => {
    const user = userEvent.setup();
    await openGate();
    await answer('84');
    await answer('83');

    await user.click(screen.getByRole('link', { name: 'Çocuk ekranı' }));
    await screen.findByRole('heading', { level: 1, name: 'Merhaba Deniz' });
    await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'Veli alanı' }));
    await screen.findByText('47 + 38 = ?');
    await answer('82');

    expect(screen.getByText('30 saniye sonra yeniden deneyebilirsiniz.')).toBeInTheDocument();
    expect(screen.getByLabelText('Cevap')).toBeDisabled();
  });

  it('keeps counting wrong answers across a reload', async () => {
    await openGate();
    await answer('84');
    await answer('83');

    // The page starts again in the same tab.
    cleanup();
    await openGate();
    await answer('82');

    expect(screen.getByText('30 saniye sonra yeniden deneyebilirsiniz.')).toBeInTheDocument();
  });

  it('counts wrong answers anew after the right answer', async () => {
    const user = userEvent.setup();
    await openGate();
    await answer('84');
    await answer('83');
    await answer('85');
    await screen.findByRole('navigation', { name: 'Veli gezinmesi' });

    await user.click(screen.getAllByRole('link', { name: 'Çocuk ekranı' })[0] as HTMLElement);
    await screen.findByRole('heading', { level: 1, name: 'Merhaba Deniz' });
    await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'Veli alanı' }));
    await screen.findByText('47 + 38 = ?');
    await answer('82');

    expect(screen.getByText('Olmadı. Bir daha deneyin.')).toBeInTheDocument();
    expect(screen.getByLabelText('Cevap')).toBeEnabled();
  });

  it('asks again once the parent has gone back to the child screen', async () => {
    const user = userEvent.setup();
    await openGate();
    await answer('85');
    await screen.findByRole('navigation', { name: 'Veli gezinmesi' });

    await user.click(screen.getAllByRole('link', { name: 'Çocuk ekranı' })[0] as HTMLElement);
    await screen.findByRole('heading', { level: 1, name: 'Merhaba Deniz' });
    await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'Veli alanı' }));

    expect(await screen.findByText('47 + 38 = ?')).toBeInTheDocument();
  });

  it('names the child in the parent area’s strip', async () => {
    await openGate();

    await answer('85');

    expect(await screen.findByText('Deniz, 3. sınıf')).toBeInTheDocument();
  });

  it('gives each width a way out of the parent area to the child screen', async () => {
    await openGate();

    await answer('85');

    // The rail and the sidebar's link, and the phone strip's button.
    const nav = await screen.findByRole('navigation', { name: 'Veli gezinmesi' });
    expect(within(nav).getByRole('link', { name: 'Çocuk ekranı' })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('link', { name: 'Çocuk ekranı' })).toHaveLength(2);
  });

  it('stays open in a tab the developer parameter opened it in', async () => {
    sessionStorage.setItem('tikir.gelistirme.kapi', 'acik');

    await renderApp('/veli');

    expect(await screen.findByRole('navigation', { name: 'Veli gezinmesi' })).toBeInTheDocument();
    expect(screen.queryByText(/\+ \d+ = \?/)).toBeNull();
  });
});

describe('the road’s way into the parent area', () => {
  it('has a lock button on the road that opens the gate', async () => {
    const user = userEvent.setup();
    const app = await renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Merhaba Deniz' });

    await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'Veli alanı' }));

    expect(app.router.state.location.pathname).toBe('/veli');
    expect(await screen.findByRole('heading', { level: 1, name: 'Veli alanı' })).toBeVisible();
  });
});
