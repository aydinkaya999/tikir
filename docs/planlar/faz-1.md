# Faz 1 planı: Ses denemesi

> Durum: onaylandı (2026-11-19). Uygulama `faz-1` dalında, bu oturumda yürür; sonunda bütün dal bağımsız bir incelemeden geçer. Görevler sırayla yürür; adımlar `- [ ]` kutularıyla izlenir. Her görevin sonunda `pnpm check` çalışır; geçerse görevin kutuları işaretlenir ve aynı commit'e girer. Dalın birleştirilmesi ve push ürün sahibinin kararıdır.

**Amaç:** Mikrofondan sunucuya giden ses yolunu gerçek cihazlarda denemeye hazırlamak. Bu fazda yazılacaklar: `AudioCapture` arayüzü ve `WebAudioCapture` (AudioWorklet içinde 16 kHz, tek kanal, 16 bit, 20 ms çerçeve), `/gelistirme/ses` sayfası, yerel yankı sunucusu, cihaz denemesi için HTTPS sunucusu ve sonuç şablonu. İkinci yarıda aynı sayfa Capacitor kabuğunda, iOS ve Android'de açılır.

**Kaynak belgeler:** `docs/yol-haritasi.md` (Faz 1, kabul ölçütleri), `docs/dinleme-hatti.md` bölüm 1 ve 5, `docs/mimari.md` (servisler, klasörler, katman yönü), `docs/kararlar.md` (T1, T9, T12, T15), `docs/ekranlar.md` → "Tasarımı olmayan durumlar" (hata bildirimi kalıbı).

