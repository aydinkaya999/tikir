import type { ReactNode } from 'react';
import styles from './PageCard.module.css';

interface PageCardProps {
  /** Book and chapter, e.g. "Kayıp Fenerin İzinde, 4. bölüm". */
  title: string;
  /** Page counter, e.g. "1 / 2". */
  counter?: string;
  className?: string;
  children: ReactNode;
}

/** The reading page: a thick white tile headed by the book name and the page counter. */
export function PageCard({ title, counter, className, children }: PageCardProps) {
  return (
    <div className={[styles.pageCard, className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        <p className={styles.headerText}>{title}</p>
        {counter !== undefined && <p className={styles.headerText}>{counter}</p>}
      </div>
      {children}
    </div>
  );
}
