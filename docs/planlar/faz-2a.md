# Faz 2a planı: Alan mantığı, servisler ve okuma motoru

> Durum: onaylandı (2026-11-20). Uygulama `faz-2a` dalında, bu oturumda yürür (superpowers:executing-plans); sonunda bütün dal bağımsız bir incelemeden geçer. Adımlar `- [ ]` kutularıyla izlenir. Her görevin sonunda `pnpm check` çalışır; geçerse görevin kutuları işaretlenir ve aynı commit'e girer. Dalın birleştirilmesi ve push ürün sahibinin kararıdır.

**Amaç:** Günlük seansın ekransız katmanlarını kurmak. Kapsam:

- alan kuralları: puanlama, canavar kelimeler, hayalet, hedefler ve ilerleme;
- servisler: sahte dinleyici, seslendirme, depo ve kayıt;
- okuma motoru: dinleyiciyi, seslendirmeyi ve hayaleti Faz 0'ın okuma bileşenlerine bağlar;
- demo profili yükleyicisi.

2b bunların üstüne ekranları ve akışı kurar.

**Mimari:** Saf kurallar `src/domain` içinde, tarihi parametre olarak alır. Servisler `src/services` altında bir arayüz ve uygulamalardan oluşur; tarayıcıya bir dikiş (seam) üzerinden dokunur, testlerde sahtesi verilir. Okuma motoru `src/features/reading` içindeki saf bir durum indirgeyicisi ve üç hook'tur; ekran yoktur. Bağımlılık yönü `features` → `services` → `domain`.

**Kaynak belgeler:**

- `docs/yol-haritasi.md` (Faz 2);
- `docs/urun.md` bölüm 2–5 ve 9;
- `docs/ekranlar.md` → "Günlük seans" ve "Tasarımı olmayan durumlar";
- `docs/dinleme-hatti.md` bölüm 1–3;
- `docs/mimari.md`: alan mantığı, tipler, servisler, zaman, seans durum makinesi, depolama;
- `docs/kararlar.md`: P5–P7, T4, T5, T8, T9, T12, T15, D6 ve yanıtlanan 12. ve 14. sorular;
- `seed/README.md` ve `seed/demo-profil.json` (`expected`).

**Yığın:** Faz 1 yığını. Yeni paketler:

- `idb`: IndexedDB sarmalayıcısı; `docs/mimari.md` adını zaten veriyor.
- `fake-indexeddb`: geliştirme bağımlılığı; Vitest'te IndexedDB sağlar.

Sürümlere kurulum anında bakılır. Zustand 2b'de gelir.

