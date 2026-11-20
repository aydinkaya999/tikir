// G5 Kayıt (docs/ekranlar.md, G5; docs/planlar/faz-2b.md, karar 15): the third reading's
// recording. The child listens to it, sends it for the parent's approval, records it again from
// G4's third reading, or goes on to the closing questions.
import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { recordedChapters } from '../../domain/progress';
import { withPossessiveSuffix } from '../../domain/text';
import type { Chapter, Id, ReadingResult, Session } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { useMicrophone } from '../reading/useMicrophone';
import { formatClock } from './format';
import { usePlayback, useRecording } from './playback';
import styles from './RecordPage.module.css';
import { useSession, useSessionDevices, useSessionStore } from './sessionContext';
import { SessionLayout } from './SessionLayout';
import { placeOf } from './sessionMachine';
import type { SessionData } from './sessionStore';
import { Waveform } from './Waveform';
import { sessionListens } from './views';

export function RecordPage() {
  const data = useSession((state) => state.data);
  const session = data?.session ?? null;
  const chapter = data?.chapter ?? null;
  if (data === null || session === null || chapter === null || placeOf(session).step !== 'record') {
    return null;
  }
  const recordingId = session.readings[2]?.recordingId ?? null;
  return (
    <RecordingResult
      key={recordingId ?? 'none'}
      data={data}
      session={session}
      chapter={chapter}
      recordingId={recordingId}
    />
  );
}

/** Tıkır's comment is said only when it is true: the third reading beat the first two. */
function mostFluentLast(readings: readonly ReadingResult[]): boolean {
  const [first, second, third] = readings;
  return (
    first !== undefined &&
    second !== undefined &&
    third !== undefined &&
    third.wcpm > first.wcpm &&
    third.wcpm > second.wcpm
  );
}

interface RecordingResultProps {
  data: SessionData;
  session: Session;
  chapter: Chapter;
  recordingId: Id | null;
}

function RecordingResult({ data, session, chapter, recordingId }: RecordingResultProps) {
  const store = useSessionStore();
  const devices = useSessionDevices();
  const microphone = useMicrophone(devices.audio, sessionListens(data));
  const recording = useRecording(devices.recorder, recordingId);
  const playback = usePlayback(devices.recorder);
  const [sent, setSent] = useState(false);

  // A library book's reading is not a chapter of the series' audio book (docs/kararlar.md P19).
  const series = session.chapterRef.bookId === data.series.id;
  const recorded = recordedChapters(data.sessions, data.series.id);
  const total = data.series.totalChapters;
  const recordedCount = withPossessiveSuffix(recorded.length);
  const pending = sent || recording?.approval === 'pending';
  const durationMs = recording ? recording.seconds * 1000 : 0;
  const progress =
    playback.elapsedMs === null || durationMs === 0
      ? null
      : Math.min(1, playback.elapsedMs / durationMs);

  const togglePlayback = () => {
    if (playback.playing) {
      playback.stop();
    } else if (recordingId !== null) {
      playback.play(recordingId);
    }
  };

  const send = () => {
    if (recordingId === null || pending) {
      return;
    }
    setSent(true);
    devices.recorder.requestApproval(recordingId).catch(() => {
      setSent(false);
    });
  };

  // The tap that leads back into the third reading opens the microphone (docs/kararlar.md T22).
  const redo = () => {
    if (playback.playing) {
      playback.stop();
    }
    microphone.start();
    store
      .getState()
      .redoRecording()
      .catch(() => undefined);
  };

  const next = () => {
    store
      .getState()
      .finishRecording()
      .catch(() => undefined);
  };

  return (
    <SessionLayout
      title={tr.session.steps.record}
      chip={<Chip tone="saffronLight">{tr.record.chip}</Chip>}
      companion={{
        expression: 'happy',
        bubble: mostFluentLast(session.readings) ? tr.record.bestBubble : tr.record.readyBubble,
      }}
      controls={
        <>
          <div className={styles.phoneControls}>
            <IconButton icon="repeat" label={tr.record.redo} size={52} raised onClick={redo} />
            <div className={styles.phoneNext}>
              <Button size="large" icon="right" fullWidth onClick={next}>
                {tr.record.next}
              </Button>
            </div>
          </div>
          <div className={styles.wideControls}>
            <Button variant="secondary" icon="repeat" onClick={redo}>
              {tr.record.redo}
            </Button>
            <Button size="large" icon="right" onClick={next}>
              {tr.record.next}
            </Button>
          </div>
        </>
      }
    >
      {recording === null && (
        // TODO(design): no recording to show (docs/planlar/faz-2b.md, karar 15).
        <p className={styles.missing}>{tr.record.missing}</p>
      )}
      {recording && (
        <div className={styles.cards}>
          <section className={styles.recording}>
            <div className={styles.recordingHead}>
              <Chip tone="turquoise" icon="check">
                {tr.record.done}
              </Chip>
              <p className={styles.time}>{formatClock(durationMs)}</p>
            </div>
            <div className={styles.phoneWave}>
              <Waveform levels={recording.levels} count={26} progress={progress} />
            </div>
            <div className={styles.wideWave}>
              <Waveform levels={recording.levels} count={36} progress={progress} />
            </div>
            <div className={styles.player}>
              <IconButton
                icon={playback.playing ? 'pause' : 'play'}
                label={playback.playing ? tr.record.pause : tr.record.play}
                size={52}
                tone="saffron"
                onClick={togglePlayback}
              />
              <div className={styles.playerText}>
                <p className={styles.recordingTitle}>{tr.record.title(chapter.title)}</p>
                {series && <p className={styles.added}>{tr.record.added}</p>}
              </div>
            </div>
            {series && (
              <div className={styles.book}>
                <ol
                  className={styles.squares}
                  aria-label={tr.record.chaptersLabel(total, recordedCount)}
                >
                  {Array.from({ length: total }, (_, index) => (
                    <li
                      key={index}
                      className={styles.square}
                      data-recorded={recorded.includes(index + 1) ? '' : undefined}
                    />
                  ))}
                </ol>
                <p className={styles.bookCount}>
                  {tr.record.chaptersRecorded(total, recordedCount)}
                </p>
              </div>
            )}
          </section>
          <section className={styles.share}>
            <div className={styles.shareText}>
              <Icon name="send" size={24} />
              <div className={styles.shareLines}>
                <p className={styles.shareTitle}>{tr.record.shareTitle}</p>
                <p className={styles.shareNote}>{tr.record.shareNote}</p>
              </div>
            </div>
            <Button variant="secondary" icon="lock" disabled={pending} onClick={send}>
              {pending ? tr.record.sent : tr.record.send}
            </Button>
          </section>
        </div>
      )}
    </SessionLayout>
  );
}
