# Faz 5: Kitaplık ve kitap üretimi

**Durum:** onaylandı (2026-11-21). Dal: `faz-5`.

> **Uygulayıcı için:** Görevler `superpowers:executing-plans` ile sırayla uygulanır; adımlar `- [ ]` ile izlenir. Her görev önce kırmızı testle başlar.

- **Amaç:** Kitaplık (U1), kartlarla kitap (U3), metinden kitap (U2) ve kitap hazır (U4); sahte kitap üreticisi; üretilen ya da kitaplıktaki bir kitabın günün seansı olarak okunması.
- **Mimari:** Faz 3 ve 4'ün kalıpları sürer.
  - Kitap metninin bölünmesi, kart cümleleri ve okuma süresi `src/domain`'de saf işlevlerdir.
  - Üretim `src/services/books`'taki `BookGenerator` arayüzünün arkasındadır.
  - Kitapların kaydı ve kitapla seans başlatma seans deposunun eylemleridir.
  - Odak kabuğu, kurulumdaki gibi çerçeve (`src/app`) ile sayfanın kurduğu düzene (`src/features`) ayrılır.
- **Teknoloji:** React 19, react-router 8, Zustand 5, IndexedDB (`idb`), Vitest 5 ve Testing Library, Playwright (Chromium ve WebKit). Yeni bağımlılık yok.
- **Dayanak:** Bu belgenin "Kararlar" bölümü; `docs/ekranlar.md` ("Kitaplık ve kitap üretimi", "Tasarımı olmayan durumlar"), `docs/urun.md` bölüm 3 ve 6, `docs/mimari.md` (`BookGenerator`, `MockBookGenerator`, okunabilirlik), `docs/kararlar.md` ve `design/ekranlar/U1…U4-*.html`.

**Okunanlar:** `docs/yol-haritasi.md` (Faz 5), `docs/ekranlar.md`, `docs/urun.md` (bölüm 3, 6), `docs/mimari.md`, `docs/kararlar.md` (P5, C3, D7, T22; yanıt bekleyen 10. soru), `seed/README.md`, `seed/ornek-kitaplar.json`, `design/ekranlar/U1…U4-*.html` ve `design/png`, mevcut kod (Faz 4 sonu).

## Kapsam

**Girenler:**

- U1–U4 ve üretim beklemesi.
- `MockBookGenerator`: kartlardan örnek kitap, veli metninden gerçek bölme (sayfa, cümle, anlam ünitesi) ve gerçek seviye denetimi.
- Kitaplıktaki ya da yeni üretilen bir kitapla günün seansı: G1'den G7'ye.
- Faz 4'ten iki küçük iş: V2 kitaplık kitabının seanslarına da bakar; kayıt satırı kitaplık kitabını adıyla anar.

**Girmeyenler:**

- Arka uç üretimi: seviyeye indirme, takılan kelimeleri yerleştirme, anlama soruları, resim, seslendirme (Faz 6). Sahte üretici bunları yapmaz; U4 bunu söyler.
- U2'nin "Sayfa fotoğrafı" ve "Konu yaz" sekmeleri (`docs/ekranlar.md`: ilk sürümde gizli).
- Kitap silme, kitabı yeniden adlandırma (tasarımda yok).
- Faz 4'ten ertelenen öteki küçük bulgular (`docs/planlar/faz-4.md`, "Son incelemeden ertelenen küçük bulgular").

## Ürün sahibinin yanıtları (2026-11-20)

1. **Kitapla geçen gün G1'de:** Günün seansı kitaplıktan bir kitapla başladıysa G1'in kartı o kitabı gösterir (kapak, ad, "Sürdür" ya da "Bugünlük bitti"). Seri yolu yerinde kalır, ertesi gün seri kaldığı bölümden sürer. Yarım kalan kitap seansı G1'den sürdürülür.
2. **Kitap okumasının kaydı:** Stüdyo'ya girmez. G5'te çocuk kaydı dinler ve veliye gönderir; serinin sesli kitap şeridi ve "Sesli kitabına eklendi" bu seansta görünmez. Veli kaydı Hesap'ta ve onay listesinde görür.
3. **Örnek metindeki ad:** Sahte üreticinin örnek metninde "Deniz" çocuğun adıyla değişir (metinde ekli biçim yok). Başka kahraman seçilse de metin aynı kalır (arka uç gelene kadar).
4. **Sınıf eşiğini aşan metin:** U4 uyarı gösterir, "Okumaya başla" açık kalır; karar velinin.
5. **Faz 4'ün açık onayları** ("tamam"):
   - Haftalık ölçüm ekranı K3'ün düzenindedir.
   - Onaylı cümleler yeni yerlerde kullanılır: V2'de "{n} gün dinlemeden okundu." ve "Bu hafta seans yapılmadı.", V3'te "Dinleme kapalı olduğu için ölçüm yapılmıyor.", kayıtlarda G5'in "Duraklat"ı.
   - Deneme hafta ortasında açılınca aynı gün yalnız denenen okuma için açılan ölçüm şimdilik böyle kalır.

## Kararlar (onaya sunulan)

### Veri, üretim ve depo

