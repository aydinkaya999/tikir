// Prepares the setup at one of its steps (docs/planlar/faz-3.md, karar 5) with the demo profile's
// parent, reader and first measurement, written through the store's own setup actions. The store
// is expected empty.
import { chapterTokens, passageChapter } from '../../../domain/text';
import { simulateReading, toWordResults } from '../../../services/listener/simulateReading';
import { createSessionStore, type SessionStoreServices } from '../../session/sessionStore';
import { demoSetupSeed } from '../demo/loadDemoProfile';
import { type SetupParam, setupParams } from './devParams';

export async function prepareSetupStep(
  services: SessionStoreServices,
  step: SetupParam,
  options: { consent: boolean },
): Promise<void> {
  const seed = demoSetupSeed();
  const store = createSessionStore(services);
  const state = () => store.getState();
  const target = setupParams.indexOf(step);
  await state().load();
  if (target >= setupParams.indexOf('okuyucu')) {
    await state().createAccount({
      email: seed.email,
      voiceProcessing: options.consent,
      weeklyEmail: seed.weeklyEmail,
    });
  }
  if (target >= setupParams.indexOf('seviye')) {
    await state().saveReader(seed.reader);
    if (!options.consent) {
      // Without the consent there is no level check: the setup goes on to meeting Tıkır.
      return;
    }
  }
  if (target >= setupParams.indexOf('tanisma')) {
    const passage = state().setup?.passage;
    if (passage?.id !== seed.firstMeasurement.passageId) {
      throw new Error(`The level check reads ${passage?.id ?? 'nothing'}, not the demo's text.`);
    }
    const words = chapterTokens(passageChapter(passage)).map((token) => token.spoken);
    const simulation = simulateReading(words, seed.firstMeasurement.scenario);
    await state().saveBaseline(
      { words: toWordResults(simulation), seconds: simulation.seconds },
      { startedAt: services.now().toISOString(), recordingId: null },
    );
  }
}
