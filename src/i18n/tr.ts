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
      /** The rail's and the sidebar's link, and G1's lock button on phones (karar 27). */
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
      /** The rail's and the sidebar's link, and the strip's button on phones (karar 27). */
      childScreen: 'Çocuk ekranı',
      /** The top strip's chip: "Deniz, 3. sınıf" (design/ekranlar/V1-*.html). */
      childLabel: (name: string, grade: number) => `${name}, ${String(grade)}. sınıf`,
    },
  },

  /** Calendar names (docs/planlar/faz-4.md, karar 39); the short weekdays are V1's strip. */
  dates: {
    months: [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ],
    /** Monday first. */
    weekdays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    weekdaysShort: ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'],
    dayMonth: (day: number, month: string) => `${String(day)} ${month}`,
    longDate: (dayMonth: string, weekday: string) => `${dayMonth} ${weekday}`,
    /** "10–16 Kasım" (V1). */
    rangeInMonth: (first: number, last: number, month: string) =>
      `${String(first)}–${String(last)} ${month}`,
    /** "27 Ekim – 2 Kasım". */
    rangeAcross: (first: string, last: string) => `${first} – ${last}`,
  },

  /** The parent's report: V1–V3 (design/ekranlar/V1…V3-*.html; docs/planlar/faz-4.md, D17). */
  report: {
    summary: {
      /** {name}: the name with its genitive suffix, "Deniz’in". */
      title: (name: string) => `${name} haftası`,
      previousWeek: 'Önceki hafta',
      nextWeek: 'Sonraki hafta',
      wcpm: { firstLine: 'doğru kelime', secondLine: 'bir dakikada', short: 'doğru kelime / dk' },
      gain: (count: number) => `Geçen haftadan ${String(count)} fazla`,
      accuracy: { value: (percent: number) => `%${String(percent)}`, label: 'doğruluk' },
      prosody: {
        value: (score: number) => `${String(score)} / 4`,
        long: 'tonlama puanı',
        short: 'tonlama',
      },
      sessionDays: {
        value: (days: number) => `${String(days)} / 7`,
        long: 'gün seans',
        short: 'gün',
      },
      /** A number the week does not have. TODO(design) */
      missing: '–',
      chartTitle: 'Doğru kelime, bir dakikada',
      weekLabel: (week: number) => `${String(week)}. hafta`,
      target: (wcpm: number) => `Hedef ${String(wcpm)}`,
      average: (grade: number, wcpm: number) =>
        `${String(grade)}. sınıf ortalaması ${String(wcpm)}`,
      /**
       * The chart's accessible name: the design's sentence, with the other directions (D17).
       * {weeks}: the number of weeks in words, capitalized; {from}, {to}: counts with suffixes.
       */
      chartLabel: {
        rose: (weeks: string, from: string, to: string) =>
          `${weeks} haftada doğru kelime sayısı ${from} ${to} çıktı`,
        fell: (weeks: string, from: string, to: string) =>
          `${weeks} haftada doğru kelime sayısı ${from} ${to} düştü`,
        same: (weeks: string, wcpm: number) =>
          `${weeks} haftada doğru kelime sayısı değişmedi: ${String(wcpm)}`,
        single: (wcpm: number) => `Doğru kelime sayısı ${String(wcpm)}`,
        target: (wcpm: number) => `hedef ${String(wcpm)}`,
        average: (grade: number, wcpm: number) =>
          `${String(grade)}. sınıf ortalaması ${String(wcpm)}`,
      },
      daysTitle: 'Seans günleri',
      /** {count}: the count with its suffixes, "5’inde". */
      daysLabel: (count: string) => `Bu hafta 7 günün ${count} seans yapıldı`,
      /** D17. TODO(design) */
      noDays: 'Bu hafta seans yapılmadı.',
      /** P14's days on the report (D17). TODO(design) */
      unheardDays: (count: number) => `${String(count)} gün dinlemeden okundu.`,
      comment: {
        passed: (name: string, next: number) =>
          `${name} bu hafta hedef çizgisini geçti. Sıradaki hedef ${String(next)}.`,
        /** D17. TODO(design) */
        below: (name: string, gap: number) => `${name} hedefe ${String(gap)} kelime uzakta.`,
        /** D17. TODO(design) */
        baseline: (name: string, target: number) =>
          `${name} bu hafta ilk ölçümünü yaptı. İlk hedef ${String(target)}.`,
        /** D17. TODO(design) */
        noMeasurement: 'Bu hafta ölçüm yapılmadı.',
        /** D17. TODO(design) */
        listeningOff: 'Dinleme kapalı olduğu için ölçüm yapılmıyor.',
      },
      updateGoal: 'Hedefi güncelle',
      /** "Hedefi güncelle"'s dialog (D17). TODO(design) */
      goalDialog: {
        title: 'Hedefi güncelle',
        body: (wcpm: number) => `Yeni hedef: bir dakikada ${String(wcpm)} doğru kelime.`,
        confirm: 'Güncelle',
        cancel: 'Vazgeç',
      },
      /** D17. TODO(design) */
      empty: 'Henüz seans ya da ölçüm yok. İlk seanstan sonra özet burada görünür.',
    },
    stuckWords: {
      title: 'Takılınan yerler',
      lead: (errors: number, types: number) =>
        `Bu hafta ${String(errors)} hata, ${String(types)} türde`,
      errorsTitle: 'Hata türleri',
      errorTypes: {
        misread: 'Yanlış okuma',
        suffix: 'Ek hatası',
        skipped: 'Atlama',
        repeated: 'Tekrar',
        inserted: 'Ekleme',
      },
      example: (written: string, heard: string) => `${written} yerine ${heard}`,
      /** D17. TODO(design) */
      noErrors: 'Bu hafta takılma yok.',
      drill: {
        lead: 'Önerilen çalışma: ek zinciri',
        /** {suffixes}: "‑yordu ve ‑diğinde". */
        body: (suffixes: string, words: number, days: number) =>
          `${suffixes} ile biten ${String(words)} kelime, ${String(days)} gün boyunca ısınmaya gelir.`,
        and: 've',
        add: 'Isınmaya ekle',
        /** Phones. */
        shortTitle: 'Ek zinciri ısınması',
        shortBody: (words: number, days: number) =>
          `Önerilen: ${String(words)} kelime, ${String(days)} gün`,
        shortAdd: 'Ekle',
        /** D17. TODO(design) */
        added: (count: number) => `${String(count)} kelime ısınmaya eklendi.`,
      },
      wordsTitle: 'En çok takıldığı kelimeler',
      wordLine: (syllables: string, misses: number) => `${syllables}, ${String(misses)} kez`,
      /** docs/urun.md section 3; "Yeni" has no design (D17). */
      status: { wild: 'Yeni', practicing: 'Çalışılıyor', tamed: 'Evcilleşti' },
      /** {name}: the name with its genitive suffix. */
      listen: (word: string, name: string) => `${word} kelimesinde ${name} okuyuşunu dinle`,
      /** D17. TODO(design) */
      noWords: 'Henüz takılınan kelime yok.',
    },
    assessment: {
      title: '1 dakikalık ölçüm',
      wcpm: { firstLine: 'doğru kelime', secondLine: 'bir dakikada' },
      wordsRead: (words: number) => `${String(words)} kelime okudu`,
      errors: (errors: number) => `${String(errors)} hata`,
      accuracy: (percent: number) => `Doğruluk %${String(percent)}`,
      levelTitle: 'Okuma düzeyi',
      /** {level}: the level's name in lower case. */
      levelLabel: (level: string) => `Okuma düzeyi: ${level}`,
      levels: {
        frustration: { name: 'Endişe', range: '%90 altı' },
        instructional: { name: 'Öğretim', range: '%90–98' },
        independent: { name: 'Serbest', range: '%99 ve üstü' },
      },
      levelSentence: {
        /** D17. TODO(design) */
        frustration: (name: string) =>
          `Endişe düzeyi: bu zorluktaki metin ${name} için şimdilik zor.`,
        instructional: (name: string) =>
          `Öğretim düzeyi: ${name} bu zorluktaki metni biraz yardımla okuyabiliyor.`,
        /** D17. TODO(design) */
        independent: (name: string) =>
          `Serbest düzey: ${name} bu zorluktaki metni yardımsız okuyabiliyor.`,
      },
      /** The level in the shared summary (D17). */
      levelNames: {
        frustration: 'Endişe düzeyi',
        instructional: 'Öğretim düzeyi',
        independent: 'Serbest düzey',
      },
      next: (date: string) => `Sıradaki ölçüm ${date}`,
      /** D17. TODO(design) */
      nextToday: 'Sıradaki ölçüm bugün',
      share: 'Öğretmenle paylaş',
      listen: 'Kaydı dinle',
      excerptTitle: 'Ölçüm metninden',
      marks: { error: 'yanlış okuma', stumble: 'takılma' },
      /** D17. TODO(design) */
      empty: 'Henüz ölçüm yok. Ölçüm, çocuğun yol ekranında açılır.',
      /** The text "Öğretmenle paylaş" sends, line by line (D17). TODO(design) */
      shared: {
        title: (name: string) => `${name} için ölçüm sonucu`,
        measured: (date: string) => `1 dakikalık ölçüm, ${date}`,
        pace: (wcpm: number) => `${String(wcpm)} doğru kelime bir dakikada`,
        counts: (words: number, errors: number, percent: number) =>
          `${String(words)} kelime okudu, ${String(errors)} hata, doğruluk %${String(percent)}`,
        copied: 'Özet panoya kopyalandı.',
        failed: 'Paylaşılamadı. Bir daha deneyin.',
      },
    },
    /** A recording's row on V2 and the account page (D17). TODO(design) */
    recordings: {
      chapter: (chapter: number, date: string) => `${String(chapter)}. bölüm, ${date}`,
      measurement: (date: string) => `1 dakikalık ölçüm, ${date}`,
    },
  },

  /** V4 Yazı ayarı (design/ekranlar/V4-yazi-ayari-*.html). */
  readingStyle: {
    title: 'Yazı ayarı',
    /** {name}: the name with its genitive suffix, "Deniz’in". */
    lead: (name: string) => `${name} okuma metinleri bu ayarla görünür.`,
    preview: 'Önizleme',
    font: 'Yazı tipi',
    fonts: {
      clear: { label: 'Net harfler', description: 'I, l, ı ve i kolay ayrılır', sample: 'I l ı i' },
      school: { label: 'Okul harfleri', description: 'a ve g defterdeki gibi', sample: 'a g' },
    },
    size: 'Harf boyutu',
    sizes: ['Küçük', 'Orta', 'Büyük', 'En büyük'],
    spacing: 'Harf aralığı',
    spacings: ['Normal', 'Açık', 'Daha açık'],
    trial: {
      title: 'Hangi ayar daha iyi?',
      /** {name}: the name with its genitive suffix. */
      text: (name: string) =>
        `Haftalık ölçümde iki ayar arka arkaya denenir. Dört ölçümden sonra ${name} daha iyi okuduğu ayar önerilir.`,
      toggle: 'Ölçümlerde iki ayarı dene',
      rows: 'Denenen ayarlar ve sonuçları',
      current: 'Şu anki ayar',
      tried: 'Denenen ayar',
      /** "Net harfler, normal aralık": the spacing in lower case. */
      styleName: (font: string, spacing: string) => `${font}, ${spacing} aralık`,
      collecting: (count: number, remaining: number) =>
        `Doğru kelime / dk, ${String(count)} ölçümün ortalaması. Fark henüz küçük; karar için ${String(remaining)} ölçüm daha gerekiyor.`,
      /** The sentences the design does not draw (docs/kararlar.md D16). TODO(design) */
      none: 'Henüz iki ayarla ölçüm yapılmadı. İlk ölçümlerden sonra sonuçlar burada görünür.',
      collectingApart: (count: number, remaining: number) =>
        `Doğru kelime / dk, ${String(count)} ölçümün ortalaması. Karar için ${String(remaining)} ölçüm daha gerekiyor.`,
      small: (count: number) =>
        `Doğru kelime / dk, ${String(count)} ölçümün ortalaması. Fark küçük; iki ayar da uygun.`,
      better: (name: string, gain: number) =>
        `${name} ile ortalama ${String(gain)} doğru kelime daha fazla okuyor.`,
      switchTo: 'Bu ayara geçebilirsiniz.',
    },
  },

  /** The parent gate (docs/kararlar.md D16, P11). TODO(design) */
  parentGate: {
    title: 'Veli alanı',
    lead: 'Devam etmek için soruyu yanıtlayın.',
    question: (a: number, b: number) => `${String(a)} + ${String(b)} = ?`,
    answer: 'Cevap',
    enter: 'Gir',
    wrong: 'Olmadı. Bir daha deneyin.',
    wait: (seconds: number) => `${String(seconds)} saniye sonra yeniden deneyebilirsiniz.`,
    back: 'Çocuk ekranı',
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
    /** K1 Veli hesabı (design/ekranlar/K1-veli-hesabi-*.html). */
    account: {
      bubble: 'Merhaba! Çocuğunuz okurken ben dinlerim.',
      title: 'Veli hesabı',
      lead: 'Önce siz kaydolun. Çocuğunuzun profilini bir sonraki adımda kurarız.',
      email: 'E-posta',
      emailPlaceholder: 'ad@ornek.com',
      password: 'Parola',
      passwordPlaceholder: 'En az 8 karakter',
      consent: 'Çocuğumun ses kaydının okuma geri bildirimi için işlenmesine izin veriyorum.',
      consentNote:
        'Kayıtlar yalnızca okumayı değerlendirmek için kullanılır. İstediğiniz zaman dinleyebilir ya da silebilirsiniz.',
      voiceInfo: 'Ses verisi nasıl kullanılır?',
      weeklyEmail: 'Haftalık özet e-postası almak istiyorum.',
      submit: 'Hesabı oluştur',
      /** The states without a design (docs/kararlar.md D16). TODO(design) */
      emailError: 'Geçerli bir e-posta adresi yazın.',
      passwordError: 'Parola en az 8 karakter olmalı.',
      noConsentNote: 'Onay vermezseniz Tıkır dinlemez: okumalar ölçülmez, seviye tespiti atlanır.',
      /** A draft (D16): a legal review comes before release (docs/urun.md section 8). TODO(legal) */
      voiceInfoBody:
        'Tıkır, çocuğunuz okurken sesini bu cihazda işler: hangi kelimeleri doğru okuduğunu, nerede takıldığını ve okuma hızını bulur. Her günün son okuması ve seviye tespiti kaydedilir. Kayıtlar bu cihazda kalır, başka bir yere gönderilmez. Onay vermezseniz mikrofon hiç açılmaz.',
      close: 'Kapat',
    },
    /** K2 Okuyucu profili (design/ekranlar/K2-okuyucu-*.html). */
    reader: {
      bubble: 'Sevdiği konuları seçin, hikâyeleri ona göre kurarım.',
      title: 'Okuyucuyu tanıyalım',
      lead: 'Metinleri seviyesine ve ilgisine göre seçmek için.',
      name: 'Okuyucunun adı',
      namePlaceholder: 'Deniz',
      grade: 'Sınıfı',
      gradeOption: (grade: number) => `${String(grade)}. sınıf`,
      interests: 'Nelerden hoşlanır?',
      interestOptions: [
        'Uzay',
        'Hayvanlar',
        'Futbol',
        'Deniz',
        'Dinozorlar',
        'Robotlar',
        'Doğa',
        'Bilmece',
      ],
      interestCounter: (chosen: number, limit: number) =>
        `${String(chosen)} / ${String(limit)} seçildi`,
      submit: 'Devam et',
      /** The states without a design (docs/kararlar.md D16). TODO(design) */
      nameError: 'Okuyucunun adını yazın.',
      gradeError: 'Sınıfını seçin.',
    },
    /** K3 Seviye tespiti (design/ekranlar/K3-seviye-*.html). */
    level: {
      bubble: 'Hazır olduğunda başla. Dinliyorum.',
      title: '1 dakikalık okuma',
      lead: (name: string) =>
        `${name} metni sesli okusun. Hata yapması sorun değil; başlangıç noktasını arıyoruz.`,
      elapsed: 'Geçen süre',
      remaining: (clock: string) => `${clock} kaldı`,
      finish: 'Okumayı bitir',
      /** After a retry did not help (docs/kararlar.md D16, P14). TODO(design) */
      skip: 'Seviye tespitini atla',
    },
    /** K4 Tıkır ile tanışma (design/ekranlar/K4-tanisma-*.html). */
    meet: {
      bubble: (name: string) =>
        `Merhaba ${name}! Sen okurken ben dinlerim, takılırsan yardım ederim.`,
      /** Without the consent Tıkır does not listen (docs/kararlar.md D16). TODO(design) */
      unheardBubble: (name: string) => `Merhaba ${name}! Her gün birlikte bir bölüm okuyacağız.`,
      title: 'Tıkır ile tanış',
      /** {name}: the name with its genitive suffix, "Deniz’in". */
      lead: (name: string) => `${name} başlangıç noktası belli oldu.`,
      words: 'doğru kelime',
      perMinute: 'bir dakikada',
      accuracy: (percent: number) => `Doğruluk %${String(percent)}`,
      /** The frustration level has no label on K4 (docs/planlar/faz-3.md, karar 20). */
      levels: {
        instructional: 'Öğretim düzeyi',
        /** docs/urun.md's name (docs/kararlar.md D16). TODO(design) */
        independent: 'Serbest düzey',
      },
      goal: (weeks: number, target: number) =>
        `İlk hedef: ${String(weeks)} haftada ${String(target)}`,
      today: (wcpm: number) => `Bugün ${String(wcpm)}`,
      goalWeek: (weeks: number, target: number) => `${String(weeks)}. hafta ${String(target)}`,
      daily: (minutes: number) => `Her gün ${String(minutes)} dakikalık bir bölüm`,
      warmup: 'Takıldığı kelimeler ertesi günün ısınmasına gelir',
      weekly: 'Haftada bir 1 dakikalık ölçüm, sonucu size',
      start: 'İlk bölüme başla',
    },
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

  /** The page card of the reading screens (G3, G4): "Kayıp Fenerin İzinde, 4. bölüm", "1 / 2". */
  page: {
    title: (book: string, chapter: number) => `${book}, ${String(chapter)}. bölüm`,
    counter: (page: number, total: number) => `${String(page)} / ${String(total)}`,
  },

  /** G3 Dinle (docs/ekranlar.md, G3). */
  listen: {
    chip: 'Tıkır okuyor',
    pause: 'Seslendirmeyi duraklat',
    /** The paused narration's button; approved with the phase 2b plan (D15). TODO(design) */
    resume: 'Seslendirmeyi sürdür',
    progressLabel: 'Seslendirme',
    time: (elapsed: string, total: string) => `${elapsed} / ${total}`,
    rateLabel: 'Okuma hızı',
    slow: 'Yavaş',
    normal: 'Normal',
    bubble: 'Ben okurken parmağınla takip et.',
    restart: 'Baştan dinle',
    start: 'Sıra sende',
  },

  /** G4 Oku (docs/ekranlar.md, G4). */
  read: {
    attemptChip: (attempt: number, total: number) => `${String(attempt)}. okuma / ${String(total)}`,
    /** Only when the child is ahead; a negative difference is never shown (rule 7). */
    raceLead: (words: number) => `Dünkü senin ${String(words)} kelime önündesin.`,
    helpLead: 'Takıldın mı? Hecele:',
    elapsed: (time: string) => `Süre ${time}`,
    correct: (count: number) => `Doğru ${String(count)}`,
    stuck: (count: number) => `Takılma ${String(count)}`,
    spaceHint: 'Boşluk tuşu: duraklat ve devam et',
    pause: 'Duraklat',
    /** The paused reading's button; "Sürdür" as on G1. TODO(design) */
    resume: 'Sürdür',
    finish: 'Okumayı bitir',
    /** Above the page while the third reading is recorded (docs/ekranlar.md, G4). TODO(design) */
    recording: 'Kayıt',
    /** The unheard session (P13, D15). TODO(design) */
    unheardBubble: 'Dinleme kapalı. Metni sesli oku, bitince Okumayı bitir’e dokun.',
  },

  /** G5 Kayıt (docs/ekranlar.md, G5; docs/planlar/faz-2b.md, karar 15). */
  record: {
    chip: 'Son okuma',
    done: 'Kayıt bitti',
    /** "Dar Patika, 3. okuma": the recorded reading is always the third. */
    title: (chapterTitle: string) => `${chapterTitle}, 3. okuma`,
    added: 'Sesli kitabına eklendi',
    /** "12 bölümün 4’ü"; the count comes with its suffix (withPossessiveSuffix). */
    chaptersLabel: (total: number, countWithSuffix: string) =>
      `Kayıtlı bölümler: ${String(total)} bölümün ${countWithSuffix}`,
    chaptersRecorded: (total: number, countWithSuffix: string) =>
      `${String(total)} bölümün ${countWithSuffix} kayıtlı`,
    play: 'Kaydı dinle',
    /** The playing recording's button, named as G4's. TODO(design) */
    pause: 'Duraklat',
    shareTitle: 'Ailene dinlet',
    shareNote: 'Göndermeden önce velin onaylar',
    send: 'Gönder',
    /** The sent recording's button (docs/ekranlar.md, G5). TODO(design) */
    sent: 'Veli onayı bekliyor',
    /** Only when the third reading was the day's most fluent (docs/ekranlar.md, G5). */
    bestBubble: 'Bu, bugünkü en akıcı okuman oldu.',
    /** Any other day (docs/ekranlar.md, G5). TODO(design) */
    readyBubble: 'Kaydın hazır.',
    /** No recording to play (docs/planlar/faz-2b.md, karar 15). TODO(design) */
    missing: 'Kaydın alınamadı. Baştan kaydet’e dokunup bir daha oku.',
    redo: 'Baştan kaydet',
    next: 'Devam et',
  },

  /** G6 Kapanış (docs/ekranlar.md, G6; docs/planlar/faz-2b.md, karar 16). */
  wrapUp: {
    questionCount: (count: number) => `${String(count)} soru`,
    counter: (question: number, total: number) => `Soru ${String(question)} / ${String(total)}`,
    bubble: 'Emin değilsen metne geri dönebilirsin.',
    backToText: 'Metne geri dön',
    submit: 'Cevabı gönder',
    /** After a wrong answer only the right option is marked; nothing says "wrong". TODO(design) */
    correctLabel: 'Doğru cevap',
    correctBubble: 'Doğru cevabı işaretledim.',
    next: 'Devam et',
    /** The chapter's read-only layer, titled as the page card. TODO(design) */
    close: 'Kapat',
  },

  /** G7, and G1 once the day is done (docs/ekranlar.md, G1: "G7'deki 'Yarın' kartını kullan"). */
  done: {
    tomorrow: (title: string) => `Yarın: ${title}`,
    tomorrowMeta: (number: number) => `${String(number)}. bölüm yarın açılır`,
    bubble: (name: string) => `Bugünlük bu kadar. Yarın görüşürüz, ${name}.`,
    /** G7's chip: the session's minutes. */
    minutes: (count: number) => `${String(count)} dakika`,
    /** The big number's label, on two lines as in the design. */
    paceFirstLine: 'doğru kelime',
    paceSecondLine: 'bir dakikada',
    /** Only when today is ahead of the previous session (karar 17; docs/urun.md, bölüm 4). */
    gain: (count: number) => `Dünkü senden ${String(count)} fazla`,
    tamedLabel: 'Evcilleşen kelimeler',
    tamed: 'evcilleşti',
    summary: 'Seansın özeti veline gitti.',
    close: 'Kapat',
  },

  /** The album tab (docs/planlar/faz-2b.md, karar 18). TODO(design) */
  album: {
    empty: 'Evcilleşen kelimelerin burada toplanır.',
    back: 'Yola dön',
  },

  /** The studio tab (docs/planlar/faz-2b.md, karar 18). TODO(design) */
  studio: {
    empty: 'Kaydettiğin bölümler burada sesli kitabın olur.',
    back: 'Yola dön',
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
    /** After a retry did not help: the day goes on unheard (docs/kararlar.md P14, D16). TODO(design) */
    readUnheard: 'Bugün dinlemeden oku',
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
