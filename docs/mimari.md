# Mimari

## Yığın

| Katman | Seçim | Not |
|---|---|---|
| Dil ve çatı | TypeScript (strict), React, Vite | |
| Yönlendirme | React Router | Rotalar `docs/ekranlar.md` içinde |
| Durum | Zustand (seans ve ayarlar), yerel bileşen durumu | Sunucu durumu arka uç gelince eklenir |
| Stil | CSS Modules + CSS değişkenleri | |
| Depolama | IndexedDB (`idb`), bir depo (repository) arayüzünün arkasında | Arka uç gelince aynı arayüzün HTTP uygulaması yazılır |
| Yazı tipleri | Fontsource paketleri, depoda barındırılır | `src/styles/fonts.css` paket dosyalarını token'daki aile adlarıyla bağlar (değişken paket aileyi "… Variable" adıyla tanımlıyor) |
| Test | Vitest + Testing Library, Playwright | |
| Paket yöneticisi | pnpm, Node LTS | |
| Sonra | `vite-plugin-pwa` (Faz 7), Capacitor (Faz 7), Python + FastAPI + PostgreSQL arka uç (Faz 6) | |

Depo kökü web uygulamasıdır. Capacitor `ios/` ve `android/` klasörlerini köke ekler; arka uç `server/` altında ayrı durur.

## Klasör yapısı

```
/
├── CLAUDE.md
├── docs/                 belgeler
├── design/               tasarım başvurusu (değiştirilmez)
├── seed/                 örnek içerik (değiştirilmez)
├── src/
│   ├── app/              yönlendirme (routes.ts, router.tsx), korumalar, sağlayıcılar
│   │   └── shells/       beş kabuk ve ortak gezinme (ShellNav)
│   ├── assets/           design/svg çizimlerinin birebir kopyaları
│   ├── components/       tasarım sistemi bileşenleri
│   ├── features/
│   │   ├── session/      günlük seans (G1–G7), Albüm, Stüdyo ve durum makinesi
│   │   ├── reading/      okuma metni, takip, hayalet, yarış çubuğu
│   │   ├── onboarding/   K1–K4
│   │   ├── library/      U1–U4
│   │   ├── parent/       V1–V4, veli kapısı
│   │   └── dev/          bileşen vitrini, ses denemesi
│   ├── domain/           saf mantık (aşağıda)
│   ├── services/         arayüzler ve uygulamaları (aşağıda)
│   ├── i18n/tr.ts        bütün arayüz metinleri
│   └── styles/           tokens.css (design/tokens.css kopyası), tokens-extra.css, fonts.css, global.css
├── e2e/                  Playwright testleri
└── scripts/              yardımcı betikler (shots.ts; yankı sunucusu vb.)
```

`design/` kopyaları (`tokens.css`, ikonlar, çizimler) `src/design-copies.test.ts` ile birebir aynı tutulur.

Geliştirmeye özgü kod (geliştirme sayfaları, Faz 2'den sonra `?demo=` parametreleri) `import.meta.env.MODE !== 'production'` koşulunu **kullanıldığı modülde, satır içinde** sınar. Vite bu ifadeyi her modülde derleme anında yerine koyduğu için kod üretim derlemesinden atılır. Başka bir modülden içe aktarılan bir bayrak katlanmaz ve `dist/` içinde sahipsiz parçalar bırakır (Faz 0'da görüldü). `e2e` kipi (`vite build --mode e2e`) geliştirme araçlarını içerir.

Bağımlılık yönü tek: `features` → `services` (arayüzler) → `domain`. `domain` hiçbir şeyi içe aktarmaz; `components` yalnız `styles` ve `domain` tiplerini bilir.

## Alan mantığı (`src/domain`)

Hepsi saf işlevdir ve birim testlidir.

