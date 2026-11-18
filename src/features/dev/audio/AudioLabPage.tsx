import type { AudioCapture, CaptureSettings } from '../../../services/audio/AudioCapture';
import type { WavPlayer } from '../../../services/audio/WavPlayer';
import type { EchoProbe } from '../../../services/echo/EchoProbe';
import styles from './AudioLabPage.module.css';
import { copy } from './copy';
import { EchoSection } from './EchoSection';
import { MicSection } from './MicSection';
import { RecordingSection } from './RecordingSection';
import { useCapture } from './useCapture';

/** What the page needs from the app; src/app/services.ts provides the real implementations. */
export interface AudioLabServices {
  createCapture: (settings: CaptureSettings) => AudioCapture;
  player: WavPlayer;
  saveFile: (fileName: string, data: Blob) => void;
  createEchoProbe: () => EchoProbe;
  /** The echo endpoint on the page's own origin (ws or wss). */
  defaultEchoUrl: () => string;
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
      <RecordingSection handle={capture} player={services.player} saveFile={services.saveFile} />
      <EchoSection
        handle={capture}
        createProbe={services.createEchoProbe}
        defaultUrl={services.defaultEchoUrl()}
      />
    </main>
  );
}
