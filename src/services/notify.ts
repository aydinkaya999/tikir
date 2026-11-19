// Calling subscribers without letting one break the others (Faz 1 review, finding 5).

/**
 * Calls every listener; one that throws is reported (reportError, else console.error) and the
 * rest still run.
 */
export function notifyAll<T>(listeners: Iterable<(value: T) => void>, value: T): void {
  for (const listener of [...listeners]) {
    try {
      listener(value);
    } catch (error) {
      report(error);
    }
  }
}

function report(error: unknown): void {
  const global = globalThis as { reportError?: unknown };
  if (typeof global.reportError === 'function') {
    (global.reportError as (error: unknown) => void)(error);
  } else {
    console.error(error);
  }
}
