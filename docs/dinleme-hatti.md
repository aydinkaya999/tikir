# Dinleme hattı

Ürünün en riskli parçası: çocuğun sesli okumasını, önceden bilinen bir metne göre izlemek. Bu belge üç şeyi tanımlar: mikrofon katmanı (şimdi yazılacak), sahte dinleyici (şimdi yazılacak) ve gerçek dinleyicinin planı (Faz 6).

## İlkeler

1. **Bilinen metne hizalama.** Serbest konuşma tanıma değil; beklenen kelime dizisi belli, aranan şey sapma.
2. **Yanlış alarm en pahalı hatadır.** Doğru okunan kelimeyi "hata" diye işaretlemek çocuğun güvenini kırar. Emin değilsen işaretleme.
3. **Geri bildirim gecikmesi görünür olmamalı.** O anki kelime vurgusu çocuğun sesinin gerisinde kalırsa ekran okumayı bozar.
4. **Arayüz, dinleyicinin kim olduğunu bilmez.** `ReadingListener` arayüzü sahte ve gerçek uygulama için aynıdır.

## 1. Mikrofon katmanı: `WebAudioCapture`

- `navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } })`. Yankı giderme, gürültü bastırma ve otomatik kazanç ayarları yapılandırılabilir olsun; hangisinin tanımaya yaradığı Faz 1'de ölçülecek.
- `AudioWorklet` içinde cihazın örnekleme hızından (44,1 ya da 48 kHz) 16 kHz'e indir, 16 bit tek kanal PCM üret, 20 ms'lik (320 örnek) çerçeveler halinde ana iş parçacığına gönder.
- Saniyede yaklaşık 20 kez ses düzeyi (RMS) olayı yayınla; mikrofon düğmesinin çevresindeki halka bununla canlanır.
- `start()` yalnız kullanıcı hareketinden çağrılır (tarayıcı kuralı).
- İzin reddi `denied`, cihaz yokluğu `unavailable`, kesinti `error` durumuna geçer; hiçbiri istisna fırlatıp ekranı çökertmez.
- Sekme gizlenince, adım değişince ve bileşen kaldırılınca mikrofon bırakılır (`track.stop()`); mikrofon ışığı gereksiz yanmaz.
- iPhone'da mikrofon açıkken hoparlör sesi kısılır. Bu yüzden Dinle adımında mikrofon kapalıdır ve kelime seslendirmesi sırasında dinleme duraklatılır.
- Veli onayı yoksa `start()` çağrılmaz; bu denetim servisin içinde değil, onu çağıran katmandadır ve testlidir.
- **Dinlemesiz seans** (Faz 2b; `docs/kararlar.md` P13): onay yokken seans yine G1'den G7'ye yürür, mikrofon hiçbir adımda açılmaz. G2'de kartlar puansız geçilir ("Sıradaki kelime"), G4'te metnin tamamı gösterilir ve çocuk her okumayı "Okumayı bitir" ile kendisi bitirir. Okuma sonucu, kart ve ses kaydı yazılmaz; G5 atlanır, G7'de doğru kelime sayısı ve fark yoktur. Mikrofon düğmesi "izin yok" görünümünde, adı "Dinleme kapalı", basılamaz. Uçtan uca test `getUserMedia`'nın hiç çağrılmadığını sınar (`e2e/session-consent.spec.ts`).

Birim testleri: örnekleme hızı dönüştürücü (48 kHz ve 44,1 kHz girişten 16 kHz çıkış uzunluğu ve basit bir sinüsün korunması), çerçeveleyici (rastgele uzunlukta girdiden tam 320 örneklik çerçeveler).

**Faz 1'de nasıl yapıldı** (`src/services/audio`, kararlar T18):

