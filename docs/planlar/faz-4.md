# Faz 4: Veli karnesi ve haftalık ölçüm

**Durum:** onaylandı (2026-11-20). Dal: `faz-4`.

> **Uygulayıcı için:** Görevler `superpowers:executing-plans` ile sırayla uygulanır; adımlar `- [ ]` ile izlenir. Her görev önce kırmızı testle başlar.

- **Amaç:** Velinin karnesi (V1–V3) gerçek seans ve ölçüm verisinden; çocuğun haftalık 1 dakikalık ölçümü; hedefin güncellenmesi, ek zincirinin ısınmaya eklenmesi, onay bekleyen kayıtlar, hesap ve veri silme; karnede dinlenmeden okunan günler.
- **Mimari:** Faz 3'ün kalıpları sürer. Haftalar, hedef, yorum durumu, hata sayımı ve ölçüm planı `src/domain`'de saf işlevlerdir. Ekranların hazır verisi `src/features/parent/views.ts`'te kurulur. Yazılar seans deposunun eylemleridir; eylem yazılarını bitirince yayınlar. Kayıt ve paylaşım `src/services`'te, aygıtlardan gelir.
- **Teknoloji:** React 19, react-router 8, Zustand 5, IndexedDB (`idb`), Vitest 5 ve Testing Library, Playwright (Chromium ve WebKit). Yeni bağımlılık yok.
- **Dayanak:** Bu belgenin "Kararlar" bölümü; `docs/ekranlar.md`, `docs/urun.md`, `docs/kararlar.md` ve `design/ekranlar/`.

**Okunanlar:** `docs/yol-haritasi.md` (Faz 4), `docs/ekranlar.md` ("Veli karnesi", "Tasarımı olmayan durumlar"), `docs/urun.md` (bölüm 2, 3, 4, 7, 8), `docs/kararlar.md` (P7, P8, P13, P14, P15, D16), `docs/planlar/faz-3.md` ("Açık sorular"), `seed/demo-profil.json` (`expected`, `veli-haftasonu`), `design/ekranlar/V1…V3-*.html`, mevcut kod (Faz 3 sonu).

## Kapsam

**Girenler:**

- V1 Haftalık özet, V2 Takılınan yerler, V3 Ölçüm sonucu: gerçek seans ve ölçüm verisinden, boş durumlarıyla.
- Haftalık ölçüm: G1'de ölçüm kartı ve K3 kalıbında ölçüm ekranı; deneme açıksa iki ayar arka arkaya.
- "Hedefi güncelle", "Isınmaya ekle", onay bekleyen kayıtlar (dinle, onayla, sil), "Öğretmenle paylaş", "Kaydı dinle", V2'de kelimenin okunuşunu dinleme.
- Hesap sayfası: ses onayını ve haftalık e-postayı değiştirme (Faz 3 planı, açık soru 2), kayıtları dinleme ve silme, hesabı silme.
- Karnede dinlenmeden okunan günler (P13, P14).
- Faz 3'ten ertelenen küçük bulgu 1: ince "l" ile biten adların iyelik eki (V1'in başlığı da bunu kullanır).

**Girmeyenler:**

- Arka uç: haftalık özet e-postasının gönderilmesi, onaylanan kaydın aileyle paylaşılması, ek zinciri önerisinin hesaplanması (Faz 6). Öneri yalnız veri hazır geldiğinde görünür (demo profilindeki `suggestedDrill`).
- Gerçek tonlama puanı (Faz 6); sahte dinleyicide senaryodan gelir.
- U2 Metinden kitap ve "Kitaplar" sekmesi (Faz 5).
- Faz 3'ten ertelenen öteki küçük bulgular (`docs/planlar/faz-3.md`, "Son incelemeden ertelenen küçük bulgular").

## Ürün sahibinin yanıtları (2026-11-20)

1. **Ölçüme giriş:** Ölçüm günü G1'de bir ölçüm kartı çıkar; çocuk seanstan önce ya da sonra başlatır, seans ayrı kalır. Ölçüm son ölçümden 7 gün sonra açılır ve yapılana kadar açık kalır.
2. **"Hedefi güncelle":** Kuralın hedefini onaylatır. Hedef geçildiyse düğme görünür; pencerede yeni hedef (eski hedefin 8 fazlası) yazar, veli onaylar. Hedef geçilmediyse düğme görünmez.
3. **"Öğretmenle paylaş":** Cihazın paylaşma penceresi ölçüm özetini kısa bir metin olarak açar; paylaşma yoksa metin panoya kopyalanır.
4. **Tek metinli sınıflarda deneme:** 1., 2. ve 4. sınıfta iki ayar aynı metinle arka arkaya okunur; hangisinin önce okunacağı her hafta değişir. İkinci metin eksiği kararlara yazılır.
5. **Faz 3'ün açık onayları** ("bence ok"): P15 (seviye tespitinin dakikası) ve D16'ya eklenen iki V4 cümlesi kesinleşir; K4'te endişe düzeyinde etiket gösterilmez, doğruluk görünür.

## Kararlar (onaya sunulan)

### Veri ve depo

1. **Hedef geçmişi:** Çocuk kaydı hedef değişikliklerini tutar: `Child.goals?: GoalChange[]`, `GoalChange { targetWcpm: number; setOn: LocalDate }`.
   - Bir haftanın hedefi, o haftanın pazartesisinden önce konan son hedeftir. Hiç hedef konmadıysa ilk hedeftir: `firstTarget(başlangıç)`. Başlangıç, ilk denemesiz ölçümdür (seviye tespiti ya da ilk haftalık ölçüm).
   - Ölçüm yoksa hedef de yoktur; grafik hedef çizgisi çizmez.
   - Hafta içinde konan hedef sonraki haftadan geçerlidir; böylece geçmiş haftaların yorumu sonradan değişmez.
2. **"Hedefi güncelle"** (yanıt 2):
   - Düğme yalnız son denemesiz ölçümün haftasında görünür: ölçüm o haftanın hedefini geçtiyse (eşitlik dahil, Faz 2a karar 17) ve önerilecek hedef `nextTarget(haftanın hedefi)` son konan hedeften büyükse.
   - Pencere yeni hedefi gösterir; "Güncelle" `setGoal(yeniHedef)` ile bugünün tarihini yazar ve düğme kaybolur.
   - Telefon tasarımında düğme yoktur. Hedefin tek girişi olduğu için telefonda da grafik kartının altında görünür (`TODO(design)`; görüntü farkı olarak yazılır).