1. **Kitap isteği:** Üretilen kitap kendi isteğini taşır: `Book.request?: BookRequest`.
   - `BookRequest = { kind: 'cards'; hero: Id; place: Id; event: Id } | { kind: 'text'; text: string; grade: Grade; length: BookLength; insertStuckWords: boolean; addQuestions: boolean }`;
   - `BookLength = 'short' | 'medium' | 'long'`.
   - "Yeniden üret" bu istekle çalışır. İsteği olmayan kitapta (örnek içerikten gelenler) düğme görünmez.
2. **Üretici arayüzü** (`src/services/books/BookGenerator.ts`):
   - `cards()` U3'ün kartlarını verir (sahte üretici `seed/ornek-kitaplar.json`'dan; ekranlar içeriği doğrudan okumaz);
   - `fromCards(input, signal)` ve `fromText(input, signal)` kitabı döndürür;
   - `signal` (`AbortSignal`) "Vazgeç"te üretimi bırakır;
   - sahte üretici 1,5 saniye bekletir (`docs/mimari.md`: 1–2 saniye).
3. **Kartlardan** (`MockBookGenerator.fromCards`):
   - metin, sorular ve zincirler `seed/ornek-kitaplar.json`'daki kartlar kitabından gelir; seçilen kartlar metni değiştirmez;
   - metindeki "Deniz" (bütün kelime) çocuğun adı olur (yanıt 3);
   - başlık `titleTemplate` ile kurulur ("Uzay İstasyonunda Gizemli Ses");
   - sınıfı çocuğun sınıfıdır;
   - eklenen kelimeler örnek kitaptaki gibidir (`insertedWords`);
   - kimliği yeni, kaynağı `cards`.
4. **Metinden** (`fromText`; bölme saf işlev `bookFromText`):
   - metin değişmez; cümlelere `splitSentences` ile ayrılır, sayfa başına en çok 4 cümle;
   - anlam üniteleri virgüllerden bölünür, virgül önceki ünitede kalır;
   - başlık ilk cümlenin ilk en çok 6 kelimesidir, sondaki noktalama atılır;
   - soru, zincir ve eklenen kelime yoktur; sınıfı seçilen sınıftır, kaynağı `parentText`.
   - Uzunluk, kelime yerleştirme ve sorular uygulanmaz (arka uç işi, karar 26).
5. **Kitaplık verisi:** Günün verisi kitaplık kitaplarını taşır (`SessionData.books`, yeniden eskiye). Bugünün bölümünün kitabını da taşır (`SessionData.book`: seri ya da seansın kitaplık kitabı).
6. **Kaydetme:** `saveBook(book)` eylemi yeni kitabı yazar; "Yeniden üret" aynı kimlikle üstüne yazar.
7. **Kitapla seans** (`startWithBook(bookId)`):
   - bugün seans yoksa kitabın okunmamış sıradaki bölümüyle başlar;
   - bütün bölümleri okunduysa ilk bölümüyle başlar (yeniden okuma);
   - ısınma destesi o bölümden kurulur, günü gelen kart varsa ısınma önce gelir;
   - bugün seans varsa bir şey yapmaz (günde tek seans, P5).
8. **Bugünün bölümü:** Depo, bugünün bölümünü seansın kitabından okur (seri ya da kitaplık kitabı). Seans yokken serinin sıradaki bölümüdür (bugünkü gibi).
9. **Karnede kitaplık kitabı:**
   - V2'nin örnek satırı ve kelime dinleme kitaplık kitabının seanslarına da bakar;
   - kayıt satırı kitaplık kitabını adıyla yazar ("{kitap}, {tarih}", D18). Faz 4'ün kararı (16) ve son incelemenin "Kitaplık seansları" maddesi böylece kapanır.

### U1 Kitaplık

10. **İçerik** (tasarımdan):
    - "Kitaplık" ve "Yeni kitap";
    - seri kartı: kapak, ad, ilerleme çubuğu ("Hikâyedeki ilerleme"), "12 bölümün 3’ü tamam", "Sürdür" → G1;
    - "Senin kitapların": kitap kartları (kapak, ad, "Kartlarla yaptın" ya da "Velin ekledi");
    - tablette ve webde kesik kenarlı "Kartlarla kitap yap" kartı;
    - "Veli bir metinden kitap ekleyebilir" → veli kapısı → U2.
11. **Kapaklar:** Kitap kartı iki desen taşır; desenler kitabın kimliğinden hep aynı çıkacak biçimde mevcut altı desenden seçilir (`TODO(design)`; yanıt bekleyen 10. soru açık kalır).
12. **Kitap kartına dokunuş:** Günün seansını o kitapla başlatır (karar 7). Mikrofonu G1'in "Başla"sı gibi dokunuş açar (T22). Bugün seans varsa kart pasiftir, altında "Yarın okuyabilirsin." yazar (`docs/ekranlar.md` varsayılanı).
13. **Boş kitaplık:** Tablette ve webde yalnız kesik kenarlı kart görünür. Telefonda o kart yok; telefonda tek cümle ve "Kartlarla kitap yap" düğmesi (D18).

### U3 Kartlarla kitap

14. **Kartlar** `cards`'tan:
    - ilk kahraman "{ad} ve Tıkır";
    - ikonlar tasarımdan: Tıkır'ın yüzü, kedi, robot; ağaç, dalga, gezegen; harita, kulak, bayrak.
    - Grup başına tek seçim; seçimler gerçek radyo düğmeleridir.