- Açılış sırası: `getUserMedia` → `AudioContext` → `audioWorklet.addModule` → kaynak ve işleyici düğümü → `resume()`. Bağlam mikrofondan sonra kurulur: iPhone'da donanım hızı mikrofon açılınca belli olur. Tek kanala indirmeyi tarayıcı yapar (`channelCount: 1`, `explicit`, `speakers`).
- Varsayılan ayar: üç işleme de açık. Ses denemesi hangisinin iyi olduğunu ölçer.
- Dönüştürücü: pencereli sinc (Blackman), kesim küçük Nyquist'in 0,9 katı; 8–48 kHz arası her giriş hızını kabul eder.
- Mikrofonu açılırken kapatmak da güvenlidir: izin sonradan gelirse mikrofon hemen bırakılır. Sekme gizlenince (`visibilitychange`, `pagehide`) servis mikrofonu kendisi bırakır.
- `diagnostics()` sayaçları: gelen çerçeve; kaçan çerçeve (işleyicinin girdi alamadığı süre ve sıra atlayarak gelen çerçeveler); sessiz çerçeve (örneklerinin hepsi sıfır). Uygulama kabuğunda "ses boş geliyor" riski sessiz çerçeve sayısında görünür.

## 2. Olaylar ve sonuç

Tipler `docs/mimari.md` içinde. Davranış sözleşmesi:

- `position`: beklenen kelime değişti. Arayüz o anki kelime vurgusunu buna göre taşır.
- `word`: bir kelime sonuçlandı (`correct` ya da bir sapma türü). Bir kelime için tam bir kez gelir.
- `hesitation`: geçerli kelimede sessizlik sürüyor. Her 500 ms'de bir, toplam süreyle gelir. Arayüz 3000 ms'de yardımı açar ve dinleyiciye bildirir (`help(index)`): kelime `helped` olarak sonuçlanır, kelime seslendirilirken dinleme duraklar, seslendirme bitince konum bir sonraki kelimeye geçer.
- `end`: metin bitti ya da durduruldu.
- `stop()` her zaman tutarlı bir sonuç döndürür: okunmayan kelimeler listede yer almaz, `wordsAttempted` son okunan kelimeye kadar sayılır.
- Süreler milisaniyedir: `tStart` ve `tEnd` okumanın başından, duraklamalar hariç. `hesitationMs` yalnız 1000 ms ve üstündeyse yazılır.

**Yardım akışı (Faz 2a planı, karar 5):**

1. Duraksama 3000 ms'ye varınca son `hesitation` olayı (`ms: 3000`) gelir ve dinleyici bekler.
2. Arayüz `help(i)` çağırır (`useReading`), Tıkır kelimeyi seslendirir (`narrator.speakWord(söyleyiş)`).
3. Seslendirme bitince arayüz `resume()` çağırır; dinleyici `word {i, helped, hesitationMs: 3000}` ve sonraki `position` olayını gönderir. Yardım alınan kelime bu yüzden seslendirme bitince sayılır (G4'te balon açıkken "Takılma 1").
4. Seslendirme ve duraklatma süresince okuma saati ve hayalet durur; yardım alınan kelimeye okuma süresi verilmez.

**Seslendirmenin geri dönüşü** (Faz 2b; `docs/kararlar.md` T8 notu): G3'te bir anlam ünitesi başlamaz ya da hata verirse sayfanın kalanı beklemeden sessiz zamanlanır; vurgu aynı hızla ilerler. Sonraki sayfa ve her kelime seslendirmesi (G2, G4'teki yardım) sesi yeniden dener. Sayfada konuşma sentezi hiç yoksa (ekran görüntüleri, uçtan uca testler) seslendirme baştan sessizdir ve saate göre zamanlanır.
5. Yardım sırasında `stop()`: `help(i)` çağrıldıysa kelime sonuçta bir kez `helped` olarak yer alır.

Çocuğa gösterilen işaretler: yanlış okuma, ek hatası ve atlama dalgalı mercan çizgi; 1 saniye ve üstü duraksama ile yardım noktalı kehribar çizgi. Tekrar, ekleme ve kendini düzeltme yalnız veli karnesinde görünür. G4'teki "Takılma" sayacı noktalı çizgili kelimeleri sayar (`src/features/reading/readingState.ts`).

Sapma türleri: `misread` (başka kelime ya da bozuk okuma), `suffix` (kök doğru, ek yanlış ya da eksik), `skipped`, `repeated`, `inserted`, `selfCorrected`, `helped`. Hangilerinin puandan düştüğü `docs/urun.md` bölüm 2'de.

## 3. Sahte dinleyici: `FakeListener`

Gerçek dinleyici gelene kadar bütün ürün bununla çalışır; testlerin ve tanıtımın da temelidir.

**Senaryo kipi (varsayılan):**

