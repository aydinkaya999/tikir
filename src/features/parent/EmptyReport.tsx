import styles from './EmptyReport.module.css';

interface EmptyReportProps {
  title: string;
  text: string;
}

/**
 * A report page without data: its title and one sentence in a card (docs/ekranlar.md, "Boş
 * durumlar"; docs/planlar/faz-4.md, D17). TODO(design)
 */
export function EmptyReport({ title, text }: EmptyReportProps) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.card}>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
}
