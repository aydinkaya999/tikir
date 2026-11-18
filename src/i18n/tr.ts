// Every user-facing string lives here (CLAUDE.md). Copy is taken verbatim from
// design/ekranlar/*.html; strings are added by the task that first shows them.

/** Working name of the product and of the companion character (docs/kararlar.md P1). */
const appName = 'Tıkır';

export const tr = {
  appName,

  session: {
    /** G4: list name of the five step tiles. */
    stepsLabel: 'Seans adımları',
    steps: {
      warmup: 'Isınma',
      listen: 'Dinle',
      read: 'Oku',
      record: 'Kayıt',
      wrapUp: 'Kapanış',
    },
  },

  mic: {
    /** G2, G4, K3. */
    listening: 'Dinliyor. Duraklatmak için dokun',
    /** Not drawn; copy approved with the phase 0 plan (decision 5). TODO(design) */
    paused: 'Duraklatıldı. Sürdürmek için dokun',
    /** Not drawn; copy approved with the phase 0 plan (decision 5). TODO(design) */
    denied: 'Mikrofon izni yok',
  },
} as const;
