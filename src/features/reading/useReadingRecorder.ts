// The recording of a reading (G4's third reading, K3's level check; docs/planlar/faz-3.md, karar
// 17): it follows the reading's own clock, so the child's pauses, a held reading and Tıkır's help
// stay out of it, and a reading cut short (the exit, leaving the screen) leaves no recording.
import { useEffect, useEffectEvent, useRef } from 'react';
import type { Id } from '../../domain/types';
import type { AudioCapture } from '../../services/audio/AudioCapture';
import type { Recorder } from '../../services/recorder/Recorder';

export interface ReadingRecorderOptions {
  /** Whether this reading is recorded. */
  enabled: boolean;
  recorder: Recorder;
  audio: AudioCapture;
  /** The reading runs: the recording runs exactly then. */
  running: boolean;
}

export interface ReadingRecorder {
  /** Once the reading has started: the recording starts, once. */
  start(): void;
  /** The reading ended: the recording stops; its id, or null without one. */
  finish(): Promise<Id | null>;
  /** The reading is dropped: its recording is removed. */
  discard(): void;
}

export function useReadingRecorder({
  enabled,
  recorder,
  audio,
  running,
}: ReadingRecorderOptions): ReadingRecorder {
  const recording = useRef<'off' | 'on' | 'failed'>('off');
  const finished = useRef(false);
  const left = useRef(false);
  /** Whether the reading runs, as last rendered: read when the recorder's start resolves. */
  const runsNow = useRef(running);

  useEffect(() => {
    runsNow.current = running;
    if (recording.current !== 'on') {
      return;
    }
    if (running) {
      recorder.resume();
    } else {
      recorder.pause();
    }
  }, [running, recorder]);

  const discard = () => {
    if (recording.current === 'on' && !finished.current) {
      recording.current = 'off';
      recorder
        .stop()
        .then((info) => recorder.remove(info.id))
        .catch(() => undefined);
    }
  };
  const discardOnLeave = useEffectEvent(discard);
  useEffect(() => {
    left.current = false;
    return () => {
      left.current = true;
      discardOnLeave();
    };
  }, []);

  return {
    start: () => {
      if (!enabled || recording.current !== 'off' || finished.current || left.current) {
        return;
      }
      recording.current = 'on';
      // The recorder starts a moment after the reading: held at once if the reading is not running.
      recorder.start(audio).then(
        () => {
          if (!runsNow.current) {
            recorder.pause();
          }
        },
        () => {
          recording.current = 'failed';
        },
      );
    },
    finish: async () => {
      finished.current = true;
      if (recording.current !== 'on') {
        return null;
      }
      recording.current = 'off';
      return recorder.stop().then(
        (info) => info.id,
        () => null,
      );
    },
    discard,
  };
}