**Kapsam dışı (2b'ye kalır):**

- seans durum makinesi ve deposu (Zustand);
- G1–G7 ekranları, Albüm ve Stüdyo;
- tasarımı olmayan durumlar: izin reddi, çıkış onayı, bugün bitti;
- geliştirme adres parametreleri (`?demo=`, `&adim=`, `&senaryo=`) ve profil yokken kendiliğinden yükleme;
- `pnpm shots` ile seans adımlarının görüntüsü;
- elle kipin klavye bağlantısı;
- yol haritasındaki 10 kabul ölçütünün uçtan uca kanıtı.

## Görev listesi

- [x] Task 0: Plan dosyası, dal ve yanıtlanan sorular
- [x] Task 1: Alan tipleri, ürün parametreleri ve takvim günü
- [x] Task 2: Rakamların okunuşu ve bölümün kelimeleri
- [x] Task 3: Puanlama
- [x] Task 4: Canavar kelimeler
- [x] Task 5: Hayalet, hedefler ve ilerleme
- [x] Task 6: Okuma benzetimi ve hazır senaryolar
- [ ] Task 7: Dinleyici yalıtımı ve Faz 1'den kalan bulgular
- [ ] Task 8: `ReadingListener` ve `FakeListener`
- [ ] Task 9: Seslendirme
- [ ] Task 10: Depo
- [ ] Task 11: Kayıt
- [ ] Task 12: Demo profili yükleyicisi ve vitrin düğmeleri
- [ ] Task 13: Sayfalar, okuma durumu ve mikrofon kapısı
- [ ] Task 14: `useReading` ve `useNarration`
- [ ] Task 15: Belgeler ve 2a'nın denetimi

## Onaylanan kararlar

1. **Bölünme.** 2a ekransız her şeyi kurar ve birim testleriyle kanıtlar. 2b ekranları, akışı ve uçtan uca kabulü yapar. Yol haritası ölçütlerinden 2a'ya düşen pay aşağıdaki "2a'nın ölçütlere katkısı" tablosunda.

2. **Rakamlar okunuşlarıyla eşlenir** (soru 14; ürün sahibi, 2026-11-19).
   - Rakam dizisi kendi kelimesidir. Ekranda yazıldığı gibi görünür, beklenen söyleyişi Türkçe okunuşudur: "3" → "üç", "1923" → "bin dokuz yüz yirmi üç".
   - Kesme işaretli ek okunuşa eklenir: "100’ü" → "yüzü".
   - Ardından nokta ve küçük harfle başlayan kelime geliyorsa sıra sayısıdır: "3. sınıf" → "üçüncü".
   - Okunuşu birden çok kelime olsa da yazılı sayı **tek kelime** sayılır. Bu, `wcpm`, okunabilirlik ve dinleyicinin beklediği dizi için geçerlidir. Hecesi okunuşundan sayılır.
   - Ondalık, yüzde, saat ve binlik ayracı ("3,5", "%50", "10.30", "1.000") bu fazda yok: her rakam grubu ayrı bir sayı olarak okunur. Çocuk içeriğinde bunların hiçbiri yok. Ne zaman gerektiği açık sorulardadır.
   - Bedeli: bu biçimler Faz 5'te velinin yapıştırdığı metinde yanlış seslendirilir.

3. **`design` senaryosunda sayfalar tasarımı izler** (soru 12; ürün sahibi, 2026-11-19).
   - Bu senaryoda G3 ve G4, içeriğin 1. ve 2. sayfasını tek sayfa olarak gösterir ("1 / 2"). Kalan sayfalar ikinci sayfadır.
   - Öteki senaryolarda her içerik sayfası bir sayfadır ("1 / 6").
   - Tutarlılık denetimi: G3 tasarımındaki "0:47", aşağıda karar 11'deki seslendirme süresiyle bu birleşik sayfanın süresine birebir denk gelir.
   - Telefon tasarımı aynı "1 / 2" sayacının altında yalnız 1. sayfayı gösteriyor. 45 kelimenin telefondaki görünümü 2b'nin ekran karşılaştırmasında fark olarak yazılır.

4. **Hazır senaryolar** (`docs/dinleme-hatti.md` bölüm 3):
   - **`smooth`:** hatasız; 80, 84, 88.
   - **`typical`:** demo profilindeki 0. günün okumalarıdır. Böylece tek kaynak `seed/` olur ve bir test bunu denetler. Bir uyumsuzluk var: belge "2 hata, 1 duraksama" diyor, seed'deki okumalar ise şöyle:

     | Okuma | `wcpm` | Ne olur |
     |---|---|---|
     | 1 | 64 | 15. kelimede ek hatası, 35'te tekrar, 40'ta atlama |
     | 2 | 68 | 9. kelimede yanlış okuma, 6'da 1,8 sn duraksama |
     | 3 | 71 | hatasız |

   - **`struggling`:** her okumada aynı yerler.
     - Hatalar: 4. kelimede yanlış okuma, 12'de ek hatası, 20'de atlama, 31'de yanlış okuma, 45'te ek hatası.
     - Duraksamalar: 8, 26 ve 52. kelimede 3,5 sn. Bunlar 3 saniyede yardımı açar.
     - `wcpm` 42, 46, 50.
     - Bu yerler test verisidir, çocuk içeriği değildir.
   - **`design`:**
     - 1. ve 3. okuma `typical` ile aynıdır.
     - 2. okuma dakikada 50 kelime. "kulaklarını"da (6) 1,8 sn duraksama, "rüzgârı"da (9) yanlış okuma, "ağaçlarının"da (14) 3 sn duraksama ve yardım. Hayaletin temposu dakikada 40 kelimeye sabit.
     - Hesap: yardım balonu okumanın 19,19. saniyesinde açılır. O an ekranda "Süre 0:19", "Doğru 13", "Takılma 1" görünür; hayalet "patika"dadır (12) ve çocuk 2 kelime öndedir. Bunlar tasarımdaki değerlerin aynısı.
   - Yazılı olmayan yerler, metinden uzun bölümlerde ve tek kelimelik ısınmada yok sayılır.

5. **Yardım akışı.**
   - Senaryoda 3000 ms ve üstü duraksama, yardımın tam 3000. ms'de açılması demektir.
   - Arayüz `help(i)` çağırınca dinleyici durur. Kelime seslendirilir. Arayüz `resume()` çağırınca kelimenin sonucu (`helped`) ve yeni konum gelir.
   - Tasarımda balon açıkken "Takılma 1" yazması bunu gerektiriyor: yardım alınan kelime, seslendirme bitince sayılır.
   - Seslendirme ve duraklatma süresince okuma saati ve hayalet durur.
   - Yardım alınan kelimeye okuma süresi verilmez.

6. **Çocuğa gösterilen işaretler.**
   - Yanlış okuma, ek hatası ve atlama dalgalı mercan çizgi alır.
   - 1 saniye ve üstü duraksama ile yardım noktalı kehribar çizgi alır.
   - Tekrar, ekleme ve kendini düzeltme çocuğa işaretlenmez; yalnız veli karnesinde görünür (`docs/urun.md` bölüm 2).
   - "Takılma" sayacı = noktalı çizgi alan kelimeler.

7. **Canavar kelimeler.**
   - **Kart ve gösterim:**
     - Kartın anahtarı kelimenin Türkçe küçük harfli halidir.
     - Gösterilen biçim metindeki gibidir; küçük harfli bir geçişi görülürse o kullanılır. Böylece cümle başındaki "Gökyüzünde" ile "gökyüzünde" tek kart olur, özel adlar bozulmaz.
     - Aynı kelime bir okumada birden çok kez takılsa da o okumada bir kez sayılır.
   - **Metindeki takılma:**
     - Vahşi ya da çalışılan kartta: sayaç artar, seri sıfırlanır, kart yarına döner. Zaten daha önce günü gelmişse o gün kalır.
     - Evcilleşmiş kart evcil kalır; yalnız sayacı artar. Albüm hiçbir zaman kelime kaybetmez (`docs/urun.md` bölüm 4, kural 7 ve 8). Bedeli: geri gelen bir kelime yeniden çalışılmaz, ama veli karnesinde görünür.
   - **Isınma:**
     - İlk deneme sayılır. Tıkır'ın seslendirmesinden sonraki ikinci deneme, doğru da olsa seriyi ilerletmez.
     - Günü gelen kart yokken metinden seçilen kelimeler kart olmaz.
     - O seçim: harf sayısına göre en uzun üç farklı kelime; eşitlikte Türkçe alfabe sırası. 4. bölümde "belirdiğinde", "Karşılarında", "kıvrılıyordu" çıkar.

8. **Hayalet.**
   - Kaynak: bugünden önceki, aynı sıradaki okumayı içeren en son seans.
   - Tempo: o okumanın dakikada denenen kelime sayısı.
   - Konum: tempo × durmadan geçen süre, aşağı yuvarlanır, metnin sonunda durur.
   - Yarış farkı yalnız artıysa verilir.

9. **G1 ve G7 kuralları alan mantığına girer** (yeni modül `src/domain/progress.ts`):
   - üst üste gün;
   - bugünün bölümü: son tamamlanan seri bölümü + 1 (kitaplıktan kitap okunan gün seriyi ilerletmez);
   - hazır bölümler bittiğinde `null` döner;
   - yol haritası karolarının durumu;
   - bir önceki seansın üçüncü okumasıyla fark (yalnız artıysa).

   `docs/mimari.md`'nin modül tablosuna eklenir.

10. **Kayıt `PcmRecorder` ile yapılır, `MediaRecorderRecorder` ile değil.**
    - Yöntem: Ses, `AudioCapture` çerçevelerinden 16 kHz WAV'a çevrilir. IndexedDB'de `ArrayBuffer` olarak durur ve Faz 1'in `WavPlayer`'ıyla çalınır.
    - Gerekçe: `AudioCapture` akışı değil çerçeveyi verir. CSP'ye `media-src` gerekmez. Yol Faz 1'de gerçek cihaz denemesine hazırlandı.
    - Boyut: saniyede 32 KB, iki dakikalık okuma 3,8 MB.
    - Sınır ve dalga biçimi: kayıt en çok 5 dakika. G5'teki dalga biçimi için 64 düzey kayıtla birlikte saklanır.
    - `docs/kararlar.md` → T21.

11. **Seslendirme.**
    - **Seçim:** Türkçe ses varsa `SpeechSynthesisNarrator` kullanılır, yoksa `SilentNarrator` (T8).
    - **Konuşma:**
      - Her anlam ünitesi ayrı bir konuşmadır.
      - Duraklatma, konuşmayı iptal edip o üniteden yeniden başlatır, çünkü `speechSynthesis.pause()` Android'de güvenilir değil.
      - 1500 ms içinde başlamayan ya da hata veren ünite sessiz zamanlamayla geçer; G3 hiçbir koşulda takılı kalmaz.
    - **Sessiz zamanlama:** G3 tasarımından ayarlandı.

      | Hız | Hece hızı |
      |---|---|
      | Yavaş | saniyede 2,8 hece |
      | Normal | saniyede 3,5 hece |

      Her üniteden sonra 250 ms ara verilir. Böylece 4. bölümün birleşik 1–2. sayfası yavaşta tam 47,0 sn sürer.
    - **Konuşma hızı:** yavaş 0,85, normal 1.
    - **Arayüz değişikliği** (`docs/mimari.md` güncellenir): `speakPage` ve `speakWord` `'completed' | 'stopped'` döndürür, çünkü G3 seslendirmenin en az bir kez bittiğini bilmeli. `estimateSeconds(page)` G3'ün süre göstergesi için eklenir.

12. **Depo.**
    - Paketler: `idb`; testlerde `fake-indexeddb`.
    - Şema: sürüm 1, tek yerde (`src/services/repository/db.ts`).
    - Seanslar tarih anahtarıyla saklanır: günde bir seans (P5).
    - Kelime kartları bütün olarak yazılır.
    - İçerik (seri kitap ve ölçüm metinleri) ilk açılışta, `meta` içindeki içerik sürümüne bakılarak yüklenir. `clearAll()` kullanıcı verisini siler, içeriği yeniden yükler.
    - IndexedDB yoksa ya da açılamazsa `RepositoryUnavailableError` fırlatılır.
    - Kimlikler `crypto.getRandomValues` ile üretilir, çünkü `randomUUID` güvenli olmayan bağlamda yok.

13. **Demo profili yükleyicisi** (`src/features/dev/demo/`, yalnız geliştirme).
    - İş: depoyu temizler, kipi kurar.
    - Okumalar ve ölçümler sahte dinleyicinin benzetiminden geçer. Her ölçümün çıkan `wcpm` değeri seed'dekine eşit değilse yükleme hata verir.
    - Arayüz: `/gelistirme/vitrin` sayfasında bir "Demo profili" bölümü. İki düğme ve depodaki kayıt sayıları; metinler aşağıda.

14. **Sahte dinleyici mikrofona bağlıdır.**
    - `start()` mikrofon dinlemiyorsa hata fırlatır.
    - Mikrofon dinlemeyi bırakırsa (sekme gizlendi, kesinti) okuma donar. Mikrofon yeniden dinleyince kaldığı yerden sürer; kullanıcı ayrıca duraklattıysa `resume()` bekler.
    - Kural: veli onayı denetimi `start()`'ı çağıran katmandadır (`useMicrophone`) ve testlidir (`docs/dinleme-hatti.md` bölüm 1).

15. **Faz 1'den kalan üç küçük bulgu bu fazda kapanır.**
    - **5. bulgu:** Fırlatan bir dinleyici artık öteki dinleyicileri ve `start()`'ı bozmaz. Ortak `notifyAll` yardımcısı hatayı `reportError` ile bildirir.
    - **3. bulgu:** 1 saniyeden uzun susturulan iz ya da kendiliğinden askıya alınan ses bağlamı `error` durumuna geçer. Böylece sessiz bekleme yerine "Yeniden dene" görünür.
    - **8. bulgu:** `stop()`'un hata durumlarını koruduğu arayüz yorumuna yazılır.
    - Öteki beş bulgu geliştirme sayfasına ait ve bekler.

16. **Zaman.**
    - Alan işlevleri günü `LocalDate` (`YYYY-MM-DD`, cihazın yerel takvimi) olarak alır; gün aritmetiği UTC üzerinden yapılır, yaz saati etkilemez.
    - Süre ölçen servisler ve hook'lar `now?: () => number` seçeneği alır (varsayılan `performance.now`); testler sahte saatle verir.
    - `WordResult.tStart`, `tEnd` ve yeni `hesitationMs` alanı milisaniyedir: okumanın başından, duraklamalar hariç.
    - Yeni alan `hesitationMs` yalnız 1000 ms ve üstündeyse yazılır.

17. **Hedef eşitlikte geçilmiş sayılır.** `weeklyGoalStatus(70, 70)` "geçti" der. Faz 4'teki haftalık yorum bu veriden seçilir; yorumların metni o fazda V1 tasarımından gelir.

### Geliştirme sayfası metinleri (karar 13)

Vitrindeki "Demo profili" bölümü. Metinler `src/features/dev/demo/copy.ts` içinde (T17).

| Yer | Metin |
|---|---|
| Bölüm başlığı | Demo profili |
| Açıklama | Depoyu temizler ve tasarımlardaki örnek kullanıcıyı (Deniz) kurar. |
| Düğme | Çocuk sabahı (G1–G7) |
| Düğme | Veli hafta sonu (V1–V4) |
| Yüklenirken | Kuruluyor… |
| Bitince | Kuruldu: {düğmenin adı}. |
| Sayılar | Depoda {n} seans, {k} kelime kartı, {m} ölçüm var. |
| Depo boş | Depo boş. |
| Hata | Kurulamadı ({ad}: {ileti}). Sayfayı yenileyip yeniden dene. |

Ürün ekranı metni (`src/i18n/tr.ts`) bu fazda değişmez.

## 2a'nın ölçütlere katkısı

| # | Yol haritası ölçütü (Faz 2) | 2a'da kanıt | 2b'de kalan |
|---|---|---|---|
| 1 | `typical` ile G1'den G7'ye seans; G1, G2, G7 `expected` değerleri | Task 12: yüklenen `cocuk-sabahi` ile alan işlevleri şunları verir: bugünkü bölüm 4, tamamlanan 3, seri 2; ısınma kartları ve kalan 2; `typical` 3. okuma 71, fark 4 | Uçtan uca seans |
| 2 | `design` G4 görüntüsü tasarımdaki anı gösterir | Task 6 ve 14: yardım anında süre 19,19 sn, hayalet 12, çocuk 14, fark 2, sayaçlar 13 ve 1, işaretler 6 ve 9 | Ekran ve görüntü |
| 3 | 3 sn'de yardım balonu, hece, seslendirme, `helped` | Task 14: yardım 3000. ms'de açılır, heceler `a-ğaç-la-rı-nın`, `speakWord('ağaçlarının')`, sonuç `helped` | Balon ve metin |
| 4 | Üçüncü okuma kaydedilir, G5'te dinlenir, yeniden alınır | Task 11: kayıt, saklama, çalma, silme | Ekran akışı |
| 5 | Yenilenince seans kaldığı adımdan sürer | Task 10 ve 12: veri yenilemeden sonra depoda (uçtan uca, Chromium ve WebKit) | Durum makinesi |
| 6 | Bitince sonuçlar depoda, takılınanlar kart, G1 "bugün bitti" | Task 3, 4, 5 kuralları | Akış ve G1 |
| 7 | Ertesi gün sıradaki bölüm, ısınmada dünün kelimeleri, "dün" imleci | Task 4 ve 5: bir gün sonra bölüm 5, yeni kartların günü gelir, hayaletin kaynağı dünkü seans | Test saatiyle uçtan uca |
| 8 | Onay yokken mikrofon hiç açılmaz | Task 13: `useMicrophone` onaysız `audio.start()` çağırmaz | Her adımda uçtan uca |
| 9 | Çocuğa olumsuz fark yok | Task 5: `raceLead` ve `deltaFromPrevious` sıfır ve eksi için `null` | Ekran testleri |
| 10 | G1–G7 tasarımla karşılaştırıldı | yok | Görüntüler ve fark listesi |

## Her görevde geçerli kurallar

- **Dil ve tipler:** TypeScript `strict`, `any` yok. Kod, yorum ve commit İngilizce.
- **Metin:** Ürün metni yalnız `src/i18n/tr.ts` içinde, geliştirme sayfası metni `src/features/dev/` içinde. Emoji yok.
- **Adlar:** Alan terimlerinin adları `docs/urun.md` sözlüğünden. Yeni ad uydurma.
- **`src/domain`:**
  - saf; React, tarayıcı API'si, `Date.now()` yok;
  - hiçbir şeyi içe aktarmaz (kendi dosyaları dışında);
  - tamamı birim testli.
- **Bileşenler ve hook'lar:** mikrofona, ağa ve depolamaya doğrudan dokunmaz, servis arayüzlerini kullanır. Tarayıcı API'si servisin dikişinin arkasındadır.
- **Mahremiyet:** Mikrofon yalnız veli onayı kayıtlıyken açılır (`consent.voiceProcessing`). Çalışma anında üçüncü taraf adrese istek yok.
- **Türkçe:**
  - büyük-küçük harf çevirisi yalnız `toLocaleUpperCase('tr-TR')` ve `toLocaleLowerCase('tr-TR')` ile;
  - sıralama `localeCompare(…, 'tr')` ile;
  - metin NFC.
- **Çocuk ekranları:** puan, rozet ve olumsuz fark yok. Alan işlevleri olumsuz farkı hiç döndürmez.
- **Başvuru klasörleri:** `design/` ve `seed/` değiştirilmez. İçerik uydurulmaz; senaryolardaki konumlar test verisidir.
- **Bağımlılıklar:** Yeni paket önce `docs/kararlar.md`'ye yazılır. Sürüm kurulum anındaki güncel kararlı sürümdür.
- **Testler:**
  - Tek dosya `pnpm test <dosya>` ile çalışır (araya `--` konmaz).
  - Görev sonunda `pnpm check` çalışır.
  - WebKit uçtan uca testleri ekran uyanıkken koşar: `caffeinate -u -t 2; caffeinate -d -i pnpm e2e …`.
- **Commit'ler:** küçük, tek amaçlı, Conventional Commits.

## İnceleme odağı

Görevlerin kendi testleri dışında en çok can yakabilecek beş durum. Her birinin testi ilgili göreve eklendi.

1. **Okumanın ortasında sekme gizlenir ya da mikrofon gider.** Olay gelmemeli, saat ve hayalet donmalı. Mikrofon dönünce sürmeli; yardım seslendirmesi sırasında olduysa dinleyici sonsuza kadar duraklı kalmamalı. (Task 8, test 6; Task 14, test 3.)
2. **Konuşma sentezi hiç başlamaz ya da hata verir** (iOS'ta kullanıcı hareketi kuralı, ses kaldırılmış). G3 takılı kalmamalı. (Task 9, test 6.)
3. **Bir duraksama ya da yardım seslendirmesi sırasında "bitir" ya da durdurma.** Sonuç tutarlı olmalı:
   - yardım alınan kelime bir kez yer alır;
   - okunmamış kelimeler yer almaz;
   - süre duraklamaları içermez.

   (Task 8, test 7 ve 8.)
4. **Aynı kelime farklı büyüklükte ya da bir okumada birden çok kez takılır.** Tek kart ve okuma başına bir takılma olmalı; evcil kelime kaybolmamalı. (Task 4, test 2–5.)
5. **IndexedDB yok ya da açılamaz** (gizli pencere, kota). Uygulama çökmemeli; tipli hata, vitrinde hata metni. (Task 10, test 7; Task 12, `DemoProfileSection` testi.)

## Görevler

### Task 0: Plan dosyası, dal ve yanıtlanan sorular

**Dosyalar:** `docs/planlar/faz-2a.md`, `docs/kararlar.md`.

- [x] `main`'den `faz-2a` dalını aç. Bu planın durum satırını "onaylandı (tarih)" yap, "Onaya sunulan kararlar" başlığını "Onaylanan kararlar" yap.
- [x] `docs/kararlar.md`:
  - İçerik tablosuna **C5** satırı (kesin, ürün sahibi 2026-11-19): "Okuma metnindeki rakamlar okunuşlarıyla eşlenir; yazılı sayı tek kelimedir. Ayrıntı: Faz 2a planı, karar 2."
  - Tasarım tablosuna **D12** satırı (kesin, ürün sahibi 2026-11-19): "`design` senaryosunda G3 ve G4, içeriğin 1–2. sayfasını tek sayfa gösterir ("1 / 2")."
  - 12. ve 14. sorulara "Yanıtlandı (2026-11-19): D12 / C5" notu.
  - Değişiklik günlüğüne bir satır.
- [x] Commit: `docs: add the phase 2a plan and record answers 12 and 14`.

### Task 1: Alan tipleri, ürün parametreleri ve takvim günü

**Dosyalar:** `src/domain/types.ts`, `src/domain/config.ts`, `src/domain/date.ts`, `src/domain/date.test.ts`.

**Üretir** (`docs/mimari.md` → "Tipler"; adlar bağlayıcı):

```ts
// types.ts: Grade, Sentence, Page already exist.
export type Id = string;
export type LocalDate = string;                       // 'YYYY-MM-DD', the device's local calendar
export type ProsodyScore = 1 | 2 | 3 | 4;
export type Attempt = 1 | 2 | 3;
export interface Consent { voiceProcessing: boolean; weeklyEmail: boolean; grantedAt?: string }
export interface Parent { id: Id; email: string; consent: Consent }
export interface ReadingStyle { font: 'clear' | 'school'; sizeStep: 0 | 1 | 2 | 3; spacingStep: 0 | 1 | 2; trialEnabled: boolean }
export interface Child { id: Id; name: string; grade: Grade; interests: string[]; readingStyle: ReadingStyle }
export interface Question { prompt: string; options: string[]; correctIndex: number }
export interface Chapter { number: number; title: string; pages: Page[]; questions: Question[]; chains: Record<string, string[]> }
export interface Book { id: Id; title: string; grade: Grade; source: 'series' | 'cards' | 'parentText'; totalChapters: number; chapters: Chapter[] }
export interface Passage { id: Id; grade: Grade; title: string; sentences: string[] }
export type MiscueType = 'misread' | 'suffix' | 'skipped' | 'repeated' | 'inserted' | 'selfCorrected' | 'helped';
export type WordStatus = 'correct' | MiscueType;
export interface WordResult { index: number; status: WordStatus; tStart: number; tEnd: number; heard?: string; hesitationMs?: number }
export interface ReadingOutcome { words: WordResult[]; seconds: number; prosodyScore?: ProsodyScore }
export interface ChapterRef { bookId: Id; chapter: number }
export interface ReadingResult { chapterRef?: ChapterRef; attempt?: Attempt; startedAt: string; seconds: number;
  words: WordResult[]; wordsAttempted: number; correctWords: number; wcpm: number; accuracy: number;
  prosodyScore?: ProsodyScore; recordingId?: Id; readingStyle: ReadingStyle }
export type SessionStep = 'warmup' | 'listen' | 'read' | 'record' | 'wrapUp' | 'done';
export interface Session { id: Id; childId: Id; date: LocalDate; chapterRef: ChapterRef; step: SessionStep;
  readings: ReadingResult[]; answers: number[]; tamedToday: string[]; startedAt: string; completedAt?: string }
export type StuckWordStatus = 'wild' | 'practicing' | 'tamed';
export interface StuckWord { word: string; syllables: string[]; chain: string[]; misses: number;
  status: StuckWordStatus; correctStreak: number; dueOn: LocalDate | null }
export interface DrillSuggestion { suffixes: string[]; words: string[]; days: number }
export type ReadingLevel = 'frustration' | 'instructional' | 'independent';
export interface Assessment { id: Id; childId: Id; date: LocalDate; passageId: Id; result: ReadingResult; level: ReadingLevel; trial?: boolean }

// config.ts: gradeLimits already exists.
export const helpThresholdMs = 3000;
export const hesitationMarkMs = 1000;
export const readingsPerSession = 3;
export const warmupCardLimit = 3;
export const goalGainPerWeek = 2;
export const goalWeeks = 6;
export const nextGoalStep = 8;
export const tamingIntervalsDays = [1, 2, 4] as const;
export const readingLevelFloors = { instructional: 0.9, independent: 0.99 } as const;

// date.ts
export function addDays(date: LocalDate, days: number): LocalDate;
export function daysBetween(from: LocalDate, to: LocalDate): number;   // to − from
export function weekdayOf(date: LocalDate): number;                     // 0 = Sunday … 6 = Saturday
export function localDateOf(moment: Date): LocalDate;                   // the moment's local calendar day
```

- [x] **Kırmızı:** `date.test.ts`:
  - `addDays('2026-11-21', -5)` → `'2026-11-16'`;
  - `addDays('2026-12-31', 1)` → `'2027-01-01'`;
  - `addDays('2028-02-28', 1)` → `'2028-02-29'`;
  - yaz saati değişen günlerin çevresinde: `addDays('2026-03-28', 1)` → `'2026-03-29'`, `addDays('2026-10-24', 2)` → `'2026-10-26'`;
  - `daysBetween('2026-11-16', '2026-11-21')` → `5`, ters yönde `-5`;
  - `weekdayOf('2026-11-22')` → `0`, `weekdayOf('2026-11-19')` → `4`;
  - `localDateOf(new Date(2026, 10, 19, 23, 59))` → `'2026-11-19'`, `localDateOf(new Date(2026, 0, 5, 0, 0))` → `'2026-01-05'`.
- [x] `pnpm test src/domain/date.test.ts` → FAIL (modül yok).
- [x] Tipleri, parametreleri ve `date.ts`'i yaz. Gün aritmetiği `Date.UTC` ile, `localDateOf` yerel `getFullYear/getMonth/getDate` ile.
- [x] Aynı komut → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(domain): add session types, product parameters and calendar days`.

### Task 2: Rakamların okunuşu ve bölümün kelimeleri

**Dosyalar:** `src/domain/text.ts`, `text.test.ts`, `src/domain/readability.ts`, `readability.test.ts`, `src/features/reading/ReadingText.test.tsx`.

**Kullanır:** `Chapter` (Task 1).

**Üretir:**

```ts
export interface Token { word: string; spoken: string; leading: string; trailing: string; spaceAfter: boolean }
// word: as written, without the punctuation around it ('Tıkır’ın', '3', '100’ü').
// spoken: what the reader is expected to say ('Tıkır’ın', 'üç', 'yüzü').
export function readCardinal(digits: string): string;
export function readOrdinal(digits: string): string;
export interface ChapterToken extends Token { index: number; page: number }   // page: content page, 0-based
export function chapterTokens(chapter: Chapter): ChapterToken[];
// syllabify and countSyllables also accept a spoken form of several words.
```

**Kurallar:**

- Kelime düzeni `/(?:\p{L}+|\p{Nd}+)(?:['’]\p{L}+)*/gu` olur.
- **Okunuş:**
  - Rakam dizisi `readCardinal` ile okunur, varsa ek harfleri son kelimeye eklenir.
  - Sıfırla başlayan ya da 12 haneden uzun dizi rakam rakam okunur.
- **Sıra sayısı:** Rakam dizisinin hemen ardından `.` geliyor ve sonraki kelime küçük harfle başlıyorsa sayı sıra sayısıdır.
  - Ek, son kelimenin son ünlüsüne göre seçilir.
  - Kelime ünlüyle bitiyorsa `ncı/nci/ncu/ncü`, ünsüzle bitiyorsa `ıncı/inci/uncu/üncü` gelir.
  - Tek ünsüz değişimi: "dört" → "dördüncü".

**Adımlar:**

- [x] **Kırmızı:** `text.test.ts`:
  - **`readCardinal`** şu tabloyu verir:

    | Rakam | Okunuş | Rakam | Okunuş |
    |---|---|---|---|
    | 0 | sıfır | 1000 | bin |
    | 7 | yedi | 1001 | bin bir |
    | 10 | on | 1100 | bin yüz |
    | 11 | on bir | 1923 | bin dokuz yüz yirmi üç |
    | 45 | kırk beş | 2000 | iki bin |
    | 99 | doksan dokuz | 10000 | on bin |
    | 100 | yüz | 100000 | yüz bin |
    | 101 | yüz bir | 1000000 | bir milyon |
    | 200 | iki yüz | 2500000 | iki milyon beş yüz bin |
    | 999 | dokuz yüz doksan dokuz | 1000000000 | bir milyar |

    Ayrıca `007` → "sıfır sıfır yedi"; 13 haneli `1234567890123` → "bir iki üç dört beş altı yedi sekiz dokuz sıfır bir iki üç".
  - **`readOrdinal`:**

    | Rakam | Okunuş | Rakam | Okunuş |
    |---|---|---|---|
    | 1 | birinci | 30 | otuzuncu |
    | 2 | ikinci | 40 | kırkıncı |
    | 3 | üçüncü | 50 | ellinci |
    | 4 | dördüncü | 60 | altmışıncı |
    | 5 | beşinci | 70 | yetmişinci |
    | 6 | altıncı | 80 | sekseninci |
    | 7 | yedinci | 90 | doksanıncı |
    | 8 | sekizinci | 100 | yüzüncü |
    | 9 | dokuzuncu | 1000 | bininci |
    | 10 | onuncu | 21 | yirmi birinci |
    | 20 | yirminci | 1000000 | bir milyonuncu |
  - **`tokenize`:**
    - "Deniz 3 elma aldı." → kelimeler `['Deniz','3','elma','aldı']`, söyleyişler `['Deniz','üç','elma','aldı']`.
    - "Kitabın 100’ü bitti." → `word` "100’ü", `spoken` "yüzü".
    - "Deniz 3. sınıfta." → "3" için `spoken` "üçüncü", `trailing` ".".
    - "Saat 3. Sonra eve döndü." → "3" için "üç".
    - "3,5 elma" → "üç", "beş", "elma" (bilinen sınır, karar 2).
  - **Hece:**
    - `syllabify('bin dokuz yüz')` → `['bin','do','kuz','yüz']`;
    - `countSyllables('bin dokuz yüz yirmi üç')` → `7`.
  - **`chapterTokens`:** 4. bölüm 99 kelime; 14. kelime "ağaçlarının", sayfa 0; 40. kelime "soluk", sayfa 1; sayfaların ilk kelimeleri 0, 25, 45, 59, 73, 88.
  - **`readability.test.ts`:** `textStats(['Deniz 3 elma aldı.'])` → 4 kelime, 7 hece. Seed'in bütün `stats` testleri değişmeden geçer.
  - **`ReadingText.test.tsx`:** "Deniz 3 elma aldı." sayfasında "3" kendi `data-word-index` hücresindedir ve "Deniz"e yapışmaz.
- [x] `pnpm test src/domain/text.test.ts` → FAIL (`readCardinal` yok).
- [x] Uygula. `textStats` heceyi `spoken` biçiminden sayar.
- [x] Üç test dosyası → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(domain): read digits as Turkish number words`.

### Task 3: Puanlama

**Dosyalar:** `src/domain/scoring.ts`, `scoring.test.ts`.

**Kullanır:** tipler ve `readingLevelFloors` (Task 1).

**Üretir:**

```ts
export function isCountedError(status: WordStatus): boolean;   // misread, suffix, skipped, helped
export interface ReadingScore { wordsAttempted: number; countedErrors: number; correctWords: number; wcpm: number; accuracy: number }
export function scoreReading(words: readonly WordResult[], seconds: number): ReadingScore;
export function readingLevel(accuracy: number): ReadingLevel;
export function countMiscues(words: readonly WordResult[]): Record<MiscueType, number>;
export interface ReadingMeta { chapterRef?: ChapterRef; attempt?: Attempt; startedAt: string; readingStyle: ReadingStyle; recordingId?: Id }
export function toReadingResult(outcome: ReadingOutcome, meta: ReadingMeta): ReadingResult;
```

**Hesap kuralları:**

- **`wordsAttempted`:** sonuç sayısı. Okunmayan kelime listede olmaz.
- **`wcpm`:** `Math.round(correctWords × 60 / seconds)`. `seconds` 0 ise 0.
- **`accuracy`:** yuvarlanmamış `correctWords / wordsAttempted`. Sonuç yoksa 0.

**Adımlar:**

- [x] **Kırmızı:** `scoring.test.ts`:
  - **V3 örneği** (`docs/urun.md` bölüm 2):
    - Girdi: 76 sonuç; 3 yanlış okuma, 1 ek hatası, 1 atlama; 60 sn.
    - Çıktı: `{wordsAttempted: 76, countedErrors: 5, correctWords: 71, wcpm: 71}`; `Math.round(accuracy × 100)` → 93; `readingLevel(accuracy)` → `'instructional'`.
  - **Düşülmeyenler:** 1 tekrar, 1 ekleme, 1 kendini düzeltme ve 7 doğru, 10 sn: `correctWords` 10, `accuracy` 1, `wcpm` 60.
  - **Yardım:** `helped` düşülür.
  - **Boş liste:** hepsi 0, `NaN` yok.
  - **`readingLevel` sınırları:**

    | `accuracy` | Düzey |
    |---|---|
    | 0,8999 | `frustration` |
    | 0,9 | `instructional` |
    | 0,9899 | `instructional` |
    | 0,99 | `independent` |
    | 1 | `independent` |
  - **`countMiscues`:** her türü ayrı sayar, `correct` saymaz.
  - **`toReadingResult`:** meta alanlarını ve skoru taşır, `prosodyScore`'u geçirir.
- [x] `pnpm test src/domain/scoring.test.ts` → FAIL.
- [x] Uygula. → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(domain): score readings`.

### Task 4: Canavar kelimeler

**Dosyalar:** `src/domain/stuckWords.ts`, `stuckWords.test.ts`.

**Kullanır:** `syllabify`, `toLowerTr` (Task 2); `addDays` (Task 1); `tamingIntervalsDays`, `warmupCardLimit`.

**Üretir:**

```ts
export function stuckKey(word: string): string;                       // Turkish lower case
export interface MissedWord { word: string; spoken: string; chain: readonly string[] }
export function recordMisses(cards: readonly StuckWord[], missed: readonly MissedWord[], today: LocalDate): StuckWord[];
export function applyWarmupResult(card: StuckWord, correct: boolean, today: LocalDate): StuckWord;
export function remainingToTame(card: StuckWord): number;             // 3 − correctStreak, at least 0
export interface WarmupItem { word: string; spoken: string; syllables: string[]; chain: string[]; card: StuckWord | null }
export interface WarmupSource { words: readonly { word: string; spoken: string }[]; chains: Readonly<Record<string, readonly string[]>> }
export function warmupDeck(cards: readonly StuckWord[], today: LocalDate, source: WarmupSource): WarmupItem[];
```

**Takvim ve sıralama:**

- Kart oluşunca günü `today + 1`.
- Isınmada doğruysa seri artar; seri 3 olunca kart evcilleşir ve `dueOn` `null` olur. Seri 3'e ulaşmadıysa kart çalışılıyor durumuna geçer ve günü şöyle belirlenir:

  | Seri | Günü |
  |---|---|
  | 1 | `today + 2` |
  | 2 | `today + 4` |

- Yanlışsa seri 0, durum çalışılıyor, günü `today + 1`.
- Deste: günü gelmiş ve evcil olmayan kartlar; en çok takılınandan başlar, eşitlikte `stuckKey`'e göre `localeCompare(…, 'tr')`; en çok 3.

**Adımlar:**

- [x] **Kırmızı:** `stuckWords.test.ts`, bugün `'2026-11-21'`:
  1. **Yeni kart:**
     - Girdi: `recordMisses([], [{word:'rüzgârı', spoken:'rüzgârı', chain:[]}], today)`.
     - Çıktı: `{word:'rüzgârı', syllables:['rüz','gâ','rı'], chain:[], misses:1, status:'wild', correctStreak:0, dueOn:'2026-11-22'}`.
  2. **Bir okumada iki kez takılma:** aynı kelime iki kez → `misses` 1.
  3. **Büyük harf:**
     - `'Gökyüzünde'` yeni kart olur ve öyle yazılır.
     - Ardından `'gökyüzünde'` takılması aynı kartı artırır, gösterim `'gökyüzünde'` olur.
     - `'gökyüzünde'` kartı varken `'Gökyüzünde'` gösterimi değiştirmez.
  4. **Metinde yeniden takılma:**
     - Çalışılan kart (seri 2, günü `'2026-11-25'`) → `misses` +1, seri 0, durum `practicing`, günü `'2026-11-22'`.
     - Günü `'2026-11-20'` olan kart günü korur.
  5. **Evcil kart:** evcil kalır, `misses` +1, seri 3, `dueOn` `null`.
  6. **`applyWarmupResult`:**

     | Önce | Okuma | Sonra |
     |---|---|---|
     | `wild`, seri 0 | doğru | `practicing`, seri 1, günü `'2026-11-23'` |
     | seri 1 | doğru | seri 2, günü `'2026-11-25'` |
     | seri 2 | doğru | `tamed`, `dueOn` `null` |
     | herhangi | yanlış | `practicing`, seri 0, günü `'2026-11-22'` |
  7. **`remainingToTame({correctStreak: 1, …})`** → 2.
  8. **Demo profilinin kartları:**
     - Girdi: `cocuk-sabahi` kartları (üçünün günü `'2026-11-21'`, "tırmanmaya"nın `'2026-11-22'`), 4. bölümün kelimeleri ve zincirleri.
     - Çıktı: kelimeler `['kıvrılıyordu','ağaçlarının','belirdiğinde']`; ilk kartın heceleri `['kıv','rı','lı','yor','du']`, zinciri `['kıvrıl','kıvrılıyor','kıvrılıyordu']`; `remainingToTame` 2.
  9. **Eşitlik:** `misses` eşit dört kart `['şeker','sabah','çiçek','cadde']` → `['cadde','çiçek','sabah']`.
  10. **Günü gelen kart yokken:**
      - Kelimeler `['belirdiğinde','Karşılarında','kıvrılıyordu']`, `card` `null`.
      - "belirdiğinde"nin zinciri `['belir','belirdi','belirdiğinde']`, "Karşılarında"nınki `[]`.
  11. **Tek kart:** günü gelen 1 kart → deste 1 kart, metinden tamamlanmaz.
- [x] `pnpm test src/domain/stuckWords.test.ts` → FAIL.
- [x] Uygula. → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(domain): turn stuck words into cards and pick the warmup deck`.

### Task 5: Hayalet, hedefler ve ilerleme

**Dosyalar:** `src/domain/ghost.ts`, `ghost.test.ts`, `src/domain/goals.ts`, `goals.test.ts`, `src/domain/progress.ts`, `progress.test.ts`.

**Kullanır:** tipler, `addDays`, `daysBetween`, `goalGainPerWeek`, `goalWeeks`, `nextGoalStep`.

**Üretir:**

```ts
// ghost.ts
export function previousReading(sessions: readonly Session[], today: LocalDate, attempt: Attempt): ReadingResult | null;
export function ghostPace(reading: ReadingResult | null): number | null;           // words attempted per minute
export function ghostIndex(paceWpm: number, elapsedMs: number, wordCount: number): number;
export function raceLead(childIndex: number, ghost: number | null): number | null;  // > 0 or null
// goals.ts
export function firstTarget(baselineWcpm: number): number;
export function nextTarget(target: number): number;
export type WeeklyGoalStatus = { passed: true; nextTarget: number } | { passed: false; target: number };
export function weeklyGoalStatus(wcpm: number, target: number): WeeklyGoalStatus;
// progress.ts
export function completedSeriesChapters(sessions: readonly Session[], seriesId: Id): number[];
export function nextSeriesChapter(sessions: readonly Session[], series: Book): number | null;
export function streakDays(completedDates: readonly LocalDate[], today: LocalDate): number;
export function deltaFromPrevious(todayWcpm: number, previousWcpm: number | null): number | null;
export type TileState = 'done' | 'today' | 'locked';
export function chapterTileState(chapter: number, completed: readonly number[], today: number | null): TileState;
```

**Adımlar:**

- [x] **Kırmızı:**
  - **`ghost.test.ts`:**
    - `ghostIndex(40, 19185, 99)` → 12; 18000 ms'de 12; 17999 ms'de 11; 600000 ms'de 99 (metnin sonunda durur).
    - `raceLead(14, 12)` → 2; `raceLead(12, 12)` → `null`; `raceLead(10, 12)` → `null`; `raceLead(5, null)` → `null`.
    - `previousReading`, bugün `'2026-11-21'`; iki seans var: `'2026-11-19'` (okuma 1–3) ve `'2026-11-20'` (yalnız okuma 1–2).
      - 3. okuma → 19'undaki seansın 3. okuması;
      - 2. okuma → 20'sindeki seansın;
      - bugünkü seans sayılmaz;
      - seans yoksa `null`.
    - `ghostPace({wordsAttempted: 98, seconds: 90, …})` → 65,33…; `seconds` 0 → `null`.
  - **`goals.test.ts`:**
    - `firstTarget(58)` → 70; `nextTarget(70)` → 78;
    - `weeklyGoalStatus(71, 70)` → `{passed: true, nextTarget: 78}`;
    - `(70, 70)` → geçti;
    - `(69, 70)` → `{passed: false, target: 70}`.
  - **`progress.test.ts`:**
    - **Bölümler:** Girdi: tamamlanan seanslar `'2026-11-16'` (kitaplık kitabı), `'2026-11-17'` (bölüm 1), `'2026-11-19'` (bölüm 2), `'2026-11-20'` (bölüm 3) ve bitmemiş bir bölüm 4 seansı. Çıktı:
      - `completedSeriesChapters` → `[1,2,3]`;
      - `nextSeriesChapter` → 4;
      - 5. bölüm tamamlanınca → `null` (seed'de 5 bölüm var).
    - **Seri:** `streakDays`, bugün `'2026-11-21'`:

      | Tamamlanan günler | Sonuç |
      |---|---|
      | `['2026-11-16','2026-11-17','2026-11-19','2026-11-20']` | 2 |
      | aynı ve bugün | 3 |
      | yalnız `'2026-11-19'` | 0 |
      | yalnız bugün | 1 |
    - **Fark:** `deltaFromPrevious`:

      | Bugün | Önceki | Sonuç |
      |---|---|---|
      | 71 | 67 | 4 |
      | 67 | 67 | `null` |
      | 60 | 67 | `null` |
      | 71 | `null` | `null` |
    - **Karolar:** `chapterTileState(3, [1,2,3], 4)` → `'done'`, `(4, …, 4)` → `'today'`, `(5, …, 4)` → `'locked'`, `(4, [1,2,3], null)` → `'locked'`.
- [x] Üç test dosyası → FAIL.
- [x] Uygula. → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(domain): add ghost pace, goals and progress rules`.

### Task 6: Okuma benzetimi ve hazır senaryolar

**Dosyalar:** `src/services/listener/types.ts`, `simulateReading.ts`, `simulateReading.test.ts`, `scenarios.ts`, `scenarios.test.ts`.

**Kullanır:** `countSyllables`, `chapterTokens` (Task 2); `scoreReading` (Task 3); `ghostIndex` (Task 5); `helpThresholdMs`, `hesitationMarkMs`; `AudioCapture` (Faz 1).

**Üretir:**

```ts
// types.ts
export interface FakeScenario {
  wcpm?: number; timed?: { seconds: number; wordsRead: number }; jitter?: number; seed?: number;
  miscues: { index: number; type: MiscueType }[]; hesitations: { index: number; ms: number }[];
  prosodyScore?: ProsodyScore;
}
export type ListenerEvent =
  | { type: 'position'; index: number } | { type: 'word'; result: WordResult }
  | { type: 'hesitation'; index: number; ms: number } | { type: 'end'; reason: 'completed' | 'stopped' };
export type ListenerOutcome = ReadingOutcome;
export interface ReadingListener {
  start(words: readonly string[], audio: AudioCapture): Promise<void>;
  pause(): void; resume(): void; help(index: number): void;
  stop(): Promise<ListenerOutcome>;
  on(callback: (event: ListenerEvent) => void): Unsubscribe;
}
// simulateReading.ts
export interface SimulatedWord { index: number; status: WordStatus; hesitationMs: number; startMs: number; endMs: number }
export interface Simulation { words: SimulatedWord[]; seconds: number; prosodyScore?: ProsodyScore }
export function simulateReading(spokenWords: readonly string[], scenario: FakeScenario): Simulation;
export function toWordResults(simulation: Simulation): WordResult[];
// scenarios.ts
export const scenarioNames = ['smooth', 'typical', 'struggling', 'design'] as const;
export type ScenarioName = (typeof scenarioNames)[number];
export interface ScenarioSet { readings: readonly [FakeScenario, FakeScenario, FakeScenario]; ghostWpm?: number; layout?: 'design' }
export const scenarioSets: Record<ScenarioName, ScenarioSet>;
```

**Benzetim** (sırayla):

1. **Kelimeler:** `n` kelime. Süreli okumada yalnız ilk `min(n, wordsRead)` kelime; ötekiler sonuçta yok. Sınırın dışındaki konumlar yok sayılır.
2. **Durum ve duraksama:**
   - Duraksaması `helpThresholdMs` ve üstü olan kelime `helped` olur, duraksaması `helpThresholdMs`'ye iner.
   - Öteki kelimenin durumu senaryodaki hata türü ya da `correct`.
3. **Toplam süre `T`:**
   - Süreli okumada `timed.seconds`.
   - Süresizde `correctWords × 60 / wcpm`; `correctWords` = okunan − düşülen hata (yardım dahil).
   - İkisi de yoksa `TypeError`.
4. **Ağırlık:**
   - Okuma süresi alan her kelimede `countSyllables(spoken)`; `skipped` ve `helped` 0.
   - `jitter` varsa ağırlık `× (1 + jitter × (2u − 1))`. `u`, `seed` ile beslenen mulberry32'den gelir.
5. **Dağıtım:**
   - `pool = T × 1000 − Σ duraksama`. `pool ≤ 0` ise `RangeError`.
   - `k = pool / Σ ağırlık`.
   - Sırayla: `t += duraksama`, `startMs = t`, `t += ağırlık × k`, `endMs = t`.
6. **Çıktı:**
   - `seconds = T`, tam değer.
   - `toWordResults`: `tStart = startMs`, `tEnd = endMs`; `hesitationMs` yalnız `hesitationMarkMs` ve üstündeyse.

**Senaryolar** (karar 4; konumlar 0'dan sayılır):

| Ad | Okuma | `wcpm` | Hatalar (konum: tür) | Duraksamalar (konum: ms) | Ek |
|---|---|---|---|---|---|
| `smooth` | 1 | 80 | — | — | |
| | 2 | 84 | — | — | |
| | 3 | 88 | — | — | |
| `typical` | 1 | 64 | 15 `suffix`, 35 `repeated`, 40 `skipped` | — | |
| | 2 | 68 | 9 `misread` | 6: 1800 | |
| | 3 | 71 | — | — | |
| `struggling` | 1, 2, 3 | 42, 46, 50 | 4 `misread`, 12 `suffix`, 20 `skipped`, 31 `misread`, 45 `suffix` | 8, 26, 52: 3500 | |
| `design` | 1 | `typical` 1 | | | `ghostWpm` 40, `layout` `'design'` |
| | 2 | 50 | 9 `misread` | 6: 1800, 14: 3000 | |
| | 3 | `typical` 3 | | | |

**Adımlar:**

- [x] **Kırmızı:**
  - **`simulateReading.test.ts`:**
    1. **Tam `wcpm`:** Bütün senaryoların bütün okumaları 4. ve 5. bölümün söyleyişlerinde çalışır; her biri için `scoreReading(toWordResults(sim), sim.seconds).wcpm` senaryodaki `wcpm`'e eşittir. `typical` 3 için `seconds` = 99 × 60 / 71.
    2. **Hece oranı:** `['ve','kıvrılıyordu']`, `smooth` 1 → ikinci kelimenin süresi birincinin 5 katı.
    3. **Duraksama:** `typical` 2'de 6. kelimenin `startMs`'i, 5. kelimenin `endMs`'inden 1800 fazla; sonucu `hesitationMs: 1800`.
    4. **Yardım:** 3500 ms duraksama → `helped`, `hesitationMs` 3000, `startMs === endMs`.
    5. **Süreli okuma:**
       - Girdi: `olcum-3b` metni, `{timed: {seconds: 60, wordsRead: 76}}`, demo profilinin 1. gün hataları ve 21. kelimede 1800 ms.
       - Çıktı: 76 sonuç, `seconds` 60, doğru 71, `wcpm` 71.
       - `wordsRead` metinden uzunsa bütün metin.
    6. **Tekrarlanabilirlik:**
       - Aynı senaryo ve tohum derin eşit sonuç verir.
       - `jitter: 0.3` ile tohum 1 ve 2 farklı `startMs`, aynı `seconds` ve `wcpm` verir.
    7. **Sınır dışı konum:** `typical` 1 tek kelimede (`['kıvrılıyordu']`) çalışınca tek sonuç `correct` olur.
    8. **Hatalı senaryolar:** duraksamalar toplam süreden uzunsa `RangeError`; ne `wcpm` ne `timed` varsa `TypeError`.
  - **`scenarios.test.ts`:**
    - `typical` okumaları `seed/demo-profil.json` → `timeline.sessions` içindeki 0. günün okumalarına eşittir (`word` alanı yok sayılır).
    - **`design` 2. okuma, 4. bölüm:**
      - yardımın açıldığı an (14. kelimenin duraksamasının başı + 3000) 19 000 ile 19 500 ms arasındadır;
      - `ghostIndex(40, o an, 99)` → 12;
      - 14'ten önceki 14 sonucun 13'ü düşülmeyen, 1'i (6) 1000 ms ve üstü duraksamalıdır.
- [x] İki test dosyası → FAIL.
- [x] Uygula. → PASS. `pnpm check` → geçer.
- [x] Commit: `feat(listener): simulate readings and add the ready scenarios`.

### Task 7: Dinleyici yalıtımı ve Faz 1'den kalan bulgular

**Dosyalar:** `src/services/notify.ts`, `notify.test.ts`, `src/services/audio/WebAudioCapture.ts`, `WebAudioCapture.test.ts`, `src/services/audio/AudioCapture.ts`, `src/services/audio/browserCaptureEnvironment.ts`, `e2e/support/media.ts`, `e2e/audio-lab.spec.ts`.

**Üretir:**

```ts
/** Calls every listener; one that throws is reported (reportError, else console.error) and the rest still run. */
export function notifyAll<T>(listeners: Iterable<(value: T) => void>, value: T): void;
```

**Davranış:** `browserCaptureEnvironment` kesintiyi şu iki durumda bildirir:

- **Susturulan iz.** İzin `mute` olayı başlatan bir 1000 ms sayaç kurar, `unmute` sayacı iptal eder. Süre dolarsa `{name: 'TrackMuted'}` bildirilir. Susturulma olaylardan izlenir; `track.muted` alanı okunmaz, çünkü testlerdeki elle gönderilen olay bu alanı değiştirmez.
- **Askıya alınan bağlam.** Ses bağlamı çalışırken kendiliğinden `suspended` durumuna geçerse `{name: 'ContextSuspended'}` bildirilir.

**Adımlar:**

- [ ] **Kırmızı:**
  - **`notify.test.ts`:** üç dinleyiciden ikincisi fırlatır; birinci ve üçüncü çağrılır, `reportError` (`vi.stubGlobal`) o hatayla bir kez çağrılır.
  - **`WebAudioCapture.test.ts`:** fırlatan bir `onStateChange` dinleyicisi varken `await capture.start()` çözülür. Durum `capturing` olur ve ikinci dinleyici `['starting','capturing']` alır.
  - **`e2e/audio-lab.spec.ts`:**
    - "a muted microphone is reported after a second": mikrofon açıkken izde `mute` olayı → 1,5 sn içinde hata görünür ve iz `ended` olur.
    - "a short mute is ignored": `mute` ardından 300 ms sonra `unmute` → 2 sn sonra hâlâ dinliyor.
    - "a suspended audio context is reported": sayfanın bağlamı `suspend()` → hata görünür.
    - `e2e/support/media.ts` akışları zaten kaydediyor (`__tikirStreams`); ses bağlamlarını da aynı biçimde kaydeder.
- [ ] `pnpm test src/services/notify.test.ts` ve `pnpm test src/services/audio/WebAudioCapture.test.ts` → FAIL.
- [ ] Uygula.
  - `WebAudioCapture` bütün dinleyici çağrılarında `notifyAll` kullanır.
  - `AudioCapture.stop()` yorumu: "Keeps a failure state (denied, unavailable, error); from starting or capturing it goes to idle."
- [ ] Birim testleri → PASS.
- [ ] `caffeinate -u -t 2; caffeinate -d -i pnpm e2e e2e/audio-lab.spec.ts` → Chromium ve WebKit'te geçer.
- [ ] `pnpm check` → geçer.
- [ ] Commit: `fix(audio): isolate listeners and report a muted or suspended input`.

### Task 8: `ReadingListener` ve `FakeListener`

**Dosyalar:** `src/services/listener/FakeListener.ts`, `FakeListener.test.ts`, `src/test/fakeCapture.ts`.

**Kullanır:** `simulateReading`, `toWordResults`, `ReadingListener`, `ListenerEvent`, `FakeScenario` (Task 6); `notifyAll` (Task 7); `helpThresholdMs`; `scoreReading` (yalnız testte).

**Üretir:**

```ts
export const hesitationEventIntervalMs = 500;
export type FakeListenerMode = { kind: 'scenario'; scenario?: FakeScenario } | { kind: 'manual' };
export type ManualMark = 'correct' | 'misread' | 'skipped' | 'hesitate';
export class FakeListener implements ReadingListener {
  constructor(mode?: FakeListenerMode, options?: { now?: () => number });   // default: scenario { wcpm: 60 }
  mark(mark: ManualMark): void;                                             // manual mode only; otherwise throws
}
// src/test/fakeCapture.ts: an AudioCapture for tests; setState(state), emitFrame(pcm), start/stop as vi.fn
export class FakeAudioCapture implements AudioCapture { /* … */ }
```

**Olay sırası:**

- **Başlangıç:** `start()`'ta `position 0`.
- **Duraksama:** Her kelimede duraksama sürerken her 500 ms'de `hesitation` gelir; 1800 ms'lik duraksama 500, 1000 ve 1500'de üç olay verir.
- **Kelime sonu:** okuma süresi bitince önce `word`, sonra `position i+1` gelir.
- **Son kelime:** `word`, ardından `end: completed`.
- **Yardım:**
  - Yardım bekleyen kelimede (`helped`) 3000. ms olayından sonra dinleyici bekler.
  - `help(i)` sonucu `helped` olarak ayırır ve duraklatır.
  - `resume()` `word {helped, hesitationMs: 3000}` ve `position i+1` gönderir.
- **Süre:** Tamamlanan okumada `stop()` benzetimin `seconds` değerini döndürür; erken durdurmada duraklamalar hariç geçen süreyi.

**Adımlar:**

- [ ] **Kırmızı:** `FakeListener.test.ts` (`vi.useFakeTimers()`, `now: () => Date.now()`):
  1. **Mikrofon kapalı:** Mikrofon `idle` iken `start()` "The microphone is not capturing" ile reddeder ve olay gelmez.
  2. **Olay sırası ve süre:**
     - Girdi: `['bir','iki','üç']`, `{wcpm: 60}`.
     - Olaylar sırasıyla: `position 0`, `word 0`, `position 1`, `word 1`, `position 2`, `word 2`, `end completed`. Her kelime tam bir kez.
     - `stop()` → 3 sonuç, `seconds` 3.
  3. **Duraksama olayları:** `typical` 2 ve 4. bölüm → 6. kelime için 500, 1000, 1500'de `hesitation`, sonra `word` (`hesitationMs: 1800`).
  4. **Yardım:**
     - 14'te 3000'e gelince olaylar durur; 5 sn daha ilerletmek olay üretmez.
     - `help(14)` sonuç vermez; `resume()` → `word {14, 'helped'}` ve `position 15`.
     - Okuma sonunda `scoreReading(…).wcpm` 50.
  5. **Duraklatma:** `pause()` sonrasında 10 sn olay yok. `resume()` sürer. Erken `stop()`'un `seconds`'ı duraklamayı içermez.
  6. **Mikrofon gider ve döner:**
     - Mikrofon `idle` olunca olaylar durur, `capturing` olunca sürer.
     - Kullanıcı ayrıca duraklattıysa mikrofon dönünce de `resume()` beklenir.
     - Yardım beklerken mikrofon gidip dönerse `resume()` yine sonucu verir.
  7. **Erken `stop()`:**
     - `end stopped` gelir; yalnız sonuçlanan kelimeler döner; zamanlayıcı çalışmaz.
     - İkinci `stop()` aynı sonucu verir.
  8. **Yardım sırasında `stop()`:** `help(14)` sonrası, `resume()` öncesi → sonuçta 14 `helped` olarak bir kez, `wordsAttempted` 15.
  9. **Tekrarlanabilirlik:** iki çalıştırma aynı olay listesini verir (JSON eşit).
  10. **Fırlatan dinleyici:** fırlatan bir `on` dinleyicisi öteki dinleyiciyi ve okumayı durdurmaz.
  11. **Elle kip:**
      - `mark('correct' | 'misread' | 'skipped')` kelimeyi o türle sonuçlandırır ve konumu ilerletir.
      - `mark('hesitate')` 500–3000 olaylarını gönderip bekler; `help` ve `resume` → `helped`.
      - Son kelimede `end completed`.
      - Senaryo kipinde `mark` fırlatır.
  12. **Varsayılan senaryo:** `new FakeListener()` ile `['kıvrılıyordu']` → 1 sn içinde `word correct`.
- [ ] `pnpm test src/services/listener/FakeListener.test.ts` → FAIL.
- [ ] Uygula. → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(listener): add the fake reading listener`.

### Task 9: Seslendirme

**Dosyalar:** `src/services/narrator/Narrator.ts`, `SilentNarrator.ts`, `SpeechSynthesisNarrator.ts`, `createNarrator.ts` ve testleri; `docs/kararlar.md` (T8 notu).

**Kullanır:** `tokenize`, `countSyllables` (Task 2); `Page`.

**Üretir:**

```ts
export type NarrationRate = 'slow' | 'normal';
export type NarrationEnd = 'completed' | 'stopped';
export interface Narrator {
  readonly rate: NarrationRate;
  speakPage(page: Page, onUnit: (unitIndex: number) => void): Promise<NarrationEnd>;   // unitIndex over the page
  speakWord(word: string): Promise<NarrationEnd>;                                      // the caller passes the spoken form
  setRate(rate: NarrationRate): void;                                                  // applies from the next unit
  pause(): void; resume(): void; stop(): void;
  estimateSeconds(page: Page): number;
}
export const narrationTiming = {
  syllablesPerSecond: { slow: 2.8, normal: 3.5 }, unitGapMs: 250, startTimeoutMs: 1500,
  speechRate: { slow: 0.85, normal: 1 }, voiceWaitMs: 1000,
} as const;
export function unitDurationMs(text: string, rate: NarrationRate): number;   // syllables of the spoken forms ÷ rate, + gap
export class SilentNarrator implements Narrator { constructor(options?: { now?: () => number }) }
export interface SpeechPort {   // the seam over window.speechSynthesis
  voices(): { name: string; lang: string }[];
  onVoicesChanged(callback: () => void): Unsubscribe;
  speak(text: string, options: { voiceName: string; lang: string; rate: number },
        handlers: { onStart(): void; onEnd(): void; onError(): void }): void;
  cancel(): void;
}
export function browserSpeechPort(): SpeechPort | null;
export class SpeechSynthesisNarrator implements Narrator { constructor(port: SpeechPort, voice: { name: string; lang: string }, options?: { now?: () => number }) }
export function createNarrator(port?: SpeechPort | null): Promise<Narrator>;
```

**Adımlar:**

- [ ] **Kırmızı** (sahte zaman ve sahte `SpeechPort`):
  1. **Süre tahmini:**
     - Girdi: 4. bölümün 1. ve 2. sayfası birleşik (18 ünite, 119 hece).
     - `estimateSeconds` yavaşta 47,0, normalde 38,5.
  2. **`SilentNarrator.speakPage`:** `onUnit` 0'dan 17'ye birikimli sürelerde çağrılır ve `'completed'` döner.
     - `stop()` → `'stopped'`, başka `onUnit` gelmez.
     - `pause()` dondurur, `resume()` aynı üniteden kalan süreyle sürer.
  3. **`speakWord` ve hız:** `speakWord('ağaçlarının')` 5 hece ÷ 2,8 + 0,25 sn sonra `'completed'` olur. `setRate('normal')` sonraki üniteden hızlanır.
  4. **`SpeechSynthesisNarrator`:**
     - Her ünite için bir `speak` çağrısı gider. Metin ünitenin kendisi, `lang` 'tr-TR', ses Türkçe ses, yavaşta hız 0,85.
     - `onUnit` her ünitenin `onStart`'ında çağrılır; son `onEnd`'de `'completed'` döner.
  5. **Duraklatma:** `pause()` `cancel()` çağırır; `resume()` o üniteyi yeniden konuşur.
  6. **Başlamayan ya da hata veren ünite:** `onStart` 1500 ms içinde gelmez ya da `onError` gelirse ünite sessiz zamanlamayla geçer. `onUnit` yine çağrılır, sonraki ünite konuşulur, sayfa `'completed'` biter.
  7. **`createNarrator`:**

     | Girdi | Sonuç |
     |---|---|
     | 'tr-TR' sesi var | `SpeechSynthesisNarrator` |
     | yalnız 'en-US' | `SilentNarrator` |
     | sesler boş, 1000 ms içinde `voiceschanged` ile 'tr_TR' gelir | `SpeechSynthesisNarrator` |
     | 1000 ms dolar | `SilentNarrator` |
     | `null` | `SilentNarrator` |
- [ ] Test dosyaları → FAIL.
- [ ] Uygula. `docs/kararlar.md` → T8'in "Şimdilik" sütununa karar 11'e gönderme.
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(narrator): add speech and silent narrators`.

### Task 10: Depo

**Dosyalar:**

- `package.json`, `pnpm-lock.yaml`, `docs/kararlar.md` (bağımlılık satırları);
- `src/services/id.ts`, `id.test.ts`;
- `src/services/repository/Repository.ts`, `db.ts`, `seedContent.ts`, `seedContent.test.ts`, `IndexedDbRepository.ts`, `IndexedDbRepository.test.ts`;
- `src/app/services.ts`.

**Kullanır:** tipler (Task 1), `splitPhraseUnits`.

**Üretir:**

```ts
export interface Repository { /* exactly as docs/mimari.md, "Depo" */ }
export class RepositoryUnavailableError extends Error {}               // name 'RepositoryUnavailableError', cause kept
export const dbName = 'tikir', schemaVersion = 1, contentVersion = 1;
export function openTikirDb(): Promise<IDBPDatabase<TikirSchema>>;     // stores below; global indexedDB
export function bookFromSeed(json: SeedBook): Book;                     // ' | ' → phrase units; stats dropped
export function seriesBook(): Book;
export function seedPassages(): Passage[];
export class IndexedDbRepository implements Repository { static open(): Promise<IndexedDbRepository> }
export function createId(): string;                                     // RFC 4122 v4 from crypto.getRandomValues
// src/app/services.ts
export function appRepository(): Promise<Repository>;                  // one shared instance per page
```

**Depolar:**

| Depo | Anahtar |
|---|---|
| `meta` | anahtar adı |
| `parent`, `child`, `drill` | tek kayıt, anahtar `'current'` |
| `books` | `id` |
| `sessions` | `date` |
| `stuckWords` | `word` |
| `assessments` | `id` |
| `passages` | `id`, `grade` dizini |
| `recordings` | `id`; Task 11 kullanır, şema sürümü 1'de kurulur |

**Adımlar:**

- [ ] Önce `docs/kararlar.md` → Bağımlılıklar: `idb` ve `fake-indexeddb` (geliştirme) satırları.
- [ ] Kur: `pnpm add idb` ve `pnpm add -D fake-indexeddb`.
- [ ] **Kırmızı:**
  - **`id.test.ts`:** 100 kimliğin hepsi farklı ve `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/` kalıbında. `crypto.randomUUID` yokken de çalışır.
  - **`seedContent.test.ts`:**
    - Seri kitabın 5 bölümü, `totalChapters` 12.
    - 4. bölümün 1. sayfasının ilk cümlesi `['Deniz sırt çantasını','omzuna aldı.']`; `stats` alanı yok.
    - `seedPassages()` 5 metin.
  - **`IndexedDbRepository.test.ts`** (`import 'fake-indexeddb/auto'`; her testten önce `globalThis.indexedDB = new IDBFactory()`):
    1. **İlk açılış:**
       - `listBooks()` → seri kitap;
       - `listPassages(3)` → `['olcum-3a','olcum-3b']`;
       - `getParent()` ve `getChild()` → `null`.
    2. **Gidiş dönüş:** veli, okuyucu, seans, kelime kartları, ölçüm ve öneri yazılıp aynen okunur; `getSession('2026-11-21')` kaydetmeden önce `null`.
    3. **Seans aralığı:** `listSessions('2026-11-16','2026-11-21')` iki ucu dahil, tarih sırasıyla.
    4. **Kartlar:** `saveStuckWords` bütün kümeyi değiştirir.
    5. **`clearAll()`:** kullanıcı verisi gider; seri kitap ve ölçüm metinleri yeniden vardır.
    6. **İkinci açılış:** aynı fabrikada kitabı çoğaltmaz.
    7. **Kullanılamayan depo:** `indexedDB` tanımsızken ya da `open()` fırlatırken `IndexedDbRepository.open()` `RepositoryUnavailableError` ile reddeder.
- [ ] Üç test dosyası → FAIL.
- [ ] Uygula. → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(repository): store app data in IndexedDB, seeded from seed/`.

### Task 11: Kayıt

**Dosyalar:** `src/services/recorder/Recorder.ts`, `RecordingStore.ts`, `PcmRecorder.ts`, `PcmRecorder.test.ts`, `docs/kararlar.md` (T21).

**Kullanır:** `AudioCapture`, `encodeWav`, `parseWav`, `rms`, `WavPlayer` (Faz 1); `openTikirDb` ve onun `recordings` deposu, `createId` (Task 10); `FakeAudioCapture` (Task 8); `sine` (`src/test/signal.ts`).

**Üretir:**

```ts
export interface RecordingInfo { id: Id; seconds: number; levels: number[] }   // levels: 0–1, peak = 1
export interface Recorder {
  start(audio: AudioCapture): Promise<void>; stop(): Promise<RecordingInfo>;
  play(id: Id): Promise<void>;   // calls the player's prepare() before its first await (iOS gesture)
  stopPlayback(): void; remove(id: Id): Promise<void>; get(id: Id): Promise<RecordingInfo | null>;
}
export interface StoredRecording { id: Id; createdAt: string; seconds: number; levels: number[]; wav: ArrayBuffer }
export interface RecordingStore { put(r: StoredRecording): Promise<void>; get(id: Id): Promise<StoredRecording | null>; remove(id: Id): Promise<void> }
export class IndexedDbRecordingStore implements RecordingStore {}
export const recordingLimits = { maxSeconds: 300, levelBars: 64 } as const;
export class PcmRecorder implements Recorder { constructor(store: RecordingStore, player: WavPlayer, limits?: Partial<typeof recordingLimits>) }
```

**Adımlar:**

- [ ] **Kırmızı:** `PcmRecorder.test.ts` (sahte depo ve sahte `WavPlayer`; bir test `IndexedDbRecordingStore` ile `fake-indexeddb` üzerinde):
  1. **Kayıt:**
     - Girdi: 440 Hz sinüsün 100 çerçevesi.
     - `stop()` → `seconds` 2, 64 düzey, en yüksek düzey 1.
     - Saklanan WAV `parseWav` ile 16 kHz'de 32 000 örnek.
  2. **Mikrofon kapalı:** `start()` "The microphone is not capturing" ile reddeder, çerçeveye abone olmaz.
  3. **Çalma:**
     - `play(id)` beklenmeden `player.prepare` çağrılmış olur.
     - `play` çalma bitince çözülür; `stopPlayback()` → `player.stop`.
  4. **Silme:** `remove(id)` → `get(id)` `null`.
  5. **Süre sınırı:** `{maxSeconds: 3}` ile 400 çerçeve → `seconds` 3.
  6. **Sıra hataları:** `start` olmadan `stop()` "Not recording" ile reddeder; `stop()` sonrası gelen çerçeve sayılmaz.
  7. **IndexedDB'de:** `IndexedDbRecordingStore` ile kayıt, yeni bir `PcmRecorder` örneğinden `get` edilebilir.
- [ ] `pnpm test src/services/recorder/PcmRecorder.test.ts` → FAIL.
- [ ] Uygula. `docs/kararlar.md` → T21 (karar 10).
- [ ] → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(recorder): record readings as WAV on the device`.

### Task 12: Demo profili yükleyicisi ve vitrin düğmeleri

**Dosyalar:**

- `src/features/dev/demo/loadDemoProfile.ts`, `loadDemoProfile.test.ts`, `DemoProfileSection.tsx`, `DemoProfileSection.module.css`, `DemoProfileSection.test.tsx`, `copy.ts`;
- `src/features/dev/showcase/ShowcasePage.tsx`;
- `src/app/router.tsx`, `src/app/services.ts`;
- `e2e/demo-profile.spec.ts`.

**Kullanır:**

- `Repository`, `appRepository`, `bookFromSeed`, `createId` (Task 10);
- `simulateReading`, `toWordResults` (Task 6);
- `toReadingResult`, `readingLevel`, `countMiscues` (Task 3);
- `chapterTokens`, `syllabify`, `tokenize` (Task 2);
- `addDays`, `weekdayOf` (Task 1);
- Task 4–5 işlevleri (yalnız testte).

**Üretir:**

```ts
export const demoModes = ['cocuk-sabahi', 'veli-haftasonu'] as const;
export type DemoMode = (typeof demoModes)[number];
export function anchorDate(mode: DemoMode, today: LocalDate): LocalDate;   // day-0 date: today, or the last Sunday ≤ today
export interface DemoSummary { mode: DemoMode; anchor: LocalDate; sessions: number; stuckWords: number; assessments: number }
export function loadDemoProfile(repository: Repository, mode: DemoMode, today: LocalDate): Promise<DemoSummary>;
export function DemoProfileSection(props: { repository: () => Promise<Repository>; today: () => LocalDate }): JSX.Element;
```

**Yükleme sırası:**

1. `clearAll()`.
2. Veli (seed'deki onay) ve okuyucu.
3. Kitaplıktaki iki örnek kitap (`seed/ornek-kitaplar.json` → `books`).
4. Seanslar. Filtre: `cocuk-sabahi` için gün < 0, `veli-haftasonu` için gün ≤ 1. Her seans için:
   - `step` `'done'`, yanıtlar seed'den;
   - başlangıç o günün 09:00'ı, bitiş `+minutes`;
   - her okuma: bölümün söyleyişleri → `simulateReading` → `toReadingResult`, okuyucunun yazı ayarıyla.
5. Kipin kartları:
   - heceler `syllabify` ile hesaplanır;
   - zincir bütün kitapların `chains` alanından alınır;
   - `dueDay` → tarih.
6. Ölçümler. Filtre seanslarla aynı. Her ölçüm:
   - süreli okumayla benzetilir; `prosodyScore` ve `trial` seed'den gelir;
   - deneme ölçümünün yazı ayarı okuyucunun ayarıyla birleştirilir;
   - çıkan `wcpm` seed'dekinden farklıysa `Error`.
7. Öneri: `veli-haftasonu` için var, ötekinde `null`.

Vitrin rotası `ShowcasePage`'e `repository` ve `today` (`localDateOf(new Date())`) verir. Ses denemesi gibi tembel yüklenir.

**Adımlar:**

- [ ] **Kırmızı:**
  - **`loadDemoProfile.test.ts`** (`fake-indexeddb`, bugün `'2026-11-19'`, perşembe):
    1. **Bağlantı tarihi:**
       - `anchorDate('cocuk-sabahi', '2026-11-19')` → `'2026-11-19'`;
       - `anchorDate('veli-haftasonu', '2026-11-19')` → `'2026-11-15'`;
       - `anchorDate('veli-haftasonu', '2026-11-22')` → `'2026-11-22'`;
       - seed'in `load` metinleri `'day < 0'` ve `'day <= 1'`.
    2. **`cocuk-sabahi`:**
       - özet `{sessions: 4, stuckWords: 4, assessments: 6}`;
       - seans tarihleri `['2026-11-14','2026-11-15','2026-11-17','2026-11-18']`, her okumanın `wcpm`'i seed'deki;
       - bugünün seansı yok; onay `voiceProcessing: true`; okuyucu Deniz, 3. sınıf.
       - G1: `nextSeriesChapter` → 4, `completedSeriesChapters` → `[1,2,3]`, `streakDays` → 2.
       - G2: `warmupDeck` → `['kıvrılıyordu','ağaçlarının','belirdiğinde']`; kalan 2; "tırmanmaya"nın günü `'2026-11-20'`.
       - G7: `typical` 3. okuma 4. bölümde → `wcpm` 71; `previousReading(…, 3).wcpm` → 67; `deltaFromPrevious` → 4.
    3. **`veli-haftasonu`:**
       - **Seanslar:** tarihler `'2026-11-09'`, `'2026-11-10'`, `'2026-11-12'`, `'2026-11-13'`, `'2026-11-14'`; günler `weekdayOf` ile pazartesi, salı, perşembe, cuma, cumartesi.
       - **Ölçümler:** 8 ölçüm; her birinin `wcpm`, `correctWords`, `wordsAttempted` ve yüzdelik doğruluğu seed'deki. Son deneme olmayan ölçümün düzeyi `instructional`.
       - **Grafik:** deneme olmayan ölçümlerin `wcpm`'i tarih sırasıyla `[58,60,63,65,67,71]`.
       - **Hatalar:** bütün seans okumalarında `countMiscues` → yanlış okuma 9, ek 7, atlama 6, tekrar 5, ekleme 3 (toplam 30).
       - **Yazı ayarı ortalamaları:** son iki deneme olmayan ölçüm 69, son iki deneme ölçümü 72.
       - **Hedef:** `firstTarget(58)` seed'in `targetWcpm` değerine (70) eşit.
    4. **Tekrar:** aynı kipi iki kez yüklemek aynı sayıları verir.
  - **`DemoProfileSection.test.tsx`:**
    - Bölüm, depodaki sayıları gösterir ("Depo boş." ya da "Depoda 4 seans, 4 kelime kartı, 6 ölçüm var.").
    - Düğmeyle "Kuruluyor…", ardından "Kuruldu: Çocuk sabahı (G1–G7)." görünür.
    - Depo `RepositoryUnavailableError` ile reddederse "Kurulamadı (RepositoryUnavailableError: …). Sayfayı yenileyip yeniden dene." görünür.
  - **`e2e/demo-profile.spec.ts`** (Chromium ve WebKit):
    - vitrinde "Çocuk sabahı (G1–G7)" → "Depoda 4 seans, 4 kelime kartı, 6 ölçüm var.";
    - sayfa yenilenince aynı metin;
    - "Veli hafta sonu (V1–V4)" → "Depoda 5 seans, 4 kelime kartı, 8 ölçüm var.".
- [ ] İlgili testler → FAIL.
- [ ] Uygula. → PASS.
- [ ] `caffeinate -u -t 2; caffeinate -d -i pnpm e2e e2e/demo-profile.spec.ts e2e/no-external-requests.spec.ts` → geçer. Vitrinin Faz 0 envanter ve taşma testleri de geçer.
- [ ] `pnpm check` → geçer.
- [ ] Commit: `feat(dev): load the demo profile from the showcase`.

### Task 13: Sayfalar, okuma durumu ve mikrofon kapısı

**Dosyalar:** `src/features/reading/pages.ts`, `pages.test.ts`, `readingState.ts`, `readingState.test.ts`, `useMicrophone.ts`, `useMicrophone.test.tsx`.

**Kullanır:**

- `chapterTokens` (Task 2);
- `ListenerEvent`, `scenarioSets` (Task 6);
- `FakeListener` (testte, Task 8);
- `FakeAudioCapture` (Task 8);
- `isCountedError` (Task 3);
- `helpThresholdMs`, `hesitationMarkMs`;
- `WordMark` (Faz 0, `ReadingText`).

**Üretir:**

```ts
// pages.ts
export type PageLayout = 'content' | 'design';
export interface ScreenPage { page: Page; firstIndex: number; wordCount: number; unitCount: number }
export function screenPages(chapter: Chapter, layout?: PageLayout): ScreenPage[];  // 'design': [0,1] + [2…]; one-page chapters stay one page
export function screenPageOf(pages: readonly ScreenPage[], wordIndex: number): number;
// readingState.ts
export interface ReadingView { position: number; results: ReadonlyMap<number, WordResult>;
  hesitation: { index: number; ms: number } | null; helpIndex: number | null; ended: 'completed' | 'stopped' | null }
export const initialReadingView: ReadingView;
export function reduceReading(view: ReadingView, event: ListenerEvent): ReadingView;
export function wordMarks(view: ReadingView): Partial<Record<number, WordMark>>;
export function readingCounters(view: ReadingView): { correct: number; stuck: number };
// useMicrophone.ts
export type MicrophoneState = CaptureState | 'noConsent';
export function useMicrophone(audio: AudioCapture, consent: boolean): { state: MicrophoneState; start(): void; stop(): void };
```

**Adımlar:**

- [ ] **Kırmızı:**
  - **`pages.test.ts`:**
    - 4. bölüm:
      - içerik düzeni 6 sayfa; `firstIndex` `[0,25,45,59,73,88]`, `wordCount` `[25,20,14,14,15,11]`;
      - `'design'` düzeni 2 sayfa; `firstIndex` `[0,45]`, `wordCount` `[45,54]`; ilk sayfa 7 cümle, 18 ünite;
      - `screenPageOf(design, 44)` → 0, `45` → 1.
    - 5. bölüm `'design'` → sayfa grupları `[0,1]` ve `[2..6]`.
    - Tek sayfalık bölüm `'design'` düzeninde tek sayfa.
  - **`readingState.test.ts`:**
    - **Olaylar:**
      - `position` konumu taşır; `word` sonucu ekler.
      - `hesitation` yalnız geçerli kelimede saklanır.
      - Geçerli kelimede `ms` 3000 ve üstüyse `helpIndex` olur; o kelimenin sonucu gelince `null`.
      - `end` → `ended`.
    - **`design` anı:** `design` 2. okumanın olayları 4. bölümde yardım açılana kadar beslenir. Sonuç:
      - `position` 14, `helpIndex` 14;
      - `readingCounters` → `{correct: 13, stuck: 1}`;
      - `wordMarks` → `{6: 'hesitation', 9: 'error'}`.
    - **İşaret kuralları:**
      - `helped` → `'hesitation'`;
      - `repeated` → işaret yok;
      - 1500 ms duraksamalı `misread` → `'error'`.
  - **`useMicrophone.test.tsx`:**
    - Onay yokken `start()` → durum `'noConsent'`, `audio.start` hiç çağrılmaz.
    - Onay varken `start()` → `audio.start` bir kez; durum mikrofonun durumunu izler.
    - Bileşen kaldırılınca `audio.stop` çağrılır.
- [ ] Üç test dosyası → FAIL.
- [ ] Uygula. → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(reading): add screen pages, reading state and the microphone gate`.

### Task 14: `useReading` ve `useNarration`

**Dosyalar:** `src/features/reading/useReading.ts`, `useReading.test.tsx`, `useNarration.ts`, `useNarration.test.tsx`.

**Kullanır:**

- `reduceReading`, `wordMarks`, `readingCounters`, `ScreenPage` (Task 13);
- `ghostIndex`, `raceLead` (Task 5);
- `ReadingListener`, `ListenerOutcome` (Task 6);
- `Narrator`, `SilentNarrator` (Task 9);
- `ChapterToken`, `syllabify` (Task 2);
- `FakeListener`, `FakeAudioCapture` (Task 8).

**Üretir:**

```ts
export interface UseReadingOptions {
  listener: ReadingListener; audio: AudioCapture; narrator: Narrator; tokens: readonly ChapterToken[];
  ghostPaceWpm: number | null; onFinish(outcome: ListenerOutcome): void; now?: () => number;
}
export interface ReadingController {
  view: ReadingView; marks: Partial<Record<number, WordMark>>; counters: { correct: number; stuck: number };
  elapsedMs: number; ghostIndex: number | null; raceLead: number | null;
  helpIndex: number | null; helpSyllables: string[] | null; paused: boolean;
  start(): Promise<void>; pause(): void; resume(): void; finish(): Promise<void>;
}
export function useReading(options: UseReadingOptions): ReadingController;
export interface NarrationController {
  pageIndex: number; currentUnit: number | null; readUnits: number; elapsedMs: number; totalMs: number;
  finishedOnce: boolean; playing: boolean;
  play(): void; pause(): void; resume(): void; restart(): void; setRate(rate: NarrationRate): void;
}
export function useNarration(options: { narrator: Narrator; pages: readonly ScreenPage[]; now?: () => number }): NarrationController;
```

**Davranış:**

- **Başlatma:** `start()` dinleyiciyi söyleyişlerle başlatır. Mikrofonu açmak çağıranın işidir (`useMicrophone`).
- **Saat:** Geçen süre 250 ms'de bir güncellenir. Şu durumlarda donar:
  - duraklatılınca;
  - mikrofon dinlemiyorken;
  - 3000 ms duraksama olayından dinleyicinin `resume()`'una kadar.
- **Yardım:** `helpIndex` olunca sırasıyla:
  1. `listener.help(i)`;
  2. `narrator.speakWord(tokens[i].spoken)`;
  3. seslendirme bitince `listener.resume()`.

  Seslendirme sırasında `pause()` seslendirmeyi de duraklatır.
- **Bitiş:**
  - `end completed` ya da `finish()` → `listener.stop()` → `onFinish` tam bir kez çağrılır.
  - Bileşen kaldırılırsa dinleyici ve seslendirme durur.
- **`useNarration`:**
  - Sayfa sonunda sıradaki sayfa kendiliğinden gelir. Son sayfa bitince `finishedOnce` olur.
  - `totalMs` geçerli sayfanın tahminidir.
  - `restart()` başa döner ama `finishedOnce`'ı korur.

**Adımlar:**

- [ ] **Kırmızı:**
  - **`useReading.test.tsx`** (`renderHook`, sahte zaman):
    1. **`design` anı:**
       - Girdi: `design` 2. okuma, 4. bölüm, `ghostPaceWpm` 40.
       - Yardım anında:
         - `helpIndex` 14, `helpSyllables` `['a','ğaç','la','rı','nın']`;
         - `elapsedMs` 19 000 ile 19 500 ms arasında, `ghostIndex` 12, `raceLead` 2;
         - `counters` `{13, 1}`;
         - `speakWord('ağaçlarının')` çağrıldı.
       - Seslendirme sürerken 1 sn ilerletmek `elapsedMs`'i değiştirmez.
       - Seslendirme bitince: 14 `helped`, konum 15, `helpIndex` `null`, saat yeniden işler.
    2. **Duraklatma:** `pause()` saati ve hayaleti dondurur, olay gelmez; `resume()` sürer.
    3. **Mikrofon kesintisi:**
       - Mikrofon `idle` olunca saat donar, `capturing` olunca sürer.
       - Yardım seslendirmesi sırasında kesinti: seslendirme ve mikrofon dönünce okuma sürer.
    4. **Bitiş:**
       - `finish()` → `onFinish` bir kez, sonuçlar konuma kadar.
       - `smooth` 3 kelimelik tam okuma → `onFinish` bir kez, `seconds` 3.
    5. **Hayalet yok:** `ghostPaceWpm` `null` → `ghostIndex` ve `raceLead` `null`.
    6. **Kaldırma:** Okuma sürerken bileşen kaldırılırsa zamanlayıcı çalışmaz ve `narrator.stop` çağrılır.
  - **`useNarration.test.tsx`** (`SilentNarrator`, 4. bölümün `'design'` sayfaları):
    - **Akış:** `play()` → `currentUnit` 0. İlk sayfa bitince `pageIndex` 1. Son sayfa bitince `finishedOnce` olur, `playing` `false` olur.
    - **Süre:** ilk sayfanın `totalMs`'i yavaşta 47 000.
    - **Denetimler:**
      - `pause` ve `resume` çalışır;
      - `restart()` → sayfa 0, ünite 0, `finishedOnce` korunur;
      - `setRate('normal')` sonraki üniteden uygulanır ve `totalMs` yeniden hesaplanır;
      - bileşen kaldırılınca `narrator.stop` çağrılır.
- [ ] İki test dosyası → FAIL.
- [ ] Uygula. → PASS. `pnpm check` → geçer.
- [ ] Commit: `feat(reading): drive reading and narration from the listener and narrator`.

### Task 15: Belgeler ve 2a'nın denetimi

**Dosyalar:** `docs/mimari.md`, `docs/dinleme-hatti.md`, `docs/kararlar.md`, bu plan ("Kanıtlar").

- [ ] **`docs/mimari.md`:**
  - modül tablosuna `date.ts` ve `progress.ts`;
  - tiplere `LocalDate`, `hesitationMs`, `ReadingOutcome`;
  - `Narrator` arayüzündeki değişiklik (karar 11);
  - `Recorder` ve `PcmRecorder` (karar 10);
  - depo şeması ve içerik sürümü;
  - `src/services/listener`, `narrator`, `recorder`, `repository` klasörleri;
  - `notifyAll`.
- [ ] **`docs/dinleme-hatti.md` bölüm 2–3:**
  - yardım akışı (karar 5);
  - dinleyicinin mikrofona bağlılığı (karar 14);
  - senaryo tablosu (karar 4).
- [ ] **`docs/kararlar.md`:** değişiklik günlüğüne 2a satırı.
- [ ] **Denetim:**
  - `pnpm check`;
  - `pnpm build`; `dist/` içinde `demo-profil`, `FakeListener` ve `gelistirme` olmamalı;
  - `caffeinate -u -t 2; caffeinate -d -i pnpm e2e`.

  Çıktılar "Kanıtlar"a yazılır. "2a'nın ölçütlere katkısı" tablosunun her satırının yanına kanıtın test adı yazılır.
- [ ] Commit: `docs: record phase 2a decisions and evidence`.

Sonra bütün dal bağımsız bir incelemeden geçer (executing-plans → "Final Review"). Düzeltmeler tek geçişte yapılır.

## Açık sorular (onayı beklemez)

1. **Diğer sayı biçimleri** (karar 2): ondalık, yüzde, saat ve binlik ayracı. Faz 5'te velinin yapıştırdığı metinde gerekir; o fazdan önce sorulur.
2. **`design` senaryosunda telefondaki sayfa** (karar 3): 45 kelimelik birleşik sayfa telefonda tasarımdakinden uzun olacak. 2b'nin ekran karşılaştırmasında fark olarak yazılır, gerekirse sorulur.
3. **`struggling` konumları** test verisidir. Bir öğretmen gerçekçi bir zorlanma profili verirse değiştirilir.

## Kanıtlar

Uygulama sırasında doldurulur.
