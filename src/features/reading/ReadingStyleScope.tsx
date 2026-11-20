// The child's reading style on a reading text (docs/urun.md section 7; docs/planlar/faz-3.md,
// karar 23): the container carries the style as attributes, and src/styles/tokens-extra.css turns
// them into the --reading-* variables the reading texts use, so the values stay in the token files.
import type { ReactNode } from 'react';
import type { ReadingStyle } from '../../domain/types';

interface ReadingStyleScopeProps {
  style: ReadingStyle;
  className?: string;
  children: ReactNode;
}

export function ReadingStyleScope({ style, className, children }: ReadingStyleScopeProps) {
  return (
    <div
      className={className}
      data-reading-font={style.font}
      data-reading-size={String(style.sizeStep)}
      data-reading-spacing={String(style.spacingStep)}
    >
      {children}
    </div>
  );
}
