import { Outlet } from 'react-router';
import { Chip } from '../../components/Chip/Chip';
import { IconButton } from '../../components/IconButton/IconButton';
import { useSession } from '../../features/session/sessionContext';
import { tr } from '../../i18n/tr';
import { parentExtraPaths, screenPaths } from '../routes';
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

/**
 * The parent's shell (V1–V4, U2): calmer than the child's — white ground, no tiles, no Tıkır.
 * Phones and tablets show an ink strip on top with the child's chip; the web sidebar names the
 * area instead. The way back to the child screen: the rail's and the sidebar's link, and on
 * phones a button at the strip's right (docs/planlar/faz-3.md, karar 27). The account page sits
 * above it at the foot, and beside it on the strip (docs/planlar/faz-4.md, karar 37).
 */
export function ParentShell() {
  const child = useSession((state) => state.data?.child ?? null);
  const childLabel = child === null ? null : tr.nav.parent.childLabel(child.name, child.grade);
  return (
    <div className={styles.shell} data-shell="parent">
      <ShellNav
        label={tr.nav.parent.label}
        items={items}
        subtitle={tr.nav.parent.area}
        footer={[
          { to: parentExtraPaths.account, label: tr.nav.parent.account, icon: 'shield' },
          { to: screenPaths.G1, label: tr.nav.parent.childScreen, icon: 'left' },
        ]}
      />
      <div className={styles.column}>
        <div className={styles.strip}>
          <span className={styles.stripTitle}>{tr.nav.parent.area}</span>
          <div className={styles.stripEnd}>
            {childLabel !== null && <Chip icon="user">{childLabel}</Chip>}
            {/* TODO(design): the phone strip's account button and way out are not drawn. */}
            <IconButton
              className={styles.exit}
              to={parentExtraPaths.account}
              icon="shield"
              label={tr.nav.parent.account}
              size={44}
            />
            <IconButton
              className={styles.exit}
              to={screenPaths.G1}
              icon="left"
              label={tr.nav.parent.childScreen}
              size={44}
            />
          </div>
        </div>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