```ts
interface FakeScenario {
  wcpm?: number;                              // süresiz okuma: sonuçta çıkacak doğru kelime/dk, örn. 71
  timed?: { seconds: number; wordsRead: number };   // süreli okuma (K3, ölçüm): örn. 60 saniyede 76 kelime
  jitter?: number;                            // kelime süresindeki oynama, 0–1; verilmezse 0
  seed?: number;                              // aynı tohum aynı okumayı üretir; verilmezse 1
  miscues: { index: number; type: MiscueType }[];
  hesitations: { index: number; ms: number }[];
}
```

- Kelime süresi hece sayısıyla orantılıdır; uzun kelime daha uzun sürer.
- **Süresiz okumada** toplam süre, sonuç tam `wcpm` çıkacak biçimde ölçeklenir: `seconds = correctWords × 60 / wcpm`. Sonuç ekranındaki sayı senaryodaki sayıdır.
- **Süreli okumada** ilk `wordsRead` kelime tam `seconds` sürecek biçimde ölçeklenir; süre dolunca okuma biter.
- Duraksama süreleri ölçeklemenin dışındadır; kalan süre kelimelere paylaştırılır.
- Benzetim saf bir işlevdir (`simulateReading(words, scenario)` → zaman damgalı `WordResult` listesi); `FakeListener` onu zamanlayıcıyla oynatır, demo profili yükleyicisi doğrudan sonucunu kullanır.
- Isınmada (tek kelime) senaryo verilmediyse kelime doğru sayılır.
- Aynı senaryo ve tohum her zaman aynı olay dizisini üretir (testlerde sahte zamanlayıcıyla).
- Hazır senaryolar (`src/services/listener/scenarios.ts`; konumlar 0'dan sayılır, test verisidir):

  | Ad | Okuma | `wcpm` | Hatalar (konum: tür) | Duraksamalar (konum: ms) |
  |---|---|---|---|---|
  | `smooth` | 1, 2, 3 | 80, 84, 88 | — | — |
  | `typical` | 1 | 64 | 15 `suffix`, 35 `repeated`, 40 `skipped` | — |
  | | 2 | 68 | 9 `misread` | 6: 1800 |
  | | 3 | 71 | — | — |
  | `struggling` | 1, 2, 3 | 42, 46, 50 | 4 `misread`, 12 `suffix`, 20 `skipped`, 31 `misread`, 45 `suffix` | 8, 26, 52: 3500 (3 sn'de yardım) |
  | `design` | 1 ve 3 | `typical` ile aynı | | |
  | | 2 | 50 | 9 `misread` | 6: 1800, 14: 3000 (yardım) |

  `typical`, demo profilinin 0. günündeki okumalardır (`seed/demo-profil.json`; bir test ikisini eşit tutar). `cocuk-sabahi` kipinde `typical` ile biten seans G7'de tasarımdaki sayıları verir: 71 doğru kelime, dünden 4 fazla. Senaryo verilmezse `FakeListener` dakikada 60 kelime, hatasız okur.

  **Ölçüm senaryoları** (Faz 3, K3; dinleyici türü `'assessment'`): her takımın süreli bir dakikalık okuması vardır (`ScenarioSet.assessment`).

  | Ad | Süre | Okunan kelime | Hatalar (konum: tür) | Duraksamalar (konum: ms) |
  |---|---|---|---|---|
  | `smooth` | 60 sn | 80 | — | — |
  | `typical`, `design` | 60 sn | 64 | 4 `misread`, 8 `suffix`, 24 `skipped`, 31 `suffix`, 43 `misread`, 49 `misread` | — |
  | `struggling` | 60 sn | 46 | `struggling` okumalarınınki | 8, 26: 3500 (yardım) |

  `typical` ölçüm, demo profilinin ilk ölçümüdür (`olcum-3a`: 58 doğru kelime, doğruluk %90,6, öğretim düzeyi; bir test ikisini eşit tutar). K4 bu ölçümle tasarımın sayılarını verir: 58 ve "İlk hedef: 6 haftada 70". Tipik ölçüm "etti."yi (23. kelime) 21,7. saniyede bitirir; ikinci sayfa o anda açılır.
- **K3'ün dakikası** (`docs/planlar/faz-3.md`, kararlar 15–17): geri sayım okumanın etkin süresinden düşer (duraklatma, mikrofonun gidişi ve Tıkır'ın yardımı sayılmaz). Dakika bitince okuma 250 ms sonra durur; o anda bitmekte olan kelime sayılır (süre tutan bir yetişkin gibi) ve sonucun süresi 60 saniyeyle sınırlanır. Süreli senaryoda son kelime dakikanın tam sonunda biter, okumayı dinleyici "tamamlandı" diye kapatır.
- `design` (tasarımdaki G4 anını üretir: 2. okuma; "kulaklarını" kısa duraksama, "rüzgârı" yanlış okuma, "ağaçlarının" üzerinde 3 saniyeyi aşan duraksama ve açık yardım balonu; hayalet o anda "patika" üzerinde). Tasarımdaki an gerçek veriden türemediği için bu senaryo hayalet temposunu da sabitler (dakikada 40 kelime). Ekran görüntüsü yardım balonu açıkken alınır.
- `design` senaryosunda yardım balonu okumanın 19,19. saniyesinde açılır: "Süre 0:19", "Doğru 13", "Takılma 1"; hayalet "patika"da (12), çocuk 2 kelime önde. G3 ve G4 bu senaryoda 4. bölümün 1. ve 2. sayfasını tek sayfa gösterir (`docs/kararlar.md` D12).
- Mikrofon gerçekten açılır ve düzey göstergesi gerçek sesle çalışır; yalnız tanıma sahtedir. Mikrofon izni yoksa sahte dinleyici de çalışmaz, böylece izin akışları gerçek gibi sınanır.
- **Mikrofona bağlılık (Faz 2a planı, karar 14):** `start()` mikrofon dinlemiyorsa hata fırlatır. Mikrofon dinlemeyi bırakırsa (sekme gizlendi, kesinti) okuma donar; yeniden dinleyince kaldığı yerden sürer. Kullanıcı ayrıca duraklattıysa `resume()` beklenir. Veli onayı denetimi `start()`'ı çağıran katmandadır: `useMicrophone(audio, consent)` onay yokken `audio.start()`'ı hiç çağırmaz, onay geri alınınca mikrofonu kapatır.

**Elle kip** (yalnız geliştirme derlemesinde): Boşluk = kelime doğru, `E` = yanlış okuma, `S` = atlama, `H` = 3 saniye duraksama. Gerçek bir çocukla tanıtım yaparken dinleyiciyi bir yetişkin oynar. Dinleyici tarafı Faz 2a'dan (`new FakeListener({ kind: 'manual' })`, `mark('correct' | 'misread' | 'skipped' | 'hesitate')`).

- **Açmak** (Faz 2b): adreste `&senaryo=elle`. Sekme ayarıdır (`tikir.gelistirme.dinleyici`); sekme kapanınca biter (`docs/mimari.md` → "Depolama ve örnek veri").
- **Tuşlar** (`useManualKeys`) G2 ve G4'te çalışır. Odak bir düğmede ya da alandayken tuşlar o denetimindir. G4'te Boşluk elle kipte kelimeyi işaretler; öteki kiplerde okumayı duraklatır ve sürdürür.

## 4. Gerçek dinleyici (Faz 6 planı)

Karar verilmedi; aşağıdaki çerçeve içinde ölçümle seçilecek.

```
tarayıcı ──PCM 16 kHz, 20 ms çerçeve──▶ WebSocket ──▶ sunucu: ses etkinliği → tanıma (kelime zamanlı) → beklenen metne hizalama → sapma sınıflandırma
        ◀──────────── olaylar (JSON): position, word, hesitation, end ─────────────
```

- **İstemci:** `RemoteListener`, `ReadingListener` arayüzünü uygular; bağlantı koparsa okuma kesilmez, olaylar bağlantı dönünce gelir, ekranda sakin bir bilgi görünür.
- **Hizalama:** tanınan kelimeler beklenen diziye yerleştirilir. Karşılaştırma Türkçe küçük harfe çevirerek, noktalama atılarak yapılır.
- **Ek hatası ayrımı:** beklenen ve duyulan kelime hecelere ayrılır; kök heceleri tutuyor, son heceler tutmuyorsa `suffix`, aksi halde `misread`.
- **Aday yaklaşımlar:** (a) kelime zamanı veren bir bulut tanıma servisi ve kendi hizalamamız; (b) kendi barındırdığımız açık kaynak model ve zorlamalı hizalama; (c) ileride cihaz içi tanıma. Hiçbirinin Türkçe çocuk sesindeki başarısı bilinmiyor; karar değerlendirme düzeneğinin sonucuna bağlı.
- **Hedefler (başlangıç değerleri):** doğru okunan kelimenin hatalı işaretlenme oranı %2'nin altında; o anki kelime vurgusunun gecikmesi ortanca 400 ms, 95. yüzdelik 800 ms'nin altında.
- **Mahremiyet:** ham ses yalnız veli onayıyla saklanır; saklanmayacaksa sunucu sesi işledikten sonra atar.

### Değerlendirme düzeneği (Faz 6'nın ilk işi)

1. En az 20 çocuktan, veli onayıyla, sınıf düzeyine uygun metinlerin sesli okuma kayıtları.
2. Her kayıt için elle etiket: kelime bazında doğru ya da sapma türü.
3. Betik: bir adayı bütün kayıtlarda çalıştırır; kelime bazında kesinlik ve duyarlılık, yanlış alarm oranı, gecikme dağılımı, `wcpm` farkı (insan etiketiyle) üretir.
4. Adaylar aynı tabloda karşılaştırılır; hedefleri tutturan en basit aday seçilir.

## 5. Ses denemesi (Faz 1)

Amaç: mikrofondan sunucuya giden yolun gerçek cihazlarda çalıştığını ve gecikmesini görmek. Tanıma yok.

`/gelistirme/ses` sayfası:

- İzin iste, durumu göster.
- Canlı düzey göstergesi.
- 10 saniye kaydet ve geri çal (16 kHz PCM'den WAV üret).
- Yankı testi: çerçeveleri `scripts/echo-server` betiğine WebSocket ile gönder, geri dönüş süresini ölç (ortanca ve 95. yüzdelik).
- Cihaz raporu: tarayıcı, işletim sistemi, giriş örnekleme hızı, uygulanan ses ayarları, kaçan çerçeve sayısı. JSON olarak indirilebilir.

Denenecek ortamlar (elle, gerçek cihaz): masaüstü Chrome, iPhone Safari, iPhone'da ana ekrana eklenmiş hali, Android Chrome (orta sınıf bir tablet). Sonuçlar `docs/ses-denemesi-sonuclari.md` dosyasına yazılır.

**Faz 1'de nasıl yapıldı** (kararlar T20):

- Yankı yolu: sayfa kendi kökenindeki `/gelistirme/yanki` adresine bağlanır (HTTPS'te `wss:`). Vite'in geliştirme ve önizleme sunucusu bu adresi `scripts/echo-server.ts` sunucusuna (`127.0.0.1:4318`) aktarır; CSP değişmez.
- İleti biçimi: 8 baytlık başlık (sıra numarası, `uint32` küçük sonlu, ardından 4 boş bayt) ve çerçevenin 640 baytlık PCM'i. Sunucu iletiyi olduğu gibi geri yollar. Test sıradaki 500 çerçeveyi gönderir. Son gönderimden 2 sn sonra dönmemiş çerçeve kayıp sayılır; bağlantı 5 sn içinde açılmazsa sonuç "ulaşılamadı" olur.
- Kayıt saatle değil çerçeve sayısıyla tutulur (500 çerçeve = 10 sn). "Kaydı çal" önce mikrofonu kapatır, WAV'ı Web Audio ile çalar.
- Komutlar: `pnpm echo-server` (yalnız yankı sunucusu), `pnpm audio-trial` (cihazlar için `https://<ip>:4443`, mkcert sertifikası, yankı sunucusu dahil).

Fazın ikinci yarısı aynı sayfayı Capacitor kabuğunda dener (iOS için macOS ve Xcode, Android için Android Studio gerekir). Seçtiğimiz yolun asıl riski burasıdır: uygulama içi tarayıcıda mikrofon izni alınsa bile ses verisinin bozuk ya da boş geldiği örnekler var. Sonuç kötüyse yalnız ses için yerel bir eklenti yazılır ve `AudioCapture` arayüzünün ikinci uygulaması olur; arayüz ve ekranlar değişmez.
