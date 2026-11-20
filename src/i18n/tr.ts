// Every user-facing string lives here (CLAUDE.md). Copy is taken verbatim from
// design/ekranlar/*.html; strings are added by the task that first shows them.

/** Working name of the product and of the companion character (docs/kararlar.md P1). */
const appName = 'Tıkır';

export const tr = {
  appName,

  nav: {
    /** G1: child navigation (bottom bar, rail, sidebar). */
    child: {
      label: 'Ana gezinme',
      road: 'Yol',
      library: 'Kitaplık',
      album: 'Albüm',
      studio: 'Stüdyo',
      /** Web sidebar only. */
      parentArea: 'Veli alanı',
    },
    /** V1: parent navigation; phones and tablets use the short labels. */
    parent: {
      label: 'Veli gezinmesi',
      area: 'Veli alanı',
      summary: 'Özet',
      stuckWords: { short: 'Takılınan', long: 'Takılınan yerler' },
      assessment: 'Ölçüm',
      readingStyle: { short: 'Yazı', long: 'Yazı ayarı' },
      books: 'Kitaplar',
      /** Web sidebar only. */
      childScreen: 'Çocuk ekranı',
    },
  },

  focus: {
    /** U3, U4: back button name. */
    back: 'Geri dön',
    bookFromCards: { title: 'Kitabını kur', subtitle: 'Her sıradan bir kart seç.' },
    bookReady: { title: 'Kitabın hazır', subtitle: 'Denetimden geçti, okunmaya hazır.' },
  },

  onboarding: {
    /** K1–K4: name of the progress dots and the counter beside them. */
    progressLabel: (step: number, total: number) =>
      `Kurulum adımı ${String(step)} / ${String(total)}`,
    progressCounter: (step: number, total: number) => `${String(step)} / ${String(total)}`,
  },

  session: {
    /** G2–G7: close button name (phone, tablet) and link text (web). */
    exit: 'Seanstan çık',
    /** G2–G7 phones: step counter, e.g. "3 / 5". */
    stepCounter: (step: number, total: number) => `${String(step)} / ${String(total)}`,
    /** G4: list name of the five step tiles. */
    stepsLabel: 'Seans adımları',
    steps: {
      warmup: 'Isınma',
      listen: 'Dinle',
      read: 'Oku',
      record: 'Kayıt',
      wrapUp: 'Kapanış',
    },
    /** G2–G7, tablet and web header: "Bölüm 4: Dar Patika". */
    chapterLabel: (number: number, title: string) => `Bölüm ${String(number)}: ${title}`,
    /** G7 title. */
    doneTitle: 'Bugünlük bitti',
    /**
     * The exit confirmation: the title is in docs/ekranlar.md, the rest was approved with the
     * phase 2b plan (docs/kararlar.md D15). TODO(design)
     */
    exitDialog: {
      title: 'Seanstan çıkılsın mı?',
      body: 'Kaldığın yerden sürdürebilirsin.',
      leave: 'Çık',
      stay: 'Seansa dön',
    },
  },

  /** Loading and the error notice; approved with the phase 2b plan (D15). TODO(design) */
  status: {
    loading: 'Hazırlanıyor…',
    error: 'Bilgilerin açılamadı. Sayfayı yenileyip yeniden dene.',
  },

  race: {
    /** G4: the child's marker and yesterday's ghost. */
    you: 'sen',
    ghost: 'dün',
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
