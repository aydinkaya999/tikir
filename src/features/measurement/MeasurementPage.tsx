// The weekly one-minute measurement (docs/kararlar.md P16; docs/planlar/faz-4.md, kararlar 28–35):
// the open measurement's readings one after the other, in the level check's layout. A trial week
// reads both styles; its second reading waits for the child's tap. Nothing of the result is shown
// to the child: once the last reading is stored, the road opens. No design yet. TODO(design)
import { Navigate } from 'react-router';
import { Chip } from '../../components/Chip/Chip';
import { measurementDue, measurementReadings } from '../../domain/measurement';
import { tr } from '../../i18n/tr';
import { OnboardingLayout } from '../onboarding/OnboardingLayout';
import { MeasurementReading } from '../reading/MeasurementReading';
import { childPaths } from '../session/paths';
import { useSession, useSessionStore } from '../session/sessionContext';
import { useNarrator } from '../session/useNarrator';
import styles from './MeasurementPage.module.css';

const copy = tr.measurement;
const back = { to: childPaths.road, label: tr.focus.back };

export function MeasurementPage() {
  const store = useSessionStore();
  const data = useSession((state) => state.data);
  const narrator = useNarrator();

  if (data === null) {
    // The setup guard loads the store before the road and this page open.
    return null;
  }
  const { child, parent } = data;
  if (
    !measurementDue(
      data.assessments,
      child.readingStyle,
      data.today,
      parent.consent.voiceProcessing,
    )
  ) {
    // Not open, or just made: the road (karar 35).
    return <Navigate to={childPaths.road} replace />;
  }
  const planned = measurementReadings(
    data.passages,
    data.assessments,
    child.readingStyle,
    data.today,
  );
  const reading = planned[0];
  const passage = data.passages.find((each) => each.id === reading?.passageId);
  if (reading === undefined || passage === undefined || narrator === null) {
    return <OnboardingLayout title={copy.title} back={back} companion={{ expression: 'listen' }} />;
  }
  // A trial week has two readings; a half-done one has only its second left.
  const total = child.readingStyle.trialEnabled ? 2 : 1;
  const number = total - planned.length + 1;
  const second = number === 2;

  return (
    <MeasurementReading
      // Each reading is a reading of its own: a new listener, a new minute, a new recording.
      key={`${reading.passageId}-${String(reading.trial)}`}
      passage={passage}
      style={reading.style}
      consent={parent.consent.voiceProcessing}
      narrator={narrator}
      bubble={second ? copy.nextBubble : copy.bubble}
      startOnTap={second}
      onFinish={(outcome, meta) => {
        store
          .getState()
          .saveMeasurement(outcome, { reading, ...meta })
          .catch(() => undefined);
      }}
      render={({ card, controls, bubble, problem }) => (
        <OnboardingLayout
          title={copy.title}
          back={back}
          companion={{ expression: 'listen', bubble, phone: problem }}
          action={controls}
        >
          {total > 1 && (
            <div className={styles.counter}>
              <Chip>{copy.counter(number, total)}</Chip>
            </div>
          )}
          {card}
        </OnboardingLayout>
      )}
    />
  );
}
