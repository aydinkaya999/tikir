import type { ReactNode } from 'react';
import { Companion, type CompanionExpression } from '../../components/Companion/Companion';
import { SpeechBubble } from '../../components/SpeechBubble/SpeechBubble';
import { tr } from '../../i18n/tr';
import styles from './FocusCompanion.module.css';

interface FocusCompanionProps {
  expression?: CompanionExpression;
  /** Tıkır's words: a polite live region, they follow the page. */
  children: ReactNode;
  className?: string;
}

/**
 * Tıkır and his words in a focus page's side column (U3, U4): beside each other on phones, Tıkır
 * above his bubble from 700 px.
 */
export function FocusCompanion({ expression = 'happy', children, className }: FocusCompanionProps) {
  return (
    <div className={[styles.companion, className ?? ''].filter(Boolean).join(' ')}>
      <Companion className={styles.face} expression={expression} size={170} label={tr.appName} />
      <SpeechBubble className={styles.bubble} arrow="adaptive" live>
        {children}
      </SpeechBubble>
    </div>
  );
}