3. **Haftalık ölçümün kaydı:** `saveMeasurement(outcome, meta)` bir `Assessment` yazar: bugünün tarihi, metin, sonuç (yazı ayarı ve kayıt kimliği içinde), düzey ve denemeyse `trial: true`. Deneme haftasında iki kayıt olur; karnenin değeri denemesiz olandır (`docs/urun.md` bölüm 7). `trial: true` denenen ayarla yapılan okumadır; önce ya da sonra okunmuş olabilir.
4. **Kayıtlar:** `Recorder` arayüzü genişler:
   - `list()`: bütün kayıtlar (kimlik, oluşturulma zamanı, süre, onay);
   - `approve(id)`: onay `'approved'` olur. `RecordingInfo.approval?: 'pending' | 'approved'`. Onaylanan kayıt arka uç gelince aileyle paylaşılır; şimdilik cihazda kalır;
   - `play(id, range?)`: `range` verilirse kaydın yalnız o dilimi çalar (`sliceWav`, saf). Kayıt okumanın kendi saatini izlediği için (Faz 2b) kelimenin `tStart`–`tEnd`'i kayıttaki yeridir.
5. **Kayıt silme:** `deleteRecording(id)` eylemi sesi siler ve seans okumalarındaki ve ölçümlerdeki `recordingId` göndermesini kaldırır. G5, Stüdyo ve V3 kaydı artık görmez.
6. **Hesap silme:** `deleteAccount()` → `clearAll()` (kayıtlar dahil) → depo boşalır, uygulama kuruluma (K1) gider.
7. **Onayın değiştirilmesi** (Faz 3 planı, açık soru 2): `setConsent({ voiceProcessing, weeklyEmail })`.
   - Ses onayı verilince `grantedAt` yazılır; geri alınınca silinir.
   - Onay geri alınınca mikrofon kapanır (`useMicrophone`). Seansın kalanı ve sonraki günler dinlemesiz yürür (P13); yazılmış okumalar ve kayıtlar kalır, veli aynı sayfadan silebilir.
8. **Ek zinciri:** Günün verisi öneriyi de taşır (`SessionData.drill`). `addDrillToWarmup()`:
   - Önerinin kelimelerinden kartı olmayanlar `wild` kart olur: kaçırma 0, heceler `syllabify`, zincir seride varsa oradan, yoksa boş.
   - Günleri yarından başlayarak ikişer ikişer verilir (6 kelime → 3 gün).
   - Öneri silinir; var olan kartlar değişmez.
   - Isınma destesinin kuralı değişmez (en çok 3 kart, en çok kaçırılan önce): eski kartlar yeni kartlardan önce gelir.
9. **Dinlenmeden okunan gün:** Seansı biten bir gün, seans `unheard` ise (P14) ya da saklanmış okuması yoksa (P13: dinlenmeyen okuma saklanmaz) dinlenmeden okunmuş sayılır. Kural bugünkü onaya bakmaz; onay sonradan değişse de geçmiş günler değişmez.
10. **Sınıf ortalaması** `config`'e girer: 3. sınıf 90, 4. sınıf 98; 1. ve 2. sınıf için yok (`docs/urun.md` bölüm 2, P8).

### V1 Haftalık özet

11. **Hafta:**
    - Hafta pazartesi başlar (`weekStart`).
    - Haftanın ölçümü o haftadaki denemesiz son ölçümdür; seans günleri o haftada biten seanslardır.
    - Açılış haftası, içinde ölçüm ya da biten seans olan en son haftadır.
    - Hafta okları yalnız veri olan haftalar arasında gezer; uçta pasiftir.
