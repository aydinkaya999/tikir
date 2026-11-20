// The setup steps not built yet (docs/planlar/faz-3.md, Tasks 8–12): each draws its layout at its
// step, so the shell stays whole while the screens arrive one by one.
import { OnboardingLayout } from './OnboardingLayout';

/** K3 Seviye tespiti. */
export function LevelAssessmentPage() {
  return <OnboardingLayout step={3} companion={{}} />;
}

/** K4 Tıkır ile tanışma. */
export function MeetCompanionPage() {
  return <OnboardingLayout step={4} companion={{}} />;
}
