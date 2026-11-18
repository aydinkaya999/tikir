import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/Card/Card';
import { TextField } from '../../../components/TextField/TextField';
import { echoFrames, type EchoProbe, type EchoResult } from '../../../services/echo/EchoProbe';
import styles from './AudioLabPage.module.css';
import { copy } from './copy';
import { formatMs } from './format';
import type { CaptureHandle } from './useCapture';

interface EchoSectionProps {
  handle: CaptureHandle;
  createProbe: () => EchoProbe;
  defaultUrl: string;
}

function milliseconds(value: number | null): string | null {
  return value === null ? null : copy.echo.ms(formatMs(value));
}

/** Sends the next 500 microphone frames to the echo server and times their way back. */
export function EchoSection({ handle, createProbe, defaultUrl }: EchoSectionProps) {
  const { capture, state } = handle;
  const [url, setUrl] = useState(defaultUrl);
  const [sent, setSent] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<EchoResult | null>(null);
  const activeProbe = useRef<EchoProbe | null>(null);

  // Leaving the page stops a run in progress and closes its socket.
  useEffect(
    () => () => {
      activeProbe.current?.cancel();
    },
    [],
  );

  const start = async () => {
    const probe = createProbe();
    activeProbe.current = probe;
    setRunning(true);
    setSent(0);
    setResult(null);
    const outcome = await probe.run({ url, capture, frames: echoFrames, onProgress: setSent });
    if (activeProbe.current === probe) {
      activeProbe.current = null;
      setResult(outcome);
      setRunning(false);
    }
  };

  const rows: [string, string | null][] =
    result === null
      ? []
      : [
          [copy.echo.sent, String(result.summary.sent)],
          [copy.echo.received, String(result.summary.received)],
          [copy.echo.lost, String(result.summary.lost)],
          [copy.echo.median, milliseconds(result.summary.medianMs)],
          [copy.echo.p95, milliseconds(result.summary.p95Ms)],
          [copy.echo.min, milliseconds(result.summary.minMs)],
          [copy.echo.max, milliseconds(result.summary.maxMs)],
        ];

  return (
    <Card as="section" className={styles.section} aria-labelledby="audio-lab-echo">
      <h2 className={styles.heading} id="audio-lab-echo">
        {copy.echo.heading}
      </h2>
      <TextField label={copy.echo.url} value={url} onChange={setUrl} />
      <div className={styles.actions}>
        {running ? (
          <Button
            variant="secondary"
            onClick={() => {
              activeProbe.current?.cancel();
            }}
          >
            {copy.echo.stop}
          </Button>
        ) : (
          <Button
            disabled={state !== 'capturing'}
            onClick={() => {
              void start();
            }}
          >
            {copy.echo.start}
          </Button>
        )}
      </div>
      {running && (
        <p className={styles.status} aria-live="polite">
          {copy.echo.progress(sent, echoFrames)}
        </p>
      )}
      {result !== null && result.outcome !== 'completed' && (
        <p className={styles.problem} role="alert">
          {copy.echo.outcomes[result.outcome]}
        </p>
      )}
      {rows.length > 0 && (
        <dl className={styles.facts}>
          {rows.map(([term, value]) =>
            value === null ? null : (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ),
          )}
        </dl>
      )}
    </Card>
  );
}
