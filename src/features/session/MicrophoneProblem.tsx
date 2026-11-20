import { Button } from '../../components/Button/Button';
import { tr } from '../../i18n/tr';
import styles from './MicrophoneProblem.module.css';

export type MicrophoneProblemKind = 'denied' | 'unavailable' | 'error';

interface MicrophoneProblemProps {
  kind: MicrophoneProblemKind;
  onRetry: () => void;
  /**
   * The way on when a retry did not help (docs/kararlar.md P14): K3's "Seviye tespitini atla", the
   * session's "Bugün dinlemeden oku". The caller gives it once the child has retried.
   */
  afterRetry?: { label: string; onChoose: () => void };
}

/**
 * Tıkır's bubble when the microphone cannot listen (docs/ekranlar.md, "Tasarımı olmayan
 * durumlar"): what happened and what to do, and "Yeniden dene". TODO(design)
 */
export function MicrophoneProblem({ kind, onRetry, afterRetry }: MicrophoneProblemProps) {
  return (
    <span className={styles.problem}>
      <span>{tr.microphoneProblem[kind]}</span>
      <Button variant="secondary" icon="repeat" onClick={onRetry}>
        {tr.microphoneProblem.retry}
      </Button>
      {afterRetry !== undefined && (
        <Button variant="secondary" icon="right" onClick={afterRetry.onChoose}>
          {afterRetry.label}
        </Button>
      )}
    </span>
  );
}
