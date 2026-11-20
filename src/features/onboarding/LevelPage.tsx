// K3 Seviye tespiti (docs/ekranlar.md, K3; docs/planlar/faz-3.md, kararlar 14–18): the child reads
// the grade's first measurement text for one minute of reading time (MeasurementReading). The
// reading is stored, recorded, as the first measurement. A microphone that a retry does not bring
// back lets the level check be skipped (docs/kararlar.md P14).
import type { Child, Passage } from '../../domain/types';
import { tr } from '../../i18n/tr';
import type { Narrator } from '../../services/narrator/Narrator';
import { MeasurementReading } from '../reading/MeasurementReading';
import { useSession, useSessionStore } from '../session/sessionContext';
import { useNarrator } from '../session/useNarrator';
import { OnboardingLayout } from './OnboardingLayout';

const copy = tr.onboarding.level;

export function LevelPage() {
  const setup = useSession((state) => state.setup);
  const narrator = useNarrator();
  const child = setup?.child ?? null;
  const passage = setup?.passage ?? null;
  if (setup?.step !== 'level' || child === null || passage === null) {
    // The setup guard takes any other step to its own address.
    return null;
  }
  if (narrator === null) {
    return (
      <OnboardingLayout
        step={3}
        title={copy.title}
        lead={copy.lead(child.name)}
        companion={{ expression: 'listen' }}
      />
    );
  }
  return (
    <LevelCheck
      child={child}
      passage={passage}
      narrator={narrator}
      consent={setup.parent?.consent.voiceProcessing ?? false}
    />
  );
}

interface LevelCheckProps {
  child: Child;
  passage: Passage;
  narrator: Narrator;
  consent: boolean;
}

function LevelCheck({ child, passage, narrator, consent }: LevelCheckProps) {
  const store = useSessionStore();
  return (
    <MeasurementReading
      passage={passage}
      style={child.readingStyle}
      consent={consent}
      narrator={narrator}
      bubble={copy.bubble}
      afterRetry={{
        label: copy.skip,
        onChoose: () => {
          store
            .getState()
            .skipBaseline()
            .catch(() => undefined);
        },
      }}
      onFinish={(outcome, meta) => {
        store
          .getState()
          .saveBaseline(outcome, meta)
          .catch(() => undefined);
      }}
      render={({ card, controls, bubble, problem }) => (
        <OnboardingLayout
          step={3}
          title={copy.title}
          lead={copy.lead(child.name)}
          companion={{ expression: 'listen', bubble, phone: problem }}
          action={controls}
        >
          {card}
        </OnboardingLayout>
      )}
    />
  );
}