**Yığın:** Faz 0 yığını. Yeni paketler: `ws` ve `@types/ws` (geliştirme bağımlılığı, yankı sunucusu); `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli` (bugün 8.6.2). Sürümlere kurulum anında yeniden bakılır. Depo dışında hazır olanlar: mkcert (kök sertifikası bu Mac'te güvenilir), Google Chrome 157, Xcode 27.2 ve iOS 26.1 simülatörleri, Android Studio 2026.2 (SDK 36, `Medium_Phone_API_36.1` emülatörü, JDK 25).

**Kapsam dışı:** konuşma tanıma; seans ekranları; `ReadingListener` ve `FakeListener` (Faz 2); ürün ekranlarında veli onayı denetimi (Faz 2); uygulama kabuğunun içinden yankı testi; PWA, uygulama simgesi ve açılış ekranı (Faz 7).

## Görev listesi

- [x] Task 0: Plan dosyası ve dal
- [x] Task 1: PCM ve WAV
- [x] Task 2: Örnekleme hızı dönüştürücü
- [x] Task 3: Çerçeveleyici, düzey ölçer ve yakalama zinciri
- [x] Task 4: `AudioCapture` ve `WebAudioCapture`
- [x] Task 5: AudioWorklet ve mikrofon bölümü
- [x] Task 6: Kayıt ve geri çalma
- [ ] Task 7: Yankı sunucusu ve yankı testi
- [ ] Task 8: Cihaz raporu
- [ ] Task 9: Cihaz denemesi sunucusu
- [ ] Task 10: Sonuç şablonu, belgeler ve web yarısının denetimi
- [ ] Task 11: Capacitor kurulumu
- [ ] Task 12: Kabukta derleme ve açılış
- [ ] Task 13: Kabul ölçütleri yürüyüşü

## Onaylanan kararlar

1. **İkinci yarı bu oturumda yapılır, en sona kalır** (ürün sahibi, 2026-11-19). Web yarısı Task 10'da kendi başına biter, Capacitor (Task 11–12) onun üstüne kurulur. Kabukta sesin boş gelmediğini gerçek cihazda insan doğrular (ölçüt 6).
2. **Ses denemesi sayfasında onay istisnası** (ürün sahibi, 2026-11-19). `/gelistirme/ses` mikrofonu veli onayı kaydı olmadan açar. Gerekçe: Faz 1'de depo ve `consent.voiceProcessing` yok, sayfa üretim derlemesine girmez ve denemeyi bir yetişkin yapar. `docs/kararlar.md` → T16. Ürün ekranlarındaki onay denetimi ve testi Faz 2'de gelir.
3. **Ses yardımcıları `domain` içinde değil, `src/services/audio` içinde durur.** Dönüştürücü, çerçeveleyici, düzey ölçer, PCM ve WAV saf modüllerdir ve birim testlidir. Ama ürün kuralı değil, yakalama uygulamasının parçasıdırlar ve AudioWorklet paketine girerler.
4. **`AudioCapture` arayüzüne `diagnostics()` eklenir** ve `docs/mimari.md` buna göre güncellenir. Cihaz raporu bu işlevi okur; ileride yerel bir ses eklentisi gerekirse aynı alanları o verir. `start()` hiçbir zaman reddetmez; hata bir duruma dönüşür.
5. **Açılış sırası:** `getUserMedia` → `AudioContext` → `audioWorklet.addModule` → kaynak ve işleyici düğümü → `resume()`. Bağlam mikrofondan sonra kurulur, çünkü iPhone'da donanım hızı mikrofon açılınca belli olur ve Safari yakalama sürerken ses bağlamına izin verir. Tek kanala indirmeyi tarayıcı yapar (`channelCount: 1`, `channelCountMode: 'explicit'`, `channelInterpretation: 'speakers'`); Chromium'un sahte aygıtı 2 kanal veriyor. İşleyici düğümü, grafik her tarayıcıda işlensin diye sessiz çıkışla hedefe bağlanır.
6. **Varsayılan ayarlarda üçü de açıktır:** yankı giderme, gürültü bastırma ve otomatik kazanç. Bu, tarayıcıların da varsayılanıdır. Sayfada her biri için bir anahtar bulunur; hangisinin iyi olduğu cihaz denemesinde ölçülür. Not: açıkken Chromium sahte aygıtın sabit tonunu yaklaşık 19 dB bastırıyor (ölçüldü). Bu yüzden e2e'de tonu ve frekansı ölçen test anahtarları kapatır. Karar 5 ile birlikte `docs/kararlar.md` → T18.
7. **Dönüştürücü:** pencereli sinc (Blackman). Kesim frekansı, küçük Nyquist frekansının 0,9 katıdır (16 kHz'e inerken 7,2 kHz). Çekirdek her yanda 16 sıfır geçişi kadar uzanır. Her giriş hızını kabul eder: 44,1 ve 48 kHz, Bluetooth'un 16 ve 24 kHz'i, ayrıca 8 kHz'ten yukarı dönüştürme. Giriş ve çıkış hızı eşitse örnekleri olduğu gibi geçirir.
8. **Sayaçlar:**
   - gelen çerçeve;
   - kaçan çerçeve: işleyicinin girdi alamadığı süre (boş gelen 128'lik kuantumlar, 16 kHz örneğe çevrilip 320'ye bölünür) ile ana iş parçacığına sıra numarası atlayarak gelen çerçevelerin toplamı;
   - sessiz çerçeve: örneklerinin hepsi sıfır olan çerçeve.
   Uygulama kabuğundaki "ses boş geliyor" riski sessiz çerçeve sayısıyla görünür.
9. **Mikrofonu bırakma:** sekme gizlenince (`visibilitychange` → `hidden`) ve `pagehide` olayında servis mikrofonu kendisi kapatır (`stop()`). Sayfa kaldırılınca `stop()` çağrısını sayfa yapar. Sekme yeniden görünür olunca mikrofon kendiliğinden açılmaz, çünkü kullanıcı hareketi gerekir.
10. **Kayıt saatle değil çerçeve sayısıyla tutulur:** 500 çerçeve = 10 sn = 160 000 örnek. Mikrofon kayıt bitmeden kapanırsa kayıt eldekiyle biter ve süresini söyler. "Kaydı çal" önce mikrofonu kapatır (iPhone'da mikrofon açıkken hoparlör kısılır), sonra WAV'ı Web Audio ile çalar; böylece CSP'ye `media-src` eklemek gerekmez. WAV indirilebilir: ayarların sese etkisi sonra karşılaştırılabilsin diye (`dinleme-hatti.md` bölüm 1: "hangisinin tanımaya yaradığı Faz 1'de ölçülecek").
11. **Yankı bağlantısı aynı kökenden kurulur:**
    - `scripts/echo-server.ts` `ws` paketini kullanır ve yalnız `127.0.0.1:4318` adresini dinler. Aynı kapıda düz HTTP isteğine 200 döner (Playwright hazır olduğunu böyle anlar).
    - Vite'in geliştirme ve önizleme sunucusu `/gelistirme/yanki` adresine gelen bağlantıyı `ws://127.0.0.1:4318` adresine aktarır.
    - Sayfa kendi kökenine bağlandığı için CSP değişmez. Chromium ve WebKit'te denendi: `default-src 'self'` aynı kökenli `ws:` bağlantısını engellemiyor, başka kökene gideni engelliyor. HTTPS sayfada adres `wss:` olur.
    - Test, sıradaki 500 çerçeveyi gönderir. Her ileti 8 baytlık başlık (sıra numarası `uint32`, küçük sonlu, ardından 4 boş bayt) ve 640 baytlık PCM'den oluşur.
    - Geri dönüş süresi `performance.now()` ile ölçülür. Ortanca ve 95. yüzdelik en yakın sıra yöntemiyle hesaplanır. Son gönderimden 2 sn sonra dönmemiş çerçeve kayıp sayılır. Bağlantı 5 sn içinde açılmazsa sonuç "ulaşılamadı" olur.
12. **Gerçek cihaz için HTTPS:** `pnpm audio-trial` şunları yapar:
    - bu Mac'in yerel ağ adresleri için mkcert ile sertifika üretir (`.cert/`, git dışı);
    - e2e kipinde `dist-trial/` klasörüne derler;
    - önizlemeyi `https://<ip>:4443` adresinde, yankı sunucusunu da yanında açar.
    mkcert kök sertifikası cihazlara elle kurulur (şablonda adım adım). Gerekçe: iPhone'da mikrofon yalnız güvenli bağlamda açılır, ana ekrana eklenen uygulama da sertifika uyarısını geçemez. Karar 11 ile birlikte `docs/kararlar.md` → T20.
13. **Geliştirme sayfasının metinleri `tr.ts` dışında durur.** Sayfanın tasarımı yok; Türkçe metinler `src/features/dev/audio/copy.ts` içinde, aşağıdaki listede (onayınıza). Gerekçe: `tr.ts` üretim paketine girer, geliştirme sayfası girmez. ESLint bu klasörü JSX metin kuralından zaten muaf tutuyor. Bu karar `docs/kararlar.md`'ye T17 olarak yazılır, `CLAUDE.md` metin kuralına da bir yan cümle eklenir. Hata metinleri `docs/ekranlar.md` kalıbına uyar: ne olduğunu ve ne yapılacağını söyleyen tek cümle.
14. **Servisler sayfaya prop olarak gelir.** `src/app/services.ts` (`docs/mimari.md`: hangi uygulamanın kullanılacağı tek yerden seçilir) `audioLabServices` nesnesini kurar; rota bu nesneyi tembel yüklenen sayfaya verir. Böylece katman yönü korunur ve bu kod üretim derlemesine girmez.
15. **E2E'de mikrofon:**
    - Chromium'un sahte aygıtı `--use-file-for-fake-audio-capture` ile 440 Hz ton çalar; dosyayı Playwright'ın global kurulumu yazar.
    - WebKit'te `microphone` izni verilince Playwright'ın sahte aygıtı ton üretir.
    - İzin reddi, aygıt yokluğu ve güvensiz sayfa iki tarayıcıda da `addInitScript` saplamasıyla sınanır.
    - Mikrofonun bırakıldığını, `getUserMedia` sarılıp dönen izlerin `ended` olması kanıtlar.
    - `E2E_CHROME=1` iken kurulu Google Chrome'da koşan bir `chrome` projesi eklenir (ölçüt 2).
16. **Capacitor denemesi:**
    - appId `com.tikir.app` (varsayım; Faz 7'de kesinleşir); webDir `dist-cap`.
    - Derleme `cap` kipindedir: geliştirme sayfaları dahil, CSP aynı.
    - `server.appStartPath: '/gelistirme/ses'` ile uygulama doğrudan ses sayfasında açılır; bu ayar Faz 7'de kalkar.
    - iOS mikrofon izni metni (taslak; asıl izin metinleri Faz 7'nin işi): "Tıkır, sesli okumayı dinlemek için mikrofonu kullanır."
    - Android izinleri: `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`.
    - Capacitor CLI'ın kullanım verisi gönderimi kapatılır (`cap telemetry off`); gerekçe T12.
    - Uygulama içinde yankı testi yok: aynı köken bulunmuyor; CSP, iOS ATS ve Android ağ güvenliği ayarlarını değiştirmek gerekirdi.
    - `docs/kararlar.md` → T19.

### Geliştirme sayfası metinleri (karar 13)

```ts
title: 'Ses denemesi'
intro: 'Mikrofondan sunucuya giden yolu dener: izin, düzey, kayıt, yankı ve cihaz raporu. Tanıma yok.'
mic: {
  heading: 'Mikrofon',
  echoCancellation: 'Yankı giderme', noiseSuppression: 'Gürültü bastırma', autoGainControl: 'Otomatik kazanç',
  settingsHint: 'Ayarlar mikrofon bir sonraki açılışta uygulanır.',
  open: 'Mikrofonu aç', close: 'Mikrofonu kapat', retry: 'Yeniden dene',
  stateLabel: 'Durum',
  states: { idle: 'Kapalı', starting: 'Açılıyor', capturing: 'Açık', denied: 'İzin yok', unavailable: 'Kullanılamıyor', error: 'Hata' },
  permissionLabel: 'Tarayıcı izni',
  permission: { granted: 'Verildi', denied: 'Reddedildi', prompt: 'Sorulacak', unknown: 'Bilinmiyor' },
  level: 'Ses düzeyi', silence: 'Sessiz', dbfs: (n) => `${n} dBFS`,
  problems: {
    denied: 'Mikrofon izni reddedildi; site ayarlarından mikrofona izin verip Yeniden dene düğmesine dokun.',
    insecure: 'Sayfa güvenli bağlantıyla açılmadığı için mikrofon kullanılamıyor; sayfayı https:// ya da localhost adresiyle aç.',
    noDevice: 'Bu cihazda mikrofon bulunamadı; bir mikrofon bağlayıp Yeniden dene düğmesine dokun.',
    error: 'Mikrofon açılamadı ya da kesildi; mikrofonu kullanan başka bir uygulamayı kapatıp Yeniden dene düğmesine dokun.',
    detail: (name, message) => `Ayrıntı: ${name}: ${message}`,
  },
}
recording: {
  heading: 'Kayıt', record: '10 saniye kaydet',
  progress: (s) => `Kaydediliyor: ${s} sn`, ready: (s) => `Kayıt hazır: ${s} sn`, partial: (s) => `Kayıt yarıda kaldı: ${s} sn`,
  play: 'Kaydı çal', stop: 'Çalmayı durdur', playing: 'Çalıyor',
  playHint: 'Çalmadan önce mikrofon kapanır.', download: 'Kaydı indir (WAV)',
}
echo: {
  heading: 'Yankı testi', url: 'Yankı adresi', start: 'Yankı testini başlat', stop: 'Testi durdur',
  progress: (sent, total) => `Gönderilen çerçeve: ${sent} / ${total}`,
  sent: 'Gönderilen', received: 'Dönen', lost: 'Kayıp', median: 'Ortanca', p95: '95. yüzdelik', min: 'En kısa', max: 'En uzun',
  ms: (n) => `${n} ms`,
  outcomes: {
    unreachable: 'Yankı sunucusuna ulaşılamadı; bilgisayarda pnpm audio-trial ya da pnpm echo-server çalışıyor mu, bak.',
    closed: 'Bağlantı test bitmeden kapandı; sonuçlar o ana kadar dönen çerçevelerden.',
    stopped: 'Test yarıda durdu; sonuçlar o ana kadar dönen çerçevelerden.',
  },
}
report: {
  heading: 'Cihaz raporu',
  browser: 'Tarayıcı', os: 'İşletim sistemi', shell: 'Kabuk', standalone: 'Ana ekrandan açıldı', secureContext: 'Güvenli bağlam',
  inputRate: 'Giriş örnekleme hızı', applied: 'Uygulanan ayarlar', delivered: 'Gelen çerçeve', dropped: 'Kaçan çerçeve', silent: 'Sessiz çerçeve',
  shells: { browser: 'Tarayıcı', 'ios-app': 'iOS uygulaması', 'android-app': 'Android uygulaması' },
  yes: 'Evet', no: 'Hayır', on: 'açık', off: 'kapalı', unknown: 'bilinmiyor', hz: (n) => `${n} Hz`,
  json: 'Rapor (JSON)', download: 'Raporu indir (JSON)',
}
```

## Her görevde geçerli kurallar

- CLAUDE.md kuralları geçerlidir: ürün metni `src/i18n/tr.ts` içinde, geliştirme sayfasının metni `copy.ts` içinde durur (karar 13); emoji yok; `any` yok; `design/` ve `seed/` değişmez.
- Katman yönü `features` → `services` → `domain` şeklindedir. Tarayıcı API'lerine yalnız `src/services` dokunur; bunu lint ve `src/lint-boundaries.test.ts` denetler.
- Mikrofon yalnız bir tıklama işleyicisinden açılır. Sayfa yüklenince mikrofon açılmaz.
- Davranışı olan her şey önce testle yazılır: test önce kırmızı görülür, sonra yeşil. Saf modüller birim testiyle (`node` ortamı), tarayıcı yapıştırıcısı e2e ile sınanır.
- Yeni paket eklemeden önce `docs/kararlar.md` → Bağımlılıklar tablosuna satırı yazılır. Kurulumda o anki güncel kararlı sürüm kullanılır.
- Komutlar Node 26 ile çalışır: `eval "$(mise env -s zsh)"` (Faz 0, uygulama kararı 5).
- Her görevin son adımı:
  - `pnpm check` geçer;
  - tarayıcıya dokunan görevlerde `pnpm e2e e2e/audio-lab.spec.ts` iki tarayıcıda geçer;
  - görevin kutuları işaretlenir;
  - Conventional Commits biçiminde, İngilizce mesajla commit atılır.
- Sayfanın tasarım karşılığı yok. Ekran görüntüleri yine üç genişlikte alınır; taşma ve 44 px kuralı e2e'de denetlenir.

## İnceleme odağı

Belgenin açıkça söylemediği ama bir kullanıcıyı en çok yakacak beş durum. Hepsinin testi, sahibi olan görevde yazılır.

1. **Açılırken kapatma.** Kullanıcı düğmeye iki kez dokunur ya da izin sorulurken sekmeyi gizler. Beklenen: geç gelen mikrofon hemen kapatılır, ışığı yanık kalmaz (Task 4).
2. **Alışılmadık giriş hızı.** Bluetooth kulaklık 16 ya da 24 kHz, bazı aygıtlar 8 kHz verir; giriş ve çıkış hızı eşit olabilir. Beklenen: çıkış uzunluğu ve perde doğru kalır (Task 2).
3. **Mikrofon iş ortasında kapanır.** Kayıt ya da yankı testi sürerken sekme gizlenir veya iz biter. Beklenen: iş eldekiyle biter, takılıp kalmaz, yarım kaldığını söyler (Task 6, Task 7).
4. **Yankı sunucusuna ulaşılamaz.** Sunucu kapalıdır, adres yanlıştır ya da CSP bağlantıyı daha kurulurken reddeder (WebKit `SecurityError` fırlatıyor). Beklenen: 5 sn içinde "ulaşılamadı" cümlesi çıkar, sayfa çökmez (Task 7).
5. **Arka plana alma.** Mikrofon açıkken sekme gizlenir ya da uygulama arka plana gider. Beklenen: mikrofon bırakılır ve kendiliğinden yeniden açılmaz (Task 4, Task 5).

## Görevler

### Task 0: Plan dosyası ve dal

- [x] `main` üzerinden `faz-1` dalını aç.
- [x] Bu dosyanın durum satırını "onaylandı (tarih)" yap.
- [x] Commit: `docs: add phase 1 plan`

### Task 1: PCM ve WAV

**Dosyalar:** `src/services/types.ts`, `src/services/audio/pcm.ts`, `pcm.test.ts`, `src/services/audio/wav.ts`, `wav.test.ts`, `src/test/signal.ts`.

**Üretir:**

```ts
// services/types.ts
export type Unsubscribe = () => void
// services/audio/pcm.ts
export function floatToInt16(sample: number): number      // [-1, 1]'e kırpar; eksi × 32768, artı × 32767, Math.round; NaN → 0
export function toInt16(samples: Float32Array): Int16Array
export function toFloat32(samples: Int16Array): Float32Array   // ÷ 32768
export function rms(samples: ArrayLike<number>): number     // boşsa 0
export function rmsToDbfs(value: number): number            // 20·log10(value); 0 → -Infinity
export function isSilent(samples: Int16Array): boolean      // hepsi 0
// services/audio/wav.ts
export interface WavData { sampleRate: number; channels: number; bitsPerSample: number; samples: Int16Array }
export function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer   // 44 baytlık RIFF/WAVE başlığı; PCM, tek kanal, 16 bit
export function parseWav(buffer: ArrayBuffer): WavData      // 16 bit PCM dışını reddeder (Error)
// test/signal.ts (yalnız testler ve e2e)
export function sine(o: { hz: number; sampleRate: number; seconds: number; amplitude?: number }): Float32Array
export function zeroCrossingHz(samples: ArrayLike<number>, sampleRate: number): number
export function seededRandom(seed: number): () => number
```

- [x] Önce testler:
  - `floatToInt16`: 1 → 32767, −1 → −32768, 0 → 0, 0,5 → 16384, 1,5 → 32767, −1,5 → −32768, NaN → 0;
  - `toFloat32(toInt16(x))`, x'ten en çok 1/32768 sapar;
  - `rms`: sabit 0,5 → 0,5; genliği 0,5 olan sinüs → 0,3536 ± 0,001; boş dizi → 0;
  - `rmsToDbfs`: 1 → 0; 0,5 → −6,02 ± 0,01; 0 → −Infinity;
  - `isSilent`: sıfır dizi true, tek örneği 1 olan dizi false;
  - `encodeWav`, 160 örnek ve 16000 Hz ile 44 + 320 bayt üretir. Başlıkta "RIFF", "WAVE", "fmt " (boyut 16, biçim 1, kanal 1, hız 16000, bayt hızı 32000, blok 2, 16 bit) ve "data" (320) bulunur; örnekler küçük sonludur;
  - `parseWav(encodeWav(x, 16000))` x'i ve başlık değerlerini aynen verir; RIFF olmayan tampon hata fırlatır.
- [x] Kırmızıyı gör (`pnpm test src/services/audio/pcm.test.ts`, `pnpm test src/services/audio/wav.test.ts`), sonra yaz, yeşili gör.
- [x] Commit: `feat(audio): add PCM conversion and WAV encoding`

### Task 2: Örnekleme hızı dönüştürücü

**Dosyalar:** `src/services/audio/resampler.ts`, `resampler.test.ts`.

**Üretir:**

```ts
export class Resampler {
  constructor(inputRate: number, outputRate: number)
  push(input: Float32Array): Float32Array   // şimdiye kadar tamamlanan çıkış örnekleri
  flush(): Float32Array                     // kalan örnekler; giriş sıfırla uzatılır
}
```

- Yaklaşım (karar 7): n. çıkış örneği girişte `n × inputRate / outputRate` konumuna düşer. Değeri, o konumun çevresindeki girişlerin Blackman pencereli sinc çekirdeğiyle ağırlıklı toplamıdır. Ağırlıklar her çıkış için kendi toplamına bölünür, böylece DC kazancı 1 olur. Akışta yalnız çekirdeğin ihtiyaç duyduğu geçmiş tutulur.
- [x] Önce testler:
  - uzunluk: `push` ve `flush` çıkışlarının toplamı `ceil(N × out / in)` eder. Örnekler: 48000 → 16000 hızında N 48000 ise 16000; 44100 → 16000 hızında N 44100 ise 16000; 44100 hızında N 1000 ise 363; 48000 hızında N 1 ise 1; 24000 hızında N 2400 ise 1600; 8000 → 16000 hızında N 800 ise 1600;
  - gecikme: `flush` öncesinde eksik çıkış en çok 40 örnektir (2,5 ms), ölçülen bütün hızlarda;
  - parçalamadan bağımsızlık: 48 000 örneği tek seferde vermekle 1–300 arası rastgele parçalarla (tohumlu) vermek aynı çıkışı verir (fark < 1e-6); aynısı 44,1 kHz için;
  - sinüs korunur: 1 sn, 1 kHz, genlik 0,5; 48 ve 44,1 kHz girişte, ilk ve son 20 ms dışında çıkışın RMS'i 0,3536 ± %1, frekansı 1000 ± 2 Hz;
  - geçirme bandı: 3 kHz sinüsün RMS oranı ±0,5 dB içinde kalır;
  - örtüşme bastırılır: 48 kHz'te 12 kHz ve 44,1 kHz'te 11 kHz sinüs, çıkışta giriş RMS'inin %1'inin altına iner (−40 dB);
  - eşit hız (16000 → 16000) örnekleri aynen geçirir.
- [x] Kırmızı, sonra yeşil (`pnpm test src/services/audio/resampler.test.ts`).
- [x] Commit: `feat(audio): add a streaming windowed-sinc resampler`

### Task 3: Çerçeveleyici, düzey ölçer ve yakalama zinciri

**Dosyalar:** `src/services/audio/framer.ts`, `levelMeter.ts`, `captureChain.ts` ve testleri.

**Kullanır:** `Resampler` (Task 2), `toInt16` (Task 1).

**Üretir:**

```ts
export class Framer { constructor(frameSamples: number); push(samples: Int16Array): Int16Array[]; get pending(): number }
export class LevelMeter { constructor(windowSamples: number); push(samples: Float32Array): number[] }   // dolan her pencere için bir RMS
export const captureFormat = { sampleRate: 16_000, frameSamples: 320, levelWindowSamples: 800 } as const   // 20 ms çerçeve, saniyede 20 düzey
export interface ChainOutput { frames: Int16Array[]; levels: number[] }
export class CaptureChain { constructor(inputRate: number); process(input: Float32Array): ChainOutput; flush(): ChainOutput }
```

- Zincirin sırası: `Resampler(inputRate → 16000)` → düzey ölçer (kayan noktalı örneklerde) → `toInt16` → çerçeveleyici.
- [x] Önce testler:
  - çerçeveleyici: 10 000 örneklik sayaç dizisi, 0–1000 arası rastgele parçalarla (tohumlu) verilir. Her çerçeve 320 örnektir; çerçeveler art arda eklenince girişin ilk 31 × 320 örneğini verir; `pending` 80'dir. Çerçeveler girişin kopyasıdır: giriş sonradan değişirse çerçeve değişmez (işleyici tamponları aktarıyor);
  - düzey ölçer: sabit 0,5 girişte her değer 0,5'tir; 16 000 örnek 20 değer verir; sonuç parçalamadan bağımsızdır;
  - zincir: 48 kHz'te 1 sn 1 kHz sinüs 128'lik parçalarla verilir, ardından `flush` çağrılır. Sonuç: 50 çerçeve, 20 düzey (ilki hariç 0,3536 ± %1), çerçevelerin frekansı 1000 ± 2 Hz. Aynı girdi 44,1 kHz'te de 50 çerçeve verir.
- [x] Kırmızı, sonra yeşil.
- [x] Commit: `feat(audio): add framer, level meter and capture chain`

### Task 4: `AudioCapture` ve `WebAudioCapture`

**Dosyalar:** `src/services/audio/AudioCapture.ts`, `captureEnvironment.ts`, `WebAudioCapture.ts`, `WebAudioCapture.test.ts`, `docs/mimari.md`.

**Üretir:**

```ts
// AudioCapture.ts
export type CaptureState = 'idle' | 'starting' | 'capturing' | 'denied' | 'unavailable' | 'error'
export interface CaptureSettings { echoCancellation: boolean; noiseSuppression: boolean; autoGainControl: boolean }
export const defaultCaptureSettings: CaptureSettings        // üçü true (karar 6)
export interface AppliedTrackSettings { echoCancellation?: boolean; noiseSuppression?: boolean; autoGainControl?: boolean; sampleRate?: number; channelCount?: number; latency?: number }
export interface CaptureFailure { name: string; message: string }
export interface CaptureDiagnostics {
  requested: CaptureSettings; applied: AppliedTrackSettings | null; deviceLabel: string | null
  inputSampleRate: number | null; framesDelivered: number; framesDropped: number; framesSilent: number
  failure: CaptureFailure | null
}
export interface AudioCapture {
  readonly state: CaptureState
  start(): Promise<void>            // kullanıcı hareketiyle çağrılır; hiç reddetmez
  stop(): Promise<void>             // her durumda güvenli; tekrar çağrılabilir
  onFrame(cb: (pcm16: Int16Array) => void): Unsubscribe
  onLevel(cb: (rms: number) => void): Unsubscribe
  onStateChange(cb: (state: CaptureState) => void): Unsubscribe
  diagnostics(): CaptureDiagnostics
}
// captureEnvironment.ts: tarayıcıyla dikiş yeri; testlerde sahtesi verilir
export type WorkletMessage =
  | { type: 'frame'; seq: number; samples: Int16Array }
  | { type: 'level'; rms: number }
  | { type: 'missed'; samples: number }        // son iletiden beri üretilemeyen 16 kHz örnek sayısı
export interface CaptureGraph {
  readonly sampleRate: number; readonly trackSettings: AppliedTrackSettings; readonly deviceLabel: string
  onMessage(cb: (message: WorkletMessage) => void): void
  onInterrupted(cb: (failure: CaptureFailure) => void): void   // iz bitti ya da bağlam kesildi
  close(): Promise<void>                                     // iz durur, düğümler ayrılır, bağlam kapanır
}
export interface CaptureEnvironment {
  readonly supported: boolean                                // getUserMedia var mı (güvenli bağlam)
  open(settings: CaptureSettings): Promise<CaptureGraph>      // tarayıcının hatasıyla reddeder
  onPageHidden(cb: () => void): Unsubscribe
}
// WebAudioCapture.ts
export function classifyCaptureError(error: unknown): 'denied' | 'unavailable' | 'error'
export class WebAudioCapture implements AudioCapture { constructor(settings: CaptureSettings, environment: CaptureEnvironment) }
```

- `supported` false ise durum `unavailable` olur, hata adı `MediaDevicesMissing` kaydedilir ve `open` hiç çağrılmaz.
- Hata sınıflaması: `NotAllowedError` ve `SecurityError` → `denied`; `NotFoundError`, `OverconstrainedError` ve `NotSupportedError` → `unavailable`; geri kalan her şey → `error`.
- Sayaçlar her başarılı açılışta sıfırlanır.
- [x] Önce testler (sahte ortamla, `node` ortamında):
  - açılış: `starting` ve `capturing` durumları bu sırayla yayınlanır; `diagnostics()` giriş hızını, uygulanan ayarları ve aygıt adını verir;
  - `supported` false: durum `unavailable`, hata adı `MediaDevicesMissing`, `open` çağrılmadı;
  - sınıflama tablosu: yukarıdaki adlar, `TypeError`, düz `Error` ve dizgi;
  - `open` reddedince de `start()` çözülür; hata `{ name, message }` olarak kaydedilir;
  - çerçeve iletisi dinleyicilere gider ve `framesDelivered` artar; hepsi sıfır bir çerçeve `framesSilent`'i artırır; sıra 0, 1, 3 gelirse `framesDropped` 1 olur; `missed` 640 gelirse `framesDropped` 2 artar;
  - düzey iletisi `onLevel` dinleyicilerine gider;
  - `stop()`: `close` bir kez çağrılır, durum `idle` olur; ikinci `stop` etkisizdir; sonra gelen iletiler dinleyicilere ulaşmaz;
  - sayfa gizlenince açık mikrofon kapanır (`idle`);
  - `starting` sırasında `stop()`: `open` sonradan çözülünce o grafik kapatılır, durum `idle` kalır, `capturing` hiç yayınlanmaz (inceleme odağı 1);
  - mikrofon açıkken `start()` ikinci kez `open` çağırmaz;
  - `onInterrupted` gelince durum `error` olur, hata kaydedilir, grafik kapatılır;
  - `denied` durumundan sonra `start()` yeniden dener ve mikrofon açılabilir;
  - yeni açılışta sayaçlar sıfırlanır; aboneliği bırakan dinleyici bir daha çağrılmaz.
- [x] Kırmızı, sonra yeşil (`pnpm test src/services/audio/WebAudioCapture.test.ts`).
- [x] `docs/mimari.md`: `AudioCapture` arayüzüne `diagnostics()` eklenir, servis klasörünün yeni dosyaları yazılır.
- [x] Commit: `feat(audio): add the AudioCapture interface and WebAudioCapture`

### Task 5: AudioWorklet ve mikrofon bölümü

**Dosyalar:** `src/services/audio/capture.worklet.ts`, `src/services/audio/browserCaptureEnvironment.ts`, `src/app/services.ts`, `src/app/router.tsx`, `src/features/dev/AudioLabPage.tsx` (taşınır: `src/features/dev/audio/AudioLabPage.tsx`, `AudioLabPage.module.css`), `src/features/dev/audio/MicSection.tsx`, `useCapture.ts`, `copy.ts`, `captureProblem.ts`, `captureProblem.test.ts`, `format.ts`, `format.test.ts`, `vite.config.ts`, `playwright.config.ts`, `e2e/support/tone.ts`, `e2e/support/global-setup.ts`, `e2e/support/media.ts`, `e2e/audio-lab.spec.ts`, `src/i18n/tr.test.ts`, `docs/kararlar.md`, `CLAUDE.md`.

**Kullanır:** `CaptureChain`, `captureFormat` (Task 3); `WebAudioCapture` ve tipler (Task 4).

**Üretir:**

```ts
// services/audio/browserCaptureEnvironment.ts
export function browserCaptureEnvironment(): CaptureEnvironment
// features/dev/audio/AudioLabPage.tsx (Task 6–8 genişletir)
export interface AudioLabServices { createCapture(settings: CaptureSettings): AudioCapture }
export function AudioLabPage(props: { services: AudioLabServices }): JSX.Element
// features/dev/audio/captureProblem.ts
export function describeCaptureProblem(state: CaptureState, failure: CaptureFailure | null): { message: string; detail: string | null } | null
// features/dev/audio/format.ts
export function meterValue(rms: number): number          // −60 dBFS → 0, 0 dBFS → 1, aradaki dB doğrusal, [0, 1]'e kırpılır
export function formatDbfs(rms: number): string          // tam sayı, tr-TR; rms 0 → copy.mic.silence
export function formatSeconds(seconds: number): string   // bir ondalık, tr-TR ("10,0")
export function formatMs(ms: number): string             // bir ondalık, tr-TR
// app/services.ts
export const audioLabServices: AudioLabServices
```

- İşleyicinin adı `tikir-capture`'dır ve içinde `CaptureChain(sampleRate)` çalışır. Girdi kanalı gelmeyen kuantumda eksik örnekleri `missed` iletisiyle bildirir. Çerçeveleri `seq` numarasıyla ve tamponu aktararak gönderir.
- TypeScript'te AudioWorklet kütüphanesi yok. `sampleRate`, `AudioWorkletProcessor` ve `registerProcessor` dosyanın içinde `declare` ile tanımlanır; bu tanımlar genel kapsama sızmaz.
- İşleyicinin adresi `import workletUrl from './capture.worklet.ts?worker&url'` ile alınır. `vite.config.ts` içinde `worker.format: 'es'` ayarlanır, çünkü AudioWorklet modül yükler; böylece işleyici geliştirmede de derlemede de modül olur.
- `browserCaptureEnvironment` karar 5'teki sırayla açar:
  - ilk adımdan sonraki her hatada izi durdurur, bağlamı kapatır ve hatayı yeniden fırlatır;
  - izin `ended` olması ile bağlamın kendiliğinden `interrupted` ya da `closed` durumuna geçmesi `onInterrupted` olarak bildirilir;
  - `visibilitychange` (`hidden`) ve `pagehide` olayları `onPageHidden` olarak bildirilir.
- Rota, `services.ts` dosyasını geliştirme rotasının `lazy` yükleyicisinde dinamik olarak içe aktarır; sayfa `services` prop'unu alır.
- Sayfanın bu görevdeki içeriği:
  - başlık ve giriş cümlesi;
  - "Mikrofon" kartında üç anahtar (mikrofon açıkken pasif) ve ayar ipucu;
  - "Mikrofonu aç" ya da "Mikrofonu kapat" düğmesi; sorun varsa sorun cümlesi ve "Yeniden dene";
  - durum satırı;
  - düzey göstergesi: `role="meter"`, adı "Ses düzeyi", `aria-valuenow` = `meterValue`, `aria-valuetext` = dBFS.
  Sayfa kaldırılınca `stop()` çağrılır. Yalnız var olan bileşenler ve token'lar kullanılır.
- [x] Önce birim testleri:
  - `describeCaptureProblem`:
    - `denied` → izin cümlesi, ayrıntı yok;
    - `unavailable` + `MediaDevicesMissing` → güvenli bağlantı cümlesi;
    - `unavailable` + `NotFoundError` → mikrofon yok cümlesi;
    - `error` + hata → hata cümlesi ve "Ayrıntı: NotReadableError: …";
    - `idle`, `starting`, `capturing` → null;
  - `meterValue`: 0 → 0, 1 → 1, 0,001 → 0, 0,0316 → 0,5 ± 0,01, 2 → 1;
  - `formatDbfs`: 0,5 → "-6 dBFS", 0 → "Sessiz";
  - `formatSeconds`: 10 → "10,0"; `formatMs`: 12,345 → "12,3".
- [x] Önce e2e testleri (`e2e/audio-lab.spec.ts`, iki tarayıcıda, `test.use({ permissions: ['microphone'] })`):
  - "the microphone opens and the level meter follows the sound": varsayılan ayarlarla "Mikrofonu aç" → durum "Açık" → 3 sn içinde `aria-valuenow` > 0,2. Varsayılan işleme tonu bastırsa da bu eşik geçilir: ölçülen en düşük değer 0,53;
  - "a refused permission is explained and can be retried": `getUserMedia` `NotAllowedError` ile reddeder → durum "İzin yok" ve izin cümlesi görünür; "Yeniden dene" `getUserMedia`'yı ikinci kez çağırır; sayfada `pageerror` olmaz;
  - "a missing microphone is explained": `NotFoundError` → mikrofon yok cümlesi;
  - "an insecure page is explained": `navigator.mediaDevices` yok → güvenli bağlantı cümlesi;
  - "the microphone is released when the tab is hidden": bütün izler `ended`, durum "Kapalı";
  - "the microphone is released when leaving the page": `history.pushState` ve `popstate` ile `/` adresine geçilir, bütün izler `ended` olur.

  Destek dosyaları:
  - `e2e/support/tone.ts`: `os.tmpdir()/tikir-e2e/tone-440hz-48k.wav` yolunu verir (1 sn, genlik 0,5, `sine` ve `encodeWav` ile yazılır);
  - `e2e/support/global-setup.ts`: ton dosyasını yazar;
  - `e2e/support/media.ts`: `getUserMedia` saplaması, `mediaDevices` silme, akış izleme, sekmeyi gizleme (`visibilityState` + olay), izlerin bitip bitmediğini sorgulama.

  `playwright.config.ts` değişiklikleri:
  - `globalSetup` eklenir;
  - Chromium projesine `--use-fake-ui-for-media-stream`, `--use-fake-device-for-media-stream` ve `--use-file-for-fake-audio-capture=<ton>` bayrakları eklenir;
  - `E2E_CHROME=1` iken aynı ayarlarla `channel: 'chrome'` kullanan bir `chrome` projesi eklenir.
- [x] Uygula; yeşili gör.
- [x] `tr.test.ts` içindeki emoji denetimi `copy` nesnesini de tarar.
- [x] Belgeler:
  - `docs/kararlar.md`: T16 (onay istisnası), T17 (geliştirme sayfası metinleri), T18 (yakalama varsayılanları ve açılış sırası); değişiklik günlüğüne bir satır.
  - `CLAUDE.md` "Kod kuralları": metin kuralına "geliştirme sayfalarının metni `src/features/dev/` içinde" yan cümlesi eklenir. Onay kuralına "(geliştirme sayfası istisnası: `docs/kararlar.md` T16)" eklenir.
- [x] Doğrulama:
  - `pnpm check`; `pnpm e2e e2e/audio-lab.spec.ts` iki tarayıcıda; ardından bütün `pnpm e2e`;
  - `pnpm build`, ardından `grep -rlE "gelistirme|AudioLab|tikir-capture" dist/` boş döner;
  - `pnpm dev` açıkken geçici bir Playwright betiğiyle Chromium ve WebKit'te mikrofon açılır ve düzey kıpırdar. Böylece işleyicinin geliştirme sunucusunda da modül olarak yüklendiği görülür;
  - `pnpm shots /gelistirme/ses`.
- [x] Commit: `feat(dev): open the microphone on the audio lab page`

### Task 6: Kayıt ve geri çalma

**Dosyalar:** `src/features/dev/audio/pcmRecording.ts`, `pcmRecording.test.ts`, `RecordingSection.tsx`, `AudioLabPage.tsx`, `copy.ts`, `format.ts`, `format.test.ts`, `src/services/audio/WavPlayer.ts`, `src/services/files.ts`, `src/app/services.ts`, `e2e/audio-lab.spec.ts`.

**Kullanır:** `encodeWav`, `parseWav`, `toFloat32`, `rms`, `rmsToDbfs` (Task 1); `AudioCapture` (Task 4).

**Üretir:**

```ts
// features/dev/audio/pcmRecording.ts
export const recordingFrames = 500                 // 10 sn
export class PcmRecording {
  constructor(maxFrames: number)
  append(frame: Int16Array): boolean               // dolunca true döner; dolduktan sonra gelen çerçeve yok sayılır
  get frameCount(): number
  get seconds(): number                            // frameCount × 0,02
  toSamples(): Int16Array
}
export interface RecordingSummary { seconds: number; frames: number; levelDbfs: number }
// features/dev/audio/format.ts (ek)
export function trialFileName(createdAt: Date, extension: 'json' | 'wav'): string   // ses-denemesi-YYYYMMDD-HHMM.<uzantı>, yerel saat
// services/audio/WavPlayer.ts
export interface WavPlayer { play(wav: ArrayBuffer): Promise<void>; stop(): void }   // çalma bitince ya da durdurulunca çözülür
export class WebAudioWavPlayer implements WavPlayer {}  // decodeAudioData + AudioBufferSourceNode
// services/files.ts
export function saveFile(fileName: string, data: Blob): void   // nesne adresi + a[download]; sonra adres bırakılır
// AudioLabServices'e eklenenler
player: WavPlayer
saveFile(fileName: string, data: Blob): void
```

- Bölümün içeriği:
  - "10 saniye kaydet" düğmesi (yalnız mikrofon açıkken ve kayıt sürmüyorken etkin);
  - ilerleme ya da sonuç satırı;
  - "Kaydı çal" ya da "Çalmayı durdur" düğmesi;
  - "Kaydı indir (WAV)" düğmesi;
  - çalma ipucu.
- Mikrofon kayıt bitmeden kapanırsa (durum `capturing` dışına çıkarsa) kayıt eldekiyle biter ve "Kayıt yarıda kaldı" yazar.
- "Kaydı çal" önce `capture.stop()` çağırır, sonra çalar.
- Kayıt özeti (`RecordingSummary`) sayfaya bildirilir; Task 8'deki rapor bunu kullanır.
- [x] Önce birim testleri:
  - `PcmRecording`: 500 çerçeveden sonra dolu, 10 sn ve sırası korunmuş 160 000 örnek; doluyken gelen çerçeve yok sayılır; 210 çerçeve 4,2 sn eder;
  - `trialFileName(new Date(2026, 10, 19, 14, 32), 'wav')` → `ses-denemesi-20261119-1432.wav`.
- [x] Önce e2e testleri (iki tarayıcıda):
  - "ten seconds are recorded as 16 kHz WAV and played back":
    1. Üç anahtar kapatılır, mikrofon açılır, "10 saniye kaydet"e basılır.
    2. 15 sn içinde "Kayıt hazır: 10,0 sn" görünür.
    3. "Kaydı indir (WAV)" ile inen dosya `parseWav` ile okunur: 16000 Hz, 1 kanal, 16 bit, 160 000 örnek.
    4. Chromium'da ilk 0,2 sn dışında frekans 440 ± 4 Hz ve RMS > 0,1; WebKit'te RMS > 0,01.
    5. "Kaydı çal"a basılınca mikrofon durumu "Kapalı" olur ve "Çalıyor" yazar.
    6. "Çalmayı durdur"a basılınca yeniden "Kayıt hazır: 10,0 sn" yazar.
  - "a recording cut short by hiding the tab keeps what it has" (inceleme odağı 3): kayıt sürerken sekme gizlenir → "Kayıt yarıda kaldı" yazar ve WAV indirilebilir.
  - 10 sn süren testlerde `test.setTimeout(60_000)` kullanılır (Task 7'deki yankı testi de böyle).
- [x] Uygula; yeşili gör.
- [x] Doğrulama: `pnpm check`; `pnpm e2e e2e/audio-lab.spec.ts`.
- [x] Commit: `feat(dev): record, play back and download ten seconds of audio`

### Task 7: Yankı sunucusu ve yankı testi

**Dosyalar:** `package.json` (`ws`, `@types/ws`, `echo-server` betiği), `scripts/echo-server.ts`, `scripts/echo-server.test.ts`, `vite.config.ts`, `playwright.config.ts`, `src/app/routes.ts`, `src/services/echo/roundTrip.ts`, `EchoProbe.ts`, `WebSocketEchoProbe.ts` ve testleri, `src/features/dev/audio/EchoSection.tsx`, `AudioLabPage.tsx`, `copy.ts`, `src/app/services.ts`, `e2e/support/watch.ts`, `e2e/no-external-requests.spec.ts`, `e2e/audio-lab.spec.ts`, `docs/kararlar.md`.

**Kullanır:** `AudioCapture` (Task 4), `formatMs` (Task 5).

**Üretir:**

```ts
// scripts/echo-server.ts (doğrudan çalıştırılınca 4318'de açılır; import.meta.main)
export const echoServerPort = 4318
export function startEchoServer(port?: number): Promise<{ port: number; close(): Promise<void> }>   // 127.0.0.1; her iletiyi aynen geri yollar; düz HTTP'ye 200
// src/app/routes.ts
export const devEndpoints = { echo: '/gelistirme/yanki' } as const   // rota değil; devPaths'e girmez (rota testleri onu dolaşmasın)
// services/echo/roundTrip.ts
export interface RoundTripSummary { sent: number; received: number; lost: number; medianMs: number | null; p95Ms: number | null; minMs: number | null; maxMs: number | null }
export function percentile(sortedValues: readonly number[], p: number): number   // en yakın sıra
export function summarizeRoundTrips(roundTripsMs: readonly number[], sent: number): RoundTripSummary
// services/echo/EchoProbe.ts
export type EchoOutcome = 'completed' | 'unreachable' | 'closed' | 'stopped'
export interface EchoResult { outcome: EchoOutcome; summary: RoundTripSummary }
export interface EchoProbe {
  run(o: { url: string; capture: AudioCapture; frames: number; onProgress?: (sent: number) => void }): Promise<EchoResult>
  cancel(): void
}
export const echoFrames = 500
export function webSocketUrlFor(pageUrl: string, path: string): string   // https → wss, öteki her şey → ws
// services/echo/WebSocketEchoProbe.ts
export interface EchoSocket { binaryType: BinaryType; send(data: ArrayBuffer): void; close(): void
  onopen: (() => void) | null; onmessage: ((e: { data: unknown }) => void) | null; onerror: (() => void) | null; onclose: (() => void) | null }
export class WebSocketEchoProbe implements EchoProbe {
  constructor(o?: { createSocket?: (url: string) => EchoSocket; now?: () => number; connectTimeoutMs?: number; graceMs?: number })   // 5000, 2000
}
export function pageWebSocketUrl(path: string): string   // webSocketUrlFor(location.href, path); location'a yalnız servis dokunur
// AudioLabServices'e eklenenler
createEchoProbe(): EchoProbe
defaultEchoUrl(): string        // pageWebSocketUrl(devEndpoints.echo)
```

- Vite yönlendirmesi: `server.proxy` ve `preview.proxy` içinde `{ [devEndpoints.echo]: { target: 'ws://127.0.0.1:4318', ws: true } }`. Vitest'in `node` projesi `scripts/**/*.test.ts` dosyalarını da çalıştırır.
- Playwright `webServer` artık bir dizidir: önizleme sunucusu ve `node scripts/echo-server.ts` (`url: 'http://127.0.0.1:4318'`, `reuseExistingServer: true`).
- Bölümün içeriği:
  - "Yankı adresi" alanı (varsayılan değeri `defaultEchoUrl()`);
  - "Yankı testini başlat" (yalnız mikrofon açıkken etkin) ya da "Testi durdur";
  - ilerleme satırı;
  - sonuç listesi;
  - test tamamlanmadıysa sonucu açıklayan cümle.
  Sonuç sayfaya bildirilir (rapor için).
- Dış istek testindeki izleme yardımcısı (`watch`) `e2e/support/watch.ts` dosyasına taşınır; davranışı değişmez.
- [ ] `docs/kararlar.md`: Bağımlılıklar tablosuna `ws` ve `@types/ws`; T20 (yankı aynı kökenden, mkcert ile HTTPS; karar 11–12). Sonra paketler kurulur.
- [ ] Önce testler:
  - `roundTrip`:
    - 1..100 dizisinde p50 → 50, p95 → 95;
    - tek değerli dizide her yüzdelik o değeri verir;
    - [10, 20, 30, 40] dizisinin ortancası 20'dir;
    - boş dizi verilirse sayılar null olur ve `lost` = `sent`;
  - `webSocketUrlFor`: `https://192.168.1.5:4443/gelistirme/ses` → `wss://192.168.1.5:4443/gelistirme/yanki`; `http://localhost:4317/...` → `ws://localhost:4317/gelistirme/yanki`;
  - `WebSocketEchoProbe` (sahte soket, sahte zamanlayıcı, sahte mikrofon):
    - her çerçeve 8 baytlık başlık ve PCM olarak gönderilir, sıra numaraları 0'dan başlar;
    - 500 çerçeve gidip dönünce sonuç `completed` olur ve doğru özet döner;
    - soket kurucusu `SecurityError` fırlatırsa sonuç `unreachable` olur;
    - bağlantı 5 sn içinde açılmazsa sonuç `unreachable` olur;
    - test sürerken bağlantı kapanırsa sonuç `closed` olur ve özet o ana kadar dönen çerçevelerden hesaplanır;
    - `cancel()` ya da mikrofonun kapanması sonucu `stopped` yapar; gönderim durur ve soket kapanır (inceleme odağı 3 ve 4);
  - `scripts/echo-server.test.ts`: sunucu 0 numaralı kapıda açılır; Node'un yerleşik `WebSocket` istemcisiyle gönderilen baytlar aynen döner; düz HTTP isteği 200 döner; `close()` sonrası kapı boşalır.
- [ ] Önce e2e testleri (iki tarayıcıda):
  - "the echo test sends 500 frames and reports the round trip": mikrofon açılır, test başlatılır; 20 sn içinde "Gönderilen 500", "Dönen 500", "Kayıp 0" ve ortanca ile 95. yüzdelik için ms değerleri görünür. Başka kökene istek ve CSP ihlali yoktur (`watch`);
  - "an unreachable echo server is explained": adres aynı kökende var olmayan bir yol (`/gelistirme/yok`) yapılır; 8 sn içinde "ulaşılamadı" cümlesi görünür ve sayfa çalışmayı sürdürür.
- [ ] Uygula; yeşili gör. `pnpm e2e e2e/no-external-requests.spec.ts` taşınmadan sonra da geçer.
- [ ] Doğrulama: `pnpm check`; bütün `pnpm e2e`; `pnpm echo-server` elle açılıp kapanır.
- [ ] Commit: `feat(dev): measure echo round trips through a local WebSocket server`

### Task 8: Cihaz raporu

**Dosyalar:** `src/services/device/environment.ts`, `environment.test.ts`, `src/features/dev/audio/report.ts`, `report.test.ts`, `ReportSection.tsx`, `MicSection.tsx` (izin satırı), `AudioLabPage.tsx`, `copy.ts`, `src/app/services.ts`, `e2e/audio-lab.spec.ts`.

**Kullanır:** `CaptureDiagnostics`, `CaptureState` (Task 4); `RecordingSummary`, `trialFileName` (Task 6); `EchoOutcome`, `RoundTripSummary` (Task 7).

**Üretir:**

```ts
// services/device/environment.ts
export type ShellKind = 'browser' | 'ios-app' | 'android-app'
export interface EnvironmentInfo { userAgent: string; browser: string; os: string; shell: ShellKind; standalone: boolean; secureContext: boolean; origin: string }
export function describeUserAgent(userAgent: string, maxTouchPoints: number): { browser: string; os: string }
export function readEnvironment(): EnvironmentInfo   // kabuk: window.Capacitor?.getPlatform(), yoksa köken (capacitor: → ios-app; https://localhost + Android UA → android-app); standalone: display-mode ya da navigator.standalone
export type PermissionReading = 'granted' | 'denied' | 'prompt' | 'unknown'
export function readMicrophonePermission(): Promise<PermissionReading>   // permissions.query yoksa ya da hata verirse 'unknown'
// features/dev/audio/report.ts
export interface AudioTrialReport {
  version: 1; createdAt: string; environment: EnvironmentInfo; permission: PermissionReading
  capture: { state: CaptureState } & CaptureDiagnostics
  recording: RecordingSummary | null
  echo: ({ url: string; outcome: EchoOutcome } & RoundTripSummary) | null
}
export function buildTrialReport(parts: Omit<AudioTrialReport, 'version' | 'createdAt'>, createdAt: Date): AudioTrialReport   // ms ve dBFS bir ondalığa yuvarlanır
// AudioLabServices'e eklenenler
readEnvironment(): EnvironmentInfo
readMicrophonePermission(): Promise<PermissionReading>
```

- Bölümün içeriği:
  - özet listesi: tarayıcı, işletim sistemi, kabuk, ana ekrandan açılış, güvenli bağlam, giriş hızı, uygulanan ayarlar, gelen, kaçan ve sessiz çerçeve;
  - raporun JSON hali (`pre`, adı "Rapor (JSON)");
  - "Raporu indir (JSON)" düğmesi.
- Rapor, mikrofon durumu değiştikçe ve mikrofon açıkken saniyede bir yenilenir. İzin satırı Mikrofon kartına eklenir.
- Uygulama kabuğunda indirme çalışmayabilir; JSON ekranda okunur ya da ekran görüntüsü alınır (şablonda yazılır).
- [ ] Önce testler:
  - `describeUserAgent`:
    - masaüstü Chrome (`HeadlessChrome` dahil) → `Chrome <ana sürüm>`, `macOS`;
    - iPhone Safari → `Safari <sürüm>`, `iOS`;
    - Android Chrome → `Chrome <ana sürüm>`, `Android <sürüm>`;
    - masaüstü kipindeki iPad (`Macintosh` + dokunma noktası > 1) → `iPadOS`;
    - Capacitor'ın iOS WebView'ı (`Version/` ve `Safari` sözcükleri yok) → `WKWebView`;
    - tanınmayan dizgi → `bilinmiyor`.
    Not: Safari 26 UA dizgisinde iOS sürümünü sabit gösteriyor; gerçek sürüm şablona elle yazılır.
  - `buildTrialReport`, verilen parçalardan beklenen nesneyi birebir kurar: sürüm 1, ISO tarih, yuvarlama.
- [ ] Önce e2e testleri (iki tarayıcıda):
  - "the device report is shown and downloads as JSON": mikrofon açılır, 1 sn beklenir, rapor indirilir. JSON'da sürüm 1, `capture.state` `capturing`, `capture.inputSampleRate` 48000, `capture.requested` varsayılan ayarlar, `capture.framesDelivered` > 0, `environment.secureContext` true, `environment.shell` `browser`, `environment.browser` `/^(Chrome|Safari) \d+/` kalıbına uyar, `permission` geçerli bir değer. Ekrandaki JSON indirilenle aynıdır;
  - "the page fits 390, 1180 and 1440 px": yatay taşma yok; düğmeler, anahtarlar ve alanlar en az 44 × 44 px.
- [ ] Uygula; yeşili gör.
- [ ] Doğrulama: `pnpm check`; `pnpm e2e e2e/audio-lab.spec.ts`; `pnpm shots /gelistirme/ses`.
- [ ] Commit: `feat(dev): show and download the device report`

### Task 9: Cihaz denemesi sunucusu

**Dosyalar:** `scripts/audio-trial.ts`, `package.json` (`audio-trial` betiği), `.gitignore` (`.cert/`, `dist-trial/`), `.prettierignore` ve `eslint.config.js` (`dist-trial/`).

**Kullanır:** `startEchoServer`, `echoServerPort` (Task 7).

- `pnpm audio-trial` sırasıyla şunları yapar (karar 12):
  1. mkcert yoksa kurulum komutunu yazar ve çıkar (`brew install mkcert`, `mkcert -install`).
  2. Dahili olmayan IPv4 adreslerini bulur ve `mkcert -cert-file .cert/cert.pem -key-file .cert/key.pem localhost 127.0.0.1 <ip…>` çalıştırır.
  3. Yankı sunucusunu açar; 4318 doluysa orada çalışan sunucuyu kullanır.
  4. Vite JS API ile `mode: 'e2e'` ve `outDir: 'dist-trial'` kullanarak derler.
  5. `vite preview` sunucusunu `host: true`, `port: 4443`, `strictPort` ve `.cert` sertifikasıyla açar; yönlendirme ayarı `vite.config.ts`'ten gelir.
  6. Her adres için `https://<ip>:4443/gelistirme/ses` adresini ve kök sertifikanın yolunu (`mkcert -CAROOT`/`rootCA.pem`) yazar.
  7. Ctrl+C ile iki sunucuyu da kapatır.
- Bu bir geliştirme betiği; otomatik testi yok, aşağıdaki doğrulamayla kanıtlanır.
- [ ] Doğrulama:
  - `pnpm audio-trial` arka planda çalışırken `curl --cacert "$(mkcert -CAROOT)/rootCA.pem" -sI https://<yerel ip>:4443/gelistirme/ses` → 200;
  - geçici bir Playwright betiği, Chromium ve WebKit'te sertifika hatası yoksaymadan `https://<yerel ip>:4443/gelistirme/ses` adresini açar: mikrofon açılır, yankı testi `wss:` üzerinden 500 / 500 verir. Ekran görüntüsü `shots/audio-trial-lan.png`;
  - Ctrl+C sonrası 4443 ve 4318 kapıları boşalır.
- [ ] Commit: `feat(scripts): serve the audio lab over HTTPS for device trials`

### Task 10: Sonuç şablonu, belgeler ve web yarısının denetimi

**Dosyalar:** `docs/ses-denemesi-sonuclari.md`, `CLAUDE.md`, `docs/mimari.md`, `docs/dinleme-hatti.md`, `docs/kararlar.md`, bu plan ("Kanıtlar").

- [ ] `docs/ses-denemesi-sonuclari.md` aşağıdaki bölümlerle yazılır:
  - **Amaç ve kural.** Denemeleri insan yapar; yapılmayan deneme için "tuttu" denmez. Denemeyi yetişkin yapar (T16).
  - **Hazırlık.**
    - Mac: `pnpm install`, `pnpm audio-trial`, aynı Wi-Fi ağı.
    - iPhone'a kök sertifika: `rootCA.pem` AirDrop ile gönderilir → Ayarlar → Genel → VPN ve Aygıt Yönetimi → profili yükle → Ayarlar → Genel → Hakkında → Sertifika Güven Ayarları → tam güven.
    - Android'e kök sertifika: Ayarlar → Güvenlik → Şifreleme ve kimlik bilgileri → Sertifika yükle → CA sertifikası.
  - **Okunacak metin.** `seed/kayip-fenerin-izinde.json` 4. bölüm 1. sayfa, olduğu gibi aktarılır. Her ortamda aynı metin okunur.
  - **Ayar setleri.** A: üçü açık (varsayılan). B: üçü kapalı.
  - **Adımlar.** Her ortam için numaralı adımlar:
    1. adresi aç;
    2. izin ver;
    3. konuşunca düzeyin oynadığına bak;
    4. A setiyle metni okuyarak 10 sn kaydet, çal, WAV'ı indir;
    5. aynısını B setiyle yap;
    6. yankı testini çalıştır;
    7. raporu indir;
    8. sekmeyi ya da uygulamayı arka plana al ve mikrofon göstergesinin söndüğüne bak;
    9. izni reddet ve açıklamayı gör, sonra izni geri aç.
  - **Ortamlar.** Masaüstü Chrome; iPhone Safari; iPhone'da ana ekrana eklenmiş hali (Paylaş → Ana Ekrana Ekle → "Web uygulaması olarak aç" açık); Android Chrome (orta sınıf tablet).
  - **Sonuç tabloları.** İki tablo, her ortam ve ayar seti için bir satır:
    - "Ses" tablosu: cihaz ve işletim sistemi sürümü (elle yazılır), tarayıcı, giriş hızı, uygulanan ayarlar, düzey, geri çalma (anlaşılır / bozuk / boş), WAV dosyasının adı;
    - "Yol ve davranış" tablosu: yankı ortancası ve 95. yüzdeliği, kaçan ve sessiz çerçeve, arka planda mikrofonun bırakılması, izin reddi açıklaması, notlar.
  - **Gözlemler ve karar önerisi.** Hangi ayar seti daha temiz duyuldu; Faz 6 için not.
  - **Uygulama kabuğu.** Başlık burada açılır; adımları Task 12'de yazılır.
- [ ] `CLAUDE.md` "Komutlar": `pnpm echo-server` ve `pnpm audio-trial` eklenir; `pnpm e2e` yankı sunucusunu kendisi açar; `E2E_CHROME=1 pnpm e2e e2e/audio-lab.spec.ts --project=chrome` yazılır. Her komut çalıştırılarak doğrulanır.
- [ ] `docs/mimari.md`: `scripts/` (yankı sunucusu ve deneme sunucusu), `src/services/{audio,echo,device}` ve `files.ts`, `src/app/services.ts`. `docs/dinleme-hatti.md` bölüm 1 ve 5: açılış sırası, sayaçların anlamı, yankı iletisinin biçimi, komutlar, şablonun adı.
- [ ] `docs/kararlar.md`: değişiklik günlüğüne bir satır; T18'in notuna "ayar setlerinin deneme sonucuyla gözden geçirilecek" yazılır.
- [ ] Web yarısının denetimi. Çıktılar "Kanıtlar" bölümüne yazılır:
  - `pnpm check`;
  - `pnpm build` ve dist'te geliştirme sayfası araması (Task 5'teki `grep` boş);
  - bütün `pnpm e2e`;
  - `E2E_CHROME=1 pnpm e2e e2e/audio-lab.spec.ts --project=chrome`;
  - `pnpm shots /gelistirme/ses` ile üç görüntü (tasarım karşılığı yok; taşma e2e'de denetlendi).
- [ ] Commit: `docs: add the audio trial template and phase 1 commands`

### Task 11: Capacitor kurulumu

**Dosyalar:** `package.json`, `pnpm-lock.yaml`, `capacitor.config.ts`, `ios/**`, `android/**`, `tsconfig.node.json`, `eslint.config.js`, `.prettierignore`, `.gitignore`, `docs/kararlar.md`.

- [ ] `docs/kararlar.md`: Bağımlılıklar tablosuna dört Capacitor paketi; T19 (karar 16). Sonra kurulum: `@capacitor/core`, `@capacitor/ios` ve `@capacitor/android` bağımlılık; `@capacitor/cli` geliştirme bağımlılığı.
- [ ] `pnpm exec cap telemetry off`.
- [ ] `capacitor.config.ts`: `{ appId: 'com.tikir.app', appName: 'Tıkır', webDir: 'dist-cap', server: { appStartPath: '/gelistirme/ses' } }`; `appStartPath`'in yalnız deneme için olduğu ve Faz 7'de kalkacağı yorumla yazılır.
- [ ] Betik: `"cap:sync": "vite build --mode cap --outDir dist-cap && cap sync"`.
- [ ] Önce `pnpm exec vite build --mode cap --outDir dist-cap`, sonra `pnpm exec cap add ios` ve `pnpm exec cap add android`. Capacitor'ın varsayılan iOS paket yöneticisi kullanılır; hangisi olduğu "Uygulamada verilen kararlar"a yazılır.
- [ ] `ios/App/App/Info.plist`: `NSMicrophoneUsageDescription` (karar 16'daki metin). `android/app/src/main/AndroidManifest.xml`: `RECORD_AUDIO` ve `MODIFY_AUDIO_SETTINGS`.
- [ ] `ios/`, `android/`, `dist-cap/` ESLint ve Prettier dışında tutulur; `.gitignore`'a `dist-cap/` eklenir; `capacitor.config.ts`, `tsconfig.node.json` kapsamına alınır.
- [ ] Doğrulama:
  - `pnpm check`;
  - `pnpm cap:sync` çıkış 0 verir ve iki platform eşitlenir;
  - `dist-cap/index.html` içinde CSP meta etiketi var;
  - `dist-cap` içinde geliştirme sayfası var, `dist/` (`pnpm build`) içinde yok;
  - `git status` derleme çıktısı göstermez.
- [ ] Commit: `build(capacitor): add iOS and Android shells for the audio trial`

### Task 12: Kabukta derleme ve açılış

**Dosyalar:** `docs/ses-denemesi-sonuclari.md` ("Uygulama kabuğu"), bu plan ("Kanıtlar").

- [ ] iOS simülatörü:
  - `pnpm exec cap run ios --target <iPhone 17 Pro, iOS 26.1>`;
  - `xcrun simctl io booted screenshot shots/cap-ios.png`;
  - görüntüde "Ses denemesi" sayfası görünür. `appStartPath` beklendiği gibi çalışmazsa yönlendirme sorunu "Uygulamada verilen kararlar"a yazılır ve onay sorulur.
- [ ] Android emülatörü:
  - `JAVA_HOME` Android Studio'nun JBR'si, `ANDROID_HOME` `~/Library/Android/sdk`. Gradle JDK 25'i desteklemezse JDK 21 yalnız o komut için `mise exec` ile kullanılır; depo ayarı değişmez;
  - emülatör `-allow-host-audio` ile açılır;
  - `pnpm exec cap run android --target Medium_Phone_API_36.1`;
  - `adb exec-out screencap -p > shots/cap-android.png`;
  - CSP denetimi: Capacitor Android köprüsünü sayfaya satır içi betik olarak ekliyor, `default-src 'self'` bunu engelleyebilir. `adb logcat` içinde CSP ihlali aranır. Sonuç "Uygulamada verilen kararlar"a yazılır. CSP değişmesi gerekiyorsa onay sorulur (Faz 7 konusu). Sayfa köprüye muhtaç değildir: mikrofon izni yerel taraftadır, kabuk tespitinin kökene bakan bir yedeği vardır (Task 8).
- [ ] Android emülatöründe ek deneme (gerçek cihaz denemesinin yerini tutmaz):
  - mikrofon izni `adb shell pm grant com.tikir.app android.permission.RECORD_AUDIO` ile verilir;
  - "Mikrofonu aç" `uiautomator dump` ile bulunan konuma `adb shell input tap` ile dokunularak açılır;
  - rapordaki gelen ve sessiz çerçeve sayıları ekran görüntüsüyle kaydedilir.
  Olmazsa yalnız açılış görüntüsü kalır ve bu durum not edilir.
- [ ] Şablonun "Uygulama kabuğu" bölümü yazılır:
  - iPhone: `pnpm cap:sync` → `pnpm exec cap open ios` → Xcode'da Signing & Capabilities → kişisel takım → cihaz → Run. "Güvenilmeyen geliştirici" uyarısında Ayarlar → Genel → VPN ve Aygıt Yönetimi.
  - Android: USB hata ayıklama açılır → `pnpm exec cap run android --target <cihaz>`.
  - Sonra tarayıcıdaki adımlar yankı testi olmadan yinelenir. Rapor ekranda okunur ya da ekran görüntüsü alınır, çünkü uygulamada indirme çalışmayabilir.
  - Ölçüt 6 için sonuç tablosuna bir satır.
- [ ] Commit: `docs: add app shell steps to the audio trial template`

### Task 13: Kabul ölçütleri yürüyüşü

- [ ] Altı ölçüt tek tek yürünür. Her birinin yanına çalıştırılan komut ve çıktısı ya da ekran görüntüsünün yolu yazılır.
- [ ] Ölçüt 5 ve 6'nın insan kısmı (gerçek cihaz denemeleri) yapılana kadar "insan denemesi bekliyor" diye yazılır; "tuttu" denmez.
- [ ] Faz 0'daki gibi, kanıtlar ve işaretler tek bir `docs` commit'iyle kaydedilir: `docs: record phase 1 acceptance evidence`.

## Açık sorular (onayı beklemez)

- Soru 13 (`docs/kararlar.md`) "Faz 1'den önce" diye işaretli ama Faz 1 kabuklara dokunmuyor. Yanıt, Faz 3'teki kurulum ekranlarına kadar bekleyebilir.
- Soru 7 (T1): Mac hazır. Gerçek cihaz denemesi için bir iPhone ve orta sınıf bir Android tablet gerekiyor.

## Kanıtlar

Task 10, 12 ve 13'te dolar.

## Uygulamada verilen kararlar

Planın açık bıraktığı ya da planla çeliştiği yerlerde verilen kararlar, verildikleri sırayla yazılır.
