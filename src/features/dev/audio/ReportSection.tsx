import { useEffect, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/Card/Card';
import type { EnvironmentInfo, PermissionReading } from '../../../services/device/environment';
import styles from './AudioLabPage.module.css';
import { copy } from './copy';
import { describeAppliedSettings, trialFileName } from './format';
import type { RecordingSummary } from './pcmRecording';
import { type AudioTrialReport, buildTrialReport, type EchoReport } from './report';
import type { CaptureHandle } from './useCapture';

interface ReportSectionProps {
  handle: CaptureHandle;
  environment: EnvironmentInfo;
  permission: PermissionReading;
  recording: RecordingSummary | null;
  echo: EchoReport | null;
  saveFile: (fileName: string, data: Blob) => void;
}

function known(value: string): string {
  return value === 'unknown' ? copy.report.unknown : value;
}

function yesNo(value: boolean): string {
  return value ? copy.report.yes : copy.report.no;
}

/** The report a tester attaches to the results template; refreshed every second. */
export function ReportSection({
  handle,
  environment,
  permission,
  recording,
  echo,
  saveFile,
}: ReportSectionProps) {
  const { capture, state } = handle;
  const [report, setReport] = useState<AudioTrialReport | null>(null);

  // A refresh right after any change (the state is a dependency for that), then every second
  // for the frame counters.
  useEffect(() => {
    const refresh = () => {
      setReport(
        buildTrialReport(
          {
            environment,
            permission,
            capture: { state: capture.state, ...capture.diagnostics() },
            recording,
            echo,
          },
          new Date(),
        ),
      );
    };
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [capture, state, environment, permission, recording, echo]);

  const json = report === null ? '' : JSON.stringify(report, null, 2);
  const rows: [string, string][] =
    report === null
      ? []
      : [
          [copy.report.browser, known(report.environment.browser)],
          [copy.report.os, known(report.environment.os)],
          [copy.report.shell, copy.report.shells[report.environment.shell]],
          [copy.report.standalone, yesNo(report.environment.standalone)],
          [copy.report.secureContext, yesNo(report.environment.secureContext)],
          [
            copy.report.inputRate,
            report.capture.inputSampleRate === null
              ? copy.report.unknown
              : copy.report.hz(String(report.capture.inputSampleRate)),
          ],
          [copy.report.applied, describeAppliedSettings(report.capture.applied)],
          [copy.report.delivered, String(report.capture.framesDelivered)],
          [copy.report.dropped, String(report.capture.framesDropped)],
          [copy.report.silent, String(report.capture.framesSilent)],
        ];

  return (
    <Card as="section" className={styles.section} aria-labelledby="audio-lab-report">
      <h2 className={styles.heading} id="audio-lab-report">
        {copy.report.heading}
      </h2>
      {report !== null && (
        <>
          <dl className={styles.facts}>
            {rows.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={() => {
                saveFile(
                  trialFileName(new Date(report.createdAt), 'json'),
                  new Blob([json], { type: 'application/json' }),
                );
              }}
            >
              {copy.report.download}
            </Button>
          </div>
          <pre className={styles.json} aria-label={copy.report.json}>
            {json}
          </pre>
        </>
      )}
    </Card>
  );
}
