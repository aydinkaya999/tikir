// The microphone of a reading screen, behind the parent's consent (CLAUDE.md, "Çocuk ve mahremiyet
// kuralları"; docs/dinleme-hatti.md, section 1): without consent.voiceProcessing it never starts.
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { AudioCapture, CaptureState } from '../../services/audio/AudioCapture';

export type MicrophoneState = CaptureState | 'noConsent';

export interface MicrophoneControl {
  state: MicrophoneState;
  /** Call from the user's tap. Does nothing without consent. */
  start(): void;
  stop(): void;
}

export function useMicrophone(audio: AudioCapture, consent: boolean): MicrophoneControl {
  const subscribe = useCallback((onChange: () => void) => audio.onStateChange(onChange), [audio]);
  const captureState: CaptureState = useSyncExternalStore(subscribe, () => audio.state);

  // A withdrawn consent closes the microphone at once. Leaving the screen does not: the address
  // rule closes it (SessionRoot, docs/kararlar.md T22), so a microphone opened by the tap that led
  // here survives this screen's mounts, StrictMode's second one included.
  useEffect(() => {
    if (!consent) {
      void audio.stop();
    }
  }, [audio, consent]);

  const start = useCallback(() => {
    if (consent) {
      void audio.start();
    }
  }, [audio, consent]);

  const stop = useCallback(() => {
    void audio.stop();
  }, [audio]);

  return { state: consent ? captureState : 'noConsent', start, stop };
}