15. **Tıkır'ın balonu:** Üç seçim tamamlanınca `summaryTemplate` ile kurulan cümle. Daha önce "Her sıradan bir kart seç." (onaylı alt başlık).
16. **"Kitabımı yap":** Üç seçim tamamlanmadan pasif (ölçüt 1). Dokunuş üretimi başlatır; bitince yeni kitap kaydedilir ve U4 açılır.
17. **Üretim beklemesi** (`docs/ekranlar.md` varsayılanı): Tıkır'ın `think` yüzü, "Kitabın yazılıyor" ve "Vazgeç". "Vazgeç" üretimi bırakır, U3'e döner, bir şey kaydetmez.

### U2 Metinden kitap

18. **Biçim** (tasarımdan):
    - başlık ve alt satır; telefonda kısa alt satır ("Metninizden Deniz’e göre bir kitap.", adın yönelme ekiyle);
    - tek sekme "Metin yapıştır", öbür ikisi gizli;
    - "Metin" ve canlı kelime sayacı ("{n} kelime");
    - "Sınıf düzeyi" 2, 3, 4: çocuk 1. sınıftaysa "1" eklenir (`docs/ekranlar.md` varsayılanı); çocuğun sınıfı seçili gelir;
    - "Uzunluk" kısa, orta, uzun ("Orta" seçili);
    - iki onay kutusu, seçili gelir;
    - tablette ve webde "Kitap böyle hazırlanır" kartı;
    - "Kitabı üret".
19. **Kelime sayacı:** Okuma metninin kelime kuralıyla sayar (`tokenize`; yazılı sayı tek kelime).
20. **"Kitabı üret":** En az bir kelime yokken pasif. Dokunuş U3'teki gibi beklemeyi gösterir, kitabı kaydeder, U4'ü açar. U4 çocuk tarafındadır; veli alanından çıkılınca kapı yeniden sorar (P11).

### U4 Kitap hazır

21. **Başlık:** Tasarımın başlığı ve alt satırı. Seviye denetimi geçmezse alt satır "Seviye denetiminden geçmedi." (D18).
22. **Kapak ve bilgi satırı:** Kapak (iki desen ve ad), kitabın adı, "{s} sayfa, {k} kelime, yaklaşık {d} dakika".
    - Sayılar gerçek hesaptır (tutarsızlık 6).
    - Süre: kelime ÷ çocuğun son denemesiz ölçümünün dakikadaki doğru kelimesi, yukarı yuvarlanır. Ölçüm yoksa dakikada 60 kelime (`config`). Deniz'de 176 ÷ 71 → 3.
23. **Çipler:** "{n} soru" yalnız soru varsa. "Resimli" ve "Seslendirildi" arka uç gelene kadar gizli (sahte üretici resim ve seslendirme yapmaz).
24. **Seviye denetimi** (`levelCheck(kitabın cümleleri, kitabın sınıfı)`):
    - geçerse "{s}. sınıf düzeyine uygun" ve iki satır işaretle ("Kelime başına ortalama 2,5 hece", "Cümle başına ortalama 5,9 kelime"; bir ondalık, Türkçe virgül);
    - geçmezse ilk satır "{s}. sınıf düzeyinin üstünde", sınırı aşan satırda uyarı işareti ve " (en çok {x})", kart açık safran (ölçüt 3; D18).
25. **İçine eklenen kelimeler:** Yalnız çocuğun kartlarında olan eklenen kelimeler; tasarımın cümlesiyle ("{ad}’in bu hafta takıldığı kelimeler hikâyede üçer kez geçiyor."). Hiçbiri yoksa bölüm görünmez.
26. **Arka uç notu:** Metinden üretilen kitapta kelime yerleştirme ya da sorular istenmişse "Kelime yerleştirme ve sorular arka uçla gelecek." (D18; `docs/mimari.md`).
27. **Tıkır'ın balonu** tasarımdan ("Kitabın hazır. Önce ben okuyayım, sonra sıra sende.").
28. **"Okumaya başla":** Karar 7, sonra ısınma ya da G3. Mikrofon dokunuşla açılır (T22).
    - Seviye uyarısında da açık (yanıt 4).
    - Bugün seans varsa pasif, altında "Yarın okuyabilirsin.".
29. **"Yeniden üret":** İstekle yeniden üretir (bekleme, karar 17), aynı kimlikle yazar, U4'te kalır. Telefonda simge düğmesi (tasarım).
30. **Geri:** U1'e döner (kartlarla da, metinden de).

### Kitaplık kitabıyla seans

31. **G1'in kartı** (yanıt 1): Seans bir kitaplık kitabıyla başladıysa kartta "Bugünkü kitap", kapak, kitabın adı, "Kitaplıktan, 12 dakika", "Sürdür" ya da "Bugünlük bitti". Tablet ve webde balon "Bugün kitaplıktan okuyoruz: {ad}. Hazırsan başlayalım." (D13'ün kalıbından; D18). Seri yolu ve "Yarın" kartı serinindir.
32. **Sayfa başlığı:** G3, G4 ve G6'nın sayfa kartında kitaplık kitabının adı yazar ("{seri}, {n}. bölüm" yerine).
33. **G5** (yanıt 2): Kitaplık kitabında serinin sesli kitap şeridi ve "Sesli kitabına eklendi" görünmez; kayıt, "Baştan kaydet" ve "Gönder" aynıdır. Stüdyo yalnız serinin kayıtlarını listeler (bugünkü gibi).
34. **G6:** Sorusuz kitapta G6 kendiliğinden biter (bugünkü davranış); G7 açılır.
35. **Takılan kelimeler:** Kitaplık kitabının okumasından da kart olur, zincir o bölümden gelir (bugünkü kural).

