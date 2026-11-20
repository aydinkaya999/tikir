// How the session screens write a duration: "0:19", "1:24" (G3, G4, G5).

/**
 * Minutes and seconds of a duration, the seconds rounded down. The duration is first taken to the
 * whole millisecond, so a sum of floating-point unit times (47.0 s as 46.99999…) keeps its second.
 */
export function formatClock(ms: number): string {
  const seconds = Math.max(0, Math.floor(Math.round(ms) / 1000));
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
}
