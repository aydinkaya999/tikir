# Ürün tanımı

Bu belge "ne yapıyoruz ve hangi kurala göre" sorusunu yanıtlar. Ekranların ayrıntısı `docs/ekranlar.md`, görünümü `docs/tasarim-sistemi.md` içindedir.

## 1. Kim için

- **Çocuk (okuyucu):** 7–10 yaş, ilkokul 1–4. sınıf. Harfleri çözüyor ama yavaş, takılarak ya da kelime atlayarak okuyor.
- **Veli:** Hesabı açar, onay verir, haftalık karneyi izler, isterse kendi metninden kitap ekler.

Örnek kullanıcı tasarımlarda "Deniz, 3. sınıf" olarak geçer. Çalışma adı ve yoldaş karakterin adı **Tıkır**.

## 2. Ölçü

Ürünün tek başarı ölçüsü hız değil, **bir dakikada doğru okunan kelime** ve anlamadır.

```
correctWords = wordsAttempted − countedErrors
wcpm         = round(correctWords × 60 / seconds)
accuracy     = correctWords / wordsAttempted
```

- **Düşülen hatalar (`countedErrors`):** yanlış okuma, ek hatası, atlama, yardım alınan kelime (3 saniye duraksamadan sonra ipucu verilen kelime).
- **Sayılan ama düşülmeyenler:** tekrar, ekleme, kendini düzeltme. Veli karnesinde görünürler.
- **Okuma düzeyi** yuvarlanmamış `accuracy` ile belirlenir: %90 altı *endişe*, %90 ile %99 arası *öğretim*, %99 ve üstü *serbest*.
- **Tonlama puanı** 1–4 arasıdır. Gerçek hesabı arka uç işidir; sahte dinleyicide senaryodan gelir.
- **Hedef çizgisi:** ilk hedef = başlangıç ölçümü + haftada 2 doğru kelime × 6 hafta (örnek: 58 → 70). Hedef geçilince yeni hedef = eski hedef + 8 (örnek: 70 → 78). Bu sayılar `src/domain/config.ts` içinde parametre olur.
- **Sınıf ortalaması çizgisi:** 3. sınıf 90, 4. sınıf 98. 1. ve 2. sınıf için çizgi gösterilmez. Bu değerler başlangıç için alınmış yaklaşık sayılardır; yayından önce bir norm çalışmasıyla doğrulanacak (`docs/kararlar.md` P8).

Tasarımdaki sayılar örnektir. Ölçüm ekranındaki "76 kelime, 5 hata" bu formülle %93 eder; tasarımda %94 yazıyor. Kodda formül geçerlidir.

## 3. Günlük seans (12 dakika)

| # | Adım | Süre | Ekran | Ne olur |
|---|---|---|---|---|
| 1 | Isınma | 2 dk | G2 | Günü gelen en çok 3 canavar kelime: hecele, büyüyen kelimeyi oku |
| 2 | Dinle | 1 dk | G3 | Tıkır bölümü okur; metin anlam ünitelerine bölünmüş görünür |
| 3 | Oku | 6 dk | G4 | Çocuk aynı metni okur: 1. ve 2. okuma prova, 3. okuma kayıt |
| 4 | Kayıt | 2 dk | G5 | Kaydı dinler, isterse baştan kaydeder, sesli kitabına eklenir |
| 5 | Kapanış | 1 dk | G6 | 2 anlama sorusu |
| | Bitti | | G7 | Bugünün özeti; sonraki bölüm ertesi gün açılır |

Haftada bir, seansın yerine geçmeyen 1 dakikalık **ölçüm** yapılır; sonucu veli karnesine gider. Ölçüm metni çocuğun daha önce çalışmadığı bir metindir; metinler `seed/olcum-metinleri.json` içindedir ve bir çocuğa aynı metin art arda iki ölçümde verilmez (sınıfında tek metin varsa verilir).

Günün seansı tek bir bölümdür: çocuk ya serinin sıradaki bölümünü ya da kitaplığından bir kitabı okur. Hangisini seçerse seçsin akış aynıdır ve o gün ikinci bir seans açılmaz.

## 4. Değişmez ürün kuralları

Bunlar araştırmaya dayanır. Kolaylık olsun diye esnetilmez.