### Diğer

36. **Odak kabuğu:** `FocusShell` yalnız çerçeve olur (`data-shell="focus"`). Başlık, geri düğmesi, yan sütun ve eylem `src/features/library/FocusLayout.tsx`'e taşınır; U3 ve U4 onu kendileri kurar (kurulumdaki `OnboardingShell` ve `OnboardingLayout` gibi). Web üst çubuğundaki "Kitaplık" bağlantısı düzende kalır.
37. **Ad yönelme eki:** `withNameDativeSuffix(ad)`: "Deniz’e", "Ali’ye", "Umut’a", "Oya’ya", "Kemal’e" (ince "l"). U2'nin telefon alt satırı kullanır.
38. **Testler ve görüntüler:** Demo profilinin `cocuk-sabahi` kipi kitaplıkta iki kitapla gelir (U1). U3 ve U4 görüntüleri dokunuşlarla çekilir; komutlar "Tasarım karşılaştırması"nda.

## Tasarımı olmayan durumların metinleri (öneri)

Hepsi `TODO(design)`; onayla `docs/kararlar.md`'ye D18 olarak işlenir.

| Yer | Metin | Kaynak |
|---|---|---|
| Üretim beklemesi | Kitabın yazılıyor · Vazgeç | `docs/ekranlar.md` varsayılanı; düğme onaylı pencerelerden |
| U1, pasif kitap kartı | Yarın okuyabilirsin. | `docs/ekranlar.md` varsayılanı |
| U1, telefonda boş kitaplık | Henüz kitabın yok. Kartlarla ilk kitabını yap. · Kartlarla kitap yap | önerilen; düğme tasarımdan |
| U3, seçim tamamlanmadan balon | Her sıradan bir kart seç. | tasarımın alt başlığı |
| U4, seviye denetimi geçmedi | Seviye denetiminden geçmedi. (alt satır) · {s}. sınıf düzeyinin üstünde · sınırı aşan satırın sonunda: (en çok {x}) | önerilen |
| U4, arka uç notu | Kelime yerleştirme ve sorular arka uçla gelecek. | `docs/mimari.md` ("arka uçla gelecek" notu) |
| U4, pasif "Okumaya başla" | Yarın okuyabilirsin. | U1 ile aynı |
| G1, kitapla geçen gün | Bugünkü kitap (etiket) · Kitaplıktan, {n} dakika · Bugün kitaplıktan okuyoruz: {ad}. Hazırsan başlayalım. | önerilen; balon D13'ün kalıbından |
| Kayıt satırı, kitaplık kitabı | {kitap}, {tarih} | önerilen |

## Ölçütler ve kanıtları

| # | Yol haritası ölçütü (Faz 5) | Kanıt |
|---|---|---|
| 1 | U3'te üç seçim olmadan düğme pasif; özet seçime göre değişir; tasarımın seçimi tasarımın cümlesini ve başlığını verir | `books.test.ts`, U3 ekran testi, uçtan uca kitap kurma |
| 2 | U2'de kelime sayacı canlı; U4'ün ortalamaları `levelCheck` çıktısı | U2 ve U4 ekran testleri, `MockBookGenerator.test.ts` |
| 3 | Sınıf eşiğini aşan metinde U4 uyarı gösterir | U4 ekran testi; uçtan uca veli metni |
| 4 | U4'ten "Okumaya başla" günün seansını o kitapla başlatır (önce ısınma) ve akış G7'ye kadar çalışır | depo testi; uçtan uca kitapla seans |
| 5 | Çocuk tarafında serbest metin kutusu yok | uçtan uca: çocuk adreslerinde `textbox` yok |
| 6 | U1–U4 üç genişlikte tasarımla karşılaştırıldı | "Tasarım karşılaştırması" |

## İnceleme odağı

1. **Günde tek seans:** Kitapla başlayan gün seriyi ilerletmez, ama üst üste günü sayar. Kitapla başlamış seans yeniden yüklenince aynı kitapla sürer. G1, U1 ve U4 aynı anda tutarlıdır.
2. **Seansın kitabı:** Bütün seans ekranları bugünün bölümünü seansın kitabından okur: ısınma destesi, G3'ün sesi, G4, G5, G6 ve takılan kelime zincirleri.
3. **Üretim:** "Vazgeç" bir şey yazmaz. Çift dokunuş iki kitap üretmez. Üretim sürerken sayfadan çıkılırsa sonuç yazılmaz. "Yeniden üret" kitabı çoğaltmaz.
4. **Veli metni:** Boş, çok kısa, tek cümlelik, noktalamasız ya da rakamlı metin. Sayaç, bölme ve seviye denetimi tutarlıdır. Metin cihazdan çıkmaz.
5. **Mahremiyet ve çocuk kuralları:** Çocuk tarafında serbest metin yok. Mikrofon yalnız onayla ve dokunuşla açılır. U2 kapının arkasındadır; U4 çocuk tarafındadır.

## Açık sorular (onayı beklemez)

