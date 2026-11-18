// The device report of the audio lab (docs/dinleme-hatti.md, section 5): shown on the page and
// downloadable as JSON, so the tester can attach it to docs/ses-denemesi-sonuclari.md.
import type { CaptureDiagnostics, CaptureState } from '../../../services/audio/AudioCapture';
import type { EnvironmentInfo, PermissionReading } from '../../../services/device/environment';
import type { EchoOutcome } from '../../../services/echo/EchoProbe';
import type { RoundTripSummary } from '../../../services/echo/roundTrip';
import type { RecordingSummary } from './pcmRecording';

export type EchoReport = { url: string; outcome: EchoOutcome } & RoundTripSummary;

export interface AudioTrialReport {
  version: 1;
  createdAt: string;
  environment: EnvironmentInfo;
  permission: PermissionReading;
  capture: { state: CaptureState } & CaptureDiagnostics;
  /** levelDbfs is null for a silent take: JSON has no minus infinity. */
  recording: (Omit<RecordingSummary, 'levelDbfs'> & { levelDbfs: number | null }) | null;
  echo: EchoReport | null;
}

export interface TrialReportParts {
  environment: EnvironmentInfo;
  permission: PermissionReading;
  capture: { state: CaptureState } & CaptureDiagnostics;
  recording: RecordingSummary | null;
  echo: EchoReport | null;
}

function oneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function oneDecimalOrNull(value: number | null): number | null {
  return value === null || !Number.isFinite(value) ? null : oneDecimal(value);
}

export function buildTrialReport(parts: TrialReportParts, createdAt: Date): AudioTrialReport {
  const { recording, echo } = parts;
  return {
    version: 1,
    createdAt: createdAt.toISOString(),
    environment: { ...parts.environment },
    permission: parts.permission,
    capture: { ...parts.capture },
    recording:
      recording === null
        ? null
        : {
            seconds: oneDecimal(recording.seconds),
            frames: recording.frames,
            levelDbfs: oneDecimalOrNull(recording.levelDbfs),
          },
    echo:
      echo === null
        ? null
        : {
            ...echo,
            medianMs: oneDecimalOrNull(echo.medianMs),
            p95Ms: oneDecimalOrNull(echo.p95Ms),
            minMs: oneDecimalOrNull(echo.minMs),
            maxMs: oneDecimalOrNull(echo.maxMs),
          },
  };
}
