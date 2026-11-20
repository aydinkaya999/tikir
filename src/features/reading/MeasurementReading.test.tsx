import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import measurementTexts from '../../../seed/olcum-metinleri.json';
import type { Passage, ReadingStyle } from '../../domain/types';
import { FakeListener } from '../../services/listener/FakeListener';
import { SilentNarrator } from '../../services/narrator/SilentNarrator';
import { testDevices } from '../../test/sessionDevices';
import { demoSessionStore } from '../../test/sessionStore';
import { SessionContext } from '../session/sessionContext';
import { MeasurementReading } from './MeasurementReading';

const seeded = measurementTexts.passages.find((each) => each.id === 'olcum-3a');
const passage: Passage = {
  id: 'olcum-3a',
  grade: 3,
  title: seeded?.title ?? '',
  sentences: seeded?.sentences ?? [],
};
const style: ReadingStyle = { font: 'clear', sizeStep: 1, spacingStep: 0, trialEnabled: false };

/** The reading with a listening microphone; the listener's start tells when the reading began. */
async function readingWith(startOnTap: boolean) {
  const listener = new FakeListener({ kind: 'manual' });
  const start = vi.spyOn(listener, 'start');
  const devices = testDevices({ listener: () => ({ listener }) });
  devices.audio.setState('capturing');
  const { store } = await demoSessionStore();
  render(
    <StrictMode>
      <SessionContext.Provider value={{ store, devices }}>
        <MeasurementReading
          passage={passage}
          style={style}
          consent
          narrator={new SilentNarrator()}
          bubble="Metni sesli oku."
          startOnTap={startOnTap}
          onFinish={vi.fn()}
          render={({ card, controls, bubble }) => (
            <>
              <p>{bubble}</p>
              {card}
              {controls}
            </>
          )}
        />
      </SessionContext.Provider>
    </StrictMode>,
  );
  return { start };
}

describe('MeasurementReading', () => {
  it('starts as soon as the microphone listens (K3)', async () => {
    const { start } = await readingWith(false);

    await waitFor(() => {
      expect(start).toHaveBeenCalledTimes(1);
    });
  });

  it('waits for a tap on the listening microphone when asked (a trial week’s second reading)', async () => {
    const { start } = await readingWith(true);
    const user = userEvent.setup();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(start).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }),
    ).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }));

    await waitFor(() => {
      expect(start).toHaveBeenCalledTimes(1);
    });
  });
});