1. **10. soru (kapak deseni):** Tasarımdaki açık kobalt zeminde safran yıldız deseni `design/svg`'de yok; kapaklar mevcut altı desenle kurulur.
2. **Gerçek üretim** (seviyeye indirme, yerleştirme, sorular, resim, ses): Faz 6.

## Her görevde geçerli kurallar

- TypeScript `strict`, `any` yok. Arayüz metni yalnız `src/i18n/tr.ts`'te ve tasarımdan birebir; tasarımsız metin bu planın tablosundan. Emoji yok; ikonlar `design/svg/ikonlar.json`'dan.
- CSS Modules ve `tokens.css` değişkenleri. Renk, yazı boyutu, yarıçap ve gölge sabit yazılmaz; tasarımda olup token'da olmayan değer kaynağıyla `tokens-extra.css`'e girer.
- Bileşenler mikrofona, ağa ve depolamaya doğrudan dokunmaz (`src/services`); `src/domain` saf ve tamamı birim testli; `features` `src/app`'i içe aktarmaz.
- Türkçe büyük-küçük harf yalnız `toLocale*Case('tr-TR')`; okuma metinlerinde `font-variant-ligatures: no-common-ligatures`.
- Mikrofon yalnız `consent.voiceProcessing` varken ve bir dokunuşla açılır. Çalışma anında dış adrese istek yok. Çocuk ekranlarında puan, rozet, olumsuz kıyas yok. `/veli/*` kapının arkasında. Çocuğun okuyacağı içerik uydurulmaz.
- Erişilebilirlik: dokunma hedefi en az 44 px, görünür odak, gerçek `button`/`input`/`label`, karşıtlık token çiftleriyle.
- Depo kuralı: Bir eylem bütün yazılarını bitirince yayınlar; yayın eylemin son adımıdır.
- Testler StrictMode'da (`renderApp`); ekran testlerinde seçici her geçişten sonra yeniden aranır. Veli ekranlarının testleri kapıyı geliştirme ayarıyla açar.
- Her görevden sonra `eval "$(mise env -s zsh)" && pnpm check`. Her ekran 390, 1180 ve 1440 px'te `pnpm shots` ile `design/png` karşılığıyla karşılaştırılır; farklar "Tasarım karşılaştırması"na yazılır ve düzeltilir.
- Küçük, tek amaçlı commit'ler (Conventional Commits); push faz sonunda.

## Görev listesi

- [x] Task 0: Planı ve kararları işle
- [ ] Task 1: Kitap alan mantığı ve ad yönelme eki
- [ ] Task 2: Kitap üreticisi
- [ ] Task 3: Seans deposunda kitaplık ve kitapla seans
- [ ] Task 4: Odak düzeninin ayrılması
- [ ] Task 5: U1 Kitaplık
- [ ] Task 6: U3 Kartlarla kitap ve üretim beklemesi
- [ ] Task 7: U2 Metinden kitap
- [ ] Task 8: U4 Kitap hazır
- [ ] Task 9: Kitaplık kitabıyla seans ekranları
- [ ] Task 10: Uçtan uca testler
- [ ] Task 11: Belgeler, karşılaştırma ve denetim

## Görevler

### Task 0: Planı ve kararları işle

**Dosyalar:** `docs/planlar/faz-5.md` (durum: onaylandı), `docs/kararlar.md`.

- [x] `docs/kararlar.md`:
  - P16'nın notu: ölçüm ekranının K3 düzeni onaylı; deneme hafta ortasında açılınca aynı gün açılan ölçüm şimdilik böyle (yanıt 5);
  - D17'ye not: onaylı cümlelerin yeni yerleri (yanıt 5);
  - P18: kitapla geçen gün G1'de (yanıt 1, kararlar 7–8 ve 31);
  - P19: kitap okumasının kaydı Stüdyo'ya girmez (yanıt 2, karar 33);
  - C9: örnek metinde çocuğun adı (yanıt 3, karar 3);
  - P20: sınıf eşiğini aşan metin uyarıyla okunabilir (yanıt 4, karar 28);
  - D18: bu planın "Tasarımı olmayan durumların metinleri" tablosu;
  - değişiklik günlüğü.
- [x] `pnpm check` → geçer.
- [x] Commit: `docs: plan phase 5 and record the owner's answers`.

### Task 1: Kitap alan mantığı ve ad yönelme eki

**Dosyalar:** `src/domain/books.ts` (yeni), `books.test.ts`, `src/domain/text.ts`, `text.test.ts`, `src/domain/types.ts`, `src/domain/config.ts`.

**Üretir:**

```ts
// types.ts
type BookLength = 'short' | 'medium' | 'long';
type BookRequest = { kind: 'cards'; hero: Id; place: Id; event: Id }
  | { kind: 'text'; text: string; grade: Grade; length: BookLength; insertStuckWords: boolean; addQuestions: boolean };
// Book.request?: BookRequest; Book.insertedWords?: string[]
// config.ts
const bookPageSentences = 4; const bookTitleWords = 6; const fallbackReadingWpm = 60;
// books.ts
bookChapterFromText(text: string, title: string): Chapter;          // karar 4: sayfalar, üniteler
bookTitleFromText(text: string): string;                            // karar 4
cardsTitle(cards: CardSet, choice: CardChoice): string;             // titleTemplate
cardsSummary(cards: CardSet, choice: CardChoice, childName: string): string; // summaryTemplate
withChildName(chapter: Chapter, childName: string): Chapter;        // karar 3: "Deniz" → ad (bütün kelime)
readingMinutes(words: number, wcpm: number | null): number;        // karar 22
nextBookChapter(sessions, book): number;                            // karar 7
// text.ts
withNameDativeSuffix(name: string): string;
```

