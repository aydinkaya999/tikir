import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/Card/Card';
import { captureFormat } from '../../../services/audio/captureChain';
import { encodeWav } from '../../../services/audio/wav';
import type { WavPlayer } from '../../../services/audio/WavPlayer';
import styles from './AudioLabPage.module.css';
import { copy } from './copy';
import { formatSeconds, trialFileName } from './format';
import {
  PcmRecording,
  recordingFrames,
  type RecordingSummary,
  summarizeRecording,
} from './pcmRecording';
import type { CaptureHandle } from './useCapture';

type Phase = 'empty' | 'recording' | 'ready' | 'partial';

interface RecordingSectionProps {
  handle: CaptureHandle;
  player: WavPlayer;
  saveFile: (fileName: string, data: Blob) => void;
  /** Called when a take ends, full or cut short; the device report shows it. */
  onRecorded: (summary: RecordingSummary) => void;
}

/** Ten seconds from the microphone's frames, played back and downloadable as 16 kHz WAV. */
export function RecordingSection({ handle, player, saveFile, onRecorded }: RecordingSectionProps) {
  const { capture, state } = handle;
  const [phase, setPhase] = useState<Phase>('empty');
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<PcmRecording | null>(null);
  const [playing, setPlaying] = useState(false);
  const stopListening = useRef<(() => void) | null>(null);

  // Leaving the page ends a take in progress and any playback.
  useEffect(
    () => () => {
      stopListening.current?.();
      player.stop();
    },
    [player],
  );

  const record = () => {
    const take = new PcmRecording(recordingFrames);
    setRecording(null);
    setSeconds(0);
    setPhase('recording');
    const finish = (result: 'ready' | 'partial') => {
      stopListening.current?.();
      stopListening.current = null;
      setSeconds(take.seconds);
      setRecording(take);
      setPhase(result);
      onRecorded(summarizeRecording(take));
    };
    const offFrame = capture.onFrame((frame) => {
      const full = take.append(frame);
      setSeconds(take.seconds);
      if (full) {
        finish('ready');
      }
    });
    // A microphone that closes mid-take (hidden tab, interruption) ends it with what it has.
    const offState = capture.onStateChange((next) => {
      if (next !== 'capturing') {
        finish('partial');
      }
    });
    stopListening.current = () => {
      offFrame();
      offState();
    };
  };

  const play = async (take: PcmRecording) => {
    // iPhone turns the speaker down while the microphone is open (docs/dinleme-hatti.md).
    await capture.stop();
    setPlaying(true);
    try {
      await player.play(encodeWav(take.toSamples(), captureFormat.sampleRate));
    } finally {
      setPlaying(false);
    }
  };

  const status = playing
    ? copy.recording.playing
    : phase === 'recording'
      ? copy.recording.progress(formatSeconds(seconds))
      : phase === 'ready'
        ? copy.recording.ready(formatSeconds(seconds))
        : phase === 'partial'
          ? copy.recording.partial(formatSeconds(seconds))
          : null;
  const take = phase === 'recording' ? null : recording;

  return (
    <Card as="section" className={styles.section} aria-labelledby="audio-lab-recording">
      <h2 className={styles.heading} id="audio-lab-recording">
        {copy.recording.heading}
      </h2>
      <div className={styles.actions}>
        <Button
          disabled={state !== 'capturing' || phase === 'recording' || playing}
          onClick={record}
        >
          {copy.recording.record}
        </Button>
        {playing ? (
          <Button
            variant="secondary"
            onClick={() => {
              player.stop();
            }}
          >
            {copy.recording.stop}
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={take === null}
            onClick={() => {
              if (take !== null) {
                void play(take);
              }
            }}
          >
            {copy.recording.play}
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={take === null}
          onClick={() => {
            if (take !== null) {
              const wav = encodeWav(take.toSamples(), captureFormat.sampleRate);
              saveFile(trialFileName(new Date(), 'wav'), new Blob([wav], { type: 'audio/wav' }));
            }
          }}
        >
          {copy.recording.download}
        </Button>
      </div>
      {status !== null && (
        <p className={styles.status} aria-live="polite">
          {status}
        </p>
      )}
      <p className={styles.hint}>{copy.recording.playHint}</p>
    </Card>
  );
}
