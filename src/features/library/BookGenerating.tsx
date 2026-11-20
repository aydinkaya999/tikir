// The wait while a book is made (docs/ekranlar.md, "Tasarımı olmayan durumlar"; docs/planlar/
// faz-5.md, karar 17 and D18): U3, U2 and U4's "Yeniden üret".
import { useEffect, useRef } from 'react';
import { Button } from '../../components/Button/Button';
import { Companion } from '../../components/Companion/Companion';
import { tr } from '../../i18n/tr';
import styles from './BookGenerating.module.css';

/** TODO(design): the wait is not drawn: Tıkır thinks, one line, and a way out. */
export function BookGenerating({ onCancel }: { onCancel: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  // The tapped button is gone: the way out takes the focus.
  useEffect(() => {
    panel.current?.querySelector('button')?.focus();
  }, []);
  return (
    <div ref={panel} className={styles.generating}>
      <Companion className={styles.face} expression="think" size={170} label={tr.appName} />
      <p className={styles.line} role="status">
        {tr.bookMaking.writing}
      </p>
      <Button variant="secondary" onClick={onCancel}>
        {tr.bookMaking.cancel}
      </Button>
    </div>
  );
}
