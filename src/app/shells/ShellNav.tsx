import { NavLink } from 'react-router';
import { Icon, type IconName } from '../../components/Icon/Icon';
import { tr } from '../../i18n/tr';
import styles from './ShellNav.module.css';

export interface ShellNavItem {
  to: string;
  /** Label on the web sidebar. */
  label: string;
  /** Label on the phone bar and the tablet rail, when shorter (V1). */
  shortLabel?: string;
  icon: IconName;
}

interface ShellNavProps {
  /** Accessible name of the navigation landmark. */
  label: string;
  items: readonly ShellNavItem[];
  /** Line under the wordmark on the web sidebar (V1: "Veli alanı"). */
  subtitle?: string;
  /** Link at the foot of the rail and the sidebar (G1: parent area, V1: child screen). */
  footer?: { to: string; label: string; icon: IconName };
}

/**
 * One navigation for three layouts (docs/tasarim-sistemi.md, "Kabuklar ve kırılma noktaları"):
 * a bottom bar below 700 px, a 104 px rail up to 1199 px, a 248–272 px sidebar from 1200 px.
 */
export function ShellNav({ label, items, subtitle, footer }: ShellNavProps) {
  return (
    <nav aria-label={label} className={styles.nav} data-has-subtitle={subtitle ? '' : undefined}>
      <span className={styles.wordmark}>{tr.appName}</span>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      <ul className={styles.items}>
        {items.map((item) => (
          <li key={item.to} className={styles.slot}>
            <NavLink to={item.to} end className={styles.item}>
              <span className={styles.pill}>
                <Icon name={item.icon} className={styles.icon} />
              </span>
              <span className={styles.shortLabel}>{item.shortLabel ?? item.label}</span>
              <span className={styles.longLabel}>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      {footer && (
        <NavLink to={footer.to} end className={styles.footer}>
          <Icon name={footer.icon} size={20} />
          <span>{footer.label}</span>
        </NavLink>
      )}
    </nav>
  );
}