- [ ] **Kırmızı:**
  - Tasarımın seçimi: "Uzay İstasyonunda Gizemli Ses" ve "Deniz ve Tıkır, uzay istasyonunda gizemli bir sesin peşine düşüyor." Başka bir seçim başka cümle; çocuğun adı kahramanda.
  - Metin bölme:
    - U2 tasarımının metni üç cümle, bir sayfa;
    - beş cümle iki sayfa (4 + 1);
    - virgüller ünite sınırı;
    - noktalamasız tek cümle;
    - rakamlı cümle;
    - `levelCheck` aynı cümlelerle aynı sayıları verir.
  - Başlık: ilk cümlenin ilk 6 kelimesi, sonda noktalama yok.
  - Ad değişimi: "Deniz" → "Ali"; "Denizaltı" değişmez.
  - Süre: 176 ve 71 → 3; ölçüm yoksa 176 ÷ 60 → 3; en az 1.
  - Sıradaki bölüm: tek bölümlü kitap okunduysa 1.
  - Yönelme: Deniz’e, Ali’ye, Umut’a, Oya’ya, Kemal’e.
- [ ] → FAIL. Uygula. → PASS. `pnpm check`.
- [ ] Commit: `feat(domain): split a text into a book and build the card sentences`.

### Task 2: Kitap üreticisi

**Dosyalar:** `src/services/books/BookGenerator.ts` (yeni), `MockBookGenerator.ts` (+test), `src/features/session/sessionContext.ts`, `src/app/services.ts`, `src/test/sessionDevices.ts`.

**Kullanır:** Task 1.

**Üretir:** `BookGenerator { cards(): CardSet; fromCards(input: { choice: CardChoice; childName: string; grade: Grade }, signal?: AbortSignal): Promise<Book>; fromText(input: Extract<BookRequest, { kind: 'text' }>, signal?: AbortSignal): Promise<Book> }`; `SessionDevices.books: BookGenerator`. `CardSet` ve `CardChoice` tipleri `src/domain/books.ts`'te (Task 1).

- [ ] **Kırmızı:**
  - Kartlar:
    - başlık ve istek;
    - "Deniz" yerine çocuğun adı;
    - sınıf çocuğun sınıfı;
    - eklenen kelimeler;
    - her üretim yeni kimlik.
  - Metin:
    - sayfalar ve başlık;
    - soru yok;
    - istek saklı.
  - `signal` iptal edilince söz `AbortError` ile reddedilir, kitap dönmez.
- [ ] → FAIL. Uygula. → PASS. `pnpm check`.
- [ ] Commit: `feat(services): generate a book from cards or from a parent's text`.

### Task 3: Seans deposunda kitaplık ve kitapla seans

**Dosyalar:** `src/features/session/sessionStore.ts` (+test), `src/features/parent/views.ts` (+test).

**Kullanır:** Task 1, 2.

**Üretir:** `SessionData.books: Book[]`, `SessionData.book: Book`; `saveBook(book): Promise<void>`, `startWithBook(bookId): Promise<void>`.

- [ ] **Kırmızı:**
  - Demo kitaplığı iki kitap, yeniden eskiye.
  - `saveBook` yeni kitabı ekler, aynı kimlikle üstüne yazar.
  - `startWithBook`:
    - bugün seans yokken seansı kitabın bölümüyle başlatır, ısınma destesi o bölümden;
    - bugün seans varsa bir şey yazmaz.
  - Yeniden yükleme: kitapla başlamış seansın bölümü kitaptan gelir; seri ilerlemez, üst üste gün sayılır.
  - V2'nin örnek satırı kitaplık seansından da gelir; kayıt satırı "{kitap}, {tarih}".
- [ ] → FAIL. Uygula. → PASS. `pnpm check`.
- [ ] Commit: `feat(session): keep the library and start the day with a book`.

### Task 4: Odak düzeninin ayrılması

**Dosyalar:** `src/app/shells/FocusShell.tsx` (+CSS), `src/features/library/FocusLayout.tsx` (yeni, +CSS, +test), `src/app/router.tsx`.

- [ ] Kırmızı: `FocusLayout` başlığı, alt satırı, geri bağlantısını, yan sütunu ve eylemi çizer; web üst çubuğunda "Kitaplık". `FocusShell` yalnız çerçevedir.
- [ ] → FAIL. Uygula; U3 ve U4'ün yer tutucuları düzeni kendileri kurar. → PASS. `pnpm check`. `pnpm e2e e2e/routes.spec.ts` (odak kabuğu adresleri).
- [ ] Commit: `refactor(library): let the focus pages lay out their own side column and action`.

### Task 5: U1 Kitaplık

**Dosyalar:** `src/features/library/LibraryPage.tsx` (+CSS, +test), `src/features/library/views.ts` (+test), `src/i18n/tr.ts`.

