// The showcase's demo profile section (docs/planlar/faz-2a.md, karar 13): two buttons that set up
// the designs' sample child, and what the repository holds.
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import type { LocalDate } from '../../../domain/types';
import type { Repository } from '../../../services/repository/Repository';
import { copy } from './copy';
import styles from './DemoProfileSection.module.css';
import { type DemoMode, demoModes, loadDemoProfile } from './loadDemoProfile';

export interface DemoProfileSectionProps {
  repository: () => Promise<Repository>;
  today: () => LocalDate;
}

interface Counts {
  sessions: number;
  stuckWords: number;
  assessments: number;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'loaded'; mode: DemoMode }
  | { kind: 'failed'; name: string; message: string };

const everyDay = ['0000-01-01', '9999-12-31'] as const;

async function countsOf(repository: Repository): Promise<Counts> {
  const [sessions, stuckWords, assessments] = await Promise.all([
    repository.listSessions(...everyDay),
    repository.listStuckWords(),
    repository.listAssessments(),
  ]);
  return {
    sessions: sessions.length,
    stuckWords: stuckWords.length,
    assessments: assessments.length,
  };
}

function failure(error: unknown): Status {
  return error instanceof Error
    ? { kind: 'failed', name: error.name, message: error.message }
    : { kind: 'failed', name: 'Error', message: String(error) };
}

function statusText(status: Status): string {
  switch (status.kind) {
    case 'idle':
      return '';
    case 'loading':
      return copy.loading;
    case 'loaded':
      return copy.loaded(copy.modes[status.mode]);
    case 'failed':
      return copy.failed(status.name, status.message);
  }
}

function countsText(counts: Counts | null): string {
  if (counts === null) {
    return '';
  }
  if (counts.sessions === 0 && counts.stuckWords === 0 && counts.assessments === 0) {
    return copy.empty;
  }
  return copy.counts(counts.sessions, counts.stuckWords, counts.assessments);
}

export function DemoProfileSection({ repository, today }: DemoProfileSectionProps) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const readCounts = useCallback(async () => countsOf(await repository()), [repository]);

  useEffect(() => {
    let active = true;
    readCounts().then(
      (found) => {
        if (active) {
          setCounts(found);
        }
      },
      (error: unknown) => {
        if (active) {
          setStatus(failure(error));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [readCounts]);

  async function load(mode: DemoMode) {
    setStatus({ kind: 'loading' });
    try {
      const opened = await repository();
      await loadDemoProfile(opened, mode, today());
      setCounts(await countsOf(opened));
      setStatus({ kind: 'loaded', mode });
    } catch (error) {
      setStatus(failure(error));
    }
  }

  const message = statusText(status);
  const summary = countsText(counts);
  return (
    <section className={styles.section} aria-labelledby="demo-profile-heading">
      <h2 className={styles.heading} id="demo-profile-heading">
        {copy.heading}
      </h2>
      <p className={styles.text}>{copy.description}</p>
      <div className={styles.actions}>
        {demoModes.map((mode) => (
          <Button
            key={mode}
            variant="secondary"
            disabled={status.kind === 'loading'}
            onClick={() => {
              void load(mode);
            }}
          >
            {copy.modes[mode]}
          </Button>
        ))}
      </div>
      <div className={styles.status} role="status">
        {message !== '' && (
          <p className={status.kind === 'failed' ? styles.failure : undefined}>{message}</p>
        )}
        {summary !== '' && <p>{summary}</p>}
      </div>
    </section>
  );
}
