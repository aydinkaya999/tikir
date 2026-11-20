// G5's waveform (docs/planlar/faz-2b.md, karar 15): the recording's levels as bars. While the
// recording plays, the played bars are saffron; otherwise every bar is light turquoise.
import styles from './Waveform.module.css';
import { waveformBars } from './waveformBars';

/** The loudest bar's share of the waveform's height, as in the design (87 of 96 px, 98 of 104). */
const loudestPercent = 92;

interface WaveformProps {
  levels: readonly number[];
  /** The design's bars: 26 on the phone, 36 on the tablet and the web. */
  count: 26 | 36;
  /** 0 to 1 while the recording plays, null when it does not. */
  progress: number | null;
}

export function Waveform({ levels, count, progress }: WaveformProps) {
  const played = progress === null ? 0 : Math.round(progress * count);
  return (
    <div className={styles.waveform} data-bars={count} aria-hidden="true">
      {waveformBars(levels, count).map((level, index) => (
        <span
          // The bars never move: the index is their identity.
          key={index}
          className={styles.bar}
          style={{ height: `${String(Math.min(1, Math.max(0, level)) * loudestPercent)}%` }}
          data-played={index < played ? '' : undefined}
        />
      ))}
    </div>
  );
}
