import { Button } from '../../components/Button/Button';
import { tr } from '../../i18n/tr';
import styles from './MicrophoneProblem.module.css';

export type MicrophoneProblemKind = 'denied' | 'unavailable' | 'error';

/**
 * Tıkır's bubble when the microphone cannot listen (docs/ekranlar.md, "Tasarımı olmayan
 * durumlar"): what happened and what to do, and "Yeniden dene". TODO(design)
 */
export function MicrophoneProblem({
  kind,
  onRetry,
}: {
  kind: MicrophoneProblemKind;
  onRetry: () => void;
}) {
  return (
    <span className={styles.problem}>
      <span>{tr.microphoneProblem[kind]}</span>
      <Button variant="secondary" icon="repeat" onClick={onRetry}>
        {tr.microphoneProblem.retry}
      </Button>
    </span>
  );
}
