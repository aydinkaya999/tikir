import type { ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

export type IconButtonSize = 44 | 46 | 48 | 52;

interface IconButtonOwnProps {
  icon: IconName;
  /** The accessible name; the icon itself is decorative. */
  label: string;
  /** Diameter in pixels: 44 and 48 for close/back, 46 and 52 for session controls. */
  size?: IconButtonSize;
  /** Icon size; by default 20, 20, 22 and 24 px for the four diameters. */
  iconSize?: number;
  tone?: 'white' | 'saffron';
  /** Raised controls (the session control bar) carry the button lift. */
  raised?: boolean;
  className?: string;
}

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  keyof IconButtonOwnProps | 'children' | 'aria-label'
>;

export type IconButtonProps = IconButtonOwnProps &
  ((NativeButtonProps & { to?: undefined }) | { to: string });

const defaultIconSize: Record<IconButtonSize, number> = { 44: 20, 46: 20, 48: 22, 52: 24 };

export function IconButton({
  icon,
  label,
  size = 44,
  iconSize,
  tone = 'white',
  raised = false,
  className,
  ...rest
}: IconButtonProps) {
  const classes = [
    styles.iconButton,
    styles[`size${String(size)}`],
    tone === 'saffron' ? styles.saffron : '',
    raised ? styles.raised : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const glyph = <Icon name={icon} size={iconSize ?? defaultIconSize[size]} />;

  if (rest.to !== undefined) {
    return (
      <Link to={rest.to} className={classes} aria-label={label}>
        {glyph}
      </Link>
    );
  }
  return (
    <button type="button" {...rest} className={classes} aria-label={label}>
      {glyph}
    </button>
  );
}
