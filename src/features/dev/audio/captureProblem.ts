// The sentence the audio lab shows when the microphone cannot open (docs/ekranlar.md, "Hata
// bildirimi": what happened and what to do, in one sentence).
import type { CaptureFailure, CaptureState } from '../../../services/audio/AudioCapture';
import { copy } from './copy';

export interface CaptureProblem {
  message: string;
  /** The browser's own error, for the tester's notes; only for unexpected errors. */
  detail: string | null;
}

export function describeCaptureProblem(
  state: CaptureState,
  failure: CaptureFailure | null,
): CaptureProblem | null {
  switch (state) {
    case 'denied':
      return { message: copy.mic.problems.denied, detail: null };
    case 'unavailable':
      return {
        message:
          failure?.name === 'MediaDevicesMissing'
            ? copy.mic.problems.insecure
            : copy.mic.problems.noDevice,
        detail: null,
      };
    case 'error':
      return {
        message: copy.mic.problems.error,
        detail: failure === null ? null : copy.mic.problems.detail(failure.name, failure.message),
      };
    case 'idle':
    case 'starting':
    case 'capturing':
      return null;
  }
}
