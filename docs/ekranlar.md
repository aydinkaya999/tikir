# Ekranlar

19 ekran, her biri üç boyutta tasarlandı. Görünüm ve metin için kaynak `design/ekranlar/<dosya>.html` ve `design/png/<dosya>.png`; bu belge tasarımda **görünmeyen** şeyi anlatır: amaç, durumlar, kurallar, geçişler.

Dosya adı kalıbı: `<kod>-<ad>-<telefon|tablet|web>`. Örnek: `G4-oku-tablet.html`. Tam liste `design/ekranlar.json`.

## Rotalar

| Kod | Ekran | Rota | Kabuk |
|---|---|---|---|
| G1 | Yol (çocuğun ana ekranı) | `/` | çocuk |
| G2 | Isınma | `/seans/isinma` | seans |
| G3 | Dinle | `/seans/dinle` | seans |
| G4 | Oku | `/seans/oku` | seans |
| G5 | Kayıt | `/seans/kayit` | seans |
| G6 | Kapanış sorusu | `/seans/kapanis` | seans |
| G7 | Bugünlük bitti | `/seans/bitti` | seans |
| K1 | Veli hesabı | `/kurulum/hesap` | kurulum |
| K2 | Okuyucu profili | `/kurulum/okuyucu` | kurulum |
| K3 | Seviye tespiti | `/kurulum/seviye` | kurulum |
| K4 | Tıkır ile tanışma | `/kurulum/tanisma` | kurulum |
| U1 | Kitaplık | `/kitaplik` | çocuk |
| U3 | Kartlarla kitap | `/kitaplik/kur` | odak |
| U4 | Kitap hazır | `/kitaplik/:bookId/hazir` | odak |
| U2 | Metinden kitap | `/veli/kitap` | veli |
| V1 | Haftalık özet | `/veli` | veli |
| V2 | Takılınan yerler | `/veli/takilinan` | veli |
| V3 | Ölçüm sonucu | `/veli/olcum` | veli |
| V4 | Yazı ayarı | `/veli/yazi` | veli |
| — | Albüm | `/album` | çocuk |
| — | Stüdyo | `/studyo` | çocuk |

Albüm ve Stüdyo'nun tasarımı yok (bu belgenin sonundaki varsayılanlar); rotaları Faz 0'da açıldı, asgari ekranları Faz 2'de gelir.

Geliştirme rotaları (üretim derlemesine girmez): `/gelistirme/vitrin`, `/gelistirme/ses`.

**Yönlendirme kuralları**

- Hesap ya da okuyucu profili yoksa her rota `/kurulum/hesap` adresine gider.
- `/veli/*` veli kapısından geçer.
- Seans adımlarına sırayla girilir. Sırası gelmemiş bir adımın adresi açılırsa geçerli adıma yönlendirilir.
- Bugünün seansı bittiyse `/seans/*` adresleri `/seans/bitti` ekranını gösterir.

## Günlük seans

Seans kabuğunun ortak parçaları: kapat düğmesi (sol üst), beş adım karosu (biten turkuaz ve onay işaretli, geçerli safran, sıradaki beyaz), "3 / 5" sayacı, Tıkır ve konuşma balonu, alt denetim çubuğu.

Kapat düğmesi onay sorar ("Seanstan çıkılsın mı?"). Çıkılırsa adım kaydedilir ve G1'deki "Başla" düğmesi "Sürdür" olur. Bu onay penceresinin tasarımı yok. G7'de kapat düğmesi sormadan G1'e döner.

**Dinlemesiz seans** (Faz 2b; `docs/kararlar.md` P13): veli ses onayı vermediyse seans mikrofonsuz yürür; ayrıntı `docs/dinleme-hatti.md`, bölüm 1. Tasarımı yok.

**Tasarımı olmayan durumların metinleri** (yükleniyor, depo hatası, mikrofon sorunları, dinlemesiz seans, G6'nın yanlış cevabı, Albüm ve Stüdyo'nun boş hâli): `docs/planlar/faz-2b.md` → "Tasarımı olmayan durumların metinleri"; onay `docs/kararlar.md` D15.

### G1 Yol

