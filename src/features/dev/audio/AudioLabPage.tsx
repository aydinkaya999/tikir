import { useEffect, useState } from 'react';
import type { AudioCapture, CaptureSettings } from '../../../services/audio/AudioCapture';
import type { WavPlayer } from '../../../services/audio/WavPlayer';
import type { EnvironmentInfo, PermissionReading } from '../../../services/device/environment';
import type { EchoProbe } from '../../../services/echo/EchoProbe';
import styles from './AudioLabPage.module.css';
import { copy } from './copy';
import { EchoSection } from './EchoSection';
import { MicSection } from './MicSection';
import type { RecordingSummary } from './pcmRecording';
import { RecordingSection } from './RecordingSection';
import type { EchoReport } from './report';
import { ReportSection } from './ReportSection';
import { useCapture } from './useCapture';

/** What the page needs from the app; src/app/services.ts provides the real implementations. */
export interface AudioLabServices {
  createCapture: (settings: CaptureSettings) => AudioCapture;
  player: WavPlayer;
  saveFile: (fileName: string, data: Blob) => void;
  createEchoProbe: () => EchoProbe;
  /** The echo endpoint on the page's own origin (ws or wss). */
  defaultEchoUrl: () => string;
  readEnvironment: () => EnvironmentInfo;
  readMicrophonePermission: () => Promise<PermissionReading>;
}

/**
 * /gelistirme/ses: the phase 1 audio trial (docs/dinleme-hatti.md, section 5). A developer page:
 * no design, never in the production build, run by an adult (docs/kararlar.md, T16).
 */
export function AudioLabPage({ services }: { services: AudioLabServices }) {
  const capture = useCapture(services.createCapture);
  const [environment] = useState(() => services.readEnvironment());
  const [permission, setPermission] = useState<PermissionReading>('unknown');
  const [recording, setRecording] = useState<RecordingSummary | null>(null);
  const [echo, setEcho] = useState<EchoReport | null>(null);

  // The permission can change with every attempt to open the microphone.
  useEffect(() => {
    let current = true;
    void services.readMicrophonePermission().then((reading) => {
      if (current) {
        setPermission(reading);
      }
    });
    return () => {
      current = false;
    };
  }, [services, capture.state]);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.intro}>{copy.intro}</p>
      <MicSection handle={capture} permission={permission} />
      <RecordingSection
        handle={capture}
        player={services.player}
        saveFile={services.saveFile}
        onRecorded={setRecording}
      />
      <EchoSection
        handle={capture}
        createProbe={services.createEchoProbe}
        defaultUrl={services.defaultEchoUrl()}
        onResult={setEcho}
      />
      <ReportSection
        handle={capture}
        environment={environment}
        permission={permission}
        recording={recording}
        echo={echo}
        saveFile={services.saveFile}
      />
    </main>
  );
}
