import type { ReactNode } from 'react';
import { Link, Outlet } from 'react-router';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { tr } from '../../i18n/tr';
import { screenPaths } from '../routes';
import styles from './FocusShell.module.css';

interface FocusShellProps {
  title: string;
  /** Shown from 700 px (U3, U4). */
  subtitle?: string;
  /** Where the back button leads. */
  backTo: string;
  /** Side column from 700 px (Tıkır and its bubble); after the content on phones. */
  aside?: ReactNode;
  /** The main action: phone bottom bar, foot of the side column on wider screens. */
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * The focus shell (U3, U4): no navigation, a back button and the title; the web adds a white top
 * bar with the wordmark and a way back to the library.
 */
export function FocusShell({ title, subtitle, backTo, aside, action, children }: FocusShellProps) {
  return (
    <div className={styles.shell} data-shell="focus">
      <div className={styles.topBar}>
        <span className={styles.wordmark}>{tr.appName}</span>
        <Link className={styles.libraryLink} to={screenPaths.U1}>
          <Icon name="book" size={18} />
          <span>{tr.nav.child.library}</span>
        </Link>
      </div>
      <main className={styles.body}>
        <div className={styles.header}>
          <IconButton className={styles.back} icon="left" label={tr.focus.back} to={backTo} />
          <div className={styles.titles}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.content} data-pane="main">
          {children ?? <Outlet />}
        </div>
        {aside !== undefined && <div className={styles.aside}>{aside}</div>}
        {action !== undefined && <div className={styles.action}>{action}</div>}
      </main>
    </div>
  );
}
