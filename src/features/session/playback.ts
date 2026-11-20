// A stored recording and its playback, on G5 and in the studio (docs/planlar/faz-2b.md, kararlar
// 15 ve 18).
import { useEffect, useRef, useState } from 'react';
import type { Id } from '../../domain/types';
import type { PlaybackRange, Recorder, RecordingInfo } from '../../services/recorder/Recorder';

/** How often the playback's progress is read. */
const playbackTickMs = 100;

/** The stored recording: undefined while it loads, null when there is none. */
export function useRecording(recorder: Recorder, id: Id | null): RecordingInfo | null | undefined {
  const [loaded, setLoaded] = useState<{ info: RecordingInfo | null } | null>(null);
  useEffect(() => {
    if (id === null) {
      return undefined;
    }
    let current = true;
    recorder.get(id).then(
      (info) => {
        if (current) {
          setLoaded({ info });
        }
      },
      () => {
        if (current) {
          setLoaded({ info: null });
        }
      },
    );
    return () => {
      current = false;
    };
  }, [recorder, id]);
  return id === null ? null : loaded?.info;
}

/**
 * The recording's playback. The player gives no position, so the progress comes from the time
 * since the tap (docs/planlar/faz-2b.md, karar 15). Leaving the screen stops it.
 */
export function usePlayback(recorder: Recorder) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  // Every play and stop is a new playback; an older one ending changes nothing.
  const playback = useRef(0);
  const playing = useRef(false);

  useEffect(() => {
    if (startedAt === null) {
      return undefined;
    }
    const timer = setInterval(() => {
      setNow(performance.now());
    }, playbackTickMs);
    return () => {
      clearInterval(timer);
    };
  }, [startedAt]);

  useEffect(
    () => () => {
      if (playing.current) {
        playing.current = false;
        recorder.stopPlayback();
      }
    },
    [recorder],
  );

  /**
   * Call from the tap: the recorder prepares the player before its first await. A range plays
   * only that part (V2: one word).
   */
  const play = (id: Id, range?: PlaybackRange) => {
    playback.current += 1;
    const current = playback.current;
    const at = performance.now();
    playing.current = true;
    setStartedAt(at);
    setNow(at);
    (range === undefined ? recorder.play(id) : recorder.play(id, range))
      .catch(() => undefined)
      .finally(() => {
        if (playback.current === current) {
          playing.current = false;
          setStartedAt(null);
        }
      });
  };

  const stop = () => {
    playback.current += 1;
    playing.current = false;
    setStartedAt(null);
    recorder.stopPlayback();
  };

  return {
    playing: startedAt !== null,
    elapsedMs: startedAt === null ? null : Math.max(0, now - startedAt),
    play,
    stop,
  };
}
