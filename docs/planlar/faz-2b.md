# Faz 2b planı: Günlük seansın ekranları ve akışı

> Durum: onaylandı (2026-11-20). Uygulama `faz-2b` dalında, bu oturumda yürür (superpowers:executing-plans); sonunda bütün dal bağımsız bir incelemeden geçer. Adımlar `- [ ]` kutularıyla izlenir. Her görevin sonunda `pnpm check` çalışır; geçerse görevin kutuları işaretlenir ve aynı commit'e girer. Dalın birleştirilmesi ve push ürün sahibinin kararıdır.

**Amaç:** 2a'nın kurallarını, servislerini ve okuma motorunu tıklanabilir bir günlük seansa çevirmek. Kapsam:

- seans durum makinesi ve deposu (Zustand), adım koruması, seanstan çıkış onayı;
- G1–G7 ekranları; veli onayı yokken dinlemesiz seans;
- tasarımı olmayan durumlar: mikrofon izni reddi, mikrofon yok ya da hata, yükleniyor, depo hatası, bugün bitti, seri bitti; Albüm ve Stüdyo'nun asgari ekranları;
- geliştirme adres parametreleri, profil yokken kendiliğinden yükleme, seans adımlarının `pnpm shots` görüntüleri, elle kipin klavye bağlantısı;
- Faz 2'nin 10 kabul ölçütünün kanıtı.

**Mimari:**

- Saf kurallar `src/domain` içindedir: sayıyla iyelik eki, ısınma destesinin yeniden kurulması, kayıtlı bölümler, seans süresi.
- Adım geçişleri `src/features/session/sessionMachine.ts` içinde saf işlevlerdir. `sessionStore.ts` onları bir Zustand deposunda IndexedDB'ye bağlar: her geçiş önce yazılır, ekran sonra ilerler.
- Ekranlar `src/features/session/` altındadır ve servisleri bir React bağlamından (`SessionProvider`) alır; bağlamı `src/app/router.tsx` kurar. `features` `src/app`'i içe aktarmaz: yol sabitleri `features/session/paths.ts` içinde durur, `src/app/routes.ts` onları kullanır.
- Bağımlılık yönü `features` → `services` → `domain`. Tarayıcı API'si yalnız `src/services` içindedir; üç küçük yeni servis gelir: sekme ayarı (`sessionStorage`), adres (`history.replaceState`) ve klavye (`document` üzerindeki tuş olayı).

**Kaynak belgeler:**

- `docs/yol-haritasi.md` (Faz 2);
- `docs/urun.md` bölüm 2–5, 8 ve 9;
- `docs/ekranlar.md` → "Rotalar", "Günlük seans", "Tasarımı olmayan durumlar";
- `docs/dinleme-hatti.md` bölüm 1–3;
- `docs/mimari.md`: servisler, seans durum makinesi, depolama ve örnek veri, test;
- `docs/tasarim-sistemi.md`;
- `docs/kararlar.md`: P5, P6, D6, D11, D12, T4, T8, T12, T15–T21, C5;
- `docs/planlar/faz-2a.md`: kararlar, son inceleme ve ertelenen bulgular;
- `design/ekranlar/G1…G7-*.html` ve `design/png/G1…G7-*.png`;
- `seed/README.md` ve `seed/demo-profil.json` (`expected`).

**Yığın:** 2a yığını. Yeni paket: `zustand` (T4, `docs/mimari.md` → "Yığın"). Sürüme kurulum anında bakılır.

**Kapsam dışı:**

- kurulum akışı ve "profil yoksa kuruluma" koruması (Faz 3). Üretim derlemesinde profil yoksa G1 ve seans adresleri boş kalır (`TODO(phase 3)`); geliştirme derlemesi profili kendisi yükler.
- yazı ayarının okuma metinlerine uygulanması (Faz 3). Metinler varsayılan ayarla görünür; demo profilinin ayarı varsayılanla aynıdır.
- veli ekranları ve kayıt onayı ekranı (Faz 4); kitaplıktan seans (Faz 5).
- gerçek cihaz denemesi: iPhone'da yardım seslendirmesi sırasında açık mikrofon, konuşma sentezinin dokunma kuralı.

## Görev listesi

- [x] Task 0: Plan dosyası, dal ve ürün sahibinin yanıtları
- [x] Task 1: Seslendirmede sayfanın kalanı sessiz
- [x] Task 2: Seans ekranlarının alan kuralları
- [x] Task 3: Isınma destesi, seslendirme hızı ve kayıt onayı alanları
- [x] Task 4: Seans durum makinesi
- [x] Task 5: Seans deposu
- [x] Task 6: Geliştirme adres parametreleri
- [x] Task 7: Servisler, kabuk, adım koruması ve mikrofon kuralı
- [ ] Task 8: `pnpm shots` adımları
- [ ] Task 9: G1 Yol
- [ ] Task 10: G2 Isınma ve mikrofon sorunları
- [ ] Task 11: G3 Dinle
- [ ] Task 12: G4 Oku
- [ ] Task 13: G5 Kayıt
- [ ] Task 14: G6 Kapanış sorusu
- [ ] Task 15: G7 Bugünlük bitti
- [ ] Task 16: Albüm ve Stüdyo
- [ ] Task 17: Uçtan uca seans testleri
- [ ] Task 18: Belgeler, tasarım karşılaştırması ve denetim

## Ürün sahibinin yanıtları (2026-11-20)

| # | Soru | Yanıt | Karar |
|---|---|---|---|
| 1 | Veli ses onayı yokken seans ne yapsın? | Dinlemesiz seans: adımlar mikrofonsuz çalışır | 10 |
| 2 | G1 balonu öteki bölümlerde ne desin? (Tasarımdaki cümle 4. bölüme özgü, içerikte yok.) | Genel kalıp | 11 |
| 3 | G6'da yanlış cevapta "ilgili cümle" nasıl bulunsun? (Sorularda cümle bilgisi yok.) | Yalnız doğru seçenek gösterilir; vurgu içerik gelince | 16 |
| 4 | Konuşma sentezi hiç başlamazsa (2a incelemesi, M1) | İlk başarısız üniteden sonra sayfanın kalanı sessiz | 8 |

## Onaylanan kararlar

1. **2b'nin işi.** 2a'nın motorlarına dokunmadan ekranları ve akışı kurar. İki değişiklik dışında: seslendirmenin geri dönüşü (karar 8) ve `useMicrophone`'un ekran kapanınca mikrofonu kapatma işi (karar 6). Her yol haritası ölçütünün kanıtı "Ölçütler ve kanıtları" tablosunda.

2. **Seans verisine eklenen alanlar** (`docs/mimari.md` → "Tipler" güncellenir):
   - `Session.warmup?: { words: string[]; done: number; scored: number }`: seans başlarken seçilen ısınma destesi (kelimelerin gösterilen biçimi), biten kart sayısı ve ilk denemesi puanlanmış kart sayısı (`done ≤ scored ≤ done + 1`).
     - Sayfa yenilense de deste aynı kalır ve ısınma ilk bitmemiş karttan sürer.
     - `scored > done` ise geçerli kartın ilk denemesi puanlanmıştır; yenileme ya da çıkıştan sonra kart yeniden puanlanmaz (karar 12). Bu, evcilleşmiş bir kartın aynı gün ikinci kez puanlanıp evcilliğini yitirmesini de önler (2a, M7).
     - İsteğe bağlıdır: demo profilinin bitmiş seanslarında yoktur.
   - `Child.narrationRate?: NarrationRate`: G3'teki son hız seçimi; yoksa yavaş (`docs/ekranlar.md` G3).
   - `StoredRecording.approval?: 'pending'`, `RecordingInfo.approval?: 'pending'` ve `Recorder.requestApproval(id)`: G5'teki "Gönder", kaydı "veli onayı bekliyor" yapar. Faz 4 `'approved'` ekler.
   - `NarrationRate` (`'slow' | 'normal'`) `src/domain/types.ts`'e taşınır; `Narrator.ts` onu yeniden dışa aktarır.
   - Şema sürümü değişmez: yeni depo ya da dizin yok, alanlar isteğe bağlı.

3. **Durum makinesi** (`docs/mimari.md` → "Seans durum makinesi"):
   - Ekrandaki yer kayıttan türetilir:

     | `step` | Yer |
     |---|---|
     | `warmup` | kart sırası = `warmup.done`; `scored > done` ise ikinci deneme |
     | `listen` | — |
     | `read` | okuma = `readings.length + 1`, en çok 3; üç okuma varken bu "Baştan kaydet"tir |
     | `record` | — |
     | `wrapUp` | soru = `answers.length` |
     | `done` | — |
   - Geçişler mimarideki gibidir. Ek olarak:
     - ısınma destesi boşsa seans `listen` ile başlar;
     - dinlemesiz 3. okumadan sonra `record` atlanır, `wrapUp` gelir (karar 10).
   - Dinlemesiz okumalar yazılmaz. Kaçıncı okumada olunduğu bellekte tutulur; sayfa yenilenirse dinlemesiz okumalar 1'den başlar.

4. **Adım koruması** (`docs/ekranlar.md` → "Yönlendirme kuralları"):

   | Durum | `/seans/*` adresi |
   |---|---|
   | Bugün seans yok | G1'e |
   | Seans bitti | G7'ye |
   | Seans sürüyor | yalnız geçerli adımın adresi açılır; başka her seans adresi geçerli adıma |

   - "Başka her adres" geçilmiş adımları da kapsar. Gerekçe: geçilmiş bir adımı adresten yeniden açmak ısınma sonuçlarını iki kez yazardı.
   - Geri dönüşün tek yolu "Baştan kaydet"tir.
   - Yönlendirmeler `replace` ile yapılır; tarayıcının geri tuşu seansı geri sarmaz.

5. **Seans deposu** (Zustand, `sessionStore.ts`):
   - **Kaynak:** IndexedDB. Yüklenince veli, okuyucu, seri kitap, bütün seanslar, kartlar ve bugünün seansı bellekte durur.
   - **Yazma:** Her eylem önce depoya yazar, sonra durumu günceller; ekran yazma bitince ilerler. Geçerli yerde olmayan bir eylem yazmaz. Böylece çift dokunuş iki geçiş yazmaz.
   - **Isınma:** İlk deneme kartı hemen günceller (`applyWarmupResult`). Evcilleşen kelime `tamedToday`'e girer.
     - Önce seans yazılır (`scored`; doğruysa `done` da ilerler), sonra kart. Kart yazılamazsa sonuç kaybolur ama kart iki kez puanlanmaz.
     - Doğru ilk deneme tek yazmada sıradaki karta geçer. Yanlışta ikinci deneme biter bitmez `done` ilerler.
   - **Okuma:** Dinlenen her okuma bitince `ReadingResult` yazılır. Takılınan kelimeler (`misread`, `suffix`, `skipped`, `helped`) karta döner (`recordMisses`). Tek başına duraksama (1–2,9 sn) kart olmaz (`docs/urun.md` bölüm 5).
   - **Baştan kaydet:** Yeni 3. okuma eskisinin yerine geçer. Eski kayıt, yeni okuma yazıldıktan sonra silinir; yarıda kalan bir yeniden kayıt eskisini kaybettirmez. Yeni okumanın takılmaları da karta yazılır, çünkü gerçek bir okumadır.
   - **Bitiş:** Seans, son soru yanıtlanıp G6'dan çıkılınca biter: `step: 'done'`, `completedAt`.
   - **Hata:** Yazma hatası işlenmemiş ret bırakmaz; eylem reddeder ve depo hata durumuna geçer.
   - **M8 (2a):** Asıl kaynak `IndexedDbRepository.saveStuckWords`'tür: bir `put` reddedince işlev `transaction.done`'ı beklemeden çıkar ve o ret sahipsiz kalır. Task 5 bunu düzeltir.

6. **Mikrofon** (`docs/dinleme-hatti.md` bölüm 1; `docs/kararlar.md` T22):
   - Sayfada seans için tek bir `AudioCapture` vardır.
   - **Açma:** Dinleyen adıma götüren dokunuş mikrofonu açar:
     - G1'de "Başla" ya da "Sürdür" (adım ısınma ya da okumaysa);
     - G3'te "Sıra sende";
     - G5'te "Baştan kaydet".

     Böylece G2 ve G4 tasarımdaki gibi dinler halde açılır ve `start()` yine her zaman bir dokunuşla çağrılır. Sayfa yenilenmişse ya da mikrofon sonradan kapandıysa mikrofon düğmesine dokunmak açar.
   - **Kapatma:** Adres dinleyen bir adım (G2, G4) değilse kök düzeydeki mikrofon kuralı mikrofonu kapatır. Kural yalnız adres değişince çalışır, yeniden çizimde çalışmaz. Sekme gizlenince `WebAudioCapture` mikrofonu kendisi bırakır (Faz 1).
   - **`useMicrophone` değişikliği:** Ekran kapanınca mikrofonu kapatma işi bu kurala taşınır. Gerekçe: StrictMode'da ekranın ikinci takılması, önceki ekranın dokunuşla açtığı mikrofonu kapatırdı. Onay denetimi `useMicrophone`'da kalır: onay yokken `audio.start()` hiç çağrılmaz, onay geri alınınca mikrofon kapanır.
   - **iPhone:** Yardım seslendirmesi sırasında mikrofon açık kalır (2a, karar 30); cihaz denemesinde bakılır.

