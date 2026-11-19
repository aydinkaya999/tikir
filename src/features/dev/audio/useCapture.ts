import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  defaultCaptureSettings,
  type AudioCapture,
  type CaptureSettings,
  type CaptureState,
} from '../../../services/audio/AudioCapture';

export interface CaptureHandle {
  capture: AudioCapture;
  state: CaptureState;
  /** Latest RMS level; 0 while the microphone is not capturing. */
  level: number;
  settings: CaptureSettings;
  /** New settings take effect with a new capture; call it only while the microphone is off. */
  changeSettings: (settings: CaptureSettings) => void;
}

function levelStore(capture: AudioCapture) {
  let level = 0;
  return {
    subscribe: (notify: () => void) =>
      capture.onLevel((rms) => {
        level = rms;
        notify();
      }),
    read: () => level,
  };
}

/**
 * One capture for the page. A settings change replaces it; the old one is stopped, and so is the
 * last one when the page unmounts (docs/dinleme-hatti.md, section 1: leaving releases the mic).
 */
export function useCapture(
  createCapture: (settings: CaptureSettings) => AudioCapture,
): CaptureHandle {
  const [settings, setSettings] = useState<CaptureSettings>(() => ({ ...defaultCaptureSettings }));
  // State, not memo: React may drop memoized values, and this one owns an open microphone.
  const [capture, setCapture] = useState(() => createCapture(settings));

  useEffect(
    () => () => {
      void capture.stop();
    },
    [capture],
  );

  const subscribeToState = useCallback(
    (notify: () => void) => capture.onStateChange(notify),
    [capture],
  );
  const state = useSyncExternalStore(subscribeToState, () => capture.state);
  const levels = useMemo(() => levelStore(capture), [capture]);
  const level = useSyncExternalStore(levels.subscribe, levels.read);

  return {
    capture,
    state,
    level: state === 'capturing' ? level : 0,
    settings,
    changeSettings: (next) => {
      setSettings(next);
      setCapture(createCapture(next));
    },
  };
}