- **Amaç:** Bugünkü bölüme tek dokunuşla başlatmak, ilerlemeyi göstermek.
- **İçerik:** selamlama, üst üste gün sayısı, bugünkü bölüm kartı, 12 karoluk bölüm haritası.
- **Karo durumları:** `done` (desenli çini), `today` (safran zemin, Tıkır), `locked` (kesik çizgili, kilit).
- **Üst üste gün:** seansı bitirilen ardışık gün sayısı. Bugünün seansı henüz yapılmadıysa dünle biten seri sayılır. 2'den küçükse etiket gizlenir. Seri bozulunca uyarı ya da ceza gösterilmez.
- **Bugün bittiyse:** bölüm kartı "Bugünlük bitti" durumuna geçer ve "Başla" yerine yarının bölüm adı görünür. Bu durumun tasarımı yok; G7'deki "Yarın" kartını kullan.
- **Tıkır'ın balonu** (tablet ve web): "Bugün {n}. bölümü okuyoruz: {başlık}. Hazırsan başlayalım." (D13). İçerik her bölüme bir giriş cümlesi yazınca onun yerine geçer (C6).
- **Geçiş:** Başla → G2.

### G2 Isınma

- **Amaç:** Takılınan kelimeleri metne girmeden çalışmak.
- **İçerik:** kart sayacı (1 / 3), kelime, heceleri, büyüyen kelime zinciri, "Evcilleşmesine N doğru okuma kaldı". Zinciri olmayan kelimede "Büyüyen kelime" bölümü, kartı olmayan kelimede (günü gelen kart yokken metinden seçilen kelimeler) evcilleşme satırı gizlenir.
- **Akış:** Çocuk kelimeyi sesli okur. Doğruysa sıradaki karta geçilir. Yanlışsa Tıkır kelimeyi seslendirir ve bir kez daha denetir; ikinci denemeden sonra sonuç ne olursa olsun geçilir.
- **Denetimler:** kelimeyi dinle, mikrofon, ileri.
- **Hece karoları:** Tıkır kelimeyi seslendirirken heceler sırayla vurgulanır; vurgu seslendirmenin hece hızını izler. Çocuk okurken vurgu yoktur; gerçek dinleyici hece zamanı verirse (Faz 6) çocuğun okumasını da izleyebilir.
- **Kelime zinciri:** kökten bugünkü kelimeye basamaklar. Bilinen basamaklar onay işaretli, son basamak bugünkü kelimedir.
- **Geçiş:** son karttan sonra → G3.

### G3 Dinle

- **Amaç:** Akıcı okumanın modelini duyurmak.
- **İçerik:** bölüm sayfası, anlam üniteleri ince dikey çizgilerle ayrılmış; okunan ünite safran vurgulu, okunanlar koyu, sıradakiler soluk; süre göstergesi.
- **Mikrofon bu adımda kapalıdır.**
- **Sayfa çevirme:** seslendirme sayfa sonuna gelince sıradaki sayfa kendiliğinden gelir.
- **Denetimler:** duraklat / sürdür, okuma hızı (Yavaş, Normal), baştan dinle, "Sıra sende".
- **Okuma hızı:** varsayılan Yavaş (tasarımdaki durum); çocuğun son seçimi hatırlanır.
- **Geçiş:** "Sıra sende" → G4. Seslendirme en az bir kez bitmeden düğme pasiftir.

### G4 Oku

Uygulamanın kalbi. Ayrıntılı davranış `docs/dinleme-hatti.md` içinde.

- **İçerik:** okuma sayacı ("2. okuma / 3"), sayfa kartı, yarış çubuğu ve yarış cümlesi, sayaç satırı, Tıkır balonu.
- **Kelime durumları:** okunmuş (koyu), o anki (safran zemin), okunmamış (soluk), duraksama (noktalı kehribar alt çizgi), hata (dalgalı mercan alt çizgi), hayaletin bulunduğu kelime (kesik kobalt çerçeve).
- **Yarış çubuğu:** "sen" imleci çocuğun konumu, "dün" imleci hayalet. İlk gün hayalet yoktur; çubukta yalnız "sen" görünür.
- **Yarış cümlesi:** çocuk öndeyse "Dünkü senin N kelime önündesin". Gerideyse, başa başsa ya da hayalet yoksa cümle gizlenir; olumsuz fark hiçbir biçimde gösterilmez.
- **Hayalet:** bir önceki seansın aynı sıradaki okumasının (1., 2., 3.) temposuyla, yani dakikada denenen kelime sayısıyla, bugünkü metinde ilerler. Önceki seans yoksa hayalet yoktur.
- **Duraksama işareti:** bir kelimede 1 saniye ve üzeri sessizlik olur ama kelime yardımsız okunursa kelime duraksama çizgisini alır.
- **Sayaç satırı:** geçen süre, doğru kelime sayısı, takılma sayısı (duraksama işareti alan ve yardım alınan kelimeler).
- **Yardım:** 3 saniye duraksamada balon "Takıldın mı? Hecele: a-ğaç-la-rı-nın" olur ve kelime seslendirilir. Vurgu, seslendirme bitene kadar kelimede kalır; sonra sıradaki kelimeye geçer.
- **3. okuma kaydedilir.** Sayfa kartının üstünde kayıt göstergesi görünür (tasarımı yok: mercan nokta + "Kayıt").
- **Denetimler:** duraklat, mikrofon (dinliyor / duraklatıldı), bitir (bayrak).
- **Geçiş:** 1. ve 2. okumadan sonra sıradaki okuma başlar. 3. okumadan sonra → G5.