1. **Aynı metin üç kez okunur.** Tekrarlı okuma, akıcılık için en iyi kanıtlanmış yöntemlerden biridir.
2. **Önce model, sonra çocuk.** Dinle adımı atlanamaz; yeniden dinlenebilir.
3. **Yardım 3 saniyede gelir.** Çocuk bir kelimede 3 saniye durursa Tıkır kelimeyi heceleyerek gösterir ve seslendirir. Kelime "yardım alındı" sayılır.
4. **Hata anında okuma kesilmez.** Yanlış okunan kelime sessizce işaretlenir. Tıkır "yanlış" demez.
5. **Hız ödüllendirilmez.** Çocuğa "daha hızlı" denmez. Gösterilen sayı doğru kelimedir.
6. **Kıyas yalnız çocuğun kendi geçmişiyledir.** Hayalet imleci dünkü okumasıdır. Ekranda başka çocuk yoktur.
7. **Olumsuz fark gösterilmez.** Öndeyse "Dünkü senin 2 kelime önündesin." yazılır. Gerideyse sayı verilmez. Bitti ekranındaki "Dünkü senden 4 fazla" yalnız fark artıysa görünür.
8. **Ödül okumanın kendisidir:** yeni bölüm, evcilleşen kelime, kendi sesinden sesli kitap. Puan, jeton, rozet ve sıralama yoktur.
9. **Seans sonludur.** Günde bir bölüm. Bitince "Bugünlük bitti" ekranı gelir ve sıradaki bölüm ertesi gün açılır.
10. **Çocuğa serbest metin kutusu verilmez.** Çocuk kitabını kartlarla kurar. Serbest metin yalnız veli alanındadır.
11. **Kayıt, veli onayı olmadan kimseye gitmez.**

## 5. Canavar kelimeler

Çocuğun takıldığı kelimeler karta dönüşür ve geri gelir.

- **Karta dönüşme:** Bir okumada yanlış okunan, eki yanlış okunan, atlanan ya da yardım alınan kelime `stuckWord` olur. Aynı kelime yeniden takılırsa sayacı artar.
- **Kart içeriği:** kelime, heceleri, büyüyen kelime zinciri (`wordChain`, içerikle birlikte gelir), takılma sayısı, durum, sıradaki gün.
- **Durumlar:** `wild` (yeni) → `practicing` (çalışılıyor) → `tamed` (evcilleşti).
- **Evcilleşme:** ısınmada üç doğru okuma. Kart oluştuktan 1 gün sonra ilk kez gelir; doğru okunursa 2 gün sonra, yine doğru okunursa 4 gün sonra gelir ve üçüncü doğru okumada evcilleşir. Yanlış okunursa seri sıfırlanır ve kart ertesi güne döner.
- Seri yalnız ısınmadaki okumayla ilerler. Metin okurken aynı kelimeye yeniden takılmak sayacı artırır ve seriyi sıfırlar.
- **Isınma:** her gün günü gelen en çok 3 kart, en çok takılınandan başlayarak (eşitlikte Türkçe alfabe sırasıyla). Günü gelen kart yoksa bugünkü metnin en uzun 3 kelimesi kullanılır. Seans yapılmayan günün kartları sonraki seansa kalır.
- Evcilleşen kelimeler Albüm'e girer (Albüm ekranının tasarımı henüz yok).

## 6. Kitaplar

- **Seri kitap:** "Kayıp Fenerin İzinde", 12 bölüm. İlk 5 bölüm `seed/kayip-fenerin-izinde.json` içinde hazır.
- **Örnek kitaplar ve kart verisi:** `seed/ornek-kitaplar.json` (sahte üreticinin döndürdüğü kitap, velinin eklediği örnek kitap, U3 kartları).
- **Çocuğun kurduğu kitap (U3):** üç karttan seçim: kahraman, mekân, olay.
- **Velinin eklediği kitap (U2):** metin yapıştırır, sayfa fotoğrafı çeker ya da konu yazar. Yalnız "metin" durumu tasarlandı.
- **Üretim hattı:** seviyeye indir → sayfalara ve anlam ünitelerine böl → takıldığı kelimeleri yerleştir (her biri üç kez) → resimle → seslendir → 2 anlama sorusu yaz.
- **Seviye denetimi kodla yapılır, modele bırakılmaz.** Ölçütler: kelime başına hece, cümle başına kelime ve Ateşman puanı (`docs/mimari.md`). Sınıf eşikleri başlangıç değeridir ve bir sınıf öğretmeniyle kalibre edilecektir:

| Sınıf | Kelime başına hece (en çok) | Cümle başına kelime (en çok) |
|---|---|---|
| 1 | 2,2 | 5 |
| 2 | 2,4 | 6 |
| 3 | 2,7 | 8 |
| 4 | 2,9 | 10 |

- **Uzunluk:** kısa 120, orta 180, uzun 260 kelime.
- Üretilen metin denetimi geçmezse yeniden yazdırılır. Üretimin kendisi (dil modeli, resim, seslendirme) arka uç işidir; ön yüz bir `BookGenerator` arayüzü görür.

## 7. Yazı ayarı

Her çocuğun okuma metni kendi ayarıyla görünür (V4). Ayar bütün okuma metinlerine uygulanır: G3, G4, K3, ölçüm ve önizleme.

- **Yazı tipi:** `clear` (Net harfler, Atkinson Hyperlegible Next) ya da `school` (Okul harfleri, a ve g defterdeki gibi). Okul harfleri için asıl yazı tipi kararı açık (TTKB Dik Temel Abece ya da Andika); tuvalde yer tutucu olarak Didact Gothic kullanıldı.
- **Harf boyutu:** dört kademe. **Harf aralığı:** üç kademe; kelime aralığı onunla birlikte açılır. Değerler `design/tokens.json` → `readingSettings`.
- **Varsayılan:** 1–2. sınıf `school`, 3–4. sınıf `clear`; boyut "Orta", aralık "Normal".
- **Ölçerek seçme:** açıkken haftalık ölçümde iki ayar arka arkaya, iki ayrı metinle denenir (sıra her hafta değişir). Denenen ayar, geçerli ayarın bir kademe açık harf aralığıdır (aralık zaten en açıksa bir kademe darı). Haftanın karnedeki değeri geçerli ayarla yapılan ölçümdür; öteki `trial` olarak işaretlenir. Her ayarla dört ölçüm birikince ortalaması daha yüksek olan önerilir. Fark 5 doğru kelimeden azsa öneri yapılmaz, "fark küçük" denir.

## 8. Mahremiyet

- Çocuğun sesi kişisel veridir. Veli açık onay vermeden mikrofon açılmaz. Onay kutusu varsayılan olarak **işaretsiz** gelir.
- Veli kayıtları dinleyebilir ve silebilir.
- Çocuk ekranlarında üçüncü taraf analitik ve reklam yoktur.
- Onay metni ve saklama süreleri taslaktır; yayından önce hukuki inceleme gerekir (KVKK).

## 9. Sözlük: arayüz terimi → kod adı

| Türkçe | Kod |
|---|---|
| doğru kelime / dakika | `wcpm` |
| doğruluk | `accuracy` |
| ölçüm | `assessment` |
| seans | `session` |
| ısınma, dinle, oku, kayıt, kapanış, bitti | `warmup`, `listen`, `read`, `record`, `wrapUp`, `done` |
| bölüm, sayfa, anlam ünitesi | `chapter`, `page`, `phraseUnit` |
| canavar kelime | `stuckWord` (`wild`, `practicing`, `tamed`) |
| büyüyen kelime | `wordChain` |
| hayalet (dünkü sen) | `ghost` |
| yoldaş (Tıkır) | `companion` |
| tonlama puanı | `prosodyScore` |
| yanlış okuma, ek hatası, atlama | `misread`, `suffix`, `skipped` |
| tekrar, ekleme, kendini düzeltme, yardım | `repeated`, `inserted`, `selfCorrected`, `helped` |
| endişe, öğretim, serbest düzey | `frustration`, `instructional`, `independent` |
| veli, okuyucu | `parent`, `child` |
| kitaplık, kitap | `library`, `book` |
| yazı ayarı | `readingStyle` (`font`, `sizeStep`, `spacingStep`) |
| veli kapısı | `parentGate` |