- [ ] **Kırmızı:**
  - Demo kitaplığı tasarımdaki gibi: seri kartı ve ilerleme, iki kitap ve kaynakları, "Kartlarla kitap yap", veli bağlantısı.
  - Kitap kartına dokunuş seansı başlatır ve ısınmayı açar, mikrofon dokunuşta.
  - Bugün seans varken kart pasif, "Yarın okuyabilirsin.".
  - Telefonda boş kitaplık cümlesi.
  - Kapak desenleri kitaptan hep aynı.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots '/kitaplik?demo=cocuk-sabahi'` → U1 ile karşılaştır.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(library): build the library (U1)`.

### Task 6: U3 Kartlarla kitap ve üretim beklemesi

**Dosyalar:** `src/features/library/BookFromCardsPage.tsx` (+CSS, +test), `src/features/library/BookGenerating.tsx` (+CSS), `src/i18n/tr.ts`.

- [ ] **Kırmızı:**
  - Kartlar ve gruplar; tek seçim.
  - Balon önce "Her sıradan bir kart seç.", üç seçimde özet.
  - Düğme üç seçime kadar pasif.
  - Üretim: bekleme ve "Vazgeç" (bir şey yazmaz); bitince kitap kaydedilir, U4 açılır.
  - Çift dokunuş tek kitap.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots --dokun 'Deniz ve Tıkır' --dokun 'Uzay istasyonu' --dokun 'Gizemli ses' '/kitaplik/kur?demo=cocuk-sabahi'` → U3 ile karşılaştır.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(library): build a book from cards (U3)`.

### Task 7: U2 Metinden kitap

**Dosyalar:** `src/features/parent/BookFromTextPage.tsx` (+CSS, +test), `src/i18n/tr.ts`, `src/app/router.tsx`.

- [ ] **Kırmızı:**
  - Biçim tasarımdaki gibi.
  - Sayaç yazdıkça değişir.
  - 1. sınıf çocukta "1" seçili.
  - Boş metinde düğme pasif.
  - Üretim kitabı kaydeder ve U4'ü açar; istek saklı.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots '/veli/kitap?demo=cocuk-sabahi&kapi=acik'` → U2 ile karşılaştır (metin kutusu boş: bilinen fark).
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(parent): build a book from a parent's text (U2)`.

### Task 8: U4 Kitap hazır

**Dosyalar:** `src/features/library/BookReadyPage.tsx` (+CSS, +test), `src/features/library/views.ts`, `src/i18n/tr.ts`.

- [ ] **Kırmızı:**
  - Örnek kitap tasarımdaki gibi; sayılar gerçek hesap: 176 kelime, 2,5 hece, 5,9 kelime, yaklaşık 3 dakika.
  - Eşiği aşan metin uyarısı, "Okumaya başla" açık.
  - Eklenen kelimeler yalnız çocuğun kartlarından.
  - Arka uç notu.
  - "Okumaya başla" seansı başlatır; bugün seans varken pasif.
  - "Yeniden üret" aynı kimlikle; isteksiz kitapta yok.
  - Geri U1.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots '/kitaplik/uzay-istasyonunda-gizemli-ses/hazir?demo=cocuk-sabahi'` → U4 ile karşılaştır.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(library): show the ready book (U4)`.

### Task 9: Kitaplık kitabıyla seans ekranları

**Dosyalar:** `src/features/session/RoadPage.tsx` (+CSS, +test), `src/features/session/views.ts` (+test), `ListenPage.tsx`, `ReadPage.tsx`, `WrapUpPage.tsx`, `RecordPage.tsx` (+testler), `src/i18n/tr.ts`, `src/features/dev/params/` (`&kitap=<kimlik>`, +test), `CLAUDE.md` ve `docs/mimari.md` (geliştirme parametresi).

- [ ] **Kırmızı:**
  - G1'de kitapla geçen günün kartı ve balonu; seri yolu değişmez.
  - G3, G4, G6'da sayfa başlığı kitabın adı.
  - G5'te serinin şeridi yok.
  - Sorusuz kitapta G6'dan G7'ye.
  - Takılan kelimeler kitabın bölümünden.
  - Geliştirme parametresi `&kitap=<kimlik>`: bugünün seansını o kitapla başlatır (`&adim=` ile birlikte o adıma getirir); yalnız geliştirme ve `e2e` derlemesinde.
- [ ] → FAIL. Uygula. Görüntü: `pnpm shots '/?demo=cocuk-sabahi&kitap=uzay-istasyonunda-gizemli-ses'` üç genişlikte.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(session): read a library book through the day's session`.

### Task 10: Uçtan uca testler

**Dosyalar:** `e2e/library.spec.ts` (yeni), `e2e/no-external-requests.spec.ts`, `e2e/routes.spec.ts`.

- [ ] Testler (Chromium ve WebKit):
  1. "a book made from cards opens ready" (ölçüt 1): U3 tasarımın seçimi, düğme, başlık ve özet, U4.
  2. "a parent's text becomes a book with its real level check" (ölçüt 2, 3): U2'ye metin, sayaç, U4'ün sayıları; eşiği aşan metin uyarısı.
  3. "reading a library book is the day's session up to G7" (ölçüt 4): U4'ten "Okumaya başla", ısınma, dinle, üç okuma, kayıt, kapanış, G7; G1 kitabı gösterir; ertesi gün seri sürer.
  4. "no child screen has a free text box" (ölçüt 5).
  5. `no-external-requests`: üretim ve kitapla seans.
