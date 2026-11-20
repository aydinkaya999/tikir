// The arguments of `pnpm shots` (docs/planlar/faz-2b.md, karar 22): steps run in the order given,
// on every route, before the screenshot.

export type ShotStep =
  { kind: 'tap'; name: string } | { kind: 'wait'; name: string } | { kind: 'advance'; ms: number };

export const shotUsage =
  'Usage: pnpm shots [--dokun <ad>] [--bekle <ad>] [--ileri <ms>] <route> [<route> ...]  ' +
  '(steps run in order; every route starts with "/")';

const namedSteps = { '--dokun': 'tap', '--bekle': 'wait' } as const;

export function parseShotArgs(args: readonly string[]): { steps: ShotStep[]; routes: string[] } {
  const steps: ShotStep[] = [];
  const routes: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? '';
    if (arg === '--') {
      continue;
    }
    if (arg === '--dokun' || arg === '--bekle' || arg === '--ileri') {
      const value = args[index + 1];
      index += 1;
      if (value === undefined) {
        throw new Error(`${arg} needs a value. ${shotUsage}`);
      }
      if (arg === '--ileri') {
        if (!/^\d+$/.test(value)) {
          throw new Error(`--ileri takes whole milliseconds, not "${value}". ${shotUsage}`);
        }
        steps.push({ kind: 'advance', ms: Number(value) });
      } else {
        steps.push({ kind: namedSteps[arg], name: value });
      }
      continue;
    }
    if (!arg.startsWith('/')) {
      throw new Error(`A route starts with "/": ${arg}. ${shotUsage}`);
    }
    routes.push(arg);
  }
  if (routes.length === 0) {
    throw new Error(`Give at least one route. ${shotUsage}`);
  }
  return { steps, routes };
}
