// Copy for /gelistirme/ses, the developer audio lab (docs/planlar/faz-1.md, decision 13).
// Not product copy: the page has no design and never reaches the production build, so its text
// stays out of src/i18n/tr.ts (docs/kararlar.md, T17). Each task adds the entries it shows.

export const copy = {
  title: 'Ses denemesi',
  intro:
    'Mikrofondan sunucuya giden yolu dener: izin, düzey, kayıt, yankı ve cihaz raporu. Tanıma yok.',
  mic: {
    heading: 'Mikrofon',
    echoCancellation: 'Yankı giderme',
    noiseSuppression: 'Gürültü bastırma',
    autoGainControl: 'Otomatik kazanç',
    settingsHint: 'Ayarlar mikrofon bir sonraki açılışta uygulanır.',
    open: 'Mikrofonu aç',
    close: 'Mikrofonu kapat',
    retry: 'Yeniden dene',
    stateLabel: 'Durum',
    states: {
      idle: 'Kapalı',
      starting: 'Açılıyor',
      capturing: 'Açık',
      denied: 'İzin yok',
      unavailable: 'Kullanılamıyor',
      error: 'Hata',
    },
    permissionLabel: 'Tarayıcı izni',
    permission: {
      granted: 'Verildi',
      denied: 'Reddedildi',
      prompt: 'Sorulacak',
      unknown: 'Bilinmiyor',
    },
    level: 'Ses düzeyi',
    silence: 'Sessiz',
    dbfs: (value: string) => `${value} dBFS`,
    problems: {
      denied:
        'Mikrofon izni reddedildi; site ayarlarından mikrofona izin verip Yeniden dene düğmesine dokun.',
      insecure:
        'Sayfa güvenli bağlantıyla açılmadığı için mikrofon kullanılamıyor; sayfayı https:// ya da localhost adresiyle aç.',
      noDevice:
        'Bu cihazda mikrofon bulunamadı; bir mikrofon bağlayıp Yeniden dene düğmesine dokun.',
      error:
        'Mikrofon açılamadı ya da kesildi; mikrofonu kullanan başka bir uygulamayı kapatıp Yeniden dene düğmesine dokun.',
      detail: (name: string, message: string) => `Ayrıntı: ${name}: ${message}`,
    },
  },
  recording: {
    heading: 'Kayıt',
    record: '10 saniye kaydet',
    progress: (seconds: string) => `Kaydediliyor: ${seconds} sn`,
    ready: (seconds: string) => `Kayıt hazır: ${seconds} sn`,
    partial: (seconds: string) => `Kayıt yarıda kaldı: ${seconds} sn`,
    play: 'Kaydı çal',
    stop: 'Çalmayı durdur',
    playing: 'Çalıyor',
    playHint: 'Çalmadan önce mikrofon kapanır.',
    download: 'Kaydı indir (WAV)',
  },
  echo: {
    heading: 'Yankı testi',
    url: 'Yankı adresi',
    start: 'Yankı testini başlat',
    stop: 'Testi durdur',
    progress: (sent: number, total: number) =>
      `Gönderilen çerçeve: ${String(sent)} / ${String(total)}`,
    sent: 'Gönderilen',
    received: 'Dönen',
    lost: 'Kayıp',
    median: 'Ortanca',
    p95: '95. yüzdelik',
    min: 'En kısa',
    max: 'En uzun',
    ms: (value: string) => `${value} ms`,
    outcomes: {
      unreachable:
        'Yankı sunucusuna ulaşılamadı; bilgisayarda pnpm audio-trial ya da pnpm echo-server çalışıyor mu, bak.',
      closed: 'Bağlantı test bitmeden kapandı; sonuçlar o ana kadar dönen çerçevelerden.',
      stopped: 'Test yarıda durdu; sonuçlar o ana kadar dönen çerçevelerden.',
    },
  },
  report: {
    heading: 'Cihaz raporu',
    browser: 'Tarayıcı',
    os: 'İşletim sistemi',
    shell: 'Kabuk',
    standalone: 'Ana ekrandan açıldı',
    secureContext: 'Güvenli bağlam',
    inputRate: 'Giriş örnekleme hızı',
    applied: 'Uygulanan ayarlar',
    delivered: 'Gelen çerçeve',
    dropped: 'Kaçan çerçeve',
    silent: 'Sessiz çerçeve',
    shells: {
      browser: 'Tarayıcı',
      'ios-app': 'iOS uygulaması',
      'android-app': 'Android uygulaması',
    },
    yes: 'Evet',
    no: 'Hayır',
    on: 'açık',
    off: 'kapalı',
    unknown: 'bilinmiyor',
    hz: (value: string) => `${value} Hz`,
    json: 'Rapor (JSON)',
    download: 'Raporu indir (JSON)',
  },
} as const;
