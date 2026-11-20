import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FakeAudioCapture } from '../../test/fakeCapture';
import { testRecorder } from '../../test/sessionDevices';
import { useReadingRecorder } from './useReadingRecorder';

function recorded(options: { enabled?: boolean; running?: boolean } = {}) {
  const recorder = testRecorder();
  const audio = new FakeAudioCapture();
  const hook = renderHook(
    ({ running }: { running: boolean }) =>
      useReadingRecorder({ enabled: options.enabled ?? true, recorder, audio, running }),
    { initialProps: { running: options.running ?? true } },
  );
  const start = async () => {
    await act(async () => {
      hook.result.current.start();
      await Promise.resolve();
    });
  };
  return { recorder, audio, hook, start };
}

describe('useReadingRecorder', () => {
  it('records an enabled reading once, on the reading’s microphone', async () => {
    const { recorder, audio, hook, start } = recorded();

    await start();
    await start();

    expect(recorder.start).toHaveBeenCalledTimes(1);
    expect(recorder.start).toHaveBeenCalledWith(audio);
    hook.unmount();
  });

  it('records nothing when the reading is not recorded', async () => {
    const { recorder, hook, start } = recorded({ enabled: false });

    await start();

    expect(recorder.start).not.toHaveBeenCalled();
    expect(await hook.result.current.finish()).toBeNull();
  });

  it('holds a recording that starts while the reading is held, then follows the reading', async () => {
    const { recorder, hook, start } = recorded({ running: false });

    await start();
    expect(recorder.pause).toHaveBeenCalledTimes(1);
    hook.rerender({ running: true });
    expect(recorder.resume).toHaveBeenCalledTimes(1);
    hook.rerender({ running: false });

    expect(recorder.pause).toHaveBeenCalledTimes(2);
  });

  it('gives the recording when the reading ends and keeps it when the screen goes', async () => {
    const { recorder, hook, start } = recorded();
    await start();

    let id: string | null = null;
    await act(async () => {
      id = await hook.result.current.finish();
    });
    await start();
    hook.unmount();

    expect(id).toBe('kayit');
    expect(recorder.start).toHaveBeenCalledTimes(1);
    expect(recorder.remove).not.toHaveBeenCalled();
  });

  it('removes the recording of a reading cut short', async () => {
    const { recorder, hook, start } = recorded();
    await start();

    hook.unmount();

    await waitFor(() => {
      expect(recorder.remove).toHaveBeenCalledWith('kayit');
    });
  });

  it('starts no recording once the screen has gone', () => {
    const { recorder, hook } = recorded();
    const asked = hook.result.current;

    hook.unmount();
    asked.start();

    expect(recorder.start).not.toHaveBeenCalled();
  });
});
