import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { StepTiles } from '../../components/StepTiles/StepTiles';
import { ExitDialog } from '../../features/session/ExitDialog';
import { ExitDialogContext } from '../../features/session/exitDialogState';
import { useSession } from '../../features/session/sessionContext';
import { tr } from '../../i18n/tr';
import { screenPaths } from '../routes';
import { sessionStepAt, sessionSteps } from '../sessionSteps';
import styles from './SessionShell.module.css';

const steps = sessionSteps.map((step) => ({ key: step.key, label: tr.session.steps[step.key] }));

/**
 * The session shell (G2–G7): no navigation; the exit, the step tiles, the counter and the chapter.
 * Each step draws its own body (SessionLayout). The exit asks first ("Seanstan çıkılsın mı?"),
 * except on G7, where the session is over.
 */
export function SessionShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { current, number } = sessionStepAt(pathname);
  const chapter = useSession((state) => state.data?.chapter ?? null);
  const [exitOpen, setExitOpen] = useState(false);
  const done = pathname === screenPaths.G7;
  const openExit = () => {
    setExitOpen(true);
  };

  return (
    <ExitDialogContext value={exitOpen}>
      <div className={styles.shell} data-shell="session">
        <header className={styles.header}>
          {done ? (
            <IconButton
              className={styles.close}
              icon="x"
              label={tr.session.exit}
              to={screenPaths.G1}
            />
          ) : (
            <IconButton
              className={styles.close}
              icon="x"
              label={tr.session.exit}
              onClick={openExit}
            />
          )}
          <div className={styles.brand}>
            <span className={styles.wordmark}>{tr.appName}</span>
            {chapter !== null && (
              <span className={styles.chapter}>
                {tr.session.chapterLabel(chapter.number, chapter.title)}
              </span>
            )}
          </div>
          <div className={styles.steps}>
            <StepTiles steps={steps} current={current} label={tr.session.stepsLabel} />
          </div>
          <p className={styles.counter}>{tr.session.stepCounter(number, sessionSteps.length)}</p>
          {done ? (
            <Link className={styles.exitLink} to={screenPaths.G1}>
              <Icon name="x" size={18} />
              <span>{tr.session.exit}</span>
            </Link>
          ) : (
            <button type="button" className={styles.exitLink} onClick={openExit}>
              <Icon name="x" size={18} />
              <span>{tr.session.exit}</span>
            </button>
          )}
        </header>
        <Outlet />
        <ExitDialog
          open={exitOpen}
          onStay={() => {
            setExitOpen(false);
          }}
          onLeave={() => {
            setExitOpen(false);
            void navigate(screenPaths.G1);
          }}
        />
      </div>
    </ExitDialogContext>
  );
}
