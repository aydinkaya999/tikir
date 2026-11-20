// G6's "Metne geri dön" (docs/ekranlar.md, G6; docs/planlar/faz-2b.md, karar 16): the whole
// chapter in a read-only modal layer; the session does not move back. TODO(design): not drawn.
import { useEffect, useId, useMemo, useRef } from 'react';
import { Button } from '../../components/Button/Button';
import { tokenizePage } from '../../domain/text';
import type { Chapter } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { ReadingText } from '../reading/ReadingText';
import styles from './TextLayer.module.css';

interface TextLayerProps {
  open: boolean;
  /** The page card's title: "Kayıp Fenerin İzinde, 4. bölüm". */
  title: string;
  chapter: Chapter;
  /** "Kapat", Esc. */
  onClose: () => void;
}

export function TextLayer({ open, title, chapter, onClose }: TextLayerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const page = useMemo(() => chapter.pages.flat(), [chapter]);
  const wordCount = useMemo(() => tokenizePage(page).length, [page]);

  useEffect(() => {
    const element = dialog.current;
    if (element === null) {
      return;
    }
    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog ref={dialog} className={styles.layer} aria-labelledby={titleId} onClose={onClose}>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <Button variant="secondary" onClick={onClose}>
          {tr.wrapUp.close}
        </Button>
      </div>
      {open && <ReadingText page={page} readCount={wordCount} />}
    </dialog>
  );
}
