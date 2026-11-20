import { Outlet } from 'react-router';
import styles from './OnboardingShell.module.css';

/**
 * The setup's shell (K1–K4): only the frame. Each step draws its panel, progress and action with
 * OnboardingLayout, as the session's steps draw theirs with SessionLayout.
 */
export function OnboardingShell() {
  return (
    <div className={styles.shell} data-shell="onboarding">
      <Outlet />
    </div>
  );
}