| Modül | İçerik |
|---|---|
| `types.ts` | Aşağıdaki tipler |
| `config.ts` | Ürün parametreleri: yardım eşiği 3000 ms, duraksama işareti eşiği 1000 ms, okuma sayısı 3, ısınma kart sayısı 3, hedef kazancı haftada 2, evcilleşme aralıkları [1, 2, 4] gün, sınıf eşikleri |
| `text.ts` | `tokenize`, `syllabify`, `countSyllables`, Türkçe küçük-büyük harf yardımcıları |
| `readability.ts` | `atesman`, `levelCheck(text, grade)` |
| `scoring.ts` | `wcpm`, `accuracy`, `readingLevel`, hata sayımı |
| `goals.ts` | İlk hedef, sıradaki hedef, haftalık yorum seçimi |
| `stuckWords.ts` | Karta dönüşme, sıradaki gün, evcilleşme, ısınma destesi seçimi |
| `ghost.ts` | Bir önceki seansın aynı sıradaki okumasının temposundan hayalet konumu |
| `readingStyle.ts` | Varsayılan ayar, CSS değişkenlerine çevirme, ölçerek seçme kararı |

### Tipler (taslak; adlar bağlayıcı, alanlar genişleyebilir)

```ts
type Grade = 1 | 2 | 3 | 4;
type Id = string;

interface Parent { id: Id; email: string; consent: { voiceProcessing: boolean; weeklyEmail: boolean; grantedAt?: string } }
interface Child  { id: Id; name: string; grade: Grade; interests: string[]; readingStyle: ReadingStyle }

interface ReadingStyle { font: 'clear' | 'school'; sizeStep: 0 | 1 | 2 | 3; spacingStep: 0 | 1 | 2; trialEnabled: boolean }

interface Book    { id: Id; title: string; grade: Grade; source: 'series' | 'cards' | 'parentText'; totalChapters: number; chapters: Chapter[] }
interface Chapter { number: number; title: string; pages: Page[]; questions: Question[]; chains: Record<string, string[]> }
type Page     = Sentence[];
type Sentence = string[];            // anlam üniteleri; birleştirince cümle
interface Question { prompt: string; options: string[]; correctIndex: number }
interface Passage  { id: Id; grade: Grade; title: string; sentences: string[] }   // 1 dakikalık ölçüm metni

type MiscueType = 'misread' | 'suffix' | 'skipped' | 'repeated' | 'inserted' | 'selfCorrected' | 'helped';
interface WordResult { index: number; status: 'correct' | MiscueType; tStart: number; tEnd: number; heard?: string }
interface ReadingResult {
  chapterRef?: { bookId: Id; chapter: number }; attempt?: 1 | 2 | 3;   // ölçüm okumasında ikisi de yok
  startedAt: string; seconds: number;
  words: WordResult[]; wordsAttempted: number; correctWords: number; wcpm: number; accuracy: number;
  prosodyScore?: 1 | 2 | 3 | 4; recordingId?: Id; readingStyle: ReadingStyle;
}

type SessionStep = 'warmup' | 'listen' | 'read' | 'record' | 'wrapUp' | 'done';
interface Session { id: Id; childId: Id; date: string; chapterRef: { bookId: Id; chapter: number };
  step: SessionStep; readings: ReadingResult[]; answers: number[]; tamedToday: string[]; startedAt: string; completedAt?: string }

interface StuckWord { word: string; syllables: string[]; chain: string[]; misses: number;
  status: 'wild' | 'practicing' | 'tamed'; correctStreak: number; dueOn: string | null }   // evcilleşen kartta dueOn yok
interface DrillSuggestion { suffixes: string[]; words: string[]; days: number }           // V2'deki ek zinciri önerisi

interface Assessment { id: Id; childId: Id; date: string; passageId: Id; result: ReadingResult;
  level: 'frustration' | 'instructional' | 'independent'; trial?: boolean }   // trial: denenen yazı ayarıyla yapılan ikinci okuma
```

`seed/` içindeki kitaplarda cümleler `"Dar patika, | çam ağaçlarının arasından | yukarıya kıvrılıyordu."` biçimindedir; ` | ` anlam ünitesi sınırıdır. Yüklerken `Sentence` dizisine çevir.

### Türkçe metin kuralları ve sınama örnekleri

**Kelimeye ayırma:** kelime, harf dizisidir; kesme işaretiyle gelen ek kelimeye dahildir (`Tıkır’ın` tek kelime; hece sayarken kesme işareti yok sayılır). Tırnak ve noktalama kelimeye dahil değildir ama ekranda kelimeye yapışık gösterilir.

