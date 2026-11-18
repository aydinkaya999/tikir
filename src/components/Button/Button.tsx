import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'saffron' | 'secondary' | 'dark' | 'danger';
export type ButtonSize = 'regular' | 'large';

interface ButtonOwnProps {
  /** primary = cobalt, saffron, secondary = white, dark = ink, danger = dark coral. */
  variant?: ButtonVariant;
  /** regular is 52 px tall, large 60 px. */
  size?: ButtonSize;
  icon?: IconName;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>;

export type ButtonProps = ButtonOwnProps &
  ((NativeButtonProps & { to?: undefined }) | { to: string });

export function Button({
  variant = 'primary',
  size = 'regular',
  icon,
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    size === 'large' ? styles.large : '',
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {icon && <Icon name={icon} size={22} />}
      <span>{children}</span>
    </>
  );

  if (rest.to !== undefined) {
    return (
      <Link to={rest.to} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" {...rest} className={classes}>
      {content}
    </button>
  );
}
