import type { ReactNode } from 'react';
import styles from './Showcase.module.css';

interface SectionProps {
  /** The component's code name; also the section's test hook. */
  name: string;
  children: ReactNode;
}

export function Section({ name, children }: SectionProps) {
  const headingId = `showcase-${name}`;
  return (
    <section className={styles.section} data-component={name} aria-labelledby={headingId}>
      <h2 className={styles.sectionTitle} id={headingId}>
        {name}
      </h2>
      {children}
    </section>
  );
}

interface RowProps {
  /** Which props or state the row shows, in code terms. */
  label: string;
  children: ReactNode;
}

export function Row({ label, children }: RowProps) {
  return (
    <div className={styles.example}>
      <p className={styles.label}>{label}</p>
      <div className={styles.row}>{children}</div>
    </div>
  );
}
