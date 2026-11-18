import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export type CardTone = 'white' | 'cobaltLight' | 'turquoiseLight';

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** White, light cobalt (information and suggestion cards) or light turquoise (U4). */
  tone?: CardTone;
  /** The tile "thickness": a hard ink shadow under the card. */
  lifted?: boolean;
  as?: 'div' | 'section' | 'article';
  children: ReactNode;
}

export function Card({
  tone = 'white',
  lifted = false,
  as: Element = 'div',
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [styles.card, styles[tone], lifted ? styles.lifted : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <Element {...rest} className={classes}>
      {children}
    </Element>
  );
}
