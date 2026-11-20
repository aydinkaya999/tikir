import { Outlet } from 'react-router';
import styles from './FocusShell.module.css';

/**
 * The focus shell (U3, U4): only the frame. Each page draws its title, way back, side column and
 * action with FocusLayout, so they follow the page's state (docs/planlar/faz-5.md, karar 36).
 */
export function FocusShell() {
  return (
    <div className={styles.shell} data-shell="focus">
      <Outlet />
    </div>
  );
}
