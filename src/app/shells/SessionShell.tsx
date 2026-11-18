import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Companion, type CompanionExpression } from '../../components/Companion/Companion';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { SpeechBubble } from '../../components/SpeechBubble/SpeechBubble';
import { StepTiles } from '../../components/StepTiles/StepTiles';
import { tr } from '../../i18n/tr';
import { screenPaths } from '../routes';
import { sessionStepAt, sessionSteps } from '../sessionSteps';
import styles from './SessionShell.module.css';

interface SessionShellProps {
  /** E.g. "Bölüm 4: Dar Patika" (tablet and web header); comes with the session (phase 2). */
  chapterLabel?: string;
  /** Tıkır's face and speech for the current moment. */
  companion?: { expression?: CompanionExpression; bubble?: ReactNode };
  /** The step's controls: phone bottom bar, foot of the side column on wider screens. */
  controls?: ReactNode;
  children?: ReactNode;
}

const steps = sessionSteps.map((step) => ({ key: step.key, label: tr.session.steps[step.key] }));

/**
 * The session shell (G2–G7): no navigation; exit, step tiles, counter, Tıkır and the control
 * bar. The step comes from the address. TODO(design): the exit asks "Seanstan çıkılsın mı?"
 * from phase 2 on; for now it goes straight to the road.
 */
export function SessionShell({ chapterLabel, companion, controls, children }: SessionShellProps) {
  const { pathname } = useLocation();
  const { current, number } = sessionStepAt(pathname);

  return (
    <div className={styles.shell} data-shell="session">
      <header className={styles.header}>
        <IconButton className={styles.close} icon="x" label={tr.session.exit} to={screenPaths.G1} />
        <div className={styles.brand}>
          <span className={styles.wordmark}>{tr.appName}</span>
          {chapterLabel && <span className={styles.chapter}>{chapterLabel}</span>}
        </div>
        <div className={styles.steps}>
          <StepTiles steps={steps} current={current} label={tr.session.stepsLabel} />
        </div>
        <p className={styles.counter}>{tr.session.stepCounter(number, sessionSteps.length)}</p>
        <Link className={styles.exitLink} to={screenPaths.G1}>
          <Icon name="x" size={18} />
          <span>{tr.session.exit}</span>
        </Link>
      </header>
      <main className={styles.body}>
        <div className={styles.content} data-pane="main">
          {children ?? <Outlet />}
        </div>
        <div className={styles.companion}>
          <Companion
            className={styles.face}
            expression={companion?.expression}
            size={190}
            label={tr.appName}
          />
          {companion?.bubble !== undefined && (
            <SpeechBubble className={styles.bubble} arrow="adaptive" live>
              {companion.bubble}
            </SpeechBubble>
          )}
        </div>
        {controls !== undefined && <div className={styles.controls}>{controls}</div>}
      </main>
    </div>
  );
}