- [ ] `caffeinate -u -t 2; caffeinate -d -i pnpm e2e e2e/library.spec.ts e2e/no-external-requests.spec.ts e2e/routes.spec.ts` → geçer.
- [ ] Commit: `test(e2e): run the library, the book generation and a book's session end to end`.

### Task 11: Belgeler, karşılaştırma ve denetim

**Dosyalar:** `docs/mimari.md`, `docs/ekranlar.md`, `docs/kararlar.md`, `CLAUDE.md` (gerekirse), bu plan.

- [ ] Belgeler:
  - `docs/mimari.md`: kitap üretimi (`BookGenerator`, `MockBookGenerator`), kitapla seans, odak düzeni.
  - `docs/ekranlar.md`: U1–U4 ayrıntılarına gönderme.
  - `docs/kararlar.md`: değişiklik günlüğü.
- [ ] Tasarım karşılaştırması: U1–U4 ve kitapla G1; fark listeleri (ölçüt 6).
- [ ] Denetim:
  - `pnpm check`;
  - `pnpm build` ve `dist/` taraması;
  - `caffeinate -u -t 2; caffeinate -d -i pnpm e2e`;
  - çıktılar "Kanıtlar"a.
- [ ] Commit: `docs: record phase 5 decisions and evidence`.

Sonra bütün dal bağımsız bir incelemeden geçer; düzeltmeler tek geçişte yapılır. Faz bitince dal `main`'e `--no-ff` birleştirilir ve gönderilir (ürün sahibinin kalıcı talimatı).

## Tasarım karşılaştırması

| Ekran | Komut |
|---|---|
| U1 | `pnpm shots '/kitaplik?demo=cocuk-sabahi'` |
| U3 | `pnpm shots --dokun 'Deniz ve Tıkır' --dokun 'Uzay istasyonu' --dokun 'Gizemli ses' '/kitaplik/kur?demo=cocuk-sabahi'` |
| U4 | `pnpm shots '/kitaplik/uzay-istasyonunda-gizemli-ses/hazir?demo=cocuk-sabahi'` |
| U2 | `pnpm shots '/veli/kitap?demo=cocuk-sabahi&kapi=acik'` |
| G1, kitapla geçen gün | `pnpm shots '/?demo=cocuk-sabahi&kitap=uzay-istasyonunda-gizemli-ses'` |

Uygulama sırasında her ekranın fark listesi buraya eklenir.

**U1** (`shots/kitaplik-demo-cocuk-sabahi-*.png` ↔ `design/png/U1-kitaplik-*.png`): yerleşim, ölçüler, metinler, seri kartı, kesik kenarlı kart ve veli bağlantısı üç genişlikte örtüşür. Farklar:

1. Kitap kapaklarının desenleri: kitabın kimliğinden türetilir (karar 11). Tasarımın ikinci desenleri (açık kobalt zeminde safran yıldız, açık turkuaz zeminde kobalt yarım daireler) `design/svg`'de yok (10. soru). Bilinen fark.
2. Kapak şeridi tasarımdan 1–2 px yüksek (desenler kare çizilir). Düzeltilmedi.

**U3** (`shots/kitaplik-kur-demo-cocuk-sabahi-*.png`, tasarımın seçimiyle ↔ `design/png/U3-kartlarla-kitap-*.png`): kartlar, gruplar, seçim rozeti, Tıkır ve balon, "Kitabımı yap" üç genişlikte örtüşür. Düzeltilenler: telefonda Tıkır ve balon eylem çubuğuna itiliyordu (içeriğin hemen altına alındı). Webde "Kitabımı yap" sütunun dibindeydi (balonun altına alındı). Görüntü betiği düğmenin kabartısını geçiş bitmeden çekiyordu (`scripts/shots.ts` artık süreli geçişleri bekliyor). Kalan fark: webde balonla düğme arası 24 px (tasarım 20; ızgaranın satır boşluğu).

**U2** (`shots/veli-kitap-demo-cocuk-sabahi-kapi-acik-*.png` ↔ `design/png/U2-metinden-kitap-*.png`): başlık, alt satır (telefonda kısa olanı, adın yönelme ekiyle), metin alanı ve sayaç, sınıf ve uzunluk seçimleri, onay kutuları, "Kitap böyle hazırlanır" ve "Kitabı üret"in yeri üç genişlikte örtüşür. Düzeltilenler: başlıkla form arası (tablet 20, web 24 px); tablette düğme kabuğun dibine indi. Farklar:

1. Kaynak çubuğunda yalnız "Metin yapıştır" var (`docs/ekranlar.md`: öbür ikisi ilk sürümde gizli). Tek bölüm olduğu için telefonda da uzun adı taşır (tasarım: "Metin").
2. Metin kutusu boş, sayaç "0 kelime", "Kitabı üret" pasif: görüntü aracında yazma adımı yok. Dolu hâli birim ve uçtan uca testlerde.
3. Telefonun üst şeridinde Faz 4'ün Hesap ve geri düğmeleri var (kabuk; Faz 4, karar 27).

**Üretim beklemesi** (tasarımı yok; `--dokun 'Kitabımı yap' --ileri 100` ile): Tıkır `think`, "Kitabın yazılıyor", "Vazgeç"; içerik alanının ortasında, yan sütun ve eylem yok.

## Kanıtlar

Uygulama sırasında doldurulur.

## Uygulamada verilen kararlar

Uygulama sırasında doldurulur.