12. **Dört sayı:**
    - Doğru kelime; yanında "Geçen haftadan {n} fazla" (önceki ölçülmüş haftaya göre; yalnız artıysa, G7'deki gibi).
    - Doğruluk `%{n}` (yuvarlanmış; formül %93 verir, tasarım %94 yazar: tutarsızlık 1).
    - Tonlama `{n} / 4` (yoksa "–").
    - Seans günü `{n} / 7`.
    - Haftanın ölçümü yoksa ilk üç sayı "–" olur.
    - Etiketler genişliğe göre tasarımdan: telefonda kısa ("doğru kelime / dk", "tonlama", "gün"), tablet ve webde uzun ("doğru kelime bir dakikada", "tonlama puanı", "gün seans").
13. **Grafik:**
    - Seçili haftaya kadar son altı ölçülmüş hafta.
    - Etiket "{n}. hafta"; sayım başlangıç ölçümünün haftasından başlar.
    - Hedef çizgisi seçili haftanın hedefidir; sınıf ortalaması karar 10'daki gibidir.
    - Erişilebilir adı tasarımın cümlesidir ("Altı haftada doğru kelime sayısı 58’den 71’e çıktı; hedef 70, 3. sınıf ortalaması 90"). Hafta sayısı, yön, hedef ve ortalama veriye göre değişir (D17); sayıların ekleri Task 1'deki yardımcılarla.
14. **Seans günleri şeridi:**
    - Pazartesiden pazara yedi gün: bitti, dinlenmeden okundu (karar 9) ya da boş.
    - Dinlenmeden okunan gün işaretini taşır. Şeridin altında "{n} gün dinlemeden okundu." yazar (`TODO(design)`).
    - Erişilebilir adı tasarımdan: "Bu hafta 7 günün 5’inde seans yapıldı"; seans yoksa D17.
    - Telefon tasarımında şerit yoktur ve telefonda gizlenir. "{n} gün dinlemeden okundu." satırı telefonda küçük sayıların altında görünür (P14).
15. **Yorum cümlesi** (ölçüt 3):
    - Haftanın ölçümü varsa: başlangıç ölçümüyse "ilk ölçüm" cümlesi; hedef geçildiyse tasarımın cümlesi (yeni hedefle); değilse "hedefe yaklaşıyor" ("{ad} hedefe {n} kelime uzakta.").
    - Ölçüm yoksa: onay yoksa "dinleme kapalı", varsa "bu hafta ölçüm yok".
    - Onay sonradan geri alınsa da ölçümü olan hafta sayısıyla yorumlanır.
16. **Boş durum:** Hiç seans ve ölçüm yoksa sayıların yerine kart içinde tek cümle (`docs/ekranlar.md`, "Boş durumlar").

### V2 Takılınan yerler

17. **Hafta:** V2'de hafta seçici yok; hafta V1'in açılış haftasıdır.
18. **Hata türleri:**
    - Haftanın dinlenen seans okumalarından beş tür sayılır: yanlış okuma, ek hatası, atlama, tekrar, ekleme.
    - Yardım alınan kelime, kendini düzeltme ve ölçüm okumaları sayılmaz.
    - Başlık "Bu hafta {n} hata, {k} türde".
    - Ek hatası satırındaki örnek ("geliyordu yerine geliyor") yalnız kelime sonucunda `heard` varsa görünür; demoda yoktur (fark listesine). Telefon tasarımında örnek satırı yoktur.
19. **En çok takılınan kelimeler:**
    - Kartlardan en çok kaçırılan dört kelime (telefonda üç, tasarımdaki gibi; eşitlikte Türkçe alfabe sırası): heceler, "{n} kez", durum etiketi.
    - Dinleme düğmesi kelimenin kayıtlı bir okumada geçtiği en son yerin dilimini çalar; kayıt yoksa gizlidir. Demonun eski seanslarında kayıt yoktur, düğmeler demoda gizlidir (fark listesine).
20. **Ek zinciri kartı:** Öneri varken görünür; metni genişliğe göre tasarımdan (telefonda kısa: "Ek zinciri ısınması", "Önerilen: 6 kelime, 3 gün", "Ekle"). "Isınmaya ekle" karar 8'i yürütür; kartın yerine "{n} kelime ısınmaya eklendi." satırı gelir.
21. **Onay bekleyen kayıtlar** (`docs/ekranlar.md`'nin varsayılanı): V2'nin altında, onayı `'pending'` olan kayıtlar. Her satırda hangi okuma olduğu, "Dinle", "Onayla" ve "Sil" vardır. Silme onay penceresi açar. Liste boşsa bölüm görünmez.

### V3 Ölçüm sonucu

22. **İçerik:**
    - Son denemesiz ölçüm; başlıkta tarihi ("16 Kasım Pazar").
    - Doğru kelime, "{n} kelime okudu", "{n} hata", "Doğruluk %{n}".
    - Okuma düzeyi bandı (etiketler tasarımdan; "%90–98" tutarsızlık 7).
    - Düzey cümlesi: öğretim düzeyininki tasarımdan; endişe ve serbest düzeyinki D17'den. V3 velinindir; endişe düzeyi burada adıyla görünür.
23. **Alıntı:**
    - Ölçüm metninin ilk dört cümlesi.
    - "Yanlış okuma" işareti: yanlış okuma, ek hatası, atlama.
    - "Takılma" işareti: yardım alınan kelime ya da 1 saniye ve üstü duraksama.
    - Okunmayan kelimeler işaretsizdir.
    - Telefon tasarımında alıntı yoktur.
24. **Sıradaki ölçüm:** Son denemesiz ölçüm + 7 gün. Tarih bugün ya da geçmişse "Sıradaki ölçüm bugün" yazar.
25. **"Kaydı dinle":** Ölçümün kaydı varsa görünür.
26. **"Öğretmenle paylaş"** (yanıt 3):
    - `ShareService.share({ title, text })`: önce `navigator.share`, yoksa panoya yazma. İkisi de yoksa düğme görünmez.
    - Metin D17'de: ad ve sınıf, tarih, sayılar, düzey. Ses ya da e-posta gitmez.
    - Panoya kopyalanınca kısa bir onay satırı görünür.
27. **Boş durum:** Ölçüm yoksa kart içinde tek cümle.

### Haftalık ölçüm (yanıt 1 ve 4)

28. **Ne zaman açık:**
    - Veli onayı yoksa hiç açılmaz.
    - Onay varsa ve hiç denemesiz ölçüm yoksa hemen açıktır (seviye tespiti atlandıysa ilk ölçüm budur).
    - Varsa son denemesiz ölçümden 7 gün sonra açılır ve yapılana kadar açık kalır.
    - Günün seansından bağımsızdır.
29. **G1'de ölçüm kartı** (`TODO(design)`):
    - Ölçüm açıkken "bugün" sütununda, bölüm kartının altında durur: "1 dakikalık ölçüm" ve "Ölçüme başla". Günün seansı ana iş olarak kalır.
    - Dokunuş mikrofonu açar (T22) ve `/olcum`'a gider.
30. **Metin:**
    - Sınıfın metinleri kimlik sırasıyla dizilir; bir önceki ölçümün metni verilmez. Sınıfta tek metin varsa o verilir.
    - Deneme açıksa ikinci okuma için öbür metin verilir. Tek metinli sınıfta aynı metin okunur (yanıt 4).
31. **Deneme sırası:**
    - İki ayardan hangisinin önce okunacağı haftadan haftaya değişir: önceki deneme haftalarının sayısı çiftse geçerli ayar, tekse denenen ayar önce okunur. İlk deneme haftasında geçerli ayar öndedir.
    - Sıra kayıtların saatine bakmaz; yarım kalan bir hafta sırayı bozmaz.
    - Bir hafta yarım kaldıysa (yalnız bir okuma yazıldı), ölçüm açık kalır ve yalnız eksik okuma yapılır.
32. **Ekran:**
    - Odak kabuğu: başlık "1 dakikalık ölçüm", "Geri dön" G1'e götürür.
    - K3'ün okuma gövdesi ortak bileşen olur (`MeasurementReading`): kart, geri sayım, mikrofon, "Okumayı bitir", yardım ve dakikanın sonu (P15).
    - Tıkır ve balonu yan sütundadır. Her okuma kendi metni ve kendi yazı ayarıyla görünür.
    - Denemede "1. okuma / 2" çipi görünür. İkinci okuma, çocuk mikrofona dokununca başlar (mikrofon açık kalır, okuma bekler).
    - Sonuç sayıları çocuğa gösterilmez; bitince G1 açılır, kart kalkar.
33. **Kayıt ve yarıda bırakma:** Her okuma kaydedilir (onay vardır). Yarıda bırakılan okuma ve kaydı yazılmaz.
34. **Mikrofon sorunu:** K3'teki gibi balon ve "Yeniden dene". Ölçüm dinlemeden yapılamaz, bu yüzden P14 seçeneği yoktur; çocuk "Geri dön" ile çıkar, kart açık kalır.
35. **Adres:** `/olcum` dinleyen adreslere girer. Ölçüm açık değilse G1'e gider.

### Hesap sayfası

36. **`/veli/hesap`** (kapının arkasında):
    - "Onaylar": ses onayı ve haftalık e-posta anahtarları; metinleri K1'deki gibi.
    - "Kayıtlar": bütün kayıtlar; hangi okuma, tarih ve süre, "Dinle" ve "Sil".
    - "Hesabı sil": açıklama ve onay penceresi; silinince kurulum açılır.
37. **Giriş** (`TODO(design)`): Ray ve kenar çubuğunun altında, "Çocuk ekranı"nın üstünde kalkan simgeli "Hesap" bağlantısı. Telefonda şeridin sağında, çıkış düğmesinin yanında 44 px'lik "Hesap" düğmesi.

### Diğer

38. **İyelik eki:** İnce "l" ile biten yaygın adlar için küçük bir istisna listesi: Bilal, Celal, Cemal, Hayal, Hilal, İkbal, Kemal, Meral, Nihal, Zülal → "Kemal’in", "Hilal’in". V1'in başlığı ("{ad}’in haftası"), K4 ve V4 bunu kullanır.
39. **Tarih biçimleri** (`src/features/parent/format.ts`):
    - Gün ve ay: "16 Kasım"; uzun tarih: "16 Kasım Pazar".
    - Hafta aralığı: "10–16 Kasım"; iki ayı kapsıyorsa "27 Ekim – 2 Kasım".
    - Kısa gün adları V1'in şeridinden: Pt Sa Ça Pe Cu Ct Pz.
    - Adlar `tr.ts`'te.
40. **Testler ve görüntüler:**
    - Demo profilinin `veli-haftasonu` kipinde V1–V4 `expected` değerlerini gösterir; görünüm testleri ve uçtan uca test (ölçüt 1).
    - Ölçüm akışı uçtan uca, sayfa saatini bir gün ileri alarak sınanır (demo profili `cocuk-sabahi`, ölçüm ertesi gün açılır; Deniz'de deneme açık olduğu için iki okuma).
    - Görüntü komutları "Tasarım karşılaştırması"nda.

## Tasarımı olmayan durumların metinleri (öneri)

Hepsi `TODO(design)`; onayla `docs/kararlar.md`'ye D17 olarak işlenir.

| Yer | Metin | Kaynak |
|---|---|---|
| V1, yorum: dinleme kapalı | Dinleme kapalı olduğu için ölçüm yapılmıyor. | önerilen |
| V1, yorum: ölçüm yok | Bu hafta ölçüm yapılmadı. | önerilen |
| V1, yorum: başlangıç ölçümü | {ad} bu hafta ilk ölçümünü yaptı. İlk hedef {n}. | tasarımın cümlesinden |
| V1, yorum: hedefe yaklaşıyor | {ad} hedefe {n} kelime uzakta. | önerilen |
| V1, grafiğin adı | {Sayı} haftada doğru kelime sayısı {ilk}’den {son}’e düştü · {Sayı} haftada doğru kelime sayısı değişmedi: {n} · tek ölçümde: Doğru kelime sayısı {n}. "; hedef {h}" ve ", {s}. sınıf ortalaması {o}" yalnız varsa eklenir | tasarımın cümlesinden |
| V1, şeridin adı, seans yok | Bu hafta seans yapılmadı. | önerilen |
| V1, dinlemeden okunan günler | {n} gün dinlemeden okundu. | önerilen |
| V1, boş durum | Henüz seans ya da ölçüm yok. İlk seanstan sonra özet burada görünür. | önerilen |
| V1, hedef penceresi | Hedefi güncelle (başlık) · Yeni hedef: bir dakikada {n} doğru kelime. · Güncelle · Vazgeç | düğme tasarımdan, gerisi önerilen |
| V2, durum etiketi `wild` | Yeni | `docs/urun.md` bölüm 3 |
| V2, boş: hata yok | Bu hafta takılma yok. | önerilen |
| V2, boş: kelime yok | Henüz takılınan kelime yok. | önerilen |
| V2, ek zinciri eklendi | {n} kelime ısınmaya eklendi. | önerilen |
| V2, onay bekleyen kayıtlar | Onay bekleyen kayıtlar (başlık) · {n}. bölüm, {tarih} · Dinle · Onayla · Sil | `docs/ekranlar.md`, önerilen |
| Kayıt silme penceresi | Kayıt silinsin mi? · Kayıt bu cihazdan silinir, geri alınamaz. · Sil · Vazgeç | önerilen |
| V3, düzey cümlesi: endişe | Endişe düzeyi: bu zorluktaki metin {ad} için şimdilik zor. | önerilen |
| V3, düzey cümlesi: serbest | Serbest düzey: {ad} bu zorluktaki metni yardımsız okuyabiliyor. | önerilen |
| V3, sıradaki ölçüm bugün | Sıradaki ölçüm bugün | önerilen |
| V3, boş durum | Henüz ölçüm yok. Ölçüm, çocuğun yol ekranında açılır. | önerilen |
| Paylaşım metni | {ad}, {s}. sınıf · 1 dakikalık ölçüm, {tarih} · {n} doğru kelime bir dakikada · {k} kelime okudu, {h} hata, doğruluk %{d} · {düzey} (satır satır) | önerilen |
| Paylaşım başlığı | {ad} için ölçüm sonucu | önerilen |
| Paylaşım, panoya | Özet panoya kopyalandı. | önerilen |
| Paylaşım, hata | Paylaşılamadı. Bir daha deneyin. | önerilen |
| G1, ölçüm kartı | 1 dakikalık ölçüm (başlık) · Haftada bir, metni bir dakika sesli oku. · Ölçüme başla | başlık `docs/ekranlar.md`, gerisi önerilen |
| Ölçüm ekranı | 1 dakikalık ölçüm (başlık) · Metni sesli oku. Hata yapman sorun değil. · {n}. okuma / 2 | başlık `docs/ekranlar.md`, çip G4 kalıbı, gerisi önerilen |
| Ölçüm, ikinci okuma balonu | Bir metin daha. Hazır olduğunda mikrofona dokun. | önerilen |
| Hesap sayfası | Hesap (başlık) · Onaylar · Kayıtlar · Hesabı sil | `docs/ekranlar.md` ("Hesap"), önerilen |
| Hesap, kayıt satırı | {n}. bölüm, {tarih} · 1 dakikalık ölçüm, {tarih} · {m:ss} · Dinle · Sil | önerilen |
| Hesap, kayıt yok | Henüz kayıt yok. | önerilen |
| Hesap silme | Hesap, okuyucu, okumalar, ölçümler ve kayıtlar bu cihazdan silinir. Geri alınamaz. · Hesap silinsin mi? (pencere) · Hesabı sil · Vazgeç | önerilen |
| Hesap girişi | Hesap (bağlantı ve düğme adı) | gezinme |
| Tarih | Ocak … Aralık; Pazartesi … Pazar; Pt Sa Ça Pe Cu Ct Pz | dil; kısa adlar V1 tasarımından |

## Ölçütler ve kanıtları

| # | Yol haritası ölçütü (Faz 4) | Kanıt |
|---|---|---|
| 1 | `veli-haftasonu` kipinde V1–V4 `expected` değerleri | `parent/views.test.ts`; uçtan uca: karne |
| 2 | Grafikte hedef çizgisi ve sınıf ortalaması; 1. ve 2. sınıfta ortalama yok | `report.test.ts`; V1 testi |
| 3 | Yorum cümlesi en az üç durumda doğru | `report.test.ts` (beş durum) |
| 4 | Ölçüm sonucu `Assessment` olarak kaydedilir, V3'te görünür | depo ve ölçüm ekranı testleri; uçtan uca: haftalık ölçüm |
| 5 | Ölçerek seçme: dört ölçümden önce öneri yok; fark 5'ten azsa "fark küçük" | `readingStyle.test.ts` (Faz 3); `measurement.test.ts` (sıra); uçtan uca: deneme haftası iki okuma |
| 6 | Silinen kayıt depodan gerçekten kalkar | depo testi; uçtan uca: kayıt silme |
| 7 | Veri yokken her ekranın boş durumu | V1, V2, V3 ve Hesap testleri |
| 8 | V1–V3 üç genişlikte tasarımla karşılaştırıldı | "Tasarım karşılaştırması" |

## İnceleme odağı

1. **Hafta sınırları:** Pazar ölçümü o haftaya girer; hafta yerel takvime göre pazartesi başlar; ay ve yıl geçişleri; sayfa gece açık kalınca hafta kayar.
2. **Deneme haftası:** Karnede denemesiz değer görünür. İkinci okuma yarıda kalırsa ilki yazılı kalır ve yalnız eksik okuma açık kalır. Sıra haftadan haftaya değişir. Tek metinli sınıfta aynı metin okunur.
3. **Kayıt silme:** Ses ve bütün göndermeler kalkar. G5, Stüdyo ve V3 kaydı göremez ama çökmez. Hesap silme kayıtları da siler.
4. **Hedef:** Sonradan konan hedef geçmiş haftaların yorumunu ve çizgisini değiştirmez; düğme bir kez güncellenince kaybolur.
5. **Mahremiyet:** Ölçüm ve mikrofon yalnız onayla. Onay geri alınınca mikrofon kapanır. Paylaşım yalnız velinin dokunuşuyla olur ve ses göndermez. `/veli/hesap` kapının arkasındadır.
6. **Boş ve eksik veri:** Boş depo, onaysız aile (P13), seviye tespiti atlanmış aile, ölçümsüz hafta: hiçbir ekran çökmez, boş durumlar görünür.

## Açık sorular (onayı beklemez)

1. **İkinci ölçüm metinleri:** 1., 2. ve 4. sınıf için ikinci metin içerik ekibinden gelince deneme iki ayrı metinle yürür (yanıt 4); kod değişmez.
2. **Onaylanan kaydın gideceği yer:** Aileyle paylaşma arka uçla gelir (Faz 6).
3. **P11'in zorluğu:** Faz 7'den önce.

## Her görevde geçerli kurallar

- TypeScript `strict`, `any` yok. Arayüz metni yalnız `src/i18n/tr.ts`'te ve tasarımdan birebir; tasarımsız metin bu planın tablosundan. Emoji yok; ikonlar `design/svg/ikonlar.json`'dan.
- CSS Modules ve `tokens.css` değişkenleri. Renk, yazı boyutu, yarıçap ve gölge sabit yazılmaz; tasarımda olup token'da olmayan değer kaynağıyla `tokens-extra.css`'e girer.
- Bileşenler mikrofona, ağa ve depolamaya doğrudan dokunmaz (`src/services`); `src/domain` saf ve tamamı birim testli; `features` `src/app`'i içe aktarmaz.
- Türkçe büyük-küçük harf yalnız `toLocale*Case('tr-TR')`; okuma metinlerinde `font-variant-ligatures: no-common-ligatures`.
- Mikrofon yalnız `consent.voiceProcessing` varken ve bir dokunuşla açılır. Çalışma anında dış adrese istek yok. Çocuk ekranlarında puan, rozet, olumsuz kıyas yok. `/veli/*` kapının arkasında.
- Erişilebilirlik: dokunma hedefi en az 44 px, görünür odak, gerçek `button`/`input`/`label`, karşıtlık token çiftleriyle.
- Depo kuralı: Bir eylem bütün yazılarını bitirince yayınlar; yayın eylemin son adımıdır.
- Testler StrictMode'da (`renderApp`); ekran testlerinde seçici her geçişten sonra yeniden aranır. Veli ekranlarının testleri kapıyı geliştirme ayarıyla açar (`tikir.gelistirme.kapi`).
- Her görevden sonra `eval "$(mise env -s zsh)" && pnpm check`. Her ekran 390, 1180 ve 1440 px'te `pnpm shots` ile `design/png` karşılığıyla karşılaştırılır; farklar "Tasarım karşılaştırması"na yazılır ve düzeltilir.
- Küçük, tek amaçlı commit'ler (Conventional Commits); push faz sonunda.

## Görev listesi

- [x] Task 0: Planı ve kararları işle
- [ ] Task 1: Rapor alan mantığı ve iyelik eki
- [ ] Task 2: Ölçüm planı ve ek zinciri alan mantığı
- [ ] Task 3: Seans deposunda hedef, ölçüm, kayıt, onay ve hesap
- [ ] Task 4: Kaydedici ve paylaşım servisleri
- [ ] Task 5: Karne görünümleri ve tarih biçimleri
- [ ] Task 6: V1 Haftalık özet
- [ ] Task 7: V2 Takılınan yerler
- [ ] Task 8: V3 Ölçüm sonucu
- [ ] Task 9: Hesap sayfası ve girişleri
- [ ] Task 10: Ölçüm okumasının ayrılması
- [ ] Task 11: Haftalık ölçüm
- [ ] Task 12: Uçtan uca testler
- [ ] Task 13: Belgeler, karşılaştırma ve denetim

## Görevler

### Task 0: Planı ve kararları işle

**Dosyalar:** `docs/planlar/faz-4.md` (durum: onaylandı), `docs/kararlar.md`.

- [x] `docs/kararlar.md`:
  - P15 kesin (yanıt 5), D16'nın iki V4 cümlesi onaylı;
  - P16: haftalık ölçümün açılması, girişi, metni ve deneme sırası (kararlar 28–31; yanıt 1 ve 4);
  - P17: hedefin güncellenmesi (kararlar 1–2; yanıt 2);
  - D17: bu planın "Tasarımı olmayan durumların metinleri" tablosu;
  - C-satırı: 1., 2. ve 4. sınıfın ikinci ölçüm metni eksik (yanıt 4);
  - T-satırı: paylaşım servisi (`navigator.share`, panoya yedek; karar 26);
  - değişiklik günlüğü.
- [x] `pnpm check` → geçer.
- [x] Commit: `docs: plan phase 4 and record the owner's answers`.

### Task 1: Rapor alan mantığı ve iyelik eki

**Dosyalar:** `src/domain/report.ts` (yeni), `report.test.ts`, `src/domain/config.ts`, `src/domain/types.ts`, `src/domain/text.ts`, `text.test.ts`.

**Üretir:**

```ts
// types.ts
interface GoalChange { targetWcpm: number; setOn: LocalDate }   // Child.goals?: GoalChange[]
// config.ts
const gradeAverageWcpm: Readonly<Partial<Record<Grade, number>>>; // { 3: 90, 4: 98 }
// report.ts
type DayMark = 'done' | 'unheard' | 'none';
weekMeasurement(assessments, weekStartDate): Assessment | null;          // denemesiz, haftanın son ölçümü
reportWeeks(sessions, assessments): LocalDate[];                          // veri olan haftaların pazartesileri, eskiden yeniye
baselineOf(assessments): Assessment | null;
targetForWeek(assessments, goals, weekStartDate): number | null;
weekNumber(assessments, weekStartDate): number | null;                    // başlangıç haftası 1
sessionDays(sessions, weekStartDate): DayMark[];                          // pazartesiden pazara 7 gün; karar 9
weekErrors(sessions, weekStartDate): Record<'misread' | 'suffix' | 'skipped' | 'repeated' | 'inserted', number>;
type WeekComment = { kind: 'listeningOff' } | { kind: 'noMeasurement' } | { kind: 'baseline'; target: number }
  | { kind: 'passed'; nextTarget: number } | { kind: 'below'; gap: number };
weekComment(input): WeekComment;                                          // karar 15
goalUpdate(assessments, goals): number | null;                            // karar 2: son ölçümün haftası için önerilecek hedef ya da null
// text.ts (grafiğin ve şeridin adları)
withAblativeSuffix(count: number): string;           // '58’den', '70’ten', '90’dan'
withDativeSuffix(count: number): string;             // '71’e', '2’ye', '6’ya', '90’a'
withPossessiveLocativeSuffix(count: number): string; // '5’inde', '6’sında', '3’ünde'
```

- [ ] **Kırmızı** (`report.test.ts`, tablo testleri):
  - Pazar ölçümü o haftaya girer; deneme ölçümü haftanın değeri olmaz.
  - `reportWeeks` yalnız veri olan haftaları verir; ay ve yıl geçişi.
  - `targetForWeek`: hedef yokken `firstTarget(başlangıç)`; hafta içinde konan hedef sonraki haftadan geçerli; ölçüm yoksa null.
  - `sessionDays`: bitmiş, dinlemeden okunmuş (`unheard` ya da saklanmış okuması yok), bitmemiş ve boş gün.
  - `weekErrors`: beş tür; `helped`, `selfCorrected` ve ölçümler sayılmaz; demo haftası 9, 7, 6, 5, 3 (toplam 30).
  - `weekComment`: beş durumun her biri (ölçüt 3); onay sonradan geri alınsa da ölçümlü hafta sayıyla yorumlanır.
  - `goalUpdate`: geçildiyse `nextTarget`; geçilmediyse null; aynı ya da daha büyük hedef konduysa null; hafta içinde konan hedef o haftanın hedefini değiştirmez.
  - `withGenitiveSuffix`: Kemal’in, Hilal’in, Bilal’in, Meral’in; öbür adlar eskisi gibi.
  - Sayı ekleri: 58’den, 70’ten, 4’ten, 90’dan, 100’den; 71’e, 2’ye, 6’ya, 4’e, 90’a; 5’inde, 6’sında, 3’ünde, 7’sinde, 0’ında.
- [ ] → FAIL. Uygula. → PASS. `pnpm check`.
- [ ] Commit: `feat(domain): add the weekly report's rules`.

### Task 2: Ölçüm planı ve ek zinciri alan mantığı

**Dosyalar:** `src/domain/measurement.ts` (yeni), `measurement.test.ts`, `src/domain/stuckWords.ts`, `stuckWords.test.ts`, `src/domain/config.ts`, `src/domain/types.ts` (`Assessment.trial`'ın açıklaması: denenen ayarla yapılan okuma, sırası ne olursa olsun).

**Üretir:**

```ts
// config.ts
const measurementIntervalDays = 7; const drillCardsPerDay = 2;
// measurement.ts
nextMeasurementOn(assessments): LocalDate | null;                         // son denemesiz + 7; ölçüm yoksa null
measurementDue(assessments, today, voiceConsent: boolean): boolean;       // karar 28
interface PlannedReading { passageId: Id; style: ReadingStyle; trial: boolean }
measurementReadings(passages, assessments, style, today): PlannedReading[]; // kararlar 30–31; yapılmışlar çıkar
// stuckWords.ts
drillCards(drill: DrillSuggestion, cards, chains, today): StuckWord[];   // karar 8: yalnız yeni kartlar
```

- [ ] **Kırmızı:**
  - `measurementDue`: onaysız hiç; ölçümsüz hemen; son ölçümden 6 gün sonra kapalı, 7 ve 9 gün sonra açık.
  - `measurementReadings`:
    - denemesiz bir okuma; önceki metin verilmez (3. sınıf: 3a sonra 3b);
    - tek metinli sınıfta aynı metin;
    - deneme açıkken iki okuma, iki ayrı metin (tek metinlide aynı);
    - önceki deneme haftalarının sayısı çiftse geçerli ayar önce, tekse denenen ayar önce;
    - yarım haftada yalnız eksik okuma.
  - `drillCards`: altı kelime, yarından başlayarak ikişer gün; kartı olan kelime atlanır; heceler ve zincir.
- [ ] → FAIL. Uygula. → PASS. `pnpm check`.
- [ ] Commit: `feat(domain): plan the weekly measurement and the suffix drill`.

### Task 3: Seans deposunda hedef, ölçüm, kayıt, onay ve hesap

**Dosyalar:** `src/features/session/sessionStore.ts`, `sessionStore.test.ts`, `src/services/repository/*` (gerekirse).

**Kullanır:** Task 1, Task 2.

**Üretir:** `SessionData.drill: DrillSuggestion | null`; eylemler:

```ts
setGoal(targetWcpm: number): Promise<void>;
saveMeasurement(outcome: ReadingOutcome, meta: { passageId: Id; readingStyle: ReadingStyle; trial: boolean;
  startedAt: string; recordingId: Id | null }): Promise<void>;
addDrillToWarmup(): Promise<void>;
deleteRecording(id: Id): Promise<void>;
setConsent(consent: { voiceProcessing: boolean; weeklyEmail: boolean }): Promise<void>;
deleteAccount(): Promise<void>;
```

- [ ] **Kırmızı:**
  - `setGoal` bugünün tarihiyle hedef ekler.
  - `saveMeasurement` denemeli ve denemesiz ölçüm yazar; `data.assessments` yenilenir.
  - `addDrillToWarmup` kartları yazar, öneriyi siler.
  - `deleteRecording` sesi ve göndermeleri kaldırır (ölçüt 6).
  - `setConsent` `grantedAt`'i yazar ya da siler.
  - `deleteAccount` depoyu boşaltır, durum `setup` olur.
- [ ] → FAIL. Uygula. → PASS. `pnpm check`.
- [ ] Commit: `feat(session): keep goals, measurements, recordings and consent in the store`.

### Task 4: Kaydedici ve paylaşım servisleri

**Dosyalar:** `src/services/recorder/Recorder.ts`, `PcmRecorder.ts` (+test), `RecordingStore.ts` (`list()`), `src/services/audio/wav.ts` (`sliceWav`, +test), `src/services/share/ShareService.ts` (yeni, +test), `src/features/session/sessionContext.ts`, `src/app/services.ts`, `src/test/sessionDevices.ts`.

**Üretir:** `Recorder.list(): Promise<RecordingInfo[]>`, `approve(id)`, `play(id, range?: { fromMs: number; toMs: number })`; `RecordingInfo.createdAt`, `approval?: 'pending' | 'approved'`; `ShareService { canShare(): boolean; share(content: { title: string; text: string }): Promise<'shared' | 'copied' | 'cancelled'> }`; `SessionDevices.share`.

- [ ] **Kırmızı:**
  - `sliceWav` doğru başlık ve örnekleri verir.
  - `play` dilimi çalar.
  - `list` ve `approve` çalışır.
  - `ShareService`: `navigator.share` varsa onunla, yoksa panoya; ikisi de yoksa `canShare()` yanlış; kullanıcının iptali `'cancelled'`.
- [ ] → FAIL. Uygula. → PASS. `pnpm check`.
- [ ] Commit: `feat(services): list, approve and play part of recordings, and share text`.

### Task 5: Karne görünümleri ve tarih biçimleri

**Dosyalar:** `src/features/parent/views.ts`, `views.test.ts`, `src/features/parent/format.ts` (yeni, +test), `src/i18n/tr.ts`.

**Kullanır:** Task 1–3.

**Üretir:** `summaryView(data, week)`, `stuckView(data, recordings)`, `assessmentView(data)`, `accountView(data, recordings)`; `formatDayMonth`, `formatLongDate`, `formatWeekRange`.

- [ ] **Kırmızı:**
  - `veli-haftasonu` demo deposuyla `expected` değerleri (ölçüt 1):
    - V1: 71, +4, %93, 3 / 4, 5 / 7 (Pt Sa Pe Cu Ct), grafik 58…71, hedef 70, ortalama 90, yorum;
    - V2: 30 hata, 9/7/6/5/3;
    - V3: 76, 5, 71, %93, öğretim, 7 gün sonra.
  - 4. sınıfta ortalama 98; 1. ve 2. sınıfta yok (ölçüt 2).
  - Tarih biçimleri, ay geçişi dahil.
- [ ] → FAIL. Uygula. → PASS. `pnpm check`.
- [ ] Commit: `feat(parent): build the report's views from the stored data`.

### Task 6: V1 Haftalık özet

**Dosyalar:** `src/features/parent/SummaryPage.tsx` (+CSS, +test), `src/features/parent/pages.tsx`, `src/app/router.tsx`, `src/i18n/tr.ts`.

- [ ] **Kırmızı:**
  - Demo haftasının içeriği tasarımdaki gibi.
  - Hafta okları önceki haftaya geçer, uçta pasif.
  - "Hedefi güncelle" penceresi yeni hedefi yazar ve düğme kaybolur.
  - Dinlemeden okunan gün işareti ve satırı.
  - Boş durum.
  - 1. sınıfta ortalama çizgisi yok.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots '/veli?demo=veli-haftasonu&kapi=acik'` → V1 ile karşılaştır.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(parent): build the weekly summary (V1)`.

### Task 7: V2 Takılınan yerler

**Dosyalar:** `src/features/parent/StuckWordsPage.tsx` (+CSS, +test), `PendingRecordings.tsx` (+test), `src/i18n/tr.ts`.

- [ ] **Kırmızı:**
  - Hata türleri ve kelimeler tasarımdaki gibi.
  - Kayıt yoksa dinleme düğmesi gizli; kayıtlı bir okumada düğme dilimi çalar.
  - "Isınmaya ekle" kartları ekler, onay satırı görünür.
  - Onay bekleyen kayıtlar: dinle, onayla, sil (pencere).
  - Boş durumlar.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots '/veli/takilinan?demo=veli-haftasonu&kapi=acik'` → V2 ile karşılaştır.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(parent): build the stuck words (V2)`.

### Task 8: V3 Ölçüm sonucu

**Dosyalar:** `src/features/parent/AssessmentPage.tsx` (+CSS, +test), `src/i18n/tr.ts`.

- [ ] **Kırmızı:**
  - Sayılar, bant, düzey cümlesi, alıntının işaretleri tasarımdaki gibi.
  - "Sıradaki ölçüm" tarihi; geçmişse "bugün".
  - Paylaşım: paylaşma penceresi ya da panoya ve onay satırı; paylaşma yoksa düğme gizli.
  - "Kaydı dinle" kayıt varken.
  - Boş durum.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots '/veli/olcum?demo=veli-haftasonu&kapi=acik'` → V3 ile karşılaştır.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(parent): build the assessment result (V3)`.

### Task 9: Hesap sayfası ve girişleri

**Dosyalar:** `src/features/parent/AccountPage.tsx` (+CSS, +test), `src/features/parent/paths.ts`, `src/app/routes.ts`, `src/app/router.tsx`, `src/app/shells/ParentShell.tsx`, `ShellNav.tsx` (birden çok alt bağlantı), `src/i18n/tr.ts`, `e2e/routes.spec.ts`.

- [ ] **Kırmızı:**
  - Onay anahtarları onayı değiştirir.
  - Kayıtlar dinlenir ve silinir (pencere).
  - Hesap silinince kurulum açılır.
  - Boş kayıt listesi.
  - Girişler: rayda ve kenar çubuğunda "Hesap"; telefonda şerit düğmesi (uçtan uca, genişliklere göre).
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots '/veli/hesap?demo=veli-haftasonu&kapi=acik'` (tasarımı yok; taşma ve kırpılma).
- [ ] → PASS. `pnpm check`. `pnpm e2e e2e/routes.spec.ts`.
- [ ] Commit: `feat(parent): add the account page with consent, recordings and deletion`.

### Task 10: Ölçüm okumasının ayrılması

**Dosyalar:** `src/features/reading/MeasurementReading.tsx` (yeni, +CSS), `src/features/onboarding/LevelPage.tsx` (+CSS).

**Üretir:** `MeasurementReading({ passage, style, consent, narrator, startOnTap?, onFinish(outcome, meta), render })`: K3'ün kartı, geri sayımı, denetimleri ve balonu; düzeni çağıran kurar (K3 `OnboardingLayout`, ölçüm odak kabuğu).

- [ ] K3'ün testleri değişmeden geçer (taşıma); `startOnTap` için kırmızı test: mikrofon açıkken okuma dokunuşa kadar başlamaz.
- [ ] → PASS. `pnpm check`. K3 görüntüsü değişmez.
- [ ] Commit: `refactor(reading): share the timed reading between K3 and the weekly measurement`.

### Task 11: Haftalık ölçüm

**Dosyalar:** `src/features/measurement/MeasurementPage.tsx` (yeni, +CSS, +test), `src/features/session/RoadPage.tsx` (+CSS, +test), `src/features/session/paths.ts` (`/olcum` dinleyen adres), `src/app/routes.ts`, `src/app/router.tsx`, `src/i18n/tr.ts`.

- [ ] **Kırmızı:**
  - G1'de kart yalnız ölçüm açıkken; dokunuş mikrofonu açar ve `/olcum`'a gider.
  - Ölçüm açık değilse `/olcum` G1'e gider.
  - Tek okuma: kayıt `Assessment` olur, G1'e dönülür, kart kalkar.
  - Deneme: iki okuma, ikincisi dokunuşla; sıra ve metinler; her okuma kendi ayarıyla görünür (denenen ayar `trialReadingStyle`) ve denenen ayarın okuması `trial: true` yazılır.
  - Yarıda çıkış yazmaz.
  - Mikrofon sorunu: "Yeniden dene", P14 seçeneği yok.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots --ileri 86400000 --bekle 'Ölçüme başla' '/?demo=cocuk-sabahi'` (kart) ve ölçüm ekranı (tasarımı yok; K3 ile karşılaştırma).
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(measurement): add the weekly one-minute measurement`.

### Task 12: Uçtan uca testler

**Dosyalar:** `e2e/report.spec.ts`, `e2e/measurement.spec.ts`, `e2e/account.spec.ts` (yeni), `e2e/no-external-requests.spec.ts`.

- [ ] Testler (Chromium ve WebKit):
  1. **`report.spec.ts`** › "the weekend profile's report shows the expected numbers" (ölçüt 1, 2): V1–V4 değerleri, grafikte hedef ve ortalama.
  2. **`measurement.spec.ts`** › "a trial week reads both styles and reaches V3" (ölçüt 4, 5): `cocuk-sabahi` (Deniz'de deneme açık), saat bir gün ileri, G1 kartı, iki dakika (saat), G1'de kart yok, V3'te yeni ölçüm, V4'te iki ayarın ölçüm sayısı birer artar.
  3. **`measurement.spec.ts`** › "with the trial off the measurement is one reading": V4'te deneme kapatılır, saat bir gün ileri, tek okuma.
  4. **`account.spec.ts`** › "a deleted recording leaves the device" (ölçüt 6) ve "deleting the account opens the setup".
  5. **`no-external-requests.spec.ts`:** yeni sayfalar ve ölçüm akışı.
- [ ] `caffeinate -u -t 2; caffeinate -d -i pnpm e2e e2e/report.spec.ts e2e/measurement.spec.ts e2e/account.spec.ts e2e/no-external-requests.spec.ts` → geçer.
- [ ] Commit: `test(e2e): run the report, the weekly measurement and the account end to end`.

### Task 13: Belgeler, karşılaştırma ve denetim

**Dosyalar:** `docs/mimari.md`, `docs/ekranlar.md`, `docs/dinleme-hatti.md`, `docs/kararlar.md`, `CLAUDE.md` (gerekirse), bu plan.

- [ ] Belgeler:
  - `docs/mimari.md`: karne verisi, hedef geçmişi, ölçüm akışı, kayıt servisi, paylaşım servisi, hesap.
  - `docs/ekranlar.md`: V1–V3, haftalık ölçüm, Hesap ayrıntılarına gönderme.
  - `docs/dinleme-hatti.md`: haftalık ölçüm (deneme sırası, kayıt).
  - `docs/kararlar.md`: değişiklik günlüğü.
- [ ] Tasarım karşılaştırması: V1–V3, G1 ölçüm kartı, ölçüm ekranı, Hesap; fark listeleri (ölçüt 8).
- [ ] Denetim:
  - `pnpm check`.
  - `pnpm build`; `dist/` içinde `demo-profil`, `veli@example.com`, `gelistirme`, `fake-indexeddb`, `kapi=acik`, `tikir.gelistirme` 0 dosyada.
  - `caffeinate -u -t 2; caffeinate -d -i pnpm e2e`.
  - Çıktılar "Kanıtlar"a yazılır.
- [ ] Commit: `docs: record phase 4 decisions and evidence`.

Sonra bütün dal bağımsız bir incelemeden geçer; düzeltmeler tek geçişte yapılır. Faz bitince dal `main`'e `--no-ff` birleştirilir ve gönderilir (ürün sahibinin kalıcı talimatı).

## Tasarım karşılaştırması

| Ekran | Komut |
|---|---|
| V1 | `pnpm shots '/veli?demo=veli-haftasonu&kapi=acik'` |
| V2 | `pnpm shots '/veli/takilinan?demo=veli-haftasonu&kapi=acik'` |
| V3 | `pnpm shots '/veli/olcum?demo=veli-haftasonu&kapi=acik'` |
| Hesap | `pnpm shots '/veli/hesap?demo=veli-haftasonu&kapi=acik'` |
| G1 ölçüm kartı | `pnpm shots --ileri 86400000 --bekle 'Ölçüme başla' '/?demo=cocuk-sabahi'` |

Uygulama sırasında her ekranın fark listesi buraya eklenir.

## Kanıtlar

Uygulama sırasında doldurulur.

## Uygulamada verilen kararlar

Uygulama sırasında doldurulur.