### G5 Kayıt

- **İçerik:** kayıt süresi, dalga biçimi ve oynat düğmesi, "Sesli kitabına eklendi", kayıtlı bölüm sayısı, "Ailene dinlet", Tıkır'ın yorumu.
- **Tıkır'ın yorumu** yalnız doğruysa söylenir: "Bu, bugünkü en akıcı okuman oldu." üçüncü okumanın `wcpm` değeri ilk ikisinden yüksekse görünür. Değilse nötr bir cümle kullanılır (tasarımı yok: "Kaydın hazır.").
- **Dalga biçimi:** kaydın 64 ses düzeyinden çizilir: telefonda 26, tablet ve webde 36 çubuk, her çubuk kendi grubunun en yükseği. Kayıt çalarken çalınan kısım safran, kalanı açık turkuazdır; durağanken hepsi açık turkuaz. Çalan kaydın düğmesi "Duraklat" olur.
- **Gönder:** kaydı "veli onayı bekliyor" olarak işaretler; düğme pasifleşir ve "Veli onayı bekliyor" yazar. Veli tarafındaki onay ekranının tasarımı yok.
- **Kayıt yoksa** (kayıt başlatılamadı ya da bulunamadı) kartın yerinde hata cümlesi görünür; "Baştan kaydet" ve "Devam et" çalışır.
- **Baştan kaydet:** G4'e 3. okuma olarak döner.
- **Geçiş:** Devam et → G6.

### G6 Kapanış sorusu

- **İçerik:** 2 soru, her biri 3 seçenek; seçenek sırası her gösterimde karışır.
- **"Metne geri dön":** metni salt okunur bir katmanda açar; seansı geri sarmaz.
- **Yanıt yanlışsa:** doğru seçenek sakin biçimde gösterilir: onay işareti ve "Doğru cevap" etiketi; balon "Doğru cevabı işaretledim.", düğme "Devam et" (D14). Çocuğa puan ya da "yanlış" yazısı gösterilmez. İlgili cümlenin metinde vurgulanması, içerik her soruya kendi cümlesini ekleyince gelir (C7). Bu durumun tasarımı yok.
- **Geçiş:** ikinci sorudan sonra → G7.

### G7 Bugünlük bitti

- **İçerik:** süre, bugünün `wcpm` değeri, dünle fark (yalnız artıysa), bugün evcilleşen kelimeler, yarının bölümü, "Seansın özeti veline gitti."
- **Bugünün `wcpm` değeri** üçüncü okumanın değeridir.
- **Geçiş:** Kapat → G1.

## İlk kurulum

Kurulum kabuğu: üstte dört adımlı ilerleme, tablet ve webde solda kobalt pano ve Tıkır.

### K1 Veli hesabı

- **Alanlar:** e-posta, parola (en az 8 karakter), ses işleme onayı, haftalık e-posta isteği.
- **Onay kutusu varsayılan olarak işaretsizdir** (tasarımda dolu durumu görünüyor). Onay verilmeden hesap oluşturulabilir ama dinleme özellikleri kapalı kalır ve K3 atlanır; bu durumda ekranda açıklama gösterilir. Açıklamanın tasarımı yok.
- **"Ses verisi nasıl kullanılır?"** bir bilgi katmanı açar; metni taslak.
- Arka uç gelene kadar hesap yalnız cihazda tutulur. **Parola depoya yazılmaz:** alan yalnız biçim için doğrulanır, değeri saklanmaz ve hiçbir yere gönderilmez.

### K2 Okuyucu profili

- **Alanlar:** ad, sınıf (1–4, tek seçim), ilgi alanları (8 seçenekten en çok 3).
- Sınıf, varsayılan yazı tipini belirler (`docs/urun.md` bölüm 7).

### K3 Seviye tespiti

