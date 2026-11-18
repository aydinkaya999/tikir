import type { ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './MicButton.module.css';

export type MicState = 'listening' | 'paused' | 'denied';
export type MicButtonSize = 64 | 72 | 76 | 84;

interface MicButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label'
> {
  state: MicState;
  /** The button's name for each state; it always says what is happening (G4). */
  labels: Readonly<Record<MicState, string>>;
  /** 76 px on phones and 84 px on tablet and web in the session; 64 and 72 px in K3. */
  size?: MicButtonSize;
}

const iconSize: Record<MicButtonSize, number> = { 64: 28, 72: 32, 76: 34, 84: 38 };

/**
 * The big microphone button. Listening: turquoise with a double ring (design). Paused and
 * permission-denied looks are not drawn (TODO(design)); see docs/planlar/faz-0.md, decision 5.
 */
export function MicButton({ state, labels, size = 76, className, ...rest }: MicButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      aria-label={labels[state]}
      className={[styles.mic, styles[state], styles[`size${String(size)}`], className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      <Icon name="mic" size={iconSize[size]} strokeWidth={2.4} />
    </button>
  );
}
