// Round-trip statistics for the echo test (docs/dinleme-hatti.md, section 5: median and
// 95th percentile).

export interface RoundTripSummary {
  sent: number;
  received: number;
  /** Frames that never came back within the grace period. */
  lost: number;
  medianMs: number | null;
  p95Ms: number | null;
  minMs: number | null;
  maxMs: number | null;
}

/** Nearest-rank percentile of an ascending list: the value at rank ceil(p / 100 × n). */
export function percentile(sortedValues: readonly number[], p: number): number {
  const rank = Math.max(1, Math.ceil((p / 100) * sortedValues.length));
  const value = sortedValues[Math.min(rank, sortedValues.length) - 1];
  if (value === undefined) {
    throw new RangeError('percentile of an empty list');
  }
  return value;
}

export function summarizeRoundTrips(
  roundTripsMs: readonly number[],
  sent: number,
): RoundTripSummary {
  const sorted = [...roundTripsMs].sort((a, b) => a - b);
  const received = sorted.length;
  if (received === 0) {
    return { sent, received, lost: sent, medianMs: null, p95Ms: null, minMs: null, maxMs: null };
  }
  return {
    sent,
    received,
    lost: Math.max(0, sent - received),
    medianMs: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    minMs: sorted[0] ?? null,
    maxMs: sorted[received - 1] ?? null,
  };
}
