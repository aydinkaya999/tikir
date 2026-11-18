import { Outlet } from 'react-router';
import { Chip } from '../../components/Chip/Chip';
import { tr } from '../../i18n/tr';
import { screenPaths } from '../routes';
import styles from './ParentShell.module.css';
import { ShellNav, type ShellNavItem } from './ShellNav';

const items: readonly ShellNavItem[] = [
  { to: screenPaths.V1, label: tr.nav.parent.summary, icon: 'chart' },
  {
    to: screenPaths.V2,
    label: tr.nav.parent.stuckWords.long,
    shortLabel: tr.nav.parent.stuckWords.short,
    icon: 'target',
  },
  { to: screenPaths.V3, label: tr.nav.parent.assessment, icon: 'clock' },
  {
    to: screenPaths.V4,
    label: tr.nav.parent.readingStyle.long,
    shortLabel: tr.nav.parent.readingStyle.short,
    icon: 'type',
  },
  { to: screenPaths.U2, label: tr.nav.parent.books, icon: 'book' },
];

interface ParentShellProps {
  /** Child chip of the top strip, e.g. "Deniz, 3. sınıf"; comes with the profile (phase 3). */
  childLabel?: string;
}

/**
 * The parent's shell (V1–V4, U2): calmer than the child's — white ground, no tiles, no Tıkır.
 * Phones and tablets show an ink strip on top; the web sidebar names the area instead.
 */
export function ParentShell({ childLabel }: ParentShellProps) {
  return (
    <div className={styles.shell} data-shell="parent">
      <ShellNav
        label={tr.nav.parent.label}
        items={items}
        subtitle={tr.nav.parent.area}
        footer={{ to: screenPaths.G1, label: tr.nav.parent.childScreen, icon: 'left' }}
      />
      <div className={styles.column}>
        <div className={styles.strip}>
          <span className={styles.stripTitle}>{tr.nav.parent.area}</span>
          {childLabel && <Chip icon="user">{childLabel}</Chip>}
        </div>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
