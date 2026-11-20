// The body of a setup step (docs/ekranlar.md, "İlk kurulum"; docs/planlar/faz-3.md, karar 6): from
// 1000 px a cobalt panel with the wordmark, Tıkır and a strip of tiles; the four-step progress, the
// step's content and its action. Below 1000 px the phone layout: no panel, the action at the foot.
import type { ReactNode } from 'react';
import { Companion, type CompanionExpression } from '../../components/Companion/Companion';
import { SpeechBubble } from '../../components/SpeechBubble/SpeechBubble';
import { Tile, type TilePattern } from '../../components/Tile/Tile';
import { tr } from '../../i18n/tr';
import styles from './OnboardingLayout.module.css';

const stepCount = 4;
const stripPatterns: readonly TilePattern[] = [1, 2, 3, 4, 5, 6];

interface OnboardingLayoutProps {
  step: 1 | 2 | 3 | 4;
  /** The step's heading and the line under it: every setup step draws them alike. */
  title?: string;
  lead?: ReactNode;
  /**
   * Tıkır's face and words on the cobalt panel. phone: below 1000 px, where the panel is hidden,
   * Tıkır and his words come at the head of the content too (K4 telefon; K3's microphone problem).
   */
  companion: { expression?: CompanionExpression; bubble?: ReactNode; phone?: boolean };
  /** The step's main action: the foot bar below 1000 px, bottom right of the content above. */
  action?: ReactNode;
  children?: ReactNode;
}

export function OnboardingLayout({
  step,
  title,
  lead,
  companion,
  action,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.panel} data-pane="panel">
        <span className={styles.wordmark}>{tr.appName}</span>
        <div className={styles.companion}>
          <Companion expression={companion.expression} size={220} label={tr.appName} />
          {companion.bubble !== undefined && (
            <SpeechBubble arrow="top" live>
              {companion.bubble}
            </SpeechBubble>
          )}
        </div>
        <div className={styles.strip} aria-hidden="true">
          {stripPatterns.map((pattern) => (
            <Tile
              key={pattern}
              className={styles.stripTile}
              state="done"
              pattern={pattern}
              size={64}
            />
          ))}
        </div>
      </div>
      <div className={styles.column} data-pane="main">
        <main className={styles.main}>
          <div className={styles.progressRow}>
            <ol
              className={styles.progress}
              aria-label={tr.onboarding.progressLabel(step, stepCount)}
            >
              {Array.from({ length: stepCount }, (_, index) => (
                <li
                  key={index}
                  className={
                    index + 1 < step
                      ? styles.done
                      : index + 1 === step
                        ? styles.current
                        : styles.next
                  }
                />
              ))}
            </ol>
            <p className={styles.counter}>{tr.onboarding.progressCounter(step, stepCount)}</p>
          </div>
          {title !== undefined && (
            <div className={styles.head}>
              <h1 className={styles.title}>{title}</h1>
              {lead !== undefined && <p className={styles.lead}>{lead}</p>}
            </div>
          )}
          {companion.phone === true && companion.bubble !== undefined && (
            // K4 telefon draws this row; K3's microphone problem borrows it (TODO(design)).
            <div className={styles.phoneCompanion}>
              <Companion
                className={styles.phoneFace}
                expression={companion.expression}
                size={96}
                label={tr.appName}
              />
              <SpeechBubble className={styles.phoneBubble} live>
                {companion.bubble}
              </SpeechBubble>
            </div>
          )}
          {children}
        </main>
        {action !== undefined && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}