7. **Dinleyici ve seslendirici seçimi** (`src/app/services.ts`):
   - **Paket:** `FakeListener` ve hazır senaryolar Faz 6'ya kadar tek dinleyici olduğu için üretim paketine girer. Demo profili, adres parametreleri ve geliştirme sayfaları girmez.
   - **Varsayılan:** Okumalar `typical` senaryosuyla, ısınma kelimeleri senaryosuz (doğru) okunur.
   - **Geliştirme:** `&senaryo=<ad>` sekme boyunca geçerlidir (sekme ayarı). `elle` elle kipi açar: G2 ve G4'te Boşluk = doğru, `E` = yanlış okuma, `S` = atlama, `H` = 3 sn duraksama (`docs/dinleme-hatti.md` bölüm 3). Elle kipte ürünün Boşluk kısayolu (duraklat) çalışmaz.
   - **Seslendirici:** Sayfada bir kez kurulur (`createNarrator`).
   - **Otomatik çalıştırmalarda ses yok:** `pnpm shots` ve uçtan uca testler sayfaya `speechSynthesis` vermez (bir başlangıç betiğiyle kaldırılır). Böylece `createNarrator(null)` beklemeden `SilentNarrator` verir.
     - Gerekçe: aksi halde `createNarrator`'ın ses bekleme süresi (1000 ms) durdurulmuş sahte saatte asılı kalır ve her an 1–1,5 sn kayar. G4'te tasarımdaki an (19,19 sn) böyle kaçırılırdı.
     - Ürün kodunda derleme kipine bağlı bir seslendirici seçimi yoktur.

8. **Seslendirmenin geri dönüşü** (ürün sahibi, 2026-11-20; T8 notu):
   - Bir ünite 1,5 sn içinde başlamaz ya da hata verirse o ünite ve sayfanın kalanı beklemeden sessiz zamanlanır.
   - Sonraki `speakPage` ve her `speakWord` sesi yeniden dener.
   - Sonuç: 47 sn'lik sayfa sesi hiç başlamayan cihazda 74 sn yerine 48,5 sn sürer.

9. **Kabuk, düzen ve çıkış onayı:**
   - `SessionShell` yalnız üst şeridi taşır: kapat, adım karoları, sayaç, bölüm adı ("Bölüm 4: Dar Patika", bölüm depodan).
   - Gövde düzeni yeni `SessionLayout` bileşenine geçer. Her adım ekranı kendi başlığını, etiketini, Tıkır'ını, balonunu ve denetimlerini verir.
   - Kapat düğmesi ve webdeki "Seanstan çık" bağlantısı onay penceresini açar (`<dialog>`, `showModal`). Pencere açıkken seslendirme ve okuma duraklar.
   - "Çık" G1'e döner; adım zaten yazılıdır. Yarım kalan okuma yazılmaz, seans sürdürülünce aynı okuma baştan başlar.
   - G7'de onay sorulmaz, kapat düğmesi doğrudan G1'e gider.
   - Tıkır'ın yüzü tasarımdaki gibidir (inline çizimler `design/svg` ile karşılaştırıldı):

     | Ekran | Yüz |
     |---|---|
     | G1 | `normal` |
     | G2 | `listen` |
     | G3 | `talk` |
     | G4 | `listen`; yardım seslendirmesi sırasında `talk` |
     | G5 | `happy` |
     | G6 | `think` |
     | G7 | `sleep` |

10. **Dinlemesiz seans** (ürün sahibi, 2026-11-20; `docs/kararlar.md` P13; tasarımı yok, `TODO(design)`):
    - **Genel:** Veli ses onayı yoksa G2 ve G4 dinlemez; mikrofon hiçbir adımda açılmaz. Mikrofon düğmesi "izin yok" görünümündedir, adı "Dinleme kapalı", basılamaz (`aria-disabled`).
    - **G2:** Kartlar gösterilir, "Kelimeyi dinle" çalışır, kartlar değerlendirilmez. İleri düğmesi sıradaki karta geçer ("Sıradaki kelime"); son kartta tasarımdaki "Dinle adımına geç" olur.
    - **G3:** Değişmez.
    - **G4:** Bölümün bütün metni tek sayfa kartında, okunmuş renkte görünür. Vurgu, hayalet, yarış çubuğu, sayaçlar ve duraklat yoktur. "Okumayı bitir" sıradaki okumaya geçer; üçüncüden sonra G6 gelir.
    - **G5:** Atlanır (kayıt yok).
    - **G7:** Büyük sayı ve fark gösterilmez; evcilleşen kelime olmaz. Süre, "Yarın" kartı ve özet satırı her zamanki gibidir.
    - **Kayıt:** Seans tamamlanmış sayılır (üst üste gün, sıradaki bölüm). Okuma sonucu, kart ve ses kaydı yazılmaz.
    - Metinler aşağıdaki tabloda.

11. **G1 Yol:**
    - **Durumlar:**

      | Durum | Ne zaman |
      |---|---|
      | Başla | bugün seans yok |
      | Sürdür | seans sürüyor |
      | Bugün bitti | bugünün seansı bitti |
      | Seri bitti | hazır bölüm kalmadı (`nextSeriesChapter` → `null`) |
    - **Bugün bitti:** Bölüm kartının başlığı "Bugünlük bitti"; altında G7'nin "Yarın" kartı, balonda G7'nin balonu. Bugünün karosu `done` olur, yarınki kilitli kalır; o gün `today` karosu yoktur.
    - **Seri bitti:** Kartta "Yeni bölümler yolda." ve "Kitaplık" düğmesi (`docs/ekranlar.md`).
    - **Balon** (yalnız tablet ve web; telefon tasarımında balon yok): genel kalıp "Bugün {n}. bölümü okuyoruz: {başlık}. Hazırsan başlayalım." (ürün sahibi, 2026-11-20; D13). Bölümlerin kendi giriş cümlesi içeriğe eklenince o kullanılır (C6).
    - **Üst üste gün:** 2'den küçükse gizlidir.
    - **Karolar:** `done` desenleri bölüm sırasıyla `cini-1` … `cini-6` arasında döner.

12. **G2 Isınma:**
    - **Dinleme:** Her kart ve her deneme için tek kelimelik bir okuma çalışır (`useReading`, yeni dinleyici). Kart görününce dinleme başlar.
    - **Doğru okuma** (`isCountedError` olmayan sonuç) sıradaki karta geçirir.
    - **Yanlış okuma:** Tıkır kelimeyi seslendirir ve ikinci deneme başlar. İkinci denemenin sonucu ne olursa olsun sıradaki karta geçilir. 3 sn duraksamada yardım açılır ve Tıkır kelimeyi okur: bu ilk denemenin yanlış sayılmasıdır (`helped`), ikinci deneme hemen başlar.
    - **Değerlendirme:** Kartı yalnız ilk deneme günceller (2a, karar 7). Bu, seansa yazılır (`warmup.scored`, karar 2).
    - **İkinci denemede yenileme ya da çıkış:** Kart ikinci denemeden sürer: Tıkır kelimeyi yeniden okur, ikinci deneme başlar, kart yeniden puanlanmaz.
    - **"Kelimeyi dinle"** dinlemeyi duraklatır; Tıkır okur, sonra dinleme sürer.
    - **İleri** ("Dinle adımına geç") ısınmanın kalanını atlar. Cevaplanmamış kartlar değişmez ve sonraki seansa kalır.
    - **Hece karoları** Tıkır'ın seslendirmesini izler: okunmuş hece açık turkuaz, o anki safran, kalanlar beyaz. Hece süresi seslendiricinin hızından tahmin edilir (`narrationTiming.syllablesPerSecond`). Seslendirme yokken hepsi beyazdır.
      - Gerekçe: dinleyici kelime düzeyindedir; çocuğun okuması hece hece izlenemez.
      - Tasarımdaki an ("yor" o anki hece) seslendirmenin ortasıdır.
    - **Büyüyen kelime:** Zincirin son öğesi kartın kelimesidir; öncekiler onay işaretlidir.
    - **Seri noktaları:** Üç noktanın `correctStreak` kadarı doludur.

13. **G3 Dinle:**
    - Ekran açılınca seslendirme başlar. Hız çocuğun son seçimidir ve seçim değişince yazılır. Telefonda hız denetimi yoktur (tasarım).
    - "Sıra sende" seslendirme en az bir kez bitene kadar pasiftir. Sayfa yenilenirse seslendirme baştan başlar ve düğme yeniden pasif olur (kural 2: dinle atlanamaz).
    - "Sıra sende" mikrofonu açar (onay varsa) ve G4'e geçer.

14. **G4 Oku:**
    - **Okumalar:** Her okuma yeni bir dinleyiciyle yapılır. Bir okuma bitince sıradaki hemen başlar; mikrofon açık kalır.
    - **Sayfa:** Konum sayfanın son kelimesini geçince sıradaki ekran sayfası gelir. `design` senaryosunda D12 düzeni kullanılır.
    - **Hayalet:** Aynı sıradaki önceki okumanın temposudur (`previousReading`, `ghostPace`); `design` senaryosunda dakikada 40 kelime. Yarış cümlesi yalnız `raceLead` varsa görünür.
    - **3. okuma:** Dinleme başlarken `Recorder.start`, bitince `stop` çağrılır; `recordingId` sonuca yazılır. Sayfa kartının üstünde kayıt göstergesi durur.
    - **3. okumada mikrofon gidip gelirse** (2a, karar 30'dan 2b'ye kalan): okuma donar (2a). Mikrofon dönünce kayıt aynı kayda devam eder; saklanan kayıt iki yanın çerçeveleridir, aradaki boşluk kayıtta yer almaz.
    - **Klavye:** Boşluk ve elle kipin tuşları yeni klavye servisinden dinlenir (`document` katman kuralıyla yasak).
    - **Denetimler:**

      | Denetim | Davranış |
      |---|---|
      | "Duraklat" / "Sürdür" | okumayı duraklatır ve sürdürür; klavyede Boşluk (ipucu yalnız webde, tasarım gibi) |
      | Mikrofon düğmesi | dinlerken dokunmak duraklatır, duraklatılmışken sürdürür; mikrofon kapalıysa açar |
      | "Okumayı bitir" | okuma o ana kadar okunanlarla biter |
    - **Yarıda kalan okuma** (çıkış ya da ekranın kapanması) yazılmaz. 3. okumanın yarım kaydı silinir.
    - **Mikrofon sorunu** (izin reddi, mikrofon yok, hata): balonda açıklama ve "Yeniden dene" düğmesi; okuma başlamaz.
    - **Tıkır'ın balonu** yalnız yardımda görünür (`TODO(design)`).
    - **Telefon:** Sayaç satırı ve Boşluk ipucu yoktur (tasarım).

