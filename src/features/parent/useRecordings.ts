// The stored recordings for V2's approvals and the account page (docs/planlar/faz-4.md, kararlar
// 21 and 36): read from the recorder, read again after a change.
import { useCallback, useEffect, useState } from 'react';
import type { Recorder, RecordingEntry } from '../../services/recorder/Recorder';

/** null while the list loads or when it cannot be read. */
export function useRecordings(recorder: Recorder) {
  const [recordings, setRecordings] = useState<RecordingEntry[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true;
    recorder.list().then(
      (listed) => {
        if (current) {
          setRecordings(listed);
        }
      },
      () => {
        if (current) {
          setRecordings(null);
        }
      },
    );
    return () => {
      current = false;
    };
  }, [recorder, version]);

  const refresh = useCallback(() => {
    setVersion((each) => each + 1);
  }, []);

  return { recordings, refresh };
}
