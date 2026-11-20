// G6's "Metne geri dön" (docs/ekranlar.md, G6; docs/planlar/faz-2b.md, karar 16): the whole
// chapter in a read-only modal layer; the session does not move back. TODO(design): not drawn.
import { useMemo } from 'react';
import { Button } from '../../components/Button/Button';
import { Dialog } from '../../components/Dialog/Dialog';
import { tokenizePage } from '../../domain/text';
import type { Chapter, ReadingStyle } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { ReadingStyleScope } from '../reading/ReadingStyleScope';
import { ReadingText } from '../reading/ReadingText';

interface TextLayerProps {
  open: boolean;
  /** The page card's title: "Kayıp Fenerin İzinde, 4. bölüm". */
  title: string;
  chapter: Chapter;
  /** The child's reading style: the layer is reading text too. */
  readingStyle: ReadingStyle;
  /** "Kapat", Esc. */
  onClose: () => void;
}

export function TextLayer({ open, title, chapter, readingStyle, onClose }: TextLayerProps) {
  const page = useMemo(() => chapter.pages.flat(), [chapter]);
  const wordCount = useMemo(() => tokenizePage(page).length, [page]);

  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      width="wide"
      actions={
        <Button variant="secondary" onClick={onClose}>
          {tr.wrapUp.close}
        </Button>
      }
    >
      {open && (
        <ReadingStyleScope style={readingStyle}>
          <ReadingText page={page} readCount={wordCount} />
        </ReadingStyleScope>
      )}
    </Dialog>
  );
}
