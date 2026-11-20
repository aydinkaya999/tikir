import { Companion } from '../../components/Companion/Companion';
import { tr } from '../../i18n/tr';
import styles from './StatusScreen.module.css';

interface StatusScreenProps {
  kind: 'loading' | 'error';
  /** main in the session shell, which has no landmark of its own; div inside the child shell. */
  as?: 'main' | 'div';
}

/**
 * Loading and the error notice (docs/ekranlar.md, "Tasarımı olmayan durumlar"): Tıkır thinking and
 * one line. TODO(design): neither is drawn.
 */
export function StatusScreen({ kind, as: Element = 'div' }: StatusScreenProps) {
  return (
    <Element className={styles.status}>
      <Companion expression="think" size={120} label={tr.appName} />
      <p className={styles.line} role={kind === 'error' ? 'alert' : 'status'}>
        {kind === 'loading' ? tr.status.loading : tr.status.error}
      </p>
    </Element>
  );
}
