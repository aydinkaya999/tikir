import type { ReactNode } from 'react';
import { Companion, type CompanionExpression } from '../../components/Companion/Companion';
import { SpeechBubble } from '../../components/SpeechBubble/SpeechBubble';
import { tr } from '../../i18n/tr';
import styles from './SessionLayout.module.css';

interface SessionLayoutProps {
  /** The step's title (G2–G7): "Isınma", "Oku", "Bugünlük bitti"… */
  title: string;
  /** The chip beside the title: "3 kelime", "2. okuma / 3"… */
  chip?: ReactNode;
  /** Tıkır's face and speech for the moment. */
  companion: { expression: CompanionExpression; bubble?: ReactNode };
  /** The step's controls: the phone's bottom bar, the foot of the side column on wider screens. */
  controls?: ReactNode;
  children?: ReactNode;
}

/**
 * The body of a session step (G2–G7): the content column with its title, Tıkır and the controls.
 * The shell above it holds the exit, the step tiles and the counter.
 */
export function SessionLayout({ title, chip, companion, controls, children }: SessionLayoutProps) {
  return (
    <main className={styles.body}>
      <div className={styles.content} data-pane="main">
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {chip}
        </div>
        {children}
      </div>
      <div className={styles.companion}>
        <Companion
          className={styles.face}
          expression={companion.expression}
          size={190}
          label={tr.appName}
        />
        {companion.bubble !== undefined && (
          <SpeechBubble className={styles.bubble} arrow="adaptive" live>
            {companion.bubble}
          </SpeechBubble>
        )}
      </div>
      {controls !== undefined && <div className={styles.controls}>{controls}</div>}
    </main>
  );
}
