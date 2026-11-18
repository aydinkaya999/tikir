import { MicButton, type MicState } from '../../../components/MicButton/MicButton';
import { StepTiles } from '../../../components/StepTiles/StepTiles';
import { tr } from '../../../i18n/tr';
import { Row, Section } from './Section';

const steps = (Object.keys(tr.session.steps) as (keyof typeof tr.session.steps)[]).map((key) => ({
  key,
  label: tr.session.steps[key],
}));

export function StepTilesDemo() {
  return (
    <Section name="StepTiles">
      <Row label="current = 0 … 4 (names from 700 px)">
        {steps.map((step, index) => (
          <StepTiles key={step.key} steps={steps} current={index} label={tr.session.stepsLabel} />
        ))}
      </Row>
      <Row label="current = null (session over, G7)">
        <StepTiles steps={steps} current={null} label={tr.session.stepsLabel} />
      </Row>
    </Section>
  );
}

const states: MicState[] = ['listening', 'paused', 'denied'];

export function MicButtonDemo() {
  return (
    <Section name="MicButton">
      <Row label="state: listening · paused (not drawn) · denied (not drawn) — size 84">
        {states.map((state) => (
          <MicButton key={state} state={state} labels={tr.mic} size={84} />
        ))}
      </Row>
      <Row label="size: 64 · 72 (K3) · 76 (G4 telefon) · 84 (G4)">
        {([64, 72, 76, 84] as const).map((size) => (
          <MicButton key={size} state="listening" labels={tr.mic} size={size} />
        ))}
      </Row>
    </Section>
  );
}
