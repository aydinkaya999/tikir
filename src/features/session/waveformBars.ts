// G5's waveform (docs/planlar/faz-2b.md, karar 15): the recording's 64 levels drawn as the design's
// bars, 26 on the phone and 36 on the tablet and the web.

/** Splits the levels into `count` groups in order and keeps each group's loudest level. */
export function waveformBars(levels: readonly number[], count: number): number[] {
  if (levels.length === 0) {
    return Array.from({ length: count }, () => 0);
  }
  return Array.from({ length: count }, (_, bar) => {
    const start = Math.floor((bar * levels.length) / count);
    const end = Math.max(start + 1, Math.floor(((bar + 1) * levels.length) / count));
    return Math.max(...levels.slice(start, end));
  });
}
