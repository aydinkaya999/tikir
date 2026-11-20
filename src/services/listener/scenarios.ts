// Ready scenarios of the fake listener (docs/dinleme-hatti.md, section 3; docs/planlar/faz-2a.md,
// karar 4). The positions are test data, not reading content. typical is the demo profile's
// reading of day 0 and its first measurement (seed/demo-profil.json); a test keeps them equal.
import type { FakeScenario } from './types';

export const scenarioNames = ['smooth', 'typical', 'struggling', 'design'] as const;

export type ScenarioName = (typeof scenarioNames)[number];

export interface ScenarioSet {
  /** The session's three readings. */
  readings: readonly [FakeScenario, FakeScenario, FakeScenario];
  /** K3's one-minute level check (docs/planlar/faz-3.md, karar 16). */
  assessment: FakeScenario;
  /** A fixed ghost pace instead of the earlier reading's. */
  ghostWpm?: number;
  /** 'design': G3 and G4 show content pages 1 and 2 as one page (docs/kararlar.md D12). */
  layout?: 'design';
}

const typical: ScenarioSet['readings'] = [
  {
    wcpm: 64,
    miscues: [
      { index: 15, type: 'suffix' },
      { index: 35, type: 'repeated' },
      { index: 40, type: 'skipped' },
    ],
    hesitations: [],
  },
  {
    wcpm: 68,
    miscues: [{ index: 9, type: 'misread' }],
    hesitations: [{ index: 6, ms: 1800 }],
  },
  { wcpm: 71, miscues: [], hesitations: [] },
];

/** The demo profile's first measurement: 64 words in the minute, 58 of them correct. */
const typicalAssessment: FakeScenario = {
  timed: { seconds: 60, wordsRead: 64 },
  miscues: [
    { index: 4, type: 'misread' },
    { index: 8, type: 'suffix' },
    { index: 24, type: 'skipped' },
    { index: 31, type: 'suffix' },
    { index: 43, type: 'misread' },
    { index: 49, type: 'misread' },
  ],
  hesitations: [],
  prosodyScore: 2,
};

/** A struggling reader's miscues and pauses, at a session pace or in the timed minute. */
function struggling(pace: Pick<FakeScenario, 'wcpm' | 'timed'>): FakeScenario {
  return {
    ...pace,
    miscues: [
      { index: 4, type: 'misread' },
      { index: 12, type: 'suffix' },
      { index: 20, type: 'skipped' },
      { index: 31, type: 'misread' },
      { index: 45, type: 'suffix' },
    ],
    hesitations: [
      { index: 8, ms: 3500 },
      { index: 26, ms: 3500 },
      { index: 52, ms: 3500 },
    ],
  };
}

export const scenarioSets: Readonly<Record<ScenarioName, ScenarioSet>> = {
  smooth: {
    readings: [
      { wcpm: 80, miscues: [], hesitations: [] },
      { wcpm: 84, miscues: [], hesitations: [] },
      { wcpm: 88, miscues: [], hesitations: [] },
    ],
    assessment: { timed: { seconds: 60, wordsRead: 80 }, miscues: [], hesitations: [] },
  },
  typical: { readings: typical, assessment: typicalAssessment },
  struggling: {
    readings: [struggling({ wcpm: 42 }), struggling({ wcpm: 46 }), struggling({ wcpm: 50 })],
    assessment: struggling({ timed: { seconds: 60, wordsRead: 46 } }),
  },
  design: {
    readings: [
      typical[0],
      {
        wcpm: 50,
        miscues: [{ index: 9, type: 'misread' }],
        hesitations: [
          { index: 6, ms: 1800 },
          { index: 14, ms: 3000 },
        ],
      },
      typical[2],
    ],
    assessment: typicalAssessment,
    ghostWpm: 40,
    layout: 'design',
  },
};
