import { Outlet } from 'react-router';
import { tr } from '../../i18n/tr';
import { extraPaths, screenPaths } from '../routes';
import styles from './ChildShell.module.css';
import { ShellNav, type ShellNavItem } from './ShellNav';

const items: readonly ShellNavItem[] = [
  { to: screenPaths.G1, label: tr.nav.child.road, icon: 'route' },
  { to: screenPaths.U1, label: tr.nav.child.library, icon: 'book' },
  { to: extraPaths.album, label: tr.nav.child.album, icon: 'grid' },
  { to: extraPaths.studio, label: tr.nav.child.studio, icon: 'headphones' },
];

/**
 * The child's shell (G1, U1, Albüm, Stüdyo). The parent area is reached from the rail's and the
 * sidebar's link, and on phones from G1's lock button (docs/planlar/faz-3.md, karar 27).
 */
export function ChildShell() {
  return (
    <div className={styles.shell} data-shell="child">
      <ShellNav
        label={tr.nav.child.label}
        items={items}
        footer={[{ to: screenPaths.V1, label: tr.nav.child.parentArea, icon: 'lock' }]}
      />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
