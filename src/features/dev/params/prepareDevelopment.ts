// Runs before the first render in developer and e2e builds (docs/planlar/faz-2b.md, karar 21;
// faz-3.md, karar 5): applies the address parameters once and removes them. An empty store stays
// empty, so the setup opens; the demo profile comes only with ?demo= (docs/mimari.md, "Depolama ve
// örnek veri").
import { scenarioNames } from '../../../services/listener/scenarios';
import { currentAddress, replaceAddress } from '../../../services/address';
import type { RecordingStore } from '../../../services/recorder/RecordingStore';
import type { Repository } from '../../../services/repository/Repository';
import { readTabSetting, tabSettingKeys, writeTabSetting } from '../../../services/tabSettings';
import type { SessionStoreServices } from '../../session/sessionStore';
import { loadDemoProfile } from '../demo/loadDemoProfile';
import { emptyStore, readDevParams } from './devParams';
import { prepareSetupStep } from './prepareSetupStep';
import { prepareSessionStep } from './prepareSessionStep';

export interface DevelopmentServices {
  repository: () => Promise<Repository>;
  recordings: RecordingStore;
  storeServices: SessionStoreServices;
}

export async function prepareDevelopment(services: DevelopmentServices): Promise<void> {
  const address = currentAddress();
  const { params, rest } = readDevParams(address.search);
  try {
    const repository = await services.repository();
    const today = services.storeServices.today();
    if (params.demo === emptyStore || params.setup !== undefined) {
      await repository.clearAll();
    } else if (params.demo !== undefined) {
      await loadDemoProfile(repository, params.demo, today);
    }
    if (params.setup !== undefined) {
      await prepareSetupStep(services.storeServices, params.setup, {
        consent: params.consentOff !== true,
      });
    } else if (params.consentOff === true) {
      const parent = await repository.getParent();
      if (parent !== null) {
        await repository.saveParent({
          ...parent,
          consent: { ...parent.consent, voiceProcessing: false },
        });
      }
    }
    if (params.scenario !== undefined) {
      writeTabSetting(tabSettingKeys.listener, params.scenario);
    }
    if (params.step !== undefined) {
      const chosen = readTabSetting(tabSettingKeys.listener);
      const scenario = scenarioNames.find((name) => name === chosen) ?? 'typical';
      await prepareSessionStep(services.storeServices, params.step, scenario, services.recordings);
    }
  } catch (error) {
    // The app still starts; its screens show the store's state.
    console.error('The developer parameters could not be applied.', error);
  } finally {
    if (rest !== address.search) {
      replaceAddress(`${address.pathname}${rest}${address.hash}`);
    }
  }
}