15. **G5 Kayıt:**
    - **Süre ve dalga biçimi** kayıttan gelir (`Recorder.get`). 64 düzey, tasarımdaki çubuk sayısına indirilir: telefonda 26, tablet ve webde 36; her grubun en yükseği alınır.
    - **Çalma:** "Kaydı dinle" çalar ve düğme "Duraklat" olur. Çalma ilerledikçe çalınan çubuklar safran, kalanlar açık turkuaz olur; durağanken hepsi açık turkuazdır.
      - İlerleme geçen süreden hesaplanır, çünkü `WavPlayer` konum vermez.
      - Tasarımdaki an (çubukların %44'ü safran) çalmanın ortasıdır.
    - **Kayıtlı bölümler:** Bu kitapta 3. okuması kayıtlı bölümler (`recordedChapters`); karelerde dolu görünürler. Demo profilinin eski seanslarında ses yoktur, bu yüzden demo "12 bölümün 1’i kayıtlı" der (tasarımda 4’ü).
    - **Tıkır'ın yorumu:** 3. okumanın `wcpm`'i ilk ikisinden büyükse tasarımdaki cümle, değilse "Kaydın hazır." (`docs/ekranlar.md`).
    - **"Gönder"** `requestApproval` çağırır. Düğme pasifleşir ve "Veli onayı bekliyor" yazar.
    - **"Baştan kaydet"** mikrofonu açar ve G4'e 3. okuma olarak döner (karar 5).
    - **Kayıt yoksa** (kayıt başlatılamadı ya da bulunamadı) kartın yerinde hata cümlesi görünür; "Baştan kaydet" ve "Devam et" çalışır.

16. **G6 Kapanış:**
    - **Seçenekler:** Her gösterimde karışır. Rastgelelik kaynağı servislerden gelir; testler sabit verir. Yanıt, seçeneğin içerikteki sırasıyla yazılır.
    - **Gönderme:** Seçim yapılmadan "Cevabı gönder" pasiftir.
    - **Doğru cevap:** Sıradaki soru gelir.
    - **Yanlış cevap:** Doğru seçenek onay işareti ve "Doğru cevap" etiketiyle gösterilir. Balon "Doğru cevabı işaretledim." olur, düğme "Devam et"e döner. "Yanlış" ya da puan yazısı yoktur.
    - **Cümle vurgusu:** Yalnız doğru seçenek gösterilir (ürün sahibi, 2026-11-20; D14). Vurgu, içerik her soruya kendi cümlesini ekleyince gelir (C7).
    - **Bitiş:** Son sorudan sonra seans biter ve G7 açılır. Son yanıt yazılmış ama seans bitmemişse (yenileme), G6 açılınca seansı bitirir.
    - **"Metne geri dön":** Bölümün bütün sayfaları salt okunur bir pencerede açılır (`<dialog>`); seans geri sarılmaz. Başlık sayfa kartının başlığıdır, kapatma düğmesi "Kapat".

17. **G7 Bugünlük bitti:**
    - **Süre:** `completedAt − startedAt`, dakikaya yuvarlanır, en az 1.
    - **Büyük sayı:** 3. okumanın `wcpm`'i. Fark `deltaFromPrevious` ile, yalnız artıysa görünür. Dinlemesiz seansta ikisi de yoktur.
    - **Evcilleşen kelimeler:** `tamedToday`; boşsa liste yoktur.
    - **Yarın kartı:** Sıradaki bölüm; seri bittiyse "Yeni bölümler yolda.".
    - **Özet satırı:** "Seansın özeti veline gitti." her zaman görünür.
    - **Kapat:** "Kapat" ve kabuğun kapat düğmesi G1'e döner.

18. **Albüm ve Stüdyo** (`TODO(design)`; `docs/ekranlar.md`: "Başka özellik ekleme"):
    - **Albüm:** Evcil kartlar, Türkçe alfabe sırasıyla. Her biri evcil canavar, kelime ve "evcilleşti" (G7'deki kart).
    - **Stüdyo:** Seri kitabın kayıtlı bölümleri, bölüm sırasıyla. Her satırda "{başlık}, 3. okuma", süre ve çal / duraklat.
    - **Boş durum:** Kart içinde tek cümle ve "Yola dön" düğmesi.

19. **Yükleniyor, hata, profil yok:**
    - **Yükleniyor:** Tıkır `think` ve "Hazırlanıyor…".
    - **Depo açılamazsa:** Tıkır ve tek cümle.
    - **Yer:** Seans ve çocuk kabuğunda aynı kalıp.
    - **Profil yoksa** (yalnız üretim derlemesinde): boş durum (`TODO(phase 3)`).

20. **Sayılar ve süreler:**
    - `withPossessiveSuffix(n)` sayıya iyelik ekini ekler. Ek, sayının okunuşunun son ünlüsüne uyar; okunuş ünlüyle bitiyorsa araya `s` girer: 3 → "3’ü", 12 → "12’si", 6 → "6’sı", 40 → "40’ı". Kesme işareti `’`.
    - Süreler `m:ss` biçimindedir ("0:19", "1:24").
    - `sessionMinutes = 12` (`config.ts`): G1'deki "12 dakika" (`docs/urun.md` bölüm 3).

21. **Geliştirme adres parametreleri** (`docs/mimari.md` → "Depolama ve örnek veri"; geliştirme ve `e2e` derlemesi):
    - **Parametreler:**

      | Parametre | Ne yapar |
      |---|---|
      | `?demo=<kip>` | depoyu kipe kurar (`loadDemoProfile`) |
      | `&adim=<adım>` | bugünün seansını o adıma getirir: `warmup`, `listen`, `read-1`, `read-2`, `read-3`, `record`, `wrapUp`, `done` |
      | `&senaryo=<ad>` | dinleyicinin senaryosu ya da elle kip (karar 7) |
      | `&onay=kapali` | velinin ses onayını kapatır (dinlemesiz seans; ölçüt 8) |
    - **`&adim` nasıl çalışır:**
      - Önceki adımlar deponun gerçek eylemleriyle oynatılır: ısınma kartları doğru, okumalar senaryonun benzetimi, sorular doğru.
      - `record` ve sonrası için 52 sn'lik yapay bir kayıt yazılır (tasarımdaki "0:52"). Bu çocuk içeriği değil, test verisidir.
      - Seans 12 dakika önce başlamış sayılır (G7'deki "12 dakika").
    - **Bir kez uygulanır:** Parametreler açılışta, uygulama çizilmeden önce uygulanır ve adresten silinir; sayfa yenilenince yeniden uygulanmaz.
    - **Kurulum sırası:** `src/app/App.tsx` yönlendiriciyi içe aktarılırken kurar. Bu yüzden `main.tsx` önce parametreleri uygular, `App`'i ondan sonra dinamik içe aktarır.
      - Yönlendirici, seans deposu ve servisler (sekme ayarındaki senaryo dahil) temizlenmiş adresle ve yazılmış ayarla kurulur.
      - Yoksa `&senaryo=design` ancak bir yenilemeden sonra geçerli olurdu.
    - **Kendiliğinden yükleme:** Profil yoksa ürün adreslerinde `cocuk-sabahi` kendiliğinden yüklenir. `/gelistirme/*` adreslerinde yüklenmez; vitrinin "Depo boş." durumu ve testi korunur.
    - **Kod yeri:** `src/features/dev/params/` içinde; `main.tsx` onu satır içi `import.meta.env.MODE !== 'production'` denetimiyle tembel yükler.

22. **`pnpm shots` adımları:**
    - **Seçenekler:**

      | Seçenek | Ne yapar |
      |---|---|
      | `--dokun <ad>` | o erişilebilir adı taşıyan düğmeye, bağlantıya, seçim düğmesine (`radio`) ya da onay kutusuna dokunur |
      | `--bekle <ad>` | o adla bir öğe görünene kadar bekler |
      | `--ileri <ms>` | saati ilerletir |
    - Adımlar verildiği sırayla her rotada çalışır.
    - `--ileri` varsa Playwright saati sayfa açılmadan kurulur ve hemen durdurulur (`install`, ardından `pauseAt`); zaman yalnız bu adımla (`runFor`) ilerler. `install` tek başına saati durdurmaz.
    - Chromium sahte mikrofonla açılır; sayfaya `speechSynthesis` verilmez (karar 7).
    - CLAUDE.md'deki komut satırı güncellenir. Seans adımlarının komutları "Tasarım karşılaştırması" bölümündedir.

23. **Uçtan uca testlerde zaman:**
    - Playwright saati (`page.clock`) sayfa açılmadan kurulur ve durdurulur (`install`, `pauseAt`). Okumalar ve seslendirme `runFor` ile saniyeler içinde geçer. Ertesi gün testi saati bir gün ileri alır.
    - WebKit'e mikrofon iznini test verir; sayfaya `speechSynthesis` verilmez (karar 7).
    - Kayıt gerçek zamanlı ses çerçevelerinden oluşur, bu yüzden hızlandırılmış okumanın kaydı çok kısadır. Çalma testi `&adim=record`'un 52 sn'lik kaydıyla yapılır.

24. **StrictMode ve 2a'dan kalanlar:**
    - Ekran testleri `<StrictMode>` içinde çizer (2a, M11).
    - `audioLabServices` bir geliştirme modülüne taşınır (2a'nın `TODO(phase 2b)`); ses denemesi üretim paketine girmez.
    - `src/services/listener/types.ts`'teki "Faz 3" yorumu "Faz 6" olur (M10).
    - jsdom'da `HTMLDialogElement.showModal` yok; `src/test/setup.ts` küçük bir yama ekler.
    - `react-refresh` kuralı, bir bileşenle birlikte bileşen olmayan dışa aktarımı reddeder. Bu yüzden bağlam ve hook'lar `.ts`, sağlayıcı bileşen ayrı bir `.tsx` dosyasındadır.
    - Bu fazda kapananlar: M1 (karar 8), M8 (karar 5), M10, M11; 2a karar 30'dan "mikrofon düşünce kaydın saklanması" (karar 14) ve "tek başına duraksamanın kart olmaması" (karar 5).
    - Ertelenmeye devam edenler: M3, M4, M5, M6, M9 (2a planı, "Son inceleme"). M7'nin yolu `warmup.scored` ile kapanır, işlevin kendisi değişmez.

### Tasarımı olmayan durumların metinleri

Hepsi `src/i18n/tr.ts` içine `TODO(design)` yorumuyla girer (D15). Kaynağı belge ya da tasarım olanlar o yerden alınır; geri kalanı bu planla onaylandı.

| Yer | Metin | Kaynak |
|---|---|---|
| G1 balonu (tablet, web) | Bugün {n}. bölümü okuyoruz: {başlık}. Hazırsan başlayalım. | yanıt 2 (D13) |
| G1, süren seans | Sürdür | `docs/ekranlar.md` |
| G1, bugün bitti | Bugünlük bitti · Yarın: {başlık} · {n}. bölüm yarın açılır · balon: Bugünlük bu kadar. Yarın görüşürüz, {ad}. | G7 tasarımı |
| G1, seri bitti | Yeni bölümler yolda. · düğme: Kitaplık | `docs/ekranlar.md`, gezinme |
| Çıkış onayı, başlık | Seanstan çıkılsın mı? | `docs/ekranlar.md` |
| Çıkış onayı, açıklama | Kaldığın yerden sürdürebilirsin. | önerilen |
| Çıkış onayı, düğmeler | Çık · Seansa dön | önerilen |
| Yükleniyor | Hazırlanıyor… | önerilen |
| Depo hatası | Bilgilerin açılamadı. Sayfayı yenileyip yeniden dene. | önerilen |
| Mikrofon izni yok (balon) | Seni duyamıyorum, mikrofon izni kapalı. Velinden izni açmasını iste, sonra Yeniden dene’ye dokun. | önerilen |
| Mikrofon yok (balon) | Mikrofonu bulamadım. Velinden bir mikrofon bağlamasını iste, sonra Yeniden dene’ye dokun. | önerilen |
| Mikrofon hatası (balon) | Mikrofon durdu. Yeniden dene’ye dokun. | önerilen |
| Mikrofon sorunu, düğme | Yeniden dene | `docs/ekranlar.md` |
| Dinlemesiz, mikrofon düğmesinin adı | Dinleme kapalı | önerilen |
| Dinlemesiz G2 balonu | Dinleme kapalı. Kelimeyi sesli oku, sonra sıradakine geç. | önerilen |
| Dinlemesiz G2, ileri düğmesi | Sıradaki kelime (son kartta tasarımdaki "Dinle adımına geç") | önerilen |
| Dinlemesiz G4 balonu | Dinleme kapalı. Metni sesli oku, bitince Okumayı bitir’e dokun. | önerilen |
| G3, duraklatılmış seslendirme | Seslendirmeyi sürdür (düğme adı) | önerilen |
| G4, duraklatılmış okuma | Sürdür | G1 tasarımı |
| G4, kayıt göstergesi | Kayıt | `docs/ekranlar.md` |
| G5, nötr yorum | Kaydın hazır. | `docs/ekranlar.md` |
| G5, çalarken | Duraklat (düğme adı) | G4 tasarımı |
| G5, gönderildi | Veli onayı bekliyor | `docs/ekranlar.md`'nin sözü |
| G5, kayıt yok | Kaydın alınamadı. Baştan kaydet’e dokunup bir daha oku. | önerilen |
| G6, doğru seçeneğin etiketi | Doğru cevap | önerilen |
| G6, yanlış cevapta balon | Doğru cevabı işaretledim. | önerilen |
| G6, yanlış cevapta düğme | Devam et | G5 tasarımı |
| G6, metin penceresi | başlık: sayfa kartının başlığı · düğme: Kapat | G3, G7 tasarımı |
| G7, seri bitti | Yeni bölümler yolda. | `docs/ekranlar.md` |
| Albüm, boş | Evcilleşen kelimelerin burada toplanır. · düğme: Yola dön | önerilen |
| Stüdyo, boş | Kaydettiğin bölümler burada sesli kitabın olur. · düğme: Yola dön | önerilen |

**Tasarımdan gelen değişkenli metinler** (kalıp; sayı ve adlar veriden):

| Ekran | Kalıp |
|---|---|
| G1 | Merhaba {ad} · {n} gün üst üste · {n}. bölüm, {dakika} dakika · {toplam} bölümün {n’ü} tamam |
| Kabuk | Bölüm {n}: {başlık} |
| G2 | {n} kelime · Canavar kelime {i} / {n} · Evcilleşmesine {n} doğru okuma kaldı |
| G3, G4 | {kitap}, {n}. bölüm · {i} / {n} · {m:ss} / {m:ss} |
| G4 | {n}. okuma / 3 · Dünkü senin {n} kelime önündesin. · Süre {m:ss} · Doğru {n} · Takılma {n} · Takıldın mı? Hecele: {he-ce-ler} |
| G5 | {başlık}, 3. okuma · Kayıtlı bölümler: {toplam} bölümün {n’ü} · {toplam} bölümün {n’ü} kayıtlı |
| G6 | {n} soru · Soru {i} / {n} |
| G7 | {n} dakika · Dünkü senden {n} fazla · Yarın: {başlık} · {n}. bölüm yarın açılır · Bugünlük bu kadar. Yarın görüşürüz, {ad}. |

## Ölçütler ve kanıtları

| # | Yol haritası ölçütü (Faz 2) | Kanıt | Görev |
|---|---|---|---|
| 1 | `typical` ile G1'den G7'ye seans; G1, G2 ve G7 `expected` değerleri | `e2e/session.spec.ts` › "a typical session runs from G1 to G7 with the demo profile's numbers" | 17 |
| 2 | `design` senaryosunda G4 görüntüsü tasarımdaki anı gösterir | `e2e/session-design.spec.ts` › "the design scenario reaches the G4 moment"; `pnpm shots` görüntüsü | 12, 17 |
| 3 | 3 sn'de yardım balonu, hece, seslendirme, `helped` | `e2e/session-design.spec.ts` (aynı test); `ReadPage.test.tsx` › "opens the help at three seconds and saves the word as helped" | 12, 17 |
| 4 | Üçüncü okuma kaydedilir, G5'te dinlenir, "Baştan kaydet" yeni kayıt alır | `e2e/session.spec.ts` › "the third reading is recorded, played and recorded again"; `RecordPage.test.tsx` | 13, 17 |
| 5 | Yenilenince seans kaldığı adımdan sürer | `e2e/session.spec.ts` (1. testte iki yenileme); `sessionStore.test.ts` › "a new store resumes at the same place" | 5, 17 |
| 6 | Bitince sonuçlar depoda, takılınanlar kart, G1 "bugün bitti" | `e2e/session.spec.ts` (1. testin sonu, depo denetimi); `sessionStore.test.ts` | 5, 9, 17 |
| 7 | Ertesi gün sıradaki bölüm, ısınmada dünün kelimeleri, G4'te "dün" imleci | `e2e/session.spec.ts` › "the next day opens the next chapter with yesterday's words and the ghost" | 17 |
| 8 | Veli onayı kapalıyken mikrofon hiçbir adımda açılmaz | `e2e/session-consent.spec.ts` › "without the parent's consent the session runs unheard and never opens the microphone"; `useMicrophone.test.tsx`; G2 ve G4 testleri | 7, 10, 12, 17 |
| 9 | Çocuğa olumsuz fark yok | `ReadPage.test.tsx` › "never shows a race sentence when the child is behind or level"; `DonePage.test.tsx` › "shows the gain over the previous session only when it is positive" | 12, 15 |
| 10 | G1–G7 üç genişlikte tasarımla karşılaştırıldı | "Tasarım karşılaştırması" bölümü | 9–15, 18 |

## Her görevde geçerli kurallar

- **Dil ve tipler:** TypeScript `strict`, `any` yok. Kod, yorum ve commit İngilizce.
- **Metin:**
  - Ürün metni yalnız `src/i18n/tr.ts` içindedir, tasarım dosyasından birebir alınır.
  - Tasarımı olmayan durumların metni yukarıdaki tablodan gelir.
  - Geliştirme sayfası metni `src/features/dev/` içindedir.
  - Emoji yok.
- **Adlar:** Alan terimleri `docs/urun.md` sözlüğünden; yeni alan adları karar 2'deki gibi.
- **Katmanlar:**
  - `src/domain` saftır ve tamamı birim testlidir.
  - Bileşenler ve ekranlar mikrofona, ağa ve depolamaya doğrudan dokunmaz.
  - Tarayıcı API'si yalnız `src/services` içindedir (ESLint denetler).
  - `features` `src/app`'i içe aktarmaz.
- **Geliştirme kodu:** `import.meta.env.MODE !== 'production'` denetimi kullanıldığı modülde, satır içinde yapılır; geliştirme modülleri tembel yüklenir.
- **Stil:** CSS Modules ve token değişkenleri. Tasarımda olup token'da olmayan değer `tokens-extra.css`'e kaynağıyla girer. `text-transform: uppercase` yok. Okuma metinlerinde `no-common-ligatures`.
- **Erişilebilirlik:**
  - Dokunma hedefi en az 44 px; gerçek `button`, `a`, `input`.
  - `aria-label`'lar tasarımdaki gibi; Tıkır'ın balonu `aria-live="polite"`.
  - Seçimler gerçek `radio`.
- **Mahremiyet:** Mikrofon yalnız `consent.voiceProcessing` ile açılır; çocuk ekranında puan, rozet ve olumsuz fark yok.
- **Türkçe:**
  - büyük-küçük harf çevirisi `toLocaleUpperCase('tr-TR')` / `toLocaleLowerCase('tr-TR')` ile;
  - sıralama `localeCompare(…, 'tr')` ile;
  - kesme işareti `’`.
- **Başvuru klasörleri:** `design/` ve `seed/` değiştirilmez; içerik uydurulmaz.
- **Testler:**
  - Tek dosya `pnpm test <dosya>` ile çalışır (araya `--` konmaz).
  - Ekran testleri `<StrictMode>` içinde çizer, sahte zamanla ve sahte servislerle koşar.
  - Görev sonunda `pnpm check` çalışır.
  - WebKit uçtan uca testleri ekran uyanıkken koşar: `caffeinate -u -t 2; caffeinate -d -i pnpm e2e …`.
- **Ekran görevleri:**
  - Görev, ekran görüntüleri alınmadan bitmez: `pnpm shots` ile 390, 1180 ve 1440 px alınır ve `design/png` ile karşılaştırılır.
  - Farklar "Tasarım karşılaştırması" bölümüne yazılır ve düzeltilir. Düzeltilmeyen farkın gerekçesi yazılır.
- **Bağımlılıklar:** Yeni paket önce `docs/kararlar.md`'ye yazılır. Sürüm kurulum anındaki güncel kararlı sürümdür.
- **Commit'ler:** küçük, tek amaçlı, Conventional Commits.
- **Yürütme defteri:** `.superpowers/sdd/faz-2b/progress.md`; görev sonu komutları ve çıktıları oraya yazılır.

## İnceleme odağı

Görevlerin kendi testleri dışında en çok can yakabilecek beş durum. Her birinin testi ilgili görevde.

1. **Çift dokunuş ve yarış.** Bir geçiş düğmesine iki kez dokunmak, ya da dinleyicinin bitişiyle "Okumayı bitir"in çakışması iki geçiş yazmamalı. (Task 5, test 12; Task 12, test 7.)
2. **Mikrofonun ömrü.** Onay yokken hiç açılmamalı. Dinlemeyen bir adrese geçince kapanmalı. StrictMode'un ikinci takılması ve yeniden çizim, dokunuşla açılan mikrofonu kapatmamalı. (Task 7, test 2; Task 10, test 7; Task 12, test 10; Task 17.)
3. **3. okuma ve kayıt.** Dinleyici ve kayıt birlikte başlayıp bitmeli. Çıkışta yarım kayıt silinmeli. "Baştan kaydet"te eski kayıt yenisi yazılmadan silinmemeli. Mikrofon gidip gelirse kayıt kesilmemeli. (Task 3, test 3; Task 5, test 8; Task 12, test 9; Task 13, test 5.)
4. **Yardım, duraklatma ve çıkış penceresi üst üste.** Yardım seslendirmesi sırasında pencere açılırsa okuma takılı kalmamalı. (Task 12, test 8.)
5. **Yenileme.** Her adımda ekran yalnız depodan kurulmalı. Bellekteki durum kaybolunca (dinlemesiz okuma sayısı, G6'daki açıklama) seans tutarlı bir yerden sürmeli. Isınmada yenileme bir kartı ikinci kez puanlamamalı. (Task 5, test 5 ve 11; Task 10, test 11; Task 14, test 5; Task 17.)

## Görevler

### Task 0: Plan dosyası, dal ve ürün sahibinin yanıtları

**Dosyalar:** `docs/planlar/faz-2b.md`, `docs/kararlar.md`.

- [x] `main`'den `faz-2b` dalını aç. Bu planın durum satırını "onaylandı (tarih)", "Onaya sunulan kararlar" başlığını "Onaylanan kararlar" yap.
- [x] `docs/kararlar.md`:
  - Ürün: **P13** dinlemesiz seans (kesin, ürün sahibi 2026-11-20; ayrıntı: Faz 2b planı, karar 10).
  - Tasarım:
    - **D13** G1 balonunun genel kalıbı (kesin, 2026-11-20).
    - **D14** G6'da yanlış cevapta yalnız doğru seçenek (kesin, 2026-11-20).
    - **D15** tasarımı olmayan durumların metinleri (varsayım; bu planla onaylandı, kodda `TODO(design)`).
  - Teknik:
    - **T8** notu: ilk başarısız üniteden sonra sayfanın kalanı sessiz (ürün sahibi 2026-11-20).
    - **T22** seansın mikrofonu: dokunuşla açılır, adres kuralıyla kapanır (varsayım; karar 6).
  - İçerik:
    - **C6** bölümlerin G1 giriş cümlesi (açık; şimdilik D13 kalıbı).
    - **C7** her sorunun cevabının metindeki cümlesi (açık; şimdilik vurgu yok).
  - Değişiklik günlüğüne bir satır.
- [x] Commit: `docs: add the phase 2b plan and record the product owner's answers`.

### Task 1: Seslendirmede sayfanın kalanı sessiz

**Dosyalar:** `src/services/narrator/SpeechSynthesisNarrator.ts`, `SpeechSynthesisNarrator.test.ts`.

**Davranış** (karar 8):

- Bir ünite 1500 ms içinde başlamazsa ya da hata verirse o ünite ve aynı `speakPage`'in kalan üniteleri `speak` çağrılmadan sessiz zamanlanır.
- Sonraki `speakPage` ve her `speakWord` sesi yeniden dener.
- Sessiz kalan bir sayfada duraklatma ve sürdürme yine sessizdir.

**Adımlar:**

- [x] **Kırmızı** (sahte zaman, sahte `SpeechPort`; 4. bölümün `design` düzenindeki ilk sayfası, 18 ünite):
  1. Hiç başlamayan ses: tek `speak` çağrısı; `onUnit` 0'dan 17'ye sırayla gelir; sayfa 48,5 sn'de (1,5 + 47,0) `'completed'` biter.
  2. 4. ünitede (`unitIndex` 3) `onError`: `speak` 4 kez çağrılır; 4–17 sessiz; `'completed'`.
  3. 1. testten sonra yeni bir `speakPage` ilk ünite için `speak` çağırır.
  4. 1. testten sonra `speakWord('ağaçlarının')` `speak` çağırır.
  5. Sessiz kalan sayfada `pause()` ve `resume()`: `speak` çağrılmaz, sayfa biter.
- [x] `pnpm test src/services/narrator/SpeechSynthesisNarrator.test.ts` → FAIL.
- [x] Uygula. → PASS. `pnpm check` → geçer.
- [x] Commit: `fix(narrator): time the rest of a page silently once the voice fails`.

### Task 2: Seans ekranlarının alan kuralları

**Dosyalar:** `src/domain/config.ts`, `text.ts`, `text.test.ts`, `stuckWords.ts`, `stuckWords.test.ts`, `progress.ts`, `progress.test.ts`.

**Üretir:**

```ts
// config.ts
export const sessionMinutes = 12;
// text.ts
export function withPossessiveSuffix(count: number): string;          // 3 → '3’ü'
// stuckWords.ts
export function isWarmupCorrect(status: WordStatus): boolean;          // !isCountedError(status)
export function warmupItems(words: readonly string[], cards: readonly StuckWord[],
  source: WarmupSource): WarmupItem[];                                 // the stored deck, rebuilt
// progress.ts
export function recordedChapters(sessions: readonly Session[], bookId: Id): number[];
export function sessionMinutesSpent(session: Session): number | null;  // null until completed
```

**Adımlar:**

- [x] **Kırmızı:**
  - **`withPossessiveSuffix`:**

    | Sayı | Sonuç | Sayı | Sonuç | Sayı | Sonuç |
    |---|---|---|---|---|---|
    | 0 | 0’ı | 7 | 7’si | 30 | 30’u |
    | 1 | 1’i | 8 | 8’i | 40 | 40’ı |
    | 2 | 2’si | 9 | 9’u | 50 | 50’si |
    | 3 | 3’ü | 10 | 10’u | 60 | 60’ı |
    | 4 | 4’ü | 11 | 11’i | 90 | 90’ı |
    | 5 | 5’i | 12 | 12’si | 100 | 100’ü |
    | 6 | 6’sı | 20 | 20’si | 1000 | 1000’i |
  - **`isWarmupCorrect`:** `correct`, `repeated`, `inserted`, `selfCorrected` → `true`; `misread`, `suffix`, `skipped`, `helped` → `false`.
  - **`warmupItems`:**
    - `cocuk-sabahi` kartları, 4. bölümün kelimeleri ve zincirleri; kelimeler `['kıvrılıyordu','ağaçlarının','belirdiğinde']` → `warmupDeck` ile derin eşit.
    - İlk kart `applyWarmupResult(…, true, today)` ile güncellendikten sonra yine üç öğe; ilk öğenin kartı güncel (seri 2).
    - Kartı olmayan bir metin kelimesi → `card: null`, zinciri bölümden.
  - **`recordedChapters`:** 3. okumasında `recordingId` olan seansların bölümleri, sıralı ve tekil; kaydı olmayan seans ve başka kitap sayılmaz.
  - **`sessionMinutesSpent`:**

    | Başlangıç | Bitiş | Sonuç |
    |---|---|---|
    | 09:00 | 09:12 | 12 |
    | 09:00 | 09:12:31 | 13 |
    | 09:00 | 09:00:20 | 1 |
    | 09:00 | yok | `null` |
- [x] Üç test dosyası → FAIL.
- [x] Uygula. `withPossessiveSuffix`, `readCardinal`'ın okunuşundan son ünlüyü bulur. → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(domain): add the counts and rules of the session screens`.

### Task 3: Isınma destesi, seslendirme hızı ve kayıt onayı alanları

**Dosyalar:** `src/domain/types.ts`, `src/services/narrator/Narrator.ts`, `src/services/repository/db.ts`, `src/services/recorder/Recorder.ts`, `PcmRecorder.ts`, `PcmRecorder.test.ts`, `src/services/repository/IndexedDbRepository.test.ts`, `docs/mimari.md`.

**Üretir** (karar 2):

```ts
// types.ts
export type NarrationRate = 'slow' | 'normal';
export interface SessionWarmup { words: string[]; done: number; scored: number }   // done ≤ scored ≤ done + 1
// Session: warmup?: SessionWarmup        Child: narrationRate?: NarrationRate
// db.ts — StoredRecording: approval?: 'pending'
// Recorder.ts
export interface RecordingInfo { id: Id; seconds: number; levels: number[]; approval?: 'pending' }
// Recorder: requestApproval(id: Id): Promise<void>   rejects for an unknown id
```

**Adımlar:**

- [x] **Kırmızı:** `PcmRecorder.test.ts`:
  1. `requestApproval(id)` → `get(id)` `approval: 'pending'` verir. Olmayan kimlik "No recording" ile reddeder. Yeni kayıtta `approval` yok.
  2. Hiç çerçeve gelmeden `stop()` → `seconds` 0 ve 64 sıfır düzey (`NaN` yok). Uçtan uca testlerde hızlandırılmış okuma bu yoldan geçer.
  3. Kayıt sürerken mikrofon `idle` olup yeniden `capturing` olur: öncesi ve sonrasının çerçeveleri tek kayıtta, aradaki boşluk yok (karar 14).
- [x] `pnpm test src/services/recorder/PcmRecorder.test.ts` → FAIL. Yeni tip alanları için kırmızı test yok: IndexedDB her alanı saklar, Vitest tip denetlemez; alanları `pnpm typecheck` denetler.
- [x] Uygula. `IndexedDbRepository.test.ts`'e `warmup` ve `narrationRate` alanlı kayıtların gidiş dönüşü gerileme testi olarak eklenir. `docs/mimari.md` → "Tipler" ve `Recorder` arayüzü. → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(session): keep the warmup deck, the narration rate and the share request`.

### Task 4: Seans durum makinesi

**Dosyalar:** `src/features/session/paths.ts`, `sessionMachine.ts`, `sessionMachine.test.ts`, `src/app/routes.ts`, `src/app/routes.test.ts`.

**Üretir:**

```ts
// paths.ts — the single source; src/app/routes.ts builds screenPaths and extraPaths from it
export const childPaths: { road: '/'; library: '/kitaplik'; album: '/album'; studio: '/studyo' };
export const sessionPaths: Readonly<Record<SessionStep, string>>;   // warmup '/seans/isinma' … done '/seans/bitti'
export const listeningPaths: readonly string[];                       // G2, G4
// sessionMachine.ts
export type SessionPlace =
  | { step: 'warmup'; card: number; secondAttempt: boolean } | { step: 'listen' }
  | { step: 'read'; attempt: Attempt; redo: boolean } | { step: 'record' }
  | { step: 'wrapUp'; question: number } | { step: 'done' };
export function placeOf(session: Session): SessionPlace;
export function sessionRedirect(session: Session | null, pathname: string): string | null;   // null: stay
export interface NewSession { id: Id; childId: Id; date: LocalDate; chapterRef: ChapterRef; warmupWords: string[]; startedAt: string }
export function createSession(input: NewSession): Session;
export function afterWarmupScore(session: Session, correct: boolean): Session;   // scored = done + 1; correct: done + 1 too
export function afterWarmupCard(session: Session): Session;                      // done + 1, scored at least done
export function skipWarmup(session: Session): Session;
export function afterListen(session: Session): Session;
export function afterReading(session: Session, reading: ReadingResult): Session;
export function afterUnheardReading(session: Session, attempt: Attempt): Session;
export function redoRecording(session: Session): Session;
export function afterRecord(session: Session): Session;
export function afterAnswer(session: Session, option: number): Session;
export function finishSession(session: Session, completedAt: string): Session;
```

Geçiş, oturum beklenen adımda değilse `Error('Not at <step>')` fırlatır. Depo bunu önceden denetler (karar 5).

**Adımlar:**

- [x] **Kırmızı:** `sessionMachine.test.ts`:
  1. **Başlangıç:** `createSession` → `step: 'warmup'`, `warmup: {words, done: 0, scored: 0}`, okuma ve yanıt yok. Kelime yoksa `step: 'listen'`.
  2. **Isınma:**
     - `afterWarmupScore(…, true)` → `done` 1, `scored` 1; üçüncü kartta `listen`;
     - `afterWarmupScore(…, false)` → `done` 0, `scored` 1, yer `secondAttempt: true`; ardından `afterWarmupCard` → `done` 1;
     - `scored > done` iken `afterWarmupScore` fırlatır (kart iki kez puanlanmaz);
     - dinlemesiz kipte üç `afterWarmupCard` → `listen`, `scored` her adımda `done`'a yetişir;
     - 0. kartta `skipWarmup` → `listen`, `done` 0 kalır.
  3. **Okumalar:**
     - `afterListen` → `read`, okuma 1;
     - iki okuma → okuma 3;
     - üçüncü → `record`.
  4. **Baştan kaydet:** `redoRecording` → okuma 3, `redo: true`. `afterReading` üçüncü okumanın yerine yazar (uzunluk 3) → `record`.
  5. **Dinlemesiz okuma:** `afterUnheardReading` 1 ve 2 için oturumu değiştirmez; 3 → `wrapUp`, okuma listesi boş.
  6. **Sorular:**
     - `afterRecord` → `wrapUp`, soru 0;
     - `afterAnswer(…, 2)` → `answers [2]`, soru 1;
     - `finishSession` → `done`, `completedAt`.
  7. **`sessionRedirect`:**

     | Oturum | Adres | Sonuç |
     |---|---|---|
     | yok | `/seans/oku` | `/` |
     | `warmup` | `/seans/isinma` | `null` |
     | `warmup` | `/seans/oku` | `/seans/isinma` |
     | `read` | `/seans/isinma` | `/seans/oku` |
     | `record` | `/seans/bitti` | `/seans/kayit` |
     | `done` | `/seans/oku` | `/seans/bitti` |
     | `done` | `/seans/bitti` | `null` |
     | herhangi | `/kitaplik` | `null` |
  8. **Yanlış adım:** `afterListen` bir `warmup` oturumunda fırlatır.
  - `routes.test.ts`: `screenPaths.G2…G7` `sessionPaths` ile aynı; mevcut testler değişmeden geçer.
- [x] `pnpm test src/features/session/sessionMachine.test.ts` → FAIL.
- [x] Uygula. → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(session): add the session state machine`.

### Task 5: Seans deposu

**Dosyalar:** `docs/kararlar.md` (bağımlılık), `package.json`, `pnpm-lock.yaml`, `src/features/session/sessionStore.ts`, `sessionStore.test.ts`, `src/services/repository/IndexedDbRepository.ts`, `IndexedDbRepository.test.ts`.

**Kullanır:** Task 2–4; 2a'nın `warmupDeck`, `applyWarmupResult`, `recordMisses`, `toReadingResult`, `nextSeriesChapter`, `chapterTokens`.

**Üretir:**

```ts
export interface SessionStoreServices {
  repository: () => Promise<Repository>;
  recorder: Pick<Recorder, 'remove'>;
  today: () => LocalDate;
  now: () => Date;
  createId: () => Id;
}
export type SessionStatus = 'idle' | 'loading' | 'ready' | 'noProfile' | 'error';
export interface SessionData {
  parent: Parent; child: Child; series: Book;
  chapter: Chapter | null;          // today's: the session's, else the next series chapter; null at the series' end
  sessions: Session[]; cards: StuckWord[]; today: LocalDate; session: Session | null;
}
export interface SessionState {
  status: SessionStatus; data: SessionData | null; error: Error | null;
  unheardDone: number;              // unheard readings of this page; not stored (karar 3)
  load(): Promise<void>;
  start(): Promise<void>;
  answerWarmupCard(correct: boolean): Promise<void>;   // the current card's first attempt: session (scored), then card
  nextWarmupCard(): Promise<void>;                     // after the second attempt, or unheard
  skipWarmup(): Promise<void>;
  finishListening(): Promise<void>;
  saveReading(outcome: ReadingOutcome, meta: { startedAt: string; recordingId: Id | null }): Promise<void>;
  skipUnheardReading(): Promise<void>;
  redoRecording(): Promise<void>;
  finishRecording(): Promise<void>;
  answerQuestion(option: number): Promise<boolean>;     // true when correct
  finishSession(): Promise<void>;
  setNarrationRate(rate: NarrationRate): Promise<void>;
}
export function createSessionStore(services: SessionStoreServices): StoreApi<SessionState>;
```

**Adımlar:**

- [x] Önce `docs/kararlar.md` → Bağımlılıklar: `zustand` satırı (T4; seans durumu, `docs/mimari.md` "Yığın"). Kur: `pnpm add zustand`.
- [x] **Kırmızı:** `sessionStore.test.ts`. Kurulum: `fake-indexeddb`, `loadDemoProfile(repo, 'cocuk-sabahi', '2026-11-21')`, bugün `'2026-11-21'`, sabit `now`, sıralı kimlikler. Okumalar 4. bölümün söyleyişleriyle `simulateReading` + `toWordResults`.
  1. **Yükleme:**
     - `ready`; okuyucu Deniz; bölüm 4; bugünün seansı yok.
     - Boş depo → `noProfile`.
     - `RepositoryUnavailableError` → `error`.
  2. **Başlangıç:**
     - `start()` seansı yazar: `warmup`, kelimeler `['kıvrılıyordu','ağaçlarının','belirdiğinde']`.
     - İkinci `start()` aynı seansı bırakır.
  3. **Isınma, hepsi doğru:**

     | Kart | Sonuç |
     |---|---|
     | kıvrılıyordu | seri 2, günü `'2026-11-25'` |
     | ağaçlarının | evcil; `tamedToday` `['ağaçlarının']` |
     | belirdiğinde | seri 1, günü `'2026-11-23'` |

     Üç karttan sonra adım `listen`.
  4. **İlk deneme yanlış:** Kart `practicing`, seri 0, günü `'2026-11-22'`. İkinci deneme kartı yeniden yazmaz.
  5. **İkinci denemede yenileme:** İlk deneme yanlış yazıldıktan sonra aynı depoya kurulan yeni bir depo → yer `secondAttempt: true`; `answerWarmupCard` yazmaz. Evcilleşmiş bir kart (seri 2 → 3) yenilemeden sonra evcil kalır.
  6. **Isınmayı atlama:** 1. kartta `skipWarmup` → `listen`; 2. ve 3. kart değişmez.
  7. **`typical` okumaları:**
     - `wcpm` `[64,68,71]`;
     - yeni kartlar "arasından", "soluk", "rüzgârı" (`wild`, günü `'2026-11-22'`);
     - kayıt kimliğiyle biten üçüncüden sonra `record`.
  8. **Baştan kaydet:**
     - `redoRecording` → okuma 3;
     - yeni üçüncü okuma eskisinin yerine yazılır;
     - `recorder.remove` eski kimlikle, seans yazıldıktan sonra çağrılır.
  9. **Dinlemesiz:** Üç `skipUnheardReading` → `wrapUp`; okuma yok; kartlar değişmez; `unheardDone` 3.
  10. **Sorular ve bitiş:**
      - `answerQuestion(0)` → `true`, `answerQuestion(1)` → `false`;
      - `finishSession` → `done`, `completedAt`;
      - `data.sessions` bu seansı içerir.
  11. **Yenileme:** 7. testin 2. okumasında aynı depoya kurulan yeni bir depo → okuma 2.
  12. **Çift dokunuş:** Aynı anda iki `finishListening()` → tek yazma, okuma 1.
  13. **Yazma hatası:** Depo bir yazmayı reddederse eylem reddeder ve `status` `error` olur.
  - **`IndexedDbRepository.test.ts` (M8):** Geçersiz anahtarlı bir kartla (`word` yok) `saveStuckWords` `DataError` ile reddeder ve işlenmemiş ret kalmaz. Vitest işlenmemiş reddi hata sayar; şimdiki kodda bu test düşer.
- [x] `pnpm test src/features/session/sessionStore.test.ts` ve `pnpm test src/services/repository/IndexedDbRepository.test.ts` → FAIL.
- [x] Uygula. `saveStuckWords` işlemin bütün adımlarını `transaction.done` ile birlikte bekler; aynı kalıpta başka çok adımlı yazma varsa o da. → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(session): add the session store`.

### Task 6: Geliştirme adres parametreleri

**Dosyalar:**

- `src/services/tabSettings.ts`, `src/services/address.ts` (+ testler);
- `src/app/services.ts` (`sessionStoreServices()`; `prepareDevelopment` bunu ister, Task 7'yi beklemez);
- `src/features/dev/params/devParams.ts`, `devParams.test.ts`, `prepareSessionStep.ts`, `prepareSessionStep.test.ts`, `syntheticRecording.ts`, `prepareDevelopment.ts`;
- `src/main.tsx`;
- `e2e/dev-params.spec.ts`.

**Üretir:**

```ts
// services/tabSettings.ts — sessionStorage, null when unavailable
export function readTabSetting(key: string): string | null;
export function writeTabSetting(key: string, value: string | null): void;
// services/address.ts
export function currentAddress(): { pathname: string; search: string };
export function replaceAddress(pathAndSearch: string): void;
// features/dev/params/devParams.ts
export type DevStep = 'warmup' | 'listen' | 'read-1' | 'read-2' | 'read-3' | 'record' | 'wrapUp' | 'done';
export interface DevParams { demo?: DemoMode; step?: DevStep; scenario?: ScenarioName | 'elle'; consentOff?: true }
export function readDevParams(search: string): { params: DevParams; rest: string };   // rest: search without them
export const listenerSettingKey = 'tikir.gelistirme.dinleyici';
// prepareSessionStep.ts
export function prepareSessionStep(store: StoreApi<SessionState>, step: DevStep, scenario: ScenarioName,
  recordings: RecordingStore): Promise<void>;
// prepareDevelopment.ts — called from main.tsx before the first render
export function prepareDevelopment(services: { repository: () => Promise<Repository>; recordings: RecordingStore;
  storeServices: SessionStoreServices }): Promise<void>;
```

**Kurallar** (karar 21):

- Bilinmeyen değerli parametre yok sayılır ve `console.warn` ile bildirilir.
- `&adim` `?demo` olmadan da çalışır: bugünkü seansı o adıma getirir.
- `prepareSessionStep` deponun eylemlerini kullanır. Seans başlangıcı `now − 12 dk`'ya çekilir.

**Adımlar:**

- [x] **Kırmızı:**
  - **`devParams.test.ts`:**
    - `'?demo=cocuk-sabahi&adim=read-2&senaryo=design&x=1'` → parametreler ve `rest` `'?x=1'`;
    - `'?onay=kapali'` → `consentOff: true`;
    - `'?adim=uc'` → yok sayılır;
    - parametresiz adres → boş.
  - **`prepareSessionStep.test.ts`** (`cocuk-sabahi`, bugün `'2026-11-21'`):
    1. `read-2` + `typical` → `read`, 1 okuma, `wcpm` 64.
    2. `read-2` + `design` → 1. okuma `typical` 1 ile aynı.
    3. `record` → 3 okuma, 3.'sünde 52 sn'lik kaydın kimliği; kayıt deposunda 64 düzey.
    4. `done` → `completedAt`, `tamedToday` `['ağaçlarının']`, `sessionMinutesSpent` 12.
    5. `warmup` → `warmup`, kart 0.
  - **`e2e/dev-params.spec.ts`** (Chromium, WebKit):
    - `/gelistirme/vitrin?demo=cocuk-sabahi&adim=read-2` → "Depoda 5 seans, 6 kelime kartı, 6 ölçüm var." (demo profilinin 4 kartı ve `typical` 1. okumanın iki yeni kartı: "arasından", "soluk").
    - Adres `/gelistirme/vitrin` olur; sayfa yenilenince sayılar aynı.
    - `/gelistirme/vitrin` profil yokken "Depo boş." kalır.
- [x] İlgili testler → FAIL.
- [x] Uygula. `main.tsx` (karar 21, "Kurulum sırası"):
  - `import './appShellStart'` ilk satırda kalır;
  - geliştirme kipinde `prepareDevelopment` ve `src/app/services.ts` satır içi denetimle dinamik içe aktarılır ve `await` edilir; üretimde `main.tsx` `services.ts`'i içe aktarmaz;
  - `App` ondan sonra dinamik içe aktarılır, böylece yönlendirici temizlenmiş adresi görür;
  - ürün adresinde profil yoksa `cocuk-sabahi` yüklenir.
- [x] → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(dev): open session steps from the address`.

### Task 7: Servisler, kabuk, adım koruması ve mikrofon kuralı

**Dosyalar:**

- `src/app/services.ts`, `src/app/devServices.ts` (yeni: `audioLabServices`), `src/app/router.tsx`, `router.test.tsx`;
- `src/app/shells/SessionShell.tsx`, `SessionShell.module.css`, `ChildShell.tsx`;
- `src/features/session/`: `sessionContext.ts` (bağlam ve hook'lar), `SessionProvider.tsx`, `SessionRoot.tsx`, `SessionGuard.tsx`, `SessionLayout.tsx` (+ CSS), `ExitDialog.tsx` (+ CSS), `exitDialogState.ts`, `StatusScreen.tsx` (+ CSS), `pages.tsx` (sayfalar kendi dosyalarına geçtikçe silinir);
- `src/features/reading/useMicrophone.ts`, `useMicrophone.test.tsx`;
- `src/services/listener/types.ts` (M10), `src/test/setup.ts` (`<dialog>` yaması), `src/i18n/tr.ts`;
- `e2e/routes.spec.ts`, `e2e/no-external-requests.spec.ts`.

**Üretir:**

```ts
// sessionContext.ts — the context and its hooks (a .ts file: react-refresh forbids mixing them with a component)
export interface ListenerChoice { listener: ReadingListener; mark?: (mark: ManualMark) => void }
export interface SessionDevices {
  audio: AudioCapture;
  narrator: () => Promise<Narrator>;             // one per page
  recorder: Recorder;
  listener: (kind: 'warmup' | 'reading', attempt: Attempt) => ListenerChoice;
  scenario: { ghostWpm: number | null; layout: PageLayout };
  random: () => number;
}
export function useSession<T>(selector: (state: SessionState) => T): T;
export function useSessionStore(): StoreApi<SessionState>;
export function useSessionDevices(): SessionDevices;
// SessionProvider.tsx — the component only
export function SessionProvider(props: { store: StoreApi<SessionState>; devices: SessionDevices; children: ReactNode }): JSX.Element;
// exitDialogState.ts
export function useExitDialogOpen(): boolean;     // pages pause while it is open
// SessionLayout.tsx
export function SessionLayout(props: { title: string; chip?: ReactNode;
  companion: { expression: CompanionExpression; bubble?: ReactNode }; controls?: ReactNode; children: ReactNode }): JSX.Element;
// src/app/services.ts
export function appRepository(): Promise<Repository>;
export function sessionStoreServices(): SessionStoreServices;
export function sessionDevices(): SessionDevices;  // listener choice per karar 7, read once at start
```

**Yapı:**

- **Kök rota `SessionRoot`:** bütün ürün rotalarını sarar. Sağlayıcıyı ve mikrofon kuralını kurar: adres değişince `listeningPaths` dışındaysa `audio.stop()`.
- **`SessionGuard`:** seans rotalarını sarar.
  - Depo boşta → `load()`;
  - yüklenirken ya da hatada `StatusScreen`;
  - `noProfile` → boş (`TODO(phase 3)`);
  - aksi halde `sessionRedirect` → `<Navigate replace>`.
- **G1:** depo durumunu çocuk kabuğunda gösterir (Task 9).
- **Kabuk:**
  - Bölüm adı depodan gelir.
  - Kapat ve "Seanstan çık" pencereyi açar; G7'de doğrudan G1'e bağlantıdır.
  - "Seansa dön" ve `Esc` pencereyi kapatır, odak açan düğmeye döner.

**Adımlar:**

- [x] Ses denemesinin üretim paketine sızmasını önle (2a'nın `TODO(phase 2b)`):
  - **Kırmızı:** Yönlendirici ürün rotaları için `src/app/services.ts`'i içe aktarır. `pnpm build` → `grep -rl "gelistirme/yanki" dist` bir dosya bulur: `audioLabServices` yankı yolunu (`devEndpoints.echo`) ve `WebSocketEchoProbe`'u pakete taşır.
  - **Yeşil:** `audioLabServices`'i `src/app/devServices.ts`'e taşı; ses denemesi rotası onu tembel yükler. `pnpm build` → aynı arama 0 dosya.
  - Commit: `refactor(app): move the audio lab services into a developer module`.
- [x] **Kırmızı:**
  1. **`useMicrophone.test.tsx`:**
     - Ekran kapanınca `audio.stop` çağrılmaz (değişen test).
     - Onay geri alınınca kapanır.
     - Onay yokken `start()` `audio.start`'ı çağırmaz.
  2. **`SessionRoot` testi:**
     - `/seans/oku`'da `stop` yok;
     - `/seans/kayit`'a geçince bir kez `stop`;
     - aynı adreste yeniden çizimde `stop` yok;
     - `/seans/oku`'da StrictMode takılmasında `stop` yok.
  3. **`router.test.tsx`** (depoda hazır veri):
     - seans yokken `/seans/oku` → `/`;
     - `done` → `/seans/bitti`;
     - `read` iken `/seans/isinma` → `/seans/oku`.
  4. **`ExitDialog` testi:**
     - Kapat → "Seanstan çıkılsın mı?" penceresi;
     - "Seansa dön" kapatır;
     - "Çık" → `/`;
     - G7'de kapat bir bağlantıdır (`href` `/`).
  5. **`StatusScreen`:**
     - yüklenirken "Hazırlanıyor…" ve Tıkır;
     - `RepositoryUnavailableError` → "Bilgilerin açılamadı. Sayfayı yenileyip yeniden dene.".
- [x] İlgili testler → FAIL.
- [x] Uygula.
  - Kabuğun gövde CSS'i `SessionLayout`'a taşınır; `data-pane="main"` içerik sütununda kalır.
  - G2–G7'nin yer tutucu sayfaları Task 9–15'e kadar `SessionLayout` çizer: tasarımdaki başlık ("Isınma", "Dinle", "Oku", "Kayıt", "Kapanış", "Bugünlük bitti") ve o ekranın Tıkır'ı. Böylece kabuğun uçtan uca testleri (Tıkır görseli, iki bölme) geçmeye devam eder.
- [x] Uçtan uca testler:
  - `e2e/routes.spec.ts`:
    - seans adımlarını `?demo=cocuk-sabahi&adim=<adım>` ile açar;
    - kapatmanın pencereyi açtığını denetler;
    - iki bölme testi `/seans/oku?demo=cocuk-sabahi&adim=read-1` kullanır.
  - `e2e/no-external-requests.spec.ts`: "Seanstan çık" bağlantısını izleyen test seansı `?demo=cocuk-sabahi&adim=read-1` ile açar ve pencereden "Çık"la G1'e döner.

  Ardından `caffeinate -u -t 2; caffeinate -d -i pnpm e2e e2e/routes.spec.ts e2e/no-external-requests.spec.ts` → geçer.
- [x] → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(session): guard the session steps and confirm the exit`.

### Task 8: `pnpm shots` adımları

**Dosyalar:** `scripts/shotArgs.ts`, `scripts/shotArgs.test.ts`, `scripts/shots.ts`, `CLAUDE.md`.

**Üretir:**

```ts
export type ShotStep = { kind: 'tap'; name: string } | { kind: 'wait'; name: string } | { kind: 'advance'; ms: number };
export function parseShotArgs(args: readonly string[]): { steps: ShotStep[]; routes: string[] };
```

**Adımlar:**

- [ ] **Kırmızı:** `shotArgs.test.ts`:
  - `['--dokun','Kelimeyi dinle','--ileri','1200','/a','/b']` → iki adım, iki rota;
  - `--ileri abc` → hata;
  - `/` ile başlamayan rota → hata;
  - `--` yok sayılır.
- [ ] `pnpm test scripts/shotArgs.test.ts` → FAIL.
- [ ] Uygula. `shots.ts` (karar 22):
  - Chromium sahte mikrofon ve izinle açılır; bir başlangıç betiği sayfadan `speechSynthesis`'i kaldırır (karar 7);
  - `--ileri` varsa saat sayfa açılmadan kurulur ve durdurulur (`page.clock.install`, ardından `pauseAt`); `--ileri` adımı `runFor` çağırır;
  - `--dokun` adı `button`, `link`, `radio` ve `checkbox` rollerinde arar;
  - adımlar sırayla koşar;
  - ekran görüntüsü yazı tipleri yüklenince alınır.
- [ ] `pnpm shots /gelistirme/vitrin` eskisi gibi çalışır. CLAUDE.md komut satırı:
  `pnpm shots [--dokun <ad>] [--bekle <ad>] [--ileri <ms>] <rota> …`, adımların sırayla çalıştığı notuyla.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(shots): tap, wait and move the clock before a screenshot`.

### Task 9: G1 Yol

**Dosyalar:** `src/features/session/RoadPage.tsx`, `RoadPage.module.css`, `RoadPage.test.tsx`, `views.ts`, `views.test.ts`, `src/i18n/tr.ts`.

**Üretir:**

```ts
export interface RoadView {
  state: 'start' | 'resume' | 'done' | 'seriesEnd';
  childName: string; streak: number | null;                 // null below 2
  chapter: { number: number; title: string } | null;
  tomorrow: { number: number; title: string } | null;       // done today, and a next chapter exists
  completed: number; totalChapters: number; bookTitle: string;
  tiles: { chapter: number; state: TileState; pattern: TilePattern }[];
}
export function roadView(data: SessionData): RoadView;
```

**Adımlar:**

- [ ] **Kırmızı:**
  - **`views.test.ts` › `roadView`:**
    1. `cocuk-sabahi`, bugün `'2026-11-21'` → `start`, bölüm 4 "Dar Patika", seri 2, tamamlanan 3; karolar 1–3 `done`, 4 `today`, 5–12 `locked`.
    2. Süren seans → `resume`.
    3. Bugün bitti → `done`; yarın 5 "Yıldız Tepesi"; karo 4 `done`; `today` karosu yok.
    4. 5 bölümün hepsi tamam → `seriesEnd`.
    5. Seri 1 → `null`.
  - **`RoadPage.test.tsx`** (StrictMode):
    1. Başlangıç ekranı: "Merhaba Deniz", "2 gün üst üste", "Bugünkü bölüm", "Dar Patika", "4. bölüm, 12 dakika", "Başla", "Kayıp Fenerin İzinde", "12 bölümün 3’ü tamam". Balon "Bugün 4. bölümü okuyoruz: Dar Patika. Hazırsan başlayalım."; telefonda CSS ile gizli.
    2. "Başla":
       - seans yazılır;
       - `audio.start` dokunuşta bir kez çağrılır;
       - adres `/seans/isinma`.
    3. Onay yokken "Başla" `audio.start`'ı çağırmaz.
    4. `read` adımında süren seans: "Sürdür" → `/seans/oku`, `audio.start` çağrılır.
    5. Bugün bitti: "Bugünlük bitti", "Yarın: Yıldız Tepesi", "5. bölüm yarın açılır", "Bugünlük bu kadar. Yarın görüşürüz, Deniz."; "Başla" yok.
    6. Seri bitti: "Yeni bölümler yolda." ve "Kitaplık" (`/kitaplik`).
    7. Yüklenirken "Hazırlanıyor…".
- [ ] İki test dosyası → FAIL.
- [ ] Uygula. Düzen G1 HTML'inden: telefonda tek sütun, tablet ve webde iki sütun.
- [ ] `pnpm shots '/?demo=cocuk-sabahi'` → `design/png/G1-yol-*.png` ile karşılaştır; farkları "Tasarım karşılaştırması"na yaz, düzelt.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(session): build the road screen (G1)`.

### Task 10: G2 Isınma ve mikrofon sorunları

**Dosyalar:** `src/features/session/WarmupPage.tsx`, `WarmupPage.module.css`, `WarmupPage.test.tsx`, `SyllableTiles.tsx` (+ CSS), `MicrophoneProblem.tsx` (+ CSS), `useManualKeys.ts`, `src/services/keyboard.ts`, `keyboard.test.ts`, `src/i18n/tr.ts`.

**Üretir:**

```ts
// services/keyboard.ts — the page-wide key seam (document is off limits outside src/services)
export interface KeyPress { key: string; onControl: boolean; preventDefault(): void }   // onControl: focus is on a button, link or form field
export function onKeyDown(callback: (press: KeyPress) => void): Unsubscribe;
```

**Kullanır:** `useReading`, `useMicrophone`, `warmupItems`, `isWarmupCorrect`, `remainingToTame`, `narrationTiming`; sahte `FakeAudioCapture`, `FakeListener` (elle kip), `SilentNarrator`.

**Adımlar:**

- [ ] **Kırmızı:** `WarmupPage.test.tsx` (StrictMode, sahte zaman):
  1. **Tasarımdaki kart:**
     - "Canavar kelime 1 / 3", "kıvrılıyordu";
     - heceler `kıv rı lı yor du` ("Heceler" listesi);
     - zincir: "kıvrıl" ve "kıvrılıyor" onaylı, "kıvrılıyordu";
     - "Evcilleşmesine 2 doğru okuma kaldı", bir dolu nokta, "3 kelime";
     - balon "Önce hecele, sonra bir nefeste söyle.";
     - mikrofon "Dinliyor. Duraklatmak için dokun".
  2. **Doğru okuma** (elle `correct`) → "ağaçlarının" kartı; depoda ilk kart güncel.
  3. **İlk deneme yanlış** (`misread`):
     - `speakWord('kıvrılıyordu')` çağrılır;
     - 1200 ms'de üç hece okunmuş, "yor" o anki;
     - sonra ikinci deneme;
     - ikinci denemenin sonucu ne olursa olsun sıradaki kart;
     - kart bir kez `false` ile güncellenir.
  4. **3 sn duraksama** (`hesitate`): yardım seslendirmesi, ardından ikinci deneme.
  5. **"Kelimeyi dinle":** seslendirme boyunca dinleyiciden olay gelmez, sonra dinleme sürer.
  6. **Geçiş:**
     - son karttan sonra `/seans/dinle`;
     - 1. kartta "Dinle adımına geç" → `/seans/dinle`; 2. ve 3. kart değişmez.
  7. **Dinlemesiz** (onay yok):
     - mikrofon "Dinleme kapalı", `aria-disabled`;
     - `audio.start` hiç çağrılmaz;
     - balon dinlemesiz metni;
     - "Sıradaki kelime" → 2. kart; 3. kartta "Dinle adımına geç";
     - kartlar değişmez.
  8. **Mikrofon sorunları:**
     - `denied` → izin metni ve "Yeniden dene" (`audio.start` yeniden çağrılır);
     - `unavailable` ve `error` → kendi metinleri.
  9. **Kapalı mikrofon** (yenileme sonrası): "Duraklatıldı. Sürdürmek için dokun" → dokununca `audio.start`.
  10. **Elle kip tuşları:** Boşluk doğru, `E` yanlış işaretler; elle kip yoksa tuşlar bir şey yapmaz.
  11. **İkinci denemede yenileme:** İlk deneme yanlış yazılmış bir seansla açılan ekran Tıkır'a kelimeyi yeniden okutur, ikinci denemeyi başlatır ve kartı yeniden puanlamaz.
  - **`keyboard.test.ts`:** `onKeyDown` tuşu ve odağın bir denetimde olup olmadığını verir; aboneliği bırakınca çağrı gelmez.
- [ ] `pnpm test src/features/session/WarmupPage.test.tsx` ve `pnpm test src/services/keyboard.test.ts` → FAIL.
- [ ] Uygula.
- [ ] Görüntü: `pnpm shots --dokun "Duraklatıldı. Sürdürmek için dokun" --bekle "Dinliyor. Duraklatmak için dokun" --dokun "Kelimeyi dinle" --ileri 1200 '/seans/isinma?demo=cocuk-sabahi&adim=warmup'` → G2 ile karşılaştır, farkları yaz, düzelt.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(session): build the warmup screen (G2) and the microphone problems`.

### Task 11: G3 Dinle

**Dosyalar:** `src/features/session/ListenPage.tsx`, `ListenPage.module.css`, `ListenPage.test.tsx`, `format.ts`, `format.test.ts`, `src/i18n/tr.ts`.

**Üretir:** `formatClock(ms: number): string` (`m:ss`, aşağı yuvarlar).

**Adımlar:**

- [ ] **Kırmızı:**
  - **`format.test.ts`:** 0 → "0:00", 19 190 → "0:19", 47 000 → "0:47", 83 662 → "1:23".
  - **`ListenPage.test.tsx`** (StrictMode, `SilentNarrator`, sahte zaman, `design` düzeni):
    1. **Açılış:**
       - seslendirme başlar; "Tıkır okuyor";
       - "Kayıp Fenerin İzinde, 4. bölüm", "1 / 2";
       - 18 000 ms'de 6. ünite ("yukarıya kıvrılıyordu.") o anki;
       - "0:18 / 0:47".
    2. **"Sıra sende":**
       - son sayfa bitene kadar pasif, sonra etkin;
       - dokununca `audio.start` (onay varken), `finishListening`, adres `/seans/oku`.
    3. **Duraklatma:** düğmenin adı "Seslendirmeyi sürdür" olur; sürdürünce kaldığı üniteden devam eder.
    4. **"Baştan dinle":** sayfa 0, ünite 0; bir kez biten seslendirmede "Sıra sende" etkin kalır.
    5. **Hız:** "Normal" → seslendirici hızı ve okuyucunun `narrationRate`'i yazılır; sonraki açılış normal hızla.
    6. **Çıkış penceresi:** açıkken seslendirme durur, kapanınca sürer.
    7. **Onay yok:** "Sıra sende" `audio.start`'ı çağırmaz ama G4'e geçer.
- [ ] İki test dosyası → FAIL.
- [ ] Uygula.
- [ ] Görüntü: `pnpm shots --ileri 18000 '/seans/dinle?demo=cocuk-sabahi&adim=listen&senaryo=design'` → G3 ile karşılaştır, farkları yaz, düzelt.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(session): build the listen screen (G3)`.

### Task 12: G4 Oku

**Dosyalar:** `src/features/session/ReadPage.tsx`, `ReadPage.module.css`, `ReadPage.test.tsx`, `src/i18n/tr.ts`.

**Kullanır:** `useReading`, `useMicrophone`, `screenPages`, `screenPageOf`, `previousReading`, `ghostPace`, `ReadingText`, `RaceBar`, `MicrophoneProblem`, `useManualKeys`, klavye servisi (Task 10).

**Adımlar:**

- [ ] **Kırmızı:** `ReadPage.test.tsx` (StrictMode, sahte zaman, `FakeAudioCapture`, `SilentNarrator`):
  1. **Tasarımdaki an** (`design`, 2. okuma, hayalet dakikada 40). Yardım açılınca:
     - balon "Takıldın mı? Hecele: a-ğaç-la-rı-nın";
     - o anki 14, hayalet 12, işaretler 6 duraksama ve 9 hata;
     - "Süre 0:19", "Doğru 13", "Takılma 1";
     - "Dünkü senin 2 kelime önündesin.", "2. okuma / 3", "1 / 2";
     - Tıkır `talk`.
  2. **"opens the help at three seconds and saves the word as helped":**
     - seslendirme bitince 14 duraksama işaretli, konum 15;
     - balon gizli, Tıkır `listen`;
     - okuma bitince yazılan sonuçta 14 `helped`.
  3. **Okumalar** (`typical`):
     - 1. okuma biter → yazılır (`wcpm` 64);
     - "2. okuma / 3" yeni dinleyiciyle başlar;
     - 3. okumada `recorder.start` dinleyiciyle başlar, `stop` bitişte;
     - sonuç `recordingId` ile yazılır; adres `/seans/kayit`.
  4. **"never shows a race sentence when the child is behind or level":** hayalet önde, başa baş ya da yokken yarış cümlesi ve sayısı DOM'da yok.
  5. **Duraklatma:**
     - "Duraklat" saati dondurur, düğme "Sürdür" olur;
     - Boşluk aç-kapa yapar;
     - odak bir düğmedeyken Boşluk bir kez çalışır.
  6. **Mikrofon düğmesi:**
     - dinlerken dokunmak duraklatır, yeniden dokunmak sürdürür;
     - mikrofon kapalıyken dokunmak `audio.start` çağırır.
  7. **"Okumayı bitir":**
     - okuma o ana kadarki sonuçlarla yazılır, sıradaki başlar;
     - dinleyicinin bitişiyle aynı anda basılırsa tek okuma yazılır.
  8. **Yardım sırasında çıkış penceresi:** okuma duraklar; "Seansa dön" sonrası yardım biter, okuma sürer.
  9. **3. okuma sürerken ekran kapanır:**
     - dinleyici ve kayıt durur;
     - yarım kayıt silinir (`recorder.remove`);
     - okuma yazılmaz.

     **3. okumada mikrofon gidip gelir:** okuma donar, mikrofon dönünce sürer; bitince tek kayıt yazılır (karar 14).
  10. **Dinlemesiz:**
      - dinleyici başlamaz, `audio.start` hiç çağrılmaz;
      - bütün bölüm tek kartta, okunmuş renkte;
      - yarış, sayaç ve "Duraklat" yok; balon dinlemesiz metni;
      - üç "Okumayı bitir" → `/seans/kapanis`.
  11. **Mikrofon sorunu:** `denied` → izin metni ve "Yeniden dene"; dinleyici başlamaz.
  12. **Sayfa çevirme** (`typical`, içerik düzeni): 25. kelimede (indeks 25) sayaç "2 / 6".
  13. **Elle kip:** Boşluk kelimeyi doğru işaretler ve duraklatmaz.
- [ ] `pnpm test src/features/session/ReadPage.test.tsx` → FAIL.
- [ ] Uygula.
- [ ] Görüntü: `pnpm shots --dokun "Duraklatıldı. Sürdürmek için dokun" --bekle "Dinliyor. Duraklatmak için dokun" --ileri 19300 '/seans/oku?demo=cocuk-sabahi&adim=read-2&senaryo=design'` → G4 ile karşılaştır, farkları yaz, düzelt. Telefondaki 45 kelimelik birleşik sayfa (2a, karar 3) farka yazılır.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(session): build the reading screen (G4)`.

### Task 13: G5 Kayıt

**Dosyalar:** `src/features/session/RecordPage.tsx`, `RecordPage.module.css`, `RecordPage.test.tsx`, `Waveform.tsx` (+ CSS), `waveform.ts`, `waveform.test.ts`, `src/i18n/tr.ts`.

**Üretir:** `waveformBars(levels: readonly number[], count: number): number[]` (her grubun en yükseği).

**Adımlar:**

- [ ] **Kırmızı:**
  - **`waveform.test.ts`:**
    - 64 düzey → 36 ve 26 çubuk; her çubuk kendi grubunun en yükseği;
    - 0 düzey → hepsi 0.
  - **`RecordPage.test.tsx`** (StrictMode; `prepareSessionStep(…, 'record', 'typical', …)` ile hazırlanmış depo):
    1. **İçerik:**
       - "Kayıt bitti", "0:52", "Dar Patika, 3. okuma", "Sesli kitabına eklendi";
       - "12 bölümün 1’i kayıtlı" ve "Kayıtlı bölümler: 12 bölümün 1’i" (4. kare dolu);
       - balon "Bu, bugünkü en akıcı okuman oldu." (71 > 64 ve 68), Tıkır `happy`.
    2. **Nötr yorum:** 3. okumanın `wcpm`'i en yüksek değilse "Kaydın hazır.".
    3. **Çalma:**
       - "Kaydı dinle" → `recorder.play(id)`, düğme "Duraklat";
       - 23 sn'de çubukların %44'ü safran;
       - dokununca `stopPlayback`.
    4. **Gönder:**
       - `requestApproval(id)`; düğme pasif, "Veli onayı bekliyor";
       - yeniden açılışta aynı.
    5. **"Baştan kaydet":** `audio.start`, `redoRecording`, adres `/seans/oku`; G4'te "3. okuma / 3".
    6. **"Devam et":** `finishRecording`, adres `/seans/kapanis`.
    7. **Kayıt yok:** hata cümlesi görünür; iki düğme çalışır.
- [ ] İki test dosyası → FAIL.
- [ ] Uygula.
- [ ] Görüntü: `pnpm shots --dokun "Kaydı dinle" --ileri 23000 '/seans/kayit?demo=cocuk-sabahi&adim=record'` → G5 ile karşılaştır, farkları yaz, düzelt.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(session): build the recording screen (G5)`.

### Task 14: G6 Kapanış sorusu

**Dosyalar:** `src/features/session/WrapUpPage.tsx`, `WrapUpPage.module.css`, `WrapUpPage.test.tsx`, `TextLayer.tsx` (+ CSS), `src/i18n/tr.ts`.

**Adımlar:**

- [ ] **Kırmızı:** `WrapUpPage.test.tsx` (StrictMode, sabit `random`):
  1. **İçerik:**
     - "Kapanış", "2 soru", "Soru 1 / 2", soru;
     - üç seçenek gerçek `radio`, sırası `random`'dan;
     - balon "Emin değilsen metne geri dönebilirsin.";
     - "Cevabı gönder" seçim yapılana kadar pasif.
  2. **Doğru cevap** → "Soru 2 / 2"; yanıtlar `[0]`.
  3. **Yanlış cevap:**
     - doğru seçenekte "Doğru cevap" ve onay işareti;
     - balon "Doğru cevabı işaretledim."; düğme "Devam et";
     - ekranda "yanlış" sözü yok;
     - "Devam et" → sıradaki soru.
  4. **Bitiş:** iki yanıt → seans `done`, adres `/seans/bitti`.
  5. **Yenileme:** son yanıt yazılı, adım `wrapUp` → ekran açılınca seans biter, `/seans/bitti`.
  6. **"Metne geri dön":**
     - bölümün bütün kelimeleriyle pencere açılır;
     - "Kapat" kapatır; seans değişmez.
  7. **Karışma:** farklı `random` farklı sıra verir; yanıt içerikteki sırayla yazılır.
- [ ] `pnpm test src/features/session/WrapUpPage.test.tsx` → FAIL.
- [ ] Uygula.
- [ ] Görüntü: `pnpm shots --dokun "Tepenin ardında" '/seans/kapanis?demo=cocuk-sabahi&adim=wrapUp'` → G6 ile karşılaştır, farkları yaz, düzelt. Seçenek sırası farka yazılır.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(session): build the wrap-up questions (G6)`.

### Task 15: G7 Bugünlük bitti

**Dosyalar:** `src/features/session/DonePage.tsx`, `DonePage.module.css`, `DonePage.test.tsx`, `views.ts` (`doneView`), `views.test.ts`, `src/i18n/tr.ts`.

**Üretir:**

```ts
export interface DoneView {
  minutes: number; wcpm: number | null; delta: number | null;
  tamed: string[]; tomorrow: { number: number; title: string } | null; childName: string;
}
export function doneView(data: SessionData): DoneView;
```

**Adımlar:**

- [ ] **Kırmızı:**
  - **`views.test.ts` › `doneView`:**
    1. `typical` ile biten seans → dakika 12, `wcpm` 71, fark 4, evcil `['ağaçlarının']`, yarın 5.
    2. Fark sıfır, eksi ya da önceki yok → `null`.
    3. Dinlemesiz → `wcpm` ve fark `null`, evcil boş.
    4. 5. bölüm → yarın `null`.
  - **`DonePage.test.tsx`** (StrictMode):
    1. **İçerik:**
       - "Bugünlük bitti", "12 dakika", "71", "doğru kelime", "bir dakikada", "Dünkü senden 4 fazla";
       - "Evcilleşen kelimeler" listesinde "ağaçlarının" ve "evcilleşti";
       - "Yarın: Yıldız Tepesi", "5. bölüm yarın açılır", "Seansın özeti veline gitti.";
       - balon "Bugünlük bu kadar. Yarın görüşürüz, Deniz.", Tıkır `sleep`.
    2. **"shows the gain over the previous session only when it is positive":** fark sıfır ya da eksiyken DOM'da ne "fazla" ne bir sayı var.
    3. **Dinlemesiz:** büyük sayı ve fark yok.
    4. **Seri bitti:** "Yeni bölümler yolda.".
    5. **Kapatma:** "Kapat" → `/`; kabuğun kapat düğmesi pencere açmaz.
- [ ] İki test dosyası → FAIL.
- [ ] Uygula.
- [ ] Görüntü: `pnpm shots '/seans/bitti?demo=cocuk-sabahi&adim=done'` → G7 ile karşılaştır, farkları yaz, düzelt.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(session): build the done screen (G7)`.

### Task 16: Albüm ve Stüdyo

**Dosyalar:** `src/features/session/AlbumPage.tsx`, `StudioPage.tsx` (+ CSS ve testler), `src/i18n/tr.ts`.

**Adımlar:**

- [ ] **Kırmızı:**
  1. **Albüm:**
     - `veli-haftasonu` → "ağaçlarının" ve "kıvrılıyordu" (alfabe sırasıyla) ve "evcilleşti";
     - `cocuk-sabahi` → "Evcilleşen kelimelerin burada toplanır." ve "Yola dön" (`/`).
  2. **Stüdyo:**
     - `record`'a kadar hazırlanmış depo → "Dar Patika, 3. okuma", "0:52"; "Kaydı dinle" → `play`, "Duraklat" → `stopPlayback`;
     - kayıt yok → "Kaydettiğin bölümler burada sesli kitabın olur." ve "Yola dön".
- [ ] Test dosyaları → FAIL.
- [ ] Uygula. Tasarım sistemi bileşenleriyle (`Card`, `Monster`, `IconButton`); `TODO(design)`.
- [ ] Görüntü: `pnpm shots '/album?demo=veli-haftasonu' '/studyo?demo=cocuk-sabahi&adim=done'`. Tasarımı yok; üç genişlikte taşma ve kırpılma yok.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(session): add the minimal album and studio screens`.

### Task 17: Uçtan uca seans testleri

**Dosyalar:** `e2e/support/session.ts`, `e2e/session.spec.ts`, `e2e/session-design.spec.ts`, `e2e/session-consent.spec.ts`, `e2e/no-external-requests.spec.ts`.

**Yardımcılar** (`support/session.ts`):

- saati sabit bir güne kurup durdurmak (`page.clock.install`, `pauseAt`) ve `runFor` ile ilerletmek;
- sayfadan `speechSynthesis`'i kaldıran başlangıç betiği (karar 7);
- WebKit'e mikrofon izni vermek;
- `getUserMedia` çağrılarını saymak;
- IndexedDB'den seansı ve kartları okumak (`page.evaluate`).

**Adımlar:**

- [ ] **Kırmızı** (Chromium ve WebKit):
  1. **`session.spec.ts` › "a typical session runs from G1 to G7 with the demo profile's numbers"** (ölçüt 1, 5, 6):
     - `/?demo=cocuk-sabahi`.
     - **G1:** "Dar Patika", "4. bölüm, 12 dakika", "12 bölümün 3’ü tamam", "2 gün üst üste".
     - **G2:** "Başla" → kartlar sırasıyla kıvrılıyordu, ağaçlarının, belirdiğinde; ilk kartta "Evcilleşmesine 2 doğru okuma kaldı". Saat ilerler.
     - **G3:** Saat ilerler. Burada yenileme → yine G3.
     - **G4:**
       - "Sıra sende"; üç okuma, saat ilerledikçe;
       - 2. okumada yenileme → "2. okuma / 3", mikrofon düğmesine dokununca sürer.
     - **G5:** "Devam et".
     - **G6:** iki doğru yanıt.
     - **G7:** "71", "Dünkü senden 4 fazla".
     - **"Kapat" → G1:** "Bugünlük bitti".
     - **Depo:** seans `done`, 3 okuma; kartlarda "arasından", "soluk", "rüzgârı".
  2. **"the third reading is recorded, played and recorded again"** (ölçüt 4):
     - `/seans/kayit?demo=cocuk-sabahi&adim=record` → "0:52";
     - "Kaydı dinle" → "Duraklat" → dokun → "Kaydı dinle";
     - "Baştan kaydet" → "3. okuma / 3"; saat ilerler → G5;
     - depoda 3. okumanın kayıt kimliği değişmiş, eski kayıt silinmiş.
  3. **"the next day opens the next chapter with yesterday's words and the ghost"** (ölçüt 7):
     - `/?demo=cocuk-sabahi&adim=done` → saat bir gün ileri → yenile;
     - G1 "Yıldız Tepesi", "5. bölüm, 12 dakika";
     - "Başla" → G2'de "tırmanmaya", "arasından", "rüzgârı";
     - "Dinle adımına geç" → G3; saat ilerler → "Sıra sende";
     - G4'te "dün" imleci görünür.
  4. **`session-design.spec.ts` › "the design scenario reaches the G4 moment"** (ölçüt 2, 3):
     - `/seans/oku?demo=cocuk-sabahi&adim=read-2&senaryo=design`; mikrofona dokun; saat 19 300 ms ilerler.
     - Bu anda:
       - `data-current` 14, `data-ghost` 12, `data-mark` 6 `hesitation`, 9 `error`;
       - "Süre 0:19", "Doğru 13", "Takılma 1";
       - "Takıldın mı? Hecele: a-ğaç-la-rı-nın", "Dünkü senin 2 kelime önündesin.".
     - Saat 3000 ms ilerler → 14 `hesitation`, balon gizli.
  5. **`session-consent.spec.ts` › "without the parent's consent the session runs unheard and never opens the microphone"** (ölçüt 8):
     - `getUserMedia` sayılır; `/?demo=cocuk-sabahi&onay=kapali`.
     - G1 "Başla"; G2'de iki kez "Sıradaki kelime" ve "Dinle adımına geç".
     - G3 saati ilerler, "Sıra sende".
     - G4'te üç kez "Okumayı bitir".
     - G6'da iki yanıt; G7'de "71" yok.
     - `getUserMedia` 0 kez çağrıldı.
  6. **`no-external-requests.spec.ts`:** `/seans/oku?demo=cocuk-sabahi&adim=read-1`'de mikrofon açık bir okuma boyunca dış istek yok.
- [ ] `caffeinate -u -t 2; caffeinate -d -i pnpm e2e e2e/session.spec.ts e2e/session-design.spec.ts e2e/session-consent.spec.ts e2e/no-external-requests.spec.ts` → geçer.
- [ ] `pnpm check` → geçer.
- [ ] Commit: `test(e2e): run the daily session end to end`.

### Task 18: Belgeler, tasarım karşılaştırması ve denetim

**Dosyalar:** `docs/mimari.md`, `docs/dinleme-hatti.md`, `docs/ekranlar.md`, `docs/kararlar.md`, bu plan ("Tasarım karşılaştırması", "Kanıtlar").

- [ ] **`docs/mimari.md`:**
  - seans durum makinesi ve depo (Zustand), yeni alanlar;
  - `SessionProvider` ve servis seçimi;
  - mikrofon kuralı;
  - geliştirme adres parametrelerinin son hali;
  - `pnpm shots` adımları;
  - uçtan uca testlerde saat;
  - `features/session/paths.ts`.
- [ ] **`docs/dinleme-hatti.md`:**
  - dinlemesiz seans (bölüm 1);
  - elle kipin tuşları ve `&senaryo=elle` (bölüm 3);
  - seslendirmenin geri dönüşü.
- [ ] **`docs/ekranlar.md`:**
  - G1 balonu (D13);
  - G2'de hece karoları ve zincir;
  - G5'te dalga biçimi;
  - G6'nın yanlış cevabı (D14, C7);
  - dinlemesiz seans ve tasarımı olmayan durumların metinlerine gönderme.
- [ ] **`docs/kararlar.md`:**
  - "Tasarımdaki örnek veri tutarsızlıkları"na yeni maddeler: G5 "4’ü kayıtlı", G3'teki an (0:21);
  - değişiklik günlüğüne 2b satırı.
- [ ] **Tasarım karşılaştırması:**
  - G1–G7'nin üç genişlikteki görüntüleri bu plandaki komutlarla yeniden alınır;
  - her ekranın fark listesi tamamlanır (ölçüt 10).
- [ ] **Denetim:**
  - `pnpm check`;
  - `pnpm build`; `dist/` içinde şu dizgiler 0 dosyada:
    - `demo-profil`, `veli@example.com`, `Demo profili`, `Kuruluyor`, `gelistirme`, `fake-indexeddb`;
    - `tikir.gelistirme.dinleyici`;
    - ses denemesinin iki metni.

    `FakeListener` ve senaryolar artık beklenir (karar 7).
  - `caffeinate -u -t 2; caffeinate -d -i pnpm e2e`.

  Çıktılar "Kanıtlar"a yazılır. "Ölçütler ve kanıtları" tablosundaki test adları doğrulanır.
- [ ] Commit: `docs: record phase 2b decisions and evidence`.

Sonra bütün dal bağımsız bir incelemeden geçer (executing-plans → "Final Review"). Düzeltmeler tek geçişte yapılır.

## Tasarım karşılaştırması

Görüntü komutları (her biri 390, 1180 ve 1440 px yazar):

| Ekran | Komut |
|---|---|
| G1 | `pnpm shots '/?demo=cocuk-sabahi'` |
| G2 | `pnpm shots --dokun "Duraklatıldı. Sürdürmek için dokun" --bekle "Dinliyor. Duraklatmak için dokun" --dokun "Kelimeyi dinle" --ileri 1200 '/seans/isinma?demo=cocuk-sabahi&adim=warmup'` |
| G3 | `pnpm shots --ileri 18000 '/seans/dinle?demo=cocuk-sabahi&adim=listen&senaryo=design'` |
| G4 | `pnpm shots --dokun "Duraklatıldı. Sürdürmek için dokun" --bekle "Dinliyor. Duraklatmak için dokun" --ileri 19300 '/seans/oku?demo=cocuk-sabahi&adim=read-2&senaryo=design'` |
| G5 | `pnpm shots --dokun "Kaydı dinle" --ileri 23000 '/seans/kayit?demo=cocuk-sabahi&adim=record'` |
| G6 | `pnpm shots --dokun "Tepenin ardında" '/seans/kapanis?demo=cocuk-sabahi&adim=wrapUp'` |
| G7 | `pnpm shots '/seans/bitti?demo=cocuk-sabahi&adim=done'` |

Önceden bilinen farklar (kural geçerlidir; `docs/kararlar.md` → "Tasarımdaki örnek veri tutarsızlıkları"):

| Ekran | Fark | Neden |
|---|---|---|
| G1 | "2 gün üst üste" (tasarımda 4) | tutarsızlık 3 |
| G1 | balonda D13 kalıbı | yanıt 2 |
| G3 | an 0:18'de alınır, tasarım 0:21 der. Bizim zamanlamamızda 0:21'de 8. ünite okunur. Telefon tasarımı aynı anda başka bir üniteyi ("Dar patika,") vurgular. | tasarımın süresi ile vurgusu birbirine uymuyor |
| G4 telefon | "1 / 2" sayfası 45 kelimenin hepsini gösterir; tasarım yalnız 1. içerik sayfasını | 2a, karar 3 |
| G5 | "12 bölümün 1’i kayıtlı" (tasarımda 4’ü) | demo profilinin eski seanslarında ses yok |
| G6 | seçenek sırası karışık | `docs/ekranlar.md`: her gösterimde karışır |
| G7 | yalnız "ağaçlarının" evcilleşir | tutarsızlık 2 |

Uygulama sırasında her ekranın fark listesi buraya eklenir.

## Açık sorular (onayı beklemez)

1. **C6:** Bölümlerin G1 giriş cümleleri. İçerik yazarı yazarsa D13 kalıbının yerine geçer.
2. **C7:** Her sorunun cevabının metindeki cümlesi. Gelince G6'da vurgulanır.
3. **Dinlemesiz seansın tasarımı:** Faz 3'te K1'in onaysız yoluyla birlikte ele alınır.
4. **G2'de hece karoları:** Gerçek dinleyici (Faz 6) hece zamanı verirse çocuğun okumasını izleyebilir.
5. **iPhone:** Yardım seslendirmesi sırasında açık mikrofon ve dokunuşsuz başlayan G3 seslendirmesi cihaz denemesinde bakılır.

## Kanıtlar

Uygulama sırasında doldurulur.

## Uygulamada verilen kararlar

Uygulama sırasında doldurulur.
