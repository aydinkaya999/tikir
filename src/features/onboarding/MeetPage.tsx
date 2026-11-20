// K4 Tıkır ile tanışma (docs/ekranlar.md, K4; docs/planlar/faz-3.md, kararlar 19–21): the first
// measurement, the first goal and the program; without a measurement only Tıkır's greeting and the
// daily chapter. "İlk bölüme başla" ends the setup and opens the road.
import { useId } from 'react';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Icon } from '../../components/Icon/Icon';
import { goalWeeks, sessionMinutes } from '../../domain/config';
import { firstTarget } from '../../domain/goals';
import { withGenitiveSuffix } from '../../domain/text';
import type { Assessment } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { useSession, useSessionStore } from '../session/sessionContext';
import styles from './MeetPage.module.css';
import { OnboardingLayout } from './OnboardingLayout';

const copy = tr.onboarding.meet;
const iconSize = 22;
const iconStroke = 2.2;

export function MeetPage() {
  const store = useSessionStore();
  const setup = useSession((state) => state.setup);
  const child = setup?.child ?? null;
  if (setup?.step !== 'meet' || child === null) {
    // The setup guard takes any other step to its own address.
    return null;
  }
  const consent = setup.parent?.consent.voiceProcessing ?? false;
  const baseline = setup.baseline;
  const start = () => {
    store
      .getState()
      .finishSetup()
      .catch(() => undefined);
  };

  return (
    <OnboardingLayout
      step={4}
      title={copy.title}
      lead={baseline === null ? undefined : copy.lead(withGenitiveSuffix(child.name))}
      // Without the consent Tıkır cannot say he listens (karar 21).
      companion={{
        expression: 'happy',
        bubble: consent ? copy.bubble(child.name) : copy.unheardBubble(child.name),
        phone: true,
      }}
      action={
        <Button size="large" icon="play" onClick={start}>
          {copy.start}
        </Button>
      }
    >
      <div className={styles.content}>
        {baseline !== null && <Baseline baseline={baseline} />}
        <ul className={styles.program}>
          <li>
            <Icon name="clock" size={iconSize} strokeWidth={iconStroke} />
            <span>{copy.daily(sessionMinutes)}</span>
          </li>
          {baseline !== null && (
            <>
              <li>
                <Icon name="repeat" size={iconSize} strokeWidth={iconStroke} />
                <span>{copy.warmup}</span>
              </li>
              <li>
                <Icon name="chart" size={iconSize} strokeWidth={iconStroke} />
                <span>{copy.weekly}</span>
              </li>
            </>
          )}
        </ul>
      </div>
    </OnboardingLayout>
  );
}

/** The first measurement and the goal it sets (karar 19). */
function Baseline({ baseline }: { baseline: Assessment }) {
  const goalId = useId();
  const { wcpm, accuracy } = baseline.result;
  const target = firstTarget(wcpm);
  // The child sees K4 too: the frustration level gets no name here (karar 20; V3 shows it).
  const level = baseline.level === 'frustration' ? null : copy.levels[baseline.level];

  return (
    <>
      <div className={styles.result}>
        <p className={styles.score}>
          <span className={styles.number}>{wcpm}</span>
          <span className={styles.unit}>
            <span>{copy.words}</span>
            <span>{copy.perMinute}</span>
          </span>
        </p>
        <div className={styles.chips}>
          <Chip>{copy.accuracy(Math.round(accuracy * 100))}</Chip>
          {level !== null && <Chip>{level}</Chip>}
        </div>
      </div>
      <section className={styles.goal} aria-labelledby={goalId}>
        <div className={styles.goalHead}>
          <Icon name="target" size={24} strokeWidth={iconStroke} />
          <h2 id={goalId} className={styles.goalTitle}>
            {copy.goal(goalWeeks, target)}
          </h2>
        </div>
        <div className={styles.goalLine} aria-hidden="true">
          <span className={styles.today} />
          <span className={styles.dash} />
          <span className={styles.target} />
        </div>
        <div className={styles.goalLabels}>
          <p>{copy.today(wcpm)}</p>
          <p>{copy.goalWeek(goalWeeks, target)}</p>
        </div>
      </section>
    </>
  );
}