**Cümleye ayırma** (yalnız velinin yapıştırdığı serbest metinde gerekir; örnek içerikte cümleler hazır ayrılmıştır): cümle `.`, `!`, `?` ya da `…` ile biter ve ardından metin biter ya da büyük harfle yeni cümle başlar. Tırnak kapandıktan sonra küçük harfle süren söz bölünmez: `“Işığım geri geliyor!” diye bağırdı.` tek cümledir.

**Heceleme:** her hecede tam bir ünlü vardır (`a e ı i o ö u ü â î û`). İki ünlü arasındaki ünsüzlerin yalnız sonuncusu sağdaki heceye geçer; arada ünsüz yoksa ünlüler ayrılır. Kelime başındaki ünsüzler ilk hecede kalır.

| Kelime | Heceler |
|---|---|
| kıvrılıyordu | kıv-rı-lı-yor-du |
| ağaçlarının | a-ğaç-la-rı-nın |
| belirdiğinde | be-lir-di-ğin-de |
| öğretmenlerimizden | öğ-ret-men-le-ri-miz-den |
| gözlükçülerden | göz-lük-çü-ler-den |
| Türkçe | Türk-çe |
| kontrol | kont-rol |
| elektrik | e-lekt-rik |
| saat | sa-at |
| şiir | şi-ir |
| tren | tren |
| rüzgârı | rüz-gâ-rı |
| İstanbul | İs-tan-bul |

**Okunabilirlik (Ateşman):**

```
x1 = toplam hece / toplam kelime
x2 = toplam kelime / toplam cümle
puan = 198.825 − 40.175 × x1 − 2.610 × x2
```

Sınama: "Deniz sırt çantasını omzuna aldı. Tıkır kulaklarını dikti ve rüzgârı dinledi." → 11 kelime, 2 cümle, x1 = 2,55, x2 = 5,5, puan = 82,2. Örnek içeriğin beklenen değerleri `seed/` dosyalarında her metnin `stats` alanındadır; `levelCheck` testlerinde bunları kullan (cümle sayısı dizinin uzunluğudur).

**Büyüyen kelime zinciri** hesaplanmaz, içerikle birlikte gelir (`chains`). Türkçe ek çözümlemesi ön yüzde yapılmaz.

## Servisler (`src/services`)

Her servis bir arayüz ve en az bir uygulamadır. Hangi uygulamanın kullanılacağı `src/app/services.ts` içinde tek yerden seçilir.

```ts
type Unsubscribe = () => void;

// Mikrofon. Ayrıntı: docs/dinleme-hatti.md
interface AudioCapture {
  readonly state: 'idle' | 'starting' | 'capturing' | 'denied' | 'unavailable' | 'error';
  start(): Promise<void>;                         // kullanıcı hareketiyle çağrılır
  stop(): Promise<void>;
  onFrame(cb: (pcm16: Int16Array) => void): Unsubscribe;   // 16 kHz, tek kanal, 20 ms
  onLevel(cb: (rms: number) => void): Unsubscribe;
  onStateChange(cb: (s: AudioCapture['state']) => void): Unsubscribe;
}

// Okumayı izleyen dinleyici. Ayrıntı: docs/dinleme-hatti.md
type ListenerEvent =
  | { type: 'position'; index: number }
  | { type: 'word'; result: WordResult }
  | { type: 'hesitation'; index: number; ms: number }
  | { type: 'end'; reason: 'completed' | 'stopped' };
interface ReadingListener {
  start(words: string[], audio: AudioCapture): Promise<void>;
  pause(): void; resume(): void;
  help(index: number): void;                      // yardım açıldı: kelime `helped` olarak sonuçlanır
  stop(): Promise<{ words: WordResult[]; seconds: number; prosodyScore?: 1 | 2 | 3 | 4 }>;
  on(cb: (e: ListenerEvent) => void): Unsubscribe;
}

// Model okuma (Dinle adımı, kelime seslendirme)
interface Narrator {
  speakPage(page: Page, onUnit: (unitIndex: number) => void): Promise<void>;
  speakWord(word: string): Promise<void>;
  setRate(rate: 'slow' | 'normal'): void;
  pause(): void; resume(): void; stop(): void;
}

// Kayıt (3. okuma)
interface Recorder { start(audio: AudioCapture): Promise<void>; stop(): Promise<{ id: Id; seconds: number }>; play(id: Id): Promise<void>; remove(id: Id): Promise<void> }

// Depo
interface Repository {
  getParent(): Promise<Parent | null>; saveParent(p: Parent): Promise<void>;
  getChild(): Promise<Child | null>;  saveChild(c: Child): Promise<void>;
  getBook(id: Id): Promise<Book | null>; listBooks(): Promise<Book[]>; saveBook(b: Book): Promise<void>;
  getSession(date: string): Promise<Session | null>; saveSession(s: Session): Promise<void>; listSessions(from: string, to: string): Promise<Session[]>;
  listStuckWords(): Promise<StuckWord[]>; saveStuckWords(w: StuckWord[]): Promise<void>;
  listAssessments(): Promise<Assessment[]>; saveAssessment(a: Assessment): Promise<void>;
  listPassages(grade: Grade): Promise<Passage[]>;
  getDrillSuggestion(): Promise<DrillSuggestion | null>; saveDrillSuggestion(d: DrillSuggestion | null): Promise<void>;
  clearAll(): Promise<void>;
}

// Kitap üretimi
interface BookGenerator {
  fromCards(input: { hero: string; place: string; event: string; grade: Grade; stuckWords: string[] }): Promise<Book>;
  fromText(input: { text: string; grade: Grade; length: 'short' | 'medium' | 'long'; insertStuckWords: boolean; addQuestions: boolean; stuckWords: string[] }): Promise<Book>;
}

// Kullanım ölçümü: varsayılan uygulama hiçbir şey yapmaz
interface Telemetry { track(event: string, props?: Record<string, string | number | boolean>): void }
```

