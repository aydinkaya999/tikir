import { Outlet } from 'react-router';
import styles from './OnboardingShell.module.css';

/**
 * The setup's shell (K1–K4): only the frame. Each step draws its panel, progress and action with
 * OnboardingLayout, as the session's steps draw theirs with SessionLayout. The weekly measurement
 * borrows the frame and the layout of the level check (docs/planlar/faz-4.md, karar 32).
 */
export function OnboardingShell({ name = 'onboarding' }: { name?: 'onboarding' | 'measurement' }) {
  return (
    <div className={styles.shell} data-shell={name}>
      <Outlet />
    </div>
  );
}
