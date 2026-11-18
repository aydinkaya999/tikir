import type { AudioCapture, CaptureSettings } from '../../../services/audio/AudioCapture';
import styles from './AudioLabPage.module.css';
import { copy } from './copy';
import { MicSection } from './MicSection';
import { useCapture } from './useCapture';

/** What the page needs from the app; src/app/services.ts provides the real implementations. */
export interface AudioLabServices {
  createCapture: (settings: CaptureSettings) => AudioCapture;
}

/**
 * /gelistirme/ses: the phase 1 audio trial (docs/dinleme-hatti.md, section 5). A developer page:
 * no design, never in the production build, run by an adult (docs/kararlar.md, T16).
 */
export function AudioLabPage({ services }: { services: AudioLabServices }) {
  const capture = useCapture(services.createCapture);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.intro}>{copy.intro}</p>
      <MicSection handle={capture} />
    </main>
  );
}
