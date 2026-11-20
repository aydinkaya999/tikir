import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { tr } from '../../i18n/tr';
import styles from './FocusLayout.module.css';
import { libraryPaths } from './paths';

interface FocusLayoutProps {
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
 * A focus page's layout (U3, U4) inside the focus frame (docs/planlar/faz-5.md, karar 36): no
 * navigation, a back button and the title; the web adds a white top bar with the wordmark and a
 * way to the library. The page fills the side column and the action, so they follow its state.
 */
export function FocusLayout({
  title,
  subtitle,
  backTo,
  aside,
  action,
  children,
}: FocusLayoutProps) {
  return (
    <>
      <div className={styles.topBar}>
        <span className={styles.wordmark}>{tr.appName}</span>
        <Link className={styles.libraryLink} to={libraryPaths.library}>
          <Icon name="book" size={18} />
          <span>{tr.nav.child.library}</span>
        </Link>
      </div>
      <main className={styles.body}>
        <div className={styles.header}>
          <IconButton className={styles.back} icon="left" label={tr.focus.back} to={backTo} />
          <div className={styles.titles}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.content} data-pane="main">
          {children}
        </div>
        {aside !== undefined && (
          <div className={styles.aside} data-focus="aside">
            {aside}
          </div>
        )}
        {action !== undefined && (
          <div className={styles.action} data-focus="action">
            {action}
          </div>
        )}
      </main>
    </>
  );
}
