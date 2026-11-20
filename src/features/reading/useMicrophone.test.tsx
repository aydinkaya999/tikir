import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FakeAudioCapture } from '../../test/fakeCapture';
import { useMicrophone } from './useMicrophone';

describe('useMicrophone', () => {
  it('never opens the microphone without the parent consent', () => {
    const audio = new FakeAudioCapture();
    const { result } = renderHook(() => useMicrophone(audio, false));

    act(() => {
      result.current.start();
    });

    expect(result.current.state).toBe('noConsent');
    expect(audio.start).not.toHaveBeenCalled();
  });

  it('opens the microphone with the consent and follows its state', async () => {
    const audio = new FakeAudioCapture();
    const { result } = renderHook(() => useMicrophone(audio, true));
    expect(result.current.state).toBe('idle');

    await act(async () => {
      result.current.start();
      await Promise.resolve();
    });

    expect(audio.start).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe('capturing');
    act(() => {
      audio.setState('error');
    });
    expect(result.current.state).toBe('error');
  });

  it('closes the microphone when the consent is withdrawn and when the screen goes', async () => {
    const audio = new FakeAudioCapture();
    const { result, rerender, unmount } = renderHook(
      ({ consent }) => useMicrophone(audio, consent),
      { initialProps: { consent: true } },
    );
    await act(async () => {
      result.current.start();
      await Promise.resolve();
    });

    rerender({ consent: false });
    expect(audio.stop).toHaveBeenCalled();
    expect(audio.state).toBe('idle');

    audio.stop.mockClear();
    unmount();
    expect(audio.stop).toHaveBeenCalledTimes(1);
  });
});
