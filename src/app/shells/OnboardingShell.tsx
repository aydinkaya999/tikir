import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Companion, type CompanionExpression } from '../../components/Companion/Companion';
import { SpeechBubble } from '../../components/SpeechBubble/SpeechBubble';
import { Tile, type TilePattern } from '../../components/Tile/Tile';
import { tr } from '../../i18n/tr';
import { screenPaths } from '../routes';
import styles from './OnboardingShell.module.css';

const steps = [screenPaths.K1, screenPaths.K2, screenPaths.K3, screenPaths.K4] as const;
const stripPatterns: readonly TilePattern[] = [1, 2, 3, 4, 5, 6];

interface OnboardingShellProps {
  /** Tıkır's face and words on the cobalt panel (tablet and web). */
  companion?: { expression?: CompanionExpression; bubble?: ReactNode };
  /** The step's main action: phone bottom bar, bottom right of the content otherwise. */
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * The onboarding shell (K1–K4): four-step progress; from 700 px a cobalt panel on the left with
 * the wordmark, Tıkır and a strip of tiles. The step comes from the address.
 */
export function OnboardingShell({ companion, action, children }: OnboardingShellProps) {
  const { pathname } = useLocation();
  const index = Math.max(
    steps.findIndex((path) => path === pathname),
    0,
  );
  const step = index + 1;

  return (
    <div className={styles.shell} data-shell="onboarding">
      <div className={styles.panel}>
        <span className={styles.wordmark}>{tr.appName}</span>
        <div className={styles.companion}>
          <Companion expression={companion?.expression} size={220} label={tr.appName} />
          {companion?.bubble !== undefined && (
            <SpeechBubble arrow="top">{companion.bubble}</SpeechBubble>
          )}
        </div>
        <div className={styles.strip} aria-hidden="true">
          {stripPatterns.map((pattern) => (
            <Tile
              key={pattern}
              className={styles.stripTile}
              state="done"
              pattern={pattern}
              size={64}
            />
          ))}
        </div>
      </div>
      <div className={styles.column} data-pane="main">
        <main className={styles.main}>
          <div className={styles.progressRow}>
            <ol
              className={styles.progress}
              aria-label={tr.onboarding.progressLabel(step, steps.length)}
            >
              {steps.map((path, position) => (
                <li
                  key={path}
                  className={
                    position < index
                      ? styles.done
                      : position === index
                        ? styles.current
                        : styles.next
                  }
                />
              ))}
            </ol>
            <p className={styles.counter}>{tr.onboarding.progressCounter(step, steps.length)}</p>
          </div>
          {children ?? <Outlet />}
        </main>
        {action !== undefined && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}
