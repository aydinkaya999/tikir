// The developer address parameters (docs/mimari.md, "Depolama ve örnek veri"; docs/planlar/
// faz-2b.md, karar 21; faz-3.md, karar 5): ?demo=<kip|bos>, ?kurulum=<adım>, &adim=<adım>,
// &senaryo=<ad|elle>, &onay=kapali. Developer and e2e builds only.
import { scenarioNames, type ScenarioName } from '../../../services/listener/scenarios';
import { type DemoMode, demoModes } from '../demo/loadDemoProfile';

export const devSteps = [
  'warmup',
  'listen',
  'read-1',
  'read-2',
  'read-3',
  'record',
  'wrapUp',
  'done',
] as const;
export type DevStep = (typeof devSteps)[number];

/** The setup steps (docs/planlar/faz-3.md, karar 5): `?kurulum=` opens the setup at one of them. */
export const setupParams = ['hesap', 'okuyucu', 'seviye', 'tanisma'] as const;

export type SetupParam = (typeof setupParams)[number];

/** `?demo=bos`: an empty store, so the setup opens. */
export const emptyStore = 'bos';

/** The manual listener: an adult marks each word from the keyboard. */
export const manualListener = 'elle';

export interface DevParams {
  demo?: DemoMode | typeof emptyStore;
  setup?: SetupParam;
  step?: DevStep;
  scenario?: ScenarioName | typeof manualListener;
  consentOff?: true;
}

function oneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

/** Removes a parameter from the query and returns its value. */
function take(query: URLSearchParams, name: string): string | null {
  const value = query.get(name);
  query.delete(name);
  return value;
}

function warnUnknown(name: string, value: string): void {
  console.warn(`Unknown developer parameter: ${name}=${value}`);
}

/**
 * The parameters of an address and the address's other parameters (`rest`, '' or '?…'). A known
 * parameter with an unknown value is dropped with a warning; either way it leaves the address.
 */
export function readDevParams(search: string): { params: DevParams; rest: string } {
  const query = new URLSearchParams(search);
  const params: DevParams = {};

  const demo = take(query, 'demo');
  if (demo !== null) {
    if (oneOf([...demoModes, emptyStore], demo)) {
      params.demo = demo;
    } else {
      warnUnknown('demo', demo);
    }
  }
  const setup = take(query, 'kurulum');
  if (setup !== null) {
    if (oneOf(setupParams, setup)) {
      params.setup = setup;
    } else {
      warnUnknown('kurulum', setup);
    }
  }
  const step = take(query, 'adim');
  if (step !== null) {
    if (oneOf(devSteps, step)) {
      params.step = step;
    } else {
      warnUnknown('adim', step);
    }
  }
  const scenario = take(query, 'senaryo');
  if (scenario !== null) {
    if (oneOf([...scenarioNames, manualListener], scenario)) {
      params.scenario = scenario;
    } else {
      warnUnknown('senaryo', scenario);
    }
  }
  const consent = take(query, 'onay');
  if (consent !== null) {
    if (consent === 'kapali') {
      params.consentOff = true;
    } else {
      warnUnknown('onay', consent);
    }
  }

  const rest = query.toString();
  return { params, rest: rest === '' ? '' : `?${rest}` };
}