- **Akış:** çocuk sınıfına uygun metni 1 dakika sesli okur; geri sayım görünür. "Okumayı bitir" erken bitirir. Süre dolunca okuma kendiliğinden biter.
- **Metin:** `seed/olcum-metinleri.json` içinden çocuğun sınıfına göre seçilir. Tasarımdaki örnek `olcum-3a` metninin başıdır.
- Okuma kaydedilir (V3'teki "Kaydı dinle" bunu çalar).
- Bu ekran haftalık ölçümün de kalıbıdır.

### K4 Tıkır ile tanışma

- **İçerik:** başlangıç `wcpm`, doğruluk ve okuma düzeyi; ilk hedef ve küçük hedef grafiği; programın üç maddesi.
- **Geçiş:** "İlk bölüme başla" → G1.

## Kitaplık ve kitap üretimi

### U1 Kitaplık

- **İçerik:** süren seri kitap ve ilerleme çubuğu, çocuğun kitapları (kaynağı: "Kartlarla yaptın" ya da "Velin ekledi"), "Yeni kitap", veli için metinden kitap bağlantısı.
- **Geçişler:** Sürdür → G1; Yeni kitap → U3; veli bağlantısı → veli kapısı → U2; kitap kartı → günün seansı o kitapla başlar.
- Kitaplıktan başlayan seans da aynı akıştır (`docs/urun.md` bölüm 3): günü gelen kart varsa ısınma, sonra dinle. Bugünün seansı başlamış ya da bitmişse kitap kartları pasiftir (varsayılanı bu belgenin sonunda).

### U3 Kartlarla kitap

- **İçerik:** üç grup (kahraman, mekân, olay), her grupta üç kart, grup başına tek seçim. Tıkır seçimi tek cümleyle özetler.
- Kartlar, başlık ve özet cümlesi `seed/ornek-kitaplar.json` → `cards` içindeki parçalardan kurulur. İlk kahraman kartı çocuğun adını taşır.
- Üç seçim tamamlanmadan "Kitabımı yap" pasiftir.
- **Geçiş:** → üretim → U4. Üretim beklemesinin tasarımı yok.

### U2 Metinden kitap (veli)

- **Sekmeler:** Metin, Fotoğraf, Konu. Yalnız Metin tasarlandı; diğer ikisi ilk sürümde gizlenir.
- **Alanlar:** metin (kelime sayacı canlı), sınıf düzeyi (2, 3, 4), uzunluk (kısa, orta, uzun), "Takıldığı kelimeleri metne yerleştir", "Sonuna 2 anlama sorusu ekle".
- **Geçiş:** Kitabı üret → U4.

### U4 Kitap hazır

- **İçerik:** kapak, ad, sayfa ve kelime sayısı, tahmini süre, seviye denetimi sonucu (kelime başına hece, cümle başına kelime), içine eklenen kelimeler.
- **Seviye denetimi sayıları gerçek hesaptan gelir** (`docs/mimari.md`).
- **Denetimler:** yeniden üret, "Okumaya başla" → günün seansı bu kitapla başlar. Tasarımdaki bağlantı doğrudan G3'e gider; günü gelen kart varsa araya ısınma girer.

## Veli karnesi

Veli kabuğu: lacivert üst şerit ("Veli alanı" ve çocuk etiketi), gezinme (Özet, Takılınan yerler, Ölçüm, Yazı ayarı, Kitaplar). Telefonda alt çubuk, tablette dar ray, webde kenar çubuğu. Webde "Çocuk ekranı" bağlantısı G1'e döner.

### V1 Haftalık özet

- **İçerik:** hafta seçici, dört sayı (doğru kelime/dk, doğruluk, tonlama, seans günü), altı haftalık çizgi grafiği (hedef çizgisi ve sınıf ortalaması ile), seans günleri şeridi, tek cümlelik yorum, "Hedefi güncelle".
- **Sayıların kaynağı:** doğru kelime, doğruluk ve tonlama o haftanın ölçümünden (deneme ölçümü değil); seans günleri o haftanın biten seanslarından gelir.
- **Açılış haftası:** içinde ölçüm ya da seans bulunan en son hafta. Hafta pazartesi başlar.
- **Yorum cümlesi** veriye göre seçilir; tasarımdaki örnek hedefin geçildiği durumdur.
- **"Hedefi güncelle"** için ekran tasarımı yok.

### V2 Takılınan yerler

- **İçerik:** haftanın hata türü dağılımı (5 tür), en çok takılınan kelimeler (heceleri, sayısı, durumu, çocuğun okuyuşunu dinleme düğmesi), ek zinciri ısınması önerisi.
- **Hata türü dağılımı** haftanın seans okumalarından sayılır; ölçüm dahil değildir. Yardım alınan kelimeler ve kendini düzeltmeler bu listede gösterilmez.
- **Dinleme düğmesi** o kelimenin kaydı yoksa gizlenir.
- **Ek zinciri önerisi:** hangi kelimelerin aynı eki taşıdığını bulmak arka uç işidir. O gelene kadar kart yalnız veri hazır geldiğinde görünür (demo profilindeki `suggestedDrill`); yoksa gizlenir.
- **"Isınmaya ekle"** önerilen kelimeleri kart olarak ekler ve sonraki günlere ikişer ikişer dağıtır. Günlük 3 kart sınırı değişmez; günü gelen eski kartlar önce gelir.

### V3 Ölçüm sonucu

- **İçerik:** son ölçümün sayıları, okuma düzeyi bandı, ölçüm metninden hata işaretli alıntı, sıradaki ölçüm tarihi, "Öğretmenle paylaş", "Kaydı dinle".
- **Alıntı** ölçüm metninin ilk dört cümlesidir; işaretler o okumanın kelime sonuçlarından gelir.
- **"Kaydı dinle"** kayıt yoksa gizlenir.
- **"Öğretmenle paylaş"** için çıktı tasarımı yok.

### V4 Yazı ayarı

- **İçerik:** canlı önizleme, yazı tipi (2 seçenek), harf boyutu (4 kademe), harf aralığı (3 kademe), "Hangi ayar daha iyi?" kartı.
- Seçim anında önizlemeye ve kayda yansır; kaydet düğmesi yoktur.
- Önizleme kutusunun yüksekliği sabittir; ayar değişince altındaki denetimler yer değiştirmez.
- "Ölçümlerde iki ayarı dene" kapalıyken sonuç satırları gizlenir.
- Sonuç satırları ölçüm kayıtlarından hesaplanır (`docs/urun.md` bölüm 7): her ayar için ortalama ve kaç ölçüm kaldığı.
- Tasarımın üç durumu da var: varsayılan, `@okul-buyuk`, `@kucuk-kapali`.

## Tasarımı olmayan durumlar

Bunlar için tasarım bekleniyor. O gelene kadar aşağıdaki varsayılanı uygula, tasarım sistemindeki bileşenlerle kur ve `// TODO(design)` bırak.

| Durum | Varsayılan |
|---|---|
| Albüm ve Stüdyo sekmeleri | Sekmeler görünür. Albüm: evcilleşen kelimelerin kart listesi. Stüdyo: kayıtlı bölümlerin oynatma listesi. Başka özellik ekleme. |
| Veli kapısı | Tam ekran katman: iki basamaklı bir toplama sorusu ("47 + 38 = ?"). Üç yanlışta 30 saniye bekletir. |
| Giriş (oturum açma) | Arka uç gelene kadar yok; hesap cihazda. |
| Haftalık ölçüm (çocuk) | K3 ekranının kalıbı; başlık "1 dakikalık ölçüm". |
| Mikrofon izni reddedildi | Seans kabuğunda Tıkır balonu: iznin nasıl açılacağını anlatır; "Yeniden dene" düğmesi. Yeniden deneme de olmazsa "Bugün dinlemeden oku": seansın kalanı dinlemesiz yürür (`docs/kararlar.md` P14). |
| Mikrofon hiç yok ya da hata | Aynı kalıp, farklı metin; aynı geri dönüş (P14). |
| Yükleniyor | Tıkır `think` yüz ifadesi ve tek satır metin. İskelet ekran yok. |
| Boş durumlar (kitap yok, ölçüm yok, takılınan kelime yok) | Kart içinde tek cümle ve bir sonraki adımın düğmesi. |
| Hata bildirimi | Ne olduğunu ve ne yapılacağını söyleyen tek cümle; özür dilemez. |
| Çevrimdışı | Üstte ince şerit. Seans, içerik önceden indirildiyse sürer. |
| Kitap üretimi beklemesi | Tıkır `think` ve "Kitabın yazılıyor" satırı; iptal düğmesi. |
| Kayıt gönderme onayı (veli) | V2 altında "Onay bekleyen kayıtlar" listesi: dinle, onayla, sil. |
| Hesap ve veri silme | Veli alanında "Hesap" sayfası: kayıtları dinle ve sil, hesabı sil. |
| Serinin hazır bölümleri bitti | G1 bölüm kartında tek cümle ("Yeni bölümler yolda.") ve Kitaplık düğmesi. Örnek içerikte 5 bölüm var. |
| U2'de 1. sınıf | Tasarımda sınıf düzeyi 2, 3, 4. Çocuk 1. sınıftaysa bölmeli denetime "1" eklenir ve seçili gelir. |
| Bugünün seansı başlamış ya da bitmişken kitap kartı | Kart pasif görünür, altında "Yarın okuyabilirsin." yazar. |