| Arayüz | İlk uygulama | Sonraki uygulama |
|---|---|---|
| `AudioCapture` | `WebAudioCapture` (getUserMedia + AudioWorklet) | Gerekirse Capacitor yerel eklentisi |
| `ReadingListener` | `FakeListener` (senaryolu) | `RemoteListener` (WebSocket) |
| `Narrator` | `SpeechSynthesisNarrator`; ses yoksa `SilentNarrator` (yalnız zamanlı vurgu) | Hazır ses dosyaları |
| `Recorder` | `MediaRecorderRecorder`, kayıtlar IndexedDB'de | Sunucuya yükleme |
| `Repository` | `IndexedDbRepository`, ilk açılışta `seed/` ile dolar | `HttpRepository` |
| `BookGenerator` | `MockBookGenerator` (aşağıda) | Arka uç |
| `Telemetry` | `NoopTelemetry` | Kendi sunucumuza |

**`MockBookGenerator`:**

- `fromCards`: `seed/ornek-kitaplar.json` içindeki `cards` kaynaklı kitabı döndürür. Metin hangi kart seçilirse seçilsin aynıdır; başlık `cards.titleTemplate` ile kurulur. Kısa bir bekleme taklit edilir (1–2 saniye).
- `fromText`: metni değiştirmez (seviyeye indirmek arka uç işidir). Cümlelere ayırır, sayfa başına en çok 4 cümle koyar, cümleyi virgüllerden anlam ünitelerine böler. Başlık metnin ilk cümlesidir (en çok 6 kelime). Soru ve kelime yerleştirme üretmez; ilgili seçenekler seçiliyse U4'te "arka uçla gelecek" notu görünür.
- İkisi de `levelCheck` sonucunu gerçekten hesaplar.

## Zaman

`src/domain` işlevleri bugünün tarihini parametre olarak alır; `Date.now()` çağırmaz. Böylece "ertesi gün", "günü gelen kart" ve "haftalık ölçüm" kuralları sahte tarihle sınanır. Gün, cihazın yerel saatine göre gece yarısı değişir.

## Seans durum makinesi

```
warmup → listen → read(1) → read(2) → read(3, kayıt) → record → wrapUp → done
                                  ↑__________ "Baştan kaydet" __________|
```

- Durum `Session.step` içinde tutulur ve her geçişte depoya yazılır; sayfa yenilense de seans kaldığı adımdan sürer.
- `read` adımında her okuma bittiğinde `ReadingResult` hesaplanır, takılınan kelimeler `stuckWords` mantığına verilir.
- `done` olunca `completedAt` yazılır; aynı gün yeni seans başlatılamaz.
- Mikrofon yalnız `warmup`, `read` ve ölçüm sırasında açıktır; adım değişince ya da sekme gizlenince kapatılır.

