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
} as const;
