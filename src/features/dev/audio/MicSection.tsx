import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/Card/Card';
import { Switch } from '../../../components/Switch/Switch';
import type { CaptureSettings } from '../../../services/audio/AudioCapture';
import styles from './AudioLabPage.module.css';
import { describeCaptureProblem } from './captureProblem';
import { copy } from './copy';
import { formatDbfs, meterValue } from './format';
import type { CaptureHandle } from './useCapture';

const settingNames = ['echoCancellation', 'noiseSuppression', 'autoGainControl'] as const;

/** Permission, state, processing switches and the live level meter. */
export function MicSection({ handle }: { handle: CaptureHandle }) {
  const { capture, state, level, settings, changeSettings } = handle;
  const open = state === 'starting' || state === 'capturing';
  const problem = describeCaptureProblem(state, capture.diagnostics().failure);
  const meter = meterValue(level);

  return (
    <Card as="section" className={styles.section} aria-labelledby="audio-lab-mic">
      <h2 className={styles.heading} id="audio-lab-mic">
        {copy.mic.heading}
      </h2>

      <div className={styles.switches}>
        {settingNames.map((name) => (
          <Switch
            key={name}
            label={copy.mic[name]}
            checked={settings[name]}
            disabled={open}
            onChange={(checked) => {
              const next: CaptureSettings = { ...settings, [name]: checked };
              changeSettings(next);
            }}
          />
        ))}
        <p className={styles.hint}>{copy.mic.settingsHint}</p>
      </div>

      {problem !== null && (
        <div className={styles.problem} role="alert">
          <p>{problem.message}</p>
          {problem.detail !== null && <p className={styles.detail}>{problem.detail}</p>}
        </div>
      )}

      <div className={styles.actions}>
        {open ? (
          <Button
            variant="secondary"
            onClick={() => {
              void capture.stop();
            }}
          >
            {copy.mic.close}
          </Button>
        ) : (
          <Button
            onClick={() => {
              void capture.start();
            }}
          >
            {problem === null ? copy.mic.open : copy.mic.retry}
          </Button>
        )}
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>{copy.mic.stateLabel}</dt>
          <dd>{copy.mic.states[state]}</dd>
        </div>
        <div>
          <dt>{copy.mic.level}</dt>
          <dd>{formatDbfs(level)}</dd>
        </div>
      </dl>

      <div
        className={styles.meter}
        role="meter"
        aria-label={copy.mic.level}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={meter}
        aria-valuetext={formatDbfs(level)}
      >
        <div className={styles.meterFill} style={{ transform: `scaleX(${String(meter)})` }} />
      </div>
    </Card>
  );
}
