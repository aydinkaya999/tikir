import { IconDemo } from './IconDemo';
import styles from './Showcase.module.css';

/**
 * /gelistirme/vitrin: every component of docs/tasarim-sistemi.md in every state. Section titles
 * are code names; sample copy comes from the design files, reading samples from seed/.
 */
export function ShowcasePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Vitrin</h1>
      <IconDemo />
    </main>
  );
}