## Depolama ve örnek veri

- Veritabanı adı `tikir`; şema sürümü `src/services/repository` içinde tek yerde.
- İlk açılışta seri kitap `seed/kayip-fenerin-izinde.json`, ölçüm metinleri `seed/olcum-metinleri.json` dosyasından yüklenir.
- **Demo profili** (`seed/demo-profil.json`): tasarımlardaki örnek kullanıcı Deniz. `/gelistirme/vitrin` sayfasındaki iki düğmeyle yüklenir; her biri depoyu temizleyip bir kipi kurar:
  - `cocuk-sabahi`: 4. bölüm okunmak üzere. G1–G7 tasarımlarının başlangıç durumu.
  - `veli-haftasonu`: hafta bitmiş, ölçüm yapılmış. V1–V4 tasarımlarındaki sayılar.
- Dosyadaki günler görelidir (`day`); yükleyici kipin `anchor` gününü takvime oturtur: `cocuk-sabahi` kipinde bugüne, `veli-haftasonu` kipinde bugünden önceki en yakın pazara (hafta şeridi tasarımdaki günlere denk gelsin diye). Okumalar ve ölçümler sahte dinleyici senaryosu biçimindedir; yükleyici onları `FakeListener` ile aynı benzetimden geçirip `ReadingResult` üretir. Dosyanın `expected` alanı, ekranlarda görülmesi gereken sayıları verir; testlerde kullan.
- Kurulum akışı yazılana kadar (Faz 3) geliştirme derlemesi, profil yoksa `cocuk-sabahi` kipini kendiliğinden yükler.
- Geliştirme derlemesinde adres parametreleri bir ekranı doğrudan istenen durumda açar: `?demo=<kip>` depoyu o kipe kurar, `&adim=<adım>` seansı o adıma getirir (örnek: `/seans/oku?demo=cocuk-sabahi&adim=read-2&senaryo=design`). Ekran görüntüsü betiği ve uçtan uca testler bunu kullanır; üretim derlemesinde yoktur.

## Test

| Tür | Kapsam |
|---|---|
| Birim | `src/domain` tamamı; yukarıdaki sınama örnekleri birebir test olur |
| Bileşen | Okuma metni durumları, bölmeli denetim, anahtar, mikrofon düğmesi durumları |
| Uçtan uca | `FakeListener` ile baştan sona bir seans; kurulum akışı; yazı ayarının okuma ekranına yansıması. Chromium ve WebKit'te, `e2e` kipi derlemesine karşı (`vite preview`). Faz 0'dan beri: rotalar ve kabuklar, dış istek ve CSP, vitrin envanteri ve taşma, okuma metninde kayma |
| Görsel | Her ekran 390, 1180 ve 1440 px genişlikte (`pnpm shots`); `design/png` ile yan yana karşılaştırma ve fark listesi |

Piksel piksel eşitlik beklenmez (yazı tipi işleme farkları olur). Beklenen: aynı düzen, aynı metin, aynı renkler, taşma ve kırpılma yok.

## Capacitor'a hazır kalmak için

- Tarayıcıya özgü her API bir servis arayüzünün arkasında.
- Fareyle üzerine gelme (hover) hiçbir işlevin tek yolu değil.
- Güvenli alan boşlukları kullanılır.
- Çalışma anında dış adrese istek yok; içerik güvenlik politikası `default-src 'self'` ile başlar.
- Servis çalışanına (service worker) bağımlı özellik yok; çevrimdışı çalışma depo arayüzünden gelir.
- Yönlendirme, uygulama alt dizinden ya da özel şemadan açılsa da çalışır (Faz 7'de doğrulanır).

## Arka uç (Faz 6, ayrı tasarım belgesi yazılacak)

Varsayım: Python + FastAPI + PostgreSQL. Sorumlulukları: hesap ve oturum, veri eşitleme (`HttpRepository`), kayıt saklama, kitap üretimi, dinleme (WebSocket). Ön yüz bu aşamaya kadar arka uçsuz, tamamen çalışır durumdadır; arayüzler değişmeden yeni uygulamalar eklenir.
