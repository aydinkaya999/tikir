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

  /** G1 Yol (docs/ekranlar.md, G1). */
  road: {
    greeting: (name: string) => `Merhaba ${name}`,
    streak: (days: number) => `${String(days)} gün üst üste`,
    /**
     * Tablet and web bubble: one pattern for every chapter (docs/kararlar.md D13). The design's
     * sentence belongs to chapter 4 and the content has none (C6).
     */
    bubble: (number: number, title: string) =>
      `Bugün ${String(number)}. bölümü okuyoruz: ${title}. Hazırsan başlayalım.`,
    todayLabel: 'Bugünkü bölüm',
    chapterMeta: (number: number, minutes: number) =>
      `${String(number)}. bölüm, ${String(minutes)} dakika`,
    start: 'Başla',
    /** docs/ekranlar.md, "Günlük seans": after an exit, "Başla" becomes "Sürdür". */
    resume: 'Sürdür',
    /** "12 bölümün 3’ü tamam"; the count comes with its suffix (withPossessiveSuffix). */
    completed: (total: number, countWithSuffix: string) =>
      `${String(total)} bölümün ${countWithSuffix} tamam`,
    chaptersLabel: 'Bölümler',
    /** No chapter left to read (docs/ekranlar.md, "Tasarımı olmayan durumlar"). TODO(design) */
    seriesEnd: 'Yeni bölümler yolda.',
  },

  /** G7, and G1 once the day is done (docs/ekranlar.md, G1: "G7'deki 'Yarın' kartını kullan"). */
  done: {
    tomorrow: (title: string) => `Yarın: ${title}`,
    tomorrowMeta: (number: number) => `${String(number)}. bölüm yarın açılır`,
    bubble: (name: string) => `Bugünlük bu kadar. Yarın görüşürüz, ${name}.`,
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
    /** The unheard session (docs/kararlar.md P13, D15). TODO(design) */
    listeningOff: 'Dinleme kapalı',
  },

  /**
   * Tıkır's bubble when the microphone cannot listen (docs/ekranlar.md, "Tasarımı olmayan
   * durumlar"); the texts were approved with the phase 2b plan (D15). TODO(design)
   */
  microphoneProblem: {
    denied:
      'Seni duyamıyorum, mikrofon izni kapalı. Velinden izni açmasını iste, sonra Yeniden dene’ye dokun.',
    unavailable:
      'Mikrofonu bulamadım. Velinden bir mikrofon bağlamasını iste, sonra Yeniden dene’ye dokun.',
    error: 'Mikrofon durdu. Yeniden dene’ye dokun.',
    retry: 'Yeniden dene',
  },

  /** G2 Isınma (docs/ekranlar.md, G2). */
  warmup: {
    wordCount: (count: number) => `${String(count)} kelime`,
    cardCounter: (card: number, total: number) =>
      `Canavar kelime ${String(card)} / ${String(total)}`,
    remaining: (count: number) => `Evcilleşmesine ${String(count)} doğru okuma kaldı`,
    syllablesLabel: 'Heceler',
    chainLabel: 'Büyüyen kelime',
    bubble: 'Önce hecele, sonra bir nefeste söyle.',
    listen: 'Kelimeyi dinle',
    /** Tablet and web: the button's text. */
    next: 'Dinle adımına geç',
    /** Phones: the round button's name. */
    nextShort: 'Sıradaki adım: Dinle',
    /** The unheard session (P13, D15). TODO(design) */
    unheardBubble: 'Dinleme kapalı. Kelimeyi sesli oku, sonra sıradakine geç.',
    nextWord: 'Sıradaki kelime',
  },
} as const;
