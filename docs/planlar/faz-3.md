# Faz 3: İlk kurulum, veli kapısı, yazı ayarı

**Durum:** onaylandı (ürün sahibi, 2026-11-20). Dal: `faz-3`.

> **Uygulayıcı için:** Görevler `superpowers:executing-plans` ile sırayla uygulanır; adımlar `- [ ]` ile izlenir. Her görev önce kırmızı testle başlar.

- **Amaç:** Boş bir cihazda veli hesabından ilk bölüme kadar kurulum; veli alanının kapısı; çocuğun yazı ayarının bütün okuma metinlerine uygulanması; mikrofon kullanılamayınca dinlemeden devam.
- **Mimari:** Faz 2b'nin kalıpları sürer: saf kurallar `src/domain`'de, durum ve yazılar seans deposunda (yazılar bitince yayın), ekranlar `features/` altında kabuk ve gövde ayrımıyla, aygıtlar bağlamdan. Kurulumun ilerlemesi veli kaydında, kapının açıklığı bellekte, yazı ayarı veri öznitelikleriyle CSS değişkenlerinde.
- **Teknoloji:** React 19, react-router 8, Zustand 5, IndexedDB (`idb`), Vitest 5 ve Testing Library, Playwright (Chromium ve WebKit). Yeni bağımlılık yok.
- **Dayanak:** Bu belgenin "Kararlar" bölümü; `docs/ekranlar.md`, `docs/urun.md`, `docs/kararlar.md` ve `design/ekranlar/`.

**Okunanlar:** `docs/yol-haritasi.md` (Faz 3), `docs/ekranlar.md` ("İlk kurulum", V4, "Tasarımı olmayan durumlar"), `docs/urun.md` (bölüm 4, 7, 8), `docs/kararlar.md` (P13, P14, D3, D15, T22), `design/ekranlar/K1…K4-*.html`, `V4-yazi-ayari-*.html` (üç durumuyla), mevcut kod (Faz 2b sonu).

## Kapsam

**Girenler:**

- K1–K4 kurulum akışı. Hesap ve profil cihazdaki depoya yazılır.
- Kurulum bitmeden ürün ekranlarının açılmaması; boş depoyla açılan uygulamanın kuruluma gitmesi.
- Veli kapısı ve telefonla tabletten veli alanına giriş.
- V4 Yazı ayarı ve ayarın bütün okuma metinlerine uygulanması: G3, G4, G6'nın metin katmanı, K3, V4 önizlemesi.
- P14: veli onay vermiş ama mikrofon kullanılamıyorsa seansın ve K3'ün dinlemeden sürmesi.
- Veli kabuğunda çocuğun etiketi ("Deniz, 3. sınıf").

**Girmeyenler:**

- Haftalık ölçüm akışı ve iki ayarla deneme ölçümleri (Faz 4). V4'teki anahtar ve sonuç satırları bu fazda kurulur; sonuçlar var olan ölçüm kayıtlarından hesaplanır.
- Hedefin saklanması ve "Hedefi güncelle" (Faz 4). K4'teki ilk hedef başlangıç ölçümünden hesaplanır, ayrıca saklanmaz.
- Kayıtları dinleme ve silme, onayın sonradan değiştirilmesi, hesap silme (Faz 4).
- Okul harflerinin asıl yazı tipi (D3 açık kalır; yer tutucu Didact Gothic).
- Arka uç, gerçek dinleyici (Faz 6).

## Ürün sahibinin yanıtları (2026-11-20)

1. **Telefonda ve tablette veli girişi:**
   - Tablette çocuk rayının altında, webdeki gibi kilit simgeli "Veli alanı" bağlantısı olur.
   - Telefonda G1'in sağ üst köşesinde küçük bir kilit düğmesi olur.
   - Her giriş veli kapısından geçer (kararlar, 11. soru).
2. **Okul harfleri:** Yer tutucu Didact Gothic kalır; D3 açık. Karar gelince tek değişken (`--font-school`) değişir.
3. **Ölçümsüz K4:** Onay yoksa ya da K3 atlandıysa K4 sayısız olur. Tanışma balonu, dinlemeden de doğru olan madde ("Her gün 12 dakikalık bir bölüm") ve "İlk bölüme başla" görünür; sayılar ve hedef görünmez.
4. **Veli kapısının süresi:** Kapı, veli alanında gezinildikçe açık kalır. "Çocuk ekranı"na dönünce, sayfa yenilenince ya da sekme kapanınca yeniden sorulur.
5. **P14** (Faz 2b sonu): Onay var ama mikrofon kullanılamıyorsa, "Yeniden dene"den sonra "Bugün dinlemeden oku" çıkar. Seansın kalanı dinlemesiz yürür ve gün sayılır.
6. **K2'nin seçim düğmeleri** (kararlar, 9. soru): Tasarımdaki 48 px'lik yuvarlak seçim düğmesi ortak bir bileşen olarak eklenir ve vitrine girer. K2 bununla kurulur; U2 de (Faz 5) kullanır.
7. **Dikey tablette kurulum** (kararlar, 13. soru): 1000 px'in altında kobalt pano gizlenir; kurulum telefon düzeniyle ve tablet yazı boyutlarıyla açılır. 1180 ve 1440 px tasarımları değişmez.
8. **Veli alanından çıkış:** girişin aynasıdır.
   - Tablette veli rayının altına "Çocuk ekranı" bağlantısı gelir.
   - Telefonda veli alanının üst şeridinin sağ köşesine küçük bir "Çocuk ekranı" düğmesi gelir.

## Kararlar (onaya sunulan)

### Veri ve depo

1. **Kurulumun ilerlemesi veli kaydında durur:** `Parent.setup?: 'reader' | 'level' | 'meet'`.
   - Alan yoksa kurulum bitmiştir. Faz 2'nin demo profili ve var olan kayıtlar bu yüzden kurulmuş sayılır.
   - Geçişler:
     - K1 veliyi `'reader'` ile yazar.
     - K2 çocuğu yazar ve onay varsa `'level'`, yoksa `'meet'` olur.
     - K3 başlangıç ölçümünü yazar (ya da atlanır) ve `'meet'` olur.
     - K4'ün "İlk bölüme başla" düğmesi alanı siler.
   - Neden ayrı bir alan: K2 çocuğu yazınca profil tamamlanmış görünür; K3 ve K4'ün yarım kaldığını yalnız veriden anlamak mümkün değil.
2. **Seans deposu kurulumu da taşır.** `status: 'noProfile'` kalkar, yerine `status: 'setup'` gelir:
   - Kurulum durumu: `setup: { step: 'account' | 'reader' | 'level' | 'meet'; parent; child; passage; baseline }`.
     - `passage`: K3'ün ölçüm metni.
     - `baseline`: K3'te yazılan ölçüm ya da `null`.
   - Yeni eylemler, Faz 2b'nin kuralıyla (yazılar bitince yayın; yayın eylemin son adımı):
     - `createAccount`, `saveReader`, `saveBaseline`, `skipBaseline`, `finishSetup`;
     - `setReadingStyle` (V4);
     - `continueUnheard` (P14).
   - `finishSetup` bugünün verisini okuyup `ready` yayınlar.
3. **Yeni alanlar:**
   - `Parent.setup?` (karar 1).
   - `Session.unheard?: true`: P14, "bugün dinlemeden oku" seçildi.
   - `Consent.grantedAt`: K1'de onay verilince yazılır.
   - Parola hiçbir kayda girmez (karar 9).
   - `docs/mimari.md` → "Tipler" güncellenir.

### Yönlendirme

4. **Kurulum koruması:**
   - Bütün ürün rotaları (çocuk, seans, odak, veli) kurulum bitmeden açılmaz; adres o anki kurulum adımına gider (`/kurulum/hesap`, `…/okuyucu`, `…/seviye`, `…/tanisma`).
   - Kurulum adresleri:
     - kurulum bitmişse G1'e gider;
     - başka bir adımı isterse o anki adıma gider (adım atlanmaz, geri dönülmez; tasarımda geri düğmesi yok).
   - Geliştirme sayfaları (`/gelistirme/*`) korumanın dışındadır.
   - `SessionGuard`'ın profil yok dalı ve G1, Albüm, Stüdyo'daki `TODO(phase 3)` dalları bu korumaya bırakılır.
5. **Geliştirme derlemesi** artık profil yoksa demo profilini kendiliğinden kurmaz; boş depo kuruluma gider (ölçüt 1).
   - Demo açıkça `?demo=cocuk-sabahi|veli-haftasonu` ile kurulur.
   - Yeni parametreler:
     - `?demo=bos`: depoyu boşaltır.
     - `?kurulum=hesap|okuyucu|seviye|tanisma`: depoyu boşaltıp kurulumu o adımda açar; demo profilinin velisi ve çocuğuyla (veli@example.com, Deniz, 3. sınıf). `tanisma` demo profilinin ilk ölçümünü (58 doğru kelime) yazar.
   - `&onay=kapali` her ikisiyle de çalışır.
   - Bu parametrelerin dayandığı uçtan uca testler açık `?demo=` alır. `e2e/dev-params.spec.ts`'teki "profil yoksa demo kurulur" testi "boş depo kuruluma gider" olur.

### Kurulum ekranları

6. **Kabuk ve gövde ayrımı** (2b'deki `SessionShell`/`SessionLayout` gibi):
   - `OnboardingShell` yalnız dış çerçeveyi tutar.
   - Her adım `OnboardingLayout` çizer: kobalt pano, Tıkır ve balonu, dört adımlı ilerleme, içerik, eylem çubuğu.
   - Neden: Tıkır'ın balonu ve düğme adıma göre değişiyor; bugün sayfalar bunları kabuğa veremiyor.
   - **Pano 1000 px'ten itibaren görünür** (yanıt 7). Altında telefon düzeni kullanılır: eylem çubuğu altta, Tıkır gizli, 700 px'ten itibaren tablet yazı boyutları. Faz 0'ın 700–719 px'lik alt alta dizilmiş geçici hâli kalkar.
7. **Ortak bileşen eklemeleri:**
   - `TextField` alan altı hata ve ipucu alır (`aria-invalid`, `aria-describedby`; K1, K2, veli kapısı).
   - G6'daki `<dialog>` kalıbından ortak bir `Dialog` bileşeni çıkar (K1'in bilgi katmanı, G6'nın metin katmanı, çıkış onayı).
   - Vitrine eklenirler.
8. **Kurulum adresleri** `src/features/onboarding/paths.ts`'te tanımlanır (2b'deki `paths.ts` gibi); `src/app/routes.ts` onlardan kurulur.

### K1 Veli hesabı

9. **Alanlar ve doğrulama:**
   - **E-posta:** basit biçim denetimi (`ad@alan.uzantı`). Saklanır.
   - **Parola:** yalnız "en az 8 karakter" diye denetlenir. Değeri hiçbir yere yazılmaz ve gönderilmez (`docs/ekranlar.md`, K1). Bir test, K1'den sonra depoda parolanın bulunmadığını sınar.
   - **Kutular:** Ses onayı ve haftalık e-posta kutuları varsayılan olarak işaretsizdir. Tasarım dolu hâlini gösteriyor; e-posta için de işaretsiz benim önerim.
   - **Hatalar:** "Hesabı oluştur"a basınca alanların altında görünür. Odak ilk hatalı alana gider.
10. **Onaysız açıklama:** Onay kutusu işaretsizken kutunun altında kısa bir açıklama durur (metni aşağıda, tasarımı yok).
11. **"Ses verisi nasıl kullanılır?"** bir pencere açar. Metni taslaktır (aşağıda; `TODO(legal)`: yayından önce KVKK incelemesi, `docs/urun.md` bölüm 8).

### K2 Okuyucu profili

12. **Alanlar:**
    - **Ad:** zorunlu, boşlukları kırpılır, en çok 30 karakter.
    - **Sınıf:** zorunlu, varsayılan yok.
    - **İlgi alanları:** sekiz seçim düğmesi (yanıt 6), en çok üç, hiç seçmemek serbest. Üç seçiliyken öteki düğmeler `aria-disabled` olur, sayaç "N / 3 seçildi" der.
    - **Sınıf:** aynı seçim düğmeleriyle, tek seçim (radyo grubu gibi davranır).
    - **Yeni bileşen `ChoicePill`:** tasarımdaki 48 px'lik yuvarlak düğme; seçilince safran zemin ve onay işareti. Çoklu seçimde `aria-pressed`, tek seçimde radyo grubu. Değerler K2 tasarımından ölçülür; vitrine girer.
13. **"Devam et":**
    - Çocuğu sınıfına göre varsayılan yazı ayarıyla yazar (karar 22).
    - Onay varsa mikrofonu bu dokunuşta açar ve K3'e geçer (T22: dinleyen adıma götüren dokunuş açar). `/kurulum/seviye` dinleyen adresler listesine girer.
    - Onay yoksa K4'e geçer.

### K3 Seviye tespiti

14. **Metin:** Çocuğun sınıfının ilk ölçüm metni (`olcum-{sınıf}a`). Metni kelimelere çeviren yardımcı `src/domain/text.ts`'e eklenir.
    - **Sayfalama** (benim kararım; tasarım böyle): Metin, tasarımdaki gibi kısa sayfalara bölünür. Cümleler sırayla, sayfa başına en çok 25 kelime olacak biçimde gruplanır; tasarımın ilk sayfası 4 cümle, 23 kelime.
    - Sayfa, okuma ilerledikçe G4'teki gibi kendiliğinden döner; geri sayım sayfa dönüşünde durmaz.
    - Geri sayım çubuğu tasarımdaki gibi kartın alt kenarındadır.
15. **Okuma:**
    - **Başlangıç:** Mikrofon dinleyince başlar; mikrofon düğmesi duraklatır ve sürdürür (G4 gibi).
    - **Süre:** 60 saniyelik geri sayım okumanın etkin süresinden düşer: "0:38 kaldı" ve "Geçen süre" çubuğu. Duraklatma ve Tıkır'ın yardımı süreden sayılmaz.
    - **Bitiş:**
      - Süre dolunca okuma kendiliğinden biter.
      - "Okumayı bitir" erken bitirir (G4'teki kuralla, çocuk ilk kelimeyi okuyunca açılır).
    - **Yardım:** 3 saniyelik duraksamada yardım eder. Yardım edilen kelime hata sayılır; bu, sesli okuma ölçümünün olağan kuralıdır.
    - **Hayalet:** yok.
16. **Dinleyici:** Sahte dinleyiciye süreli bir ölçüm senaryosu eklenir (`assessment`, `typical` takımında). Senaryo demo profilinin ilk ölçümüdür: 60 sn, 64 kelime, aynı hatalar. Sonuç 58 doğru kelime, doğruluk %90,6, öğretim düzeyi, ilk hedef 70 (ölçüt 3). Aygıtların dinleyici fabrikası `'assessment'` türünü de alır.
17. **Kayıt ve yazma:**
    - Onay varsa okuma kaydedilir (V3 Faz 4'te çalar); duraklamalar kayda girmez (2b'nin düzeltmesi).
    - Bitince `Assessment` yazılır: sınıfın metni, sonuç, düzey; kayıt kimliği sonucun içinde. Ardından adım `'meet'` olur.
    - Yarıda kalan okuma (yenileme, çıkış) yazılmaz; K3 baştan açılır.
18. **K3'te P14:** Mikrofon sorununda balonda "Yeniden dene" çıkar. Bir yeniden deneme de olmazsa "Seviye tespitini atla" gelir (metin önerisi) ve K4 sayısız açılır.

### K4 Tıkır ile tanışma

19. **Başlangıç ölçümüyle:**
    - Sayılar: "58 doğru kelime bir dakikada"; "Doğruluk %91" (yuvarlanmış); düzey etiketi.
    - "İlk hedef: 6 haftada 70" (`firstTarget`) ve iki noktalı hedef grafiği: "Bugün 58", "6. hafta 70".
    - Programın üç maddesi ve "İlk bölüme başla".
20. **Düzey etiketi:**
    - Öğretim düzeyinde tasarımdaki gibi "Öğretim düzeyi".
    - Serbest düzeyde "Serbest düzey" (`docs/urun.md`'nin adı).
    - Endişe düzeyinde K4 etiket göstermez. K4'ü çocuk da görür, olumsuz bir ad çocuğa gösterilmez (`docs/urun.md` bölüm 4). Veli düzeyi V3'te görür (Faz 4).
21. **Ölçümsüz K4** (yanıt 3):
    - Başlık "Tıkır ile tanış"; tasarımın alt başlığı ("başlangıç noktası belli oldu") görünmez.
    - Balon:
      - onay varsa tasarımınki;
      - onay yoksa "ben dinlerim" diyemeyeceği için öneri metni (aşağıda).
    - Tek madde ve "İlk bölüme başla".
    - Düğme kurulumu bitirir ve G1'i açar.

### Yazı ayarı

22. **Alan mantığı** (`src/domain/readingStyle.ts`, `docs/mimari.md`'nin öngördüğü dosya):
    - `defaultReadingStyle(grade)`: 1–2. sınıf okul harfleri, 3–4. sınıf net harfler; boyut "Orta", aralık "Normal" (`docs/urun.md` bölüm 7).
    - `trialReadingStyle(style)`: bir kademe açık aralık; en açıktaysa bir kademe dar.
    - `trialComparison(assessments, style)`: iki ayarın ortalaması, ölçüm sayıları, durum. Durumlar:
      - ölçüm yok;
      - sürüyor ("karar için N ölçüm daha");
      - fark küçük (5'ten az);
      - öneri hazır.
    - **Hangi ölçümler sayılır** (benim kararım, `docs/urun.md` bölüm 7):
      - Yalnız iki ayarın birlikte ölçüldüğü haftalar sayılır.
      - "Şu anki ayar" satırı, o haftalarda geçerli ayarla yapılan ölçümlerdir.
      - "Denenen ayar" satırı, o haftaların `trial` ölçümleridir.
      - Ayarın tamamı (yazı tipi, boyut, aralık) eşleşmelidir; ayar değişince karşılaştırma sıfırdan başlar.
      - Demo profili böylece tasarımın 69 ve 72'sini verir (ikişer ölçüm).
      - Tasarımın "okul harfi, büyük" durumundaki satırlar bu kurala uymuyor (başka bir andan çizilmiş). Tasarım tutarsızlıklarına 10. madde olarak yazılır.
23. **Uygulama:** `ReadingStyleScope` okuma metninin kabına `data-reading-font`, `data-reading-size` ve `data-reading-spacing` yazar; genel CSS bunları `--reading-*` değişkenlerine bağlar. Kaplar: G3, G4 (dinlenen ve dinlemesiz), G6'nın metin katmanı, K3, V4 önizlemesi.
    - Satır içi stil yerine öznitelik kullanılır: değerler `tokens-extra.css`'te kalır, Stylelint denetler.
    - Faz 0'ın kaymasız vurgu kuralı okul harfleriyle ve dört boyutla da sınanır.
24. **V4 ekranı:**
    - **Önizleme** (benim kararım): kitap adı ve çocuğun son okuduğu bölümün ilk iki cümlesi; hiç okumadıysa ilk bölümün. Demo profilinde tasarımdaki "Deniz sırt çantasını omzuna aldı…" çıkar.
    - **Denetimler:** yazı tipi için iki `OptionCard` (`detail`), boyut ve aralık için `SegmentedControl`.
    - **Kayıt:** Seçim anında önizlemeye ve depoya yansır; kaydet düğmesi yok.
    - **Önizleme kutusu:** yüksekliği en büyük boyut ve en açık aralığa göre sabittir; altındaki denetimler yer değiştirmez (ölçüt 6).
    - **"Hangi ayar daha iyi?" kartı:** "Ölçümlerde iki ayarı dene" anahtarı (`trialEnabled`). Anahtar açıkken sonuç satırları `trialComparison`'dan gelir; kapalıyken satırlar gizlenir.

### Veli kapısı

25. **Kapı ekranı:**
    - Veli rotalarının önünde tam ekran bir katmandır; kapı açılmadan veli kabuğu çizilmez.
    - Soru: iki basamaklı iki sayının toplamı, birler basamağında elde var, toplam 100'den küçük (örnek "47 + 38 = ?").
    - Yanıt sayısal bir alana yazılır; "Çocuk ekranı" ile geri dönülür.
    - Üç yanlışta 30 saniye beklenir. Bekleme sekme ayarında tutulur (`tabSettings`), sayfa yenilense de sürer.
    - Soru üreteci saftır (`src/domain/parentGate.ts`); rastgelelik aygıtlardan gelir, testler sabit verir.
26. **Açık kalma** (yanıt 4): Kapının açıklığı bellekte durur. Veli alanı dışına çıkınca, yenilenince ya da sekme kapanınca kapı yeniden sorar.
27. **Girişler ve çıkışlar:**
    - **Giriş** (yanıt 1):
      - Webde kenar çubuğunun altındaki bağlantı (var).
      - Tablette çocuk rayının altına aynı bağlantı.
      - Telefonda G1'in sağ üst köşesinde kilit simgeli, adı "Veli alanı" olan 44 px'lik düğme (`TODO(design)`).
    - **Çıkış** (yanıt 8):
      - Webde veli kenar çubuğunun altındaki "Çocuk ekranı" (var).
      - Tablette veli rayının altına aynı bağlantı.
      - Telefonda üst şeridin sağ köşesinde 44 px'lik "Çocuk ekranı" düğmesi (`TODO(design)`).
28. **Veli kabuğunda çocuğun etiketi:** "Deniz, 3. sınıf" (tasarımdaki kalıp), profilden.

### P14 seansta

29. **Seçenek:**
    - Mikrofon sorunu balonunda (G2, G4) "Yeniden dene"ye en az bir kez basılmış ve sorun sürüyorsa "Bugün dinlemeden oku" düğmesi görünür.
    - Düğme seansa `unheard: true` yazar. Ekranlar "dinlenir mi" sorusunu `onay && !session.unheard` ile yanıtlar.
    - Dinlemesiz yol Faz 2b'nin yoludur (P13): kartlar puansız, okumalar "Okumayı bitir"le, G5 yok.
30. **Seansın ortasında:**
    - Önceden dinlenen okumalar kalır, kalan okumalar dinlenmeden okunur.
    - 3. okuma dinlenmediyse G5 atlanır ve G7 sayı göstermez (zaten öyle: G7 3. okumaya bakar).
    - Gün tamamlanmış sayılır.

### Testler ve görüntüler

31. **Uçtan uca testler:**
    - kurulumun iki yolu (onaylı ve onaysız);
    - yazı ayarının G3, G4 ve K3'te görünmesi;
    - V4 önizlemesinin sabit yüksekliği;
    - veli kapısı (yanlış, bekleme, açık kalma, yeniden sorma);
    - P14: `getUserMedia` reddedilince "Bugün dinlemeden oku" ile G7'ye varış.
    - Var olan testler kapıya ve boş depoya göre güncellenir:
      - `routes.spec.ts`'teki veli rotaları kapıyı geçerek açılır;
      - ürün adresleri `?demo=` ile açılır.
32. **Görüntüler:**
    - K1–K4 ve V4'ün üç durumu, üç genişlikte, `design/png` ile karşılaştırılır (ölçüt 8). Komutlar `?kurulum=` ve `?demo=veli-haftasonu` ile yazılır.
    - Tasarımı olmayan ekranlar (kapı, telefondaki kilit düğmesi, ölçümsüz K4, onaysız K1 açıklaması) taşma ve kırpılma için bakılır.

## Tasarımı olmayan durumların metinleri (öneri)

Hepsi `TODO(design)`; onayla `docs/kararlar.md`'ye D16 olarak işlenir.

| Yer | Metin | Kaynak |
|---|---|---|
| K1, e-posta hatası | Geçerli bir e-posta adresi yazın. | önerilen |
| K1, parola hatası | Parola en az 8 karakter olmalı. | önerilen |
| K1, onaysız açıklama | Onay vermezseniz Tıkır dinlemez: okumalar ölçülmez, seviye tespiti atlanır. | önerilen |
| K1, bilgi penceresi başlığı | Ses verisi nasıl kullanılır? | tasarımdaki bağlantı |
| K1, bilgi penceresi metni | Tıkır, çocuğunuz okurken sesini bu cihazda işler: hangi kelimeleri doğru okuduğunu, nerede takıldığını ve okuma hızını bulur. Her günün son okuması ve seviye tespiti kaydedilir. Kayıtlar bu cihazda kalır, başka bir yere gönderilmez. Onay vermezseniz mikrofon hiç açılmaz. (Taslak; yayından önce hukuki inceleme gerekir.) | önerilen, `TODO(legal)` |
| K1, bilgi penceresi düğmesi | Kapat | G6 |
| K2, ad hatası | Okuyucunun adını yazın. | önerilen |
| K2, sınıf hatası | Sınıfını seçin. | önerilen |
| K3, mikrofon yokken atlama | Seviye tespitini atla | önerilen |
| K4, onaysız balon | Merhaba {ad}! Her gün birlikte bir bölüm okuyacağız. | önerilen |
| K4, serbest düzey | Serbest düzey | `docs/urun.md` |
| Veli kapısı, başlık | Veli alanı | gezinme |
| Veli kapısı, açıklama | Devam etmek için soruyu yanıtlayın. | önerilen |
| Veli kapısı, soru | {a} + {b} = ? | `docs/ekranlar.md` |
| Veli kapısı, alan ve düğme | Cevap · Gir | önerilen |
| Veli kapısı, yanlış | Olmadı. Bir daha deneyin. | önerilen |
| Veli kapısı, bekleme | {n} saniye sonra yeniden deneyebilirsiniz. | önerilen |
| Veli kapısı, geri | Çocuk ekranı | gezinme |
| Telefonda G1, kilit düğmesi | Veli alanı (düğme adı) | gezinme |
| Telefonda veli şeridi, çıkış düğmesi | Çocuk ekranı (düğme adı) | gezinme |
| G2, G4: P14 düğmesi | Bugün dinlemeden oku | P14 |
| V4, ölçüm yok | Henüz iki ayarla ölçüm yapılmadı. İlk ölçümlerden sonra sonuçlar burada görünür. | önerilen |
| V4, öneri hazır | {ayar} ile ortalama {n} doğru kelime daha fazla okuyor. Bu ayara geçebilirsiniz. | önerilen |
| V4, fark küçük (yeterli ölçümle) | Doğru kelime / dk, {n} ölçümün ortalaması. Fark küçük; iki ayar da uygun. | tasarımın cümlesinden |

**Tasarımdan gelen değişkenli metinler** (kalıp; sayı ve adlar veriden):

| Ekran | Kalıp |
|---|---|
| K2 | {n} / 3 seçildi |
| K3 | {ad} metni sesli okusun. Hata yapması sorun değil; başlangıç noktasını arıyoruz. · {m:ss} kaldı |
| K4 | Merhaba {ad}! Sen okurken ben dinlerim, takılırsan yardım ederim. · {ad}’in başlangıç noktası belli oldu. · Doğruluk %{n} · İlk hedef: {h} haftada {n} · Bugün {n} · {h}. hafta {n} |
| V4 | {ad}’in okuma metinleri bu ayarla görünür. · Haftalık ölçümde iki ayar arka arkaya denenir. Dört ölçümden sonra {ad}’in daha iyi okuduğu ayar önerilir. · {yazı tipi}, {aralık} aralık · Doğru kelime / dk, {n} ölçümün ortalaması. Fark henüz küçük; karar için {k} ölçüm daha gerekiyor. |
| Veli kabuğu | {ad}, {n}. sınıf |

**İyelik eki** ({ad}’in): adın son ünlüsüne ve sonundaki sese göre (Deniz’in, Ali’nin, Ayşe’nin, Umut’un). Kural alan mantığına yazılır ve tablo testiyle sınanır.

## Ölçütler ve kanıtları

| # | Yol haritası ölçütü (Faz 3) | Kanıt |
|---|---|---|
| 1 | Boş depo kuruluma gider; K1–K4 bitince G1 açılır | uçtan uca: onaylı kurulum |
| 2 | Onay kutusu işaretsiz gelir; onaysız kurulumda K3 atlanır, mikrofon açılmaz | uçtan uca: onaysız kurulum (`getUserMedia` sayacı 0); birim testleri |
| 3 | K3 süreli senaryoyla yapılır; K4'te 58 ve ilk hedef 70 | uçtan uca: onaylı kurulum; `readingStyle`, `goals` ve K3/K4 testleri |
| 4 | Sınıfa göre varsayılan yazı tipi | `readingStyle.test.ts`; K2 testi |
| 5 | V4 seçimi önizlemeye anında yansır; G3, G4 ve K3 metinlerinde görünür | uçtan uca: yazı ayarı |
| 6 | V4 önizleme yüksekliği 4 boyut × 3 aralıkta değişmez; denetimler yer değiştirmez | uçtan uca: on iki birleşimin ölçümü |
| 7 | Veli kapısı geçilmeden `/veli/*` açılmaz; üç yanlışta bekletir | `ParentGate` testleri; uçtan uca: kapı |
| 8 | K1–K4 ve V4 (üç durum) tasarımla karşılaştırıldı | "Tasarım karşılaştırması" |
| 9 | Onay varken mikrofon kullanılamıyorsa "Bugün dinlemeden oku" ile seans G7'ye varır, gün sayılır (P14) | uçtan uca: reddedilen `getUserMedia` ile seans |

## İnceleme odağı

1. **Yönlendirme döngüleri:** Kurulum koruması ile seans ve veli korumaları birbirine adres göndermemeli. Yenileme her adımda doğru yere varmalı. Depo yüklenirken hiçbir koruma karar vermemeli.
2. **Parola:** Hiçbir kayda, adrese ya da günlüğe girmemeli.
3. **Onay:** Varsayılan işaretsiz; onaysız kurulumda mikrofon hiçbir adımda açılmamalı (K2'nin dokunuşu dahil).
4. **Veli kapısı:** Doğrudan adresle, yenilemeyle ya da geri tuşuyla aşılmamalı. Bekleme yenilemeyle sıfırlanmamalı.
5. **Yazı ayarı:** Bütün okuma metinlerine uygulanmalı. Kaymasız vurgu her yazı tipi ve boyutta korunmalı. V4 önizlemesinin yüksekliği hiçbir birleşimde değişmemeli.
6. **P14:** Seansın ortasında geçişte dinlenmiş okumalar kaybolmamalı. `unheard` yenilemeden sonra da geçerli olmalı. Çift dokunuş iki geçiş yazmamalı.
7. **Boş depo değişikliği:** Uçtan uca testler ve ekran görüntüleri artık demo profilini açıkça istemeli; kendiliğinden kurulan demoya dayanan bir test kalmamalı.

## Açık sorular (onayı beklemez)

1. **D3:** Okul harflerinin asıl yazı tipi (TTKB Dik Temel Abece ya da Andika). Değişince yalnız `--font-school` değişir.
2. **Onayın sonradan değiştirilmesi:** Velinin onayı verme ya da geri alma yeri Faz 4'ün hesap sayfası. O zamana kadar onay yalnız K1'de verilir.
3. **K1'in bilgi penceresi metni:** Taslak; yayından önce hukuki inceleme (KVKK).

## Her görevde geçerli kurallar

- TypeScript `strict`, `any` yok. Arayüz metni yalnız `src/i18n/tr.ts`'te ve tasarımdan birebir; tasarımsız metin bu planın tablosundan. Emoji yok; ikonlar `design/svg/ikonlar.json`'dan.
- CSS Modules ve `tokens.css` değişkenleri. Renk, yazı boyutu, yarıçap ve gölge sabit yazılmaz; tasarımda olup token'da olmayan değer kaynağıyla `tokens-extra.css`'e girer.
- Bileşenler mikrofona, ağa ve depolamaya doğrudan dokunmaz (`src/services`); `src/domain` saf ve tamamı birim testli; `features` `src/app`'i içe aktarmaz.
- Türkçe büyük-küçük harf yalnız `toLocale*Case('tr-TR')`; okuma metinlerinde `font-variant-ligatures: no-common-ligatures`.
- Mikrofon yalnız `consent.voiceProcessing` varken ve bir dokunuşla açılır. Çalışma anında dış adrese istek yok. Çocuk ekranlarında puan, rozet, olumsuz kıyas yok. `/veli/*` kapının arkasında.
- Erişilebilirlik: dokunma hedefi en az 44 px, görünür odak, gerçek `button`/`input`/`label`, karşıtlık token çiftleriyle.
- Depo kuralı (Faz 2b): Bir eylem bütün yazılarını bitirince yayınlar; yayın eylemin son adımıdır.
- Parola hiçbir kayda, adrese ya da günlüğe girmez.
- Testler StrictMode'da (`renderApp`); ekran testlerinde seçici her geçişten sonra yeniden aranır.
- Her görevden sonra `eval "$(mise env -s zsh)" && pnpm check`. Her ekran 390, 1180 ve 1440 px'te `pnpm shots` ile `design/png` karşılığıyla karşılaştırılır; farklar "Tasarım karşılaştırması"na yazılır ve düzeltilir.
- Küçük, tek amaçlı commit'ler (Conventional Commits); push yok.

## Görev listesi

- [x] Task 0: Planı ve kararları işle
- [ ] Task 1: Yazı ayarı alan mantığı
- [ ] Task 2: Kurulum ve kapı için alan mantığı, yeni alanlar
- [ ] Task 3: Seans deposunda kurulum, yazı ayarı ve P14
- [ ] Task 4: Geliştirme parametreleri ve boş depo
- [ ] Task 5: Kurulum koruması ve yönlendirme
- [ ] Task 6: Ortak bileşenler: alan hatası, pencere, seçim düğmesi
- [ ] Task 7: Kurulum çatısı
- [ ] Task 8: K1 Veli hesabı
- [ ] Task 9: K2 Okuyucu profili
- [ ] Task 10: Yazı ayarının okuma metinlerine uygulanması
- [ ] Task 11: K3 Seviye tespiti
- [ ] Task 12: K4 Tıkır ile tanışma
- [ ] Task 13: Veli kapısı, girişler ve çıkışlar
- [ ] Task 14: V4 Yazı ayarı
- [ ] Task 15: P14 seansta
- [ ] Task 16: Uçtan uca testler
- [ ] Task 17: Belgeler, karşılaştırma ve denetim

## Görevler

### Task 0: Planı ve kararları işle

**Dosyalar:** `docs/planlar/faz-3.md` (durum: onaylandı), `docs/kararlar.md`.

- [x] `docs/kararlar.md`:
  - 9. ve 13. sorular yanıtlandı (2026-11-20): yanıt 6 ve 7;
  - P11 (veli kapısı) kararları 25–27 ile kesinleşir;
  - D16: bu planın "Tasarımı olmayan durumların metinleri" tablosu;
  - D3'e not: Faz 3'te yer tutucu Didact Gothic kaldı;
  - tasarım tutarsızlıklarına 10. madde (V4'ün "okul harfi, büyük" durumundaki sonuç satırları, karar 22);
  - değişiklik günlüğü.
- [x] `pnpm check` → geçer (Prettier).
- [x] Commit: `docs: plan phase 3 and record the owner's answers`.

### Task 1: Yazı ayarı alan mantığı

**Dosyalar:** `src/domain/readingStyle.ts` (yeni), `readingStyle.test.ts`, `src/domain/config.ts`, `src/domain/date.ts`, `date.test.ts`.

**Üretir:**

```ts
// readingStyle.ts
export function defaultReadingStyle(grade: Grade): ReadingStyle;
export function trialReadingStyle(style: ReadingStyle): ReadingStyle;
export function sameReadingStyle(a: ReadingStyle, b: ReadingStyle): boolean; // yazı tipi, boyut, aralık
export interface StyleAverage { style: ReadingStyle; average: number | null; count: number }
export type TrialState = 'none' | 'collecting' | 'smallDifference' | 'recommend';
export interface TrialComparison {
  current: StyleAverage; trial: StyleAverage; state: TrialState;
  remaining: number; // 'collecting' iken karar için gereken ölçüm
  better: 'current' | 'trial' | null; // yalnız 'recommend'
}
export function trialComparison(assessments: readonly Assessment[], style: ReadingStyle): TrialComparison;
// date.ts
export function weekStart(date: LocalDate): LocalDate; // pazartesi
// config.ts
export const trialMeasurementsNeeded = 4;
export const trialSmallDifference = 5;
```

- [ ] **Kırmızı** (`readingStyle.test.ts`, `date.test.ts`):
  1. `defaultReadingStyle`: 1 ve 2 → `school`; 3 ve 4 → `clear`; hepsinde `sizeStep: 1`, `spacingStep: 0`, `trialEnabled: false`.
  2. `trialReadingStyle`: aralık 0 → 1, 1 → 2, 2 → 1; yazı tipi ve boyut aynı.
  3. **Demo profilinin karşılığı:**
     - Girdi:
       - iki deneme haftası: geçerli ayarla 68 ve 70, deneme ayarıyla `trial` 71 ve 73;
       - iki sıradan hafta: yalnız geçerli ayarla 60 ve 62.
     - Beklenen sonuç: `current` {69, 2}; `trial` {72, 2}; `state: 'collecting'`; `remaining: 2`.
  4. Deneme haftası yoksa `state: 'none'`, iki ortalama `null`.
  5. Dörder ölçümde fark 3 → `'smallDifference'`; fark 6 → `'recommend'`, `better: 'trial'`.
  6. Boyutu farklı ölçümler sayılmaz (ayar değişince sıfırdan).
  7. `weekStart('2026-11-22')` (pazar) → `'2026-11-16'`; `weekStart('2026-11-16')` → kendisi.
- [ ] `pnpm test src/domain/readingStyle.test.ts src/domain/date.test.ts` → FAIL.
- [ ] Uygula. Ortalama `Math.round`. Bir hafta, `weekStart`'ı aynı olan ölçümlerdir; sayılmak için o haftada hem geçerli ayarla bir ölçüm hem deneme ayarıyla bir `trial` ölçüm bulunmalı.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(domain): add the reading style rules`.

### Task 2: Kurulum ve kapı için alan mantığı, yeni alanlar

**Dosyalar:** `src/domain/types.ts`, `src/domain/text.ts`, `text.test.ts`, `src/domain/parentGate.ts` (yeni), `parentGate.test.ts`, `src/domain/config.ts`, `src/services/repository/IndexedDbRepository.test.ts`, `docs/mimari.md` ("Tipler").

**Üretir:**

```ts
// types.ts
export type SetupStep = 'reader' | 'level' | 'meet';
Parent.setup?: SetupStep;          // yoksa kurulum bitmiş
Session.unheard?: true;            // P14
// text.ts
export function passageChapter(passage: Passage, maxWords?: number): Chapter; // varsayılan passagePageWords
export function withGenitiveSuffix(name: string): string; // "Deniz’in"
// parentGate.ts
export interface GateQuestion { a: number; b: number }
export function gateQuestion(random: () => number): GateQuestion;
export function isGateAnswer(question: GateQuestion, answer: string): boolean;
// config.ts
export const passagePageWords = 25;
export const parentGateAttempts = 3;
export const parentGateWaitMs = 30_000;
```

- [ ] **Kırmızı:**
  1. `passageChapter(olcum-3a)`:
     - İlk sayfa ilk dört cümledir (23 kelime, tasarımdaki sayfa).
     - Bütün sayfaların kelime toplamı 149.
     - Her cümle tek anlam birimidir (`[metin]`).
     - 25 kelimeden uzun bir cümle tek başına bir sayfadır.
  2. `withGenitiveSuffix` tablosu: Deniz’in, Ali’nin, Umut’un, Ayşe’nin, Gül’ün, Işık’ın, Oya’nın, Ömür’ün, Elif’in, Can’ın.
  3. `gateQuestion`: 200 tohumlu rastgele dizide `a` ve `b` 10–99 arası, `(a % 10) + (b % 10) >= 10`, `a + b < 100`.
  4. `isGateAnswer({ a: 47, b: 38 }, …)`: `'85'` ve `' 85 '` doğru; `'84'`, `'8 5'`, `''`, `'85a'` yanlış.
  5. Depo gidiş dönüşü: `setup`'lı veli ve `unheard`'lü seans aynen geri okunur.
- [ ] → FAIL.
- [ ] Uygula. `gateQuestion`'ın üretimi:
  - `onesA = 1 + ⌊r·9⌋`, `onesB = (10 − onesA) + ⌊r·onesA⌋`;
  - `tensA = 1 + ⌊r·7⌋`, `tensB = 1 + ⌊r·(8 − tensA)⌋`;
  - her `r` yeni bir `random()`.
- [ ] → PASS. `docs/mimari.md` → "Tipler". `pnpm check`.
- [ ] Commit: `feat(domain): add the setup, gate and passage rules`.

### Task 3: Seans deposunda kurulum, yazı ayarı ve P14

**Dosyalar:** `src/features/session/sessionStore.ts`, `sessionStore.test.ts`.

**Kullanır:** Task 1 (`defaultReadingStyle`), Task 2 (tipler).

**Üretir:**

```ts
export type SetupPlace = 'account' | SetupStep;
export interface SetupData {
  step: SetupPlace; parent: Parent | null; child: Child | null;
  passage: Passage | null;      // 'level': sınıfın ilk ölçüm metni
  baseline: Assessment | null;  // 'meet': K3'ün ölçümü ya da null
  today: LocalDate;
}
SessionStatus: 'idle' | 'loading' | 'ready' | 'setup' | 'error';   // 'noProfile' kalkar
SessionState.setup: SetupData | null;
createAccount(input: { email: string; voiceProcessing: boolean; weeklyEmail: boolean }): Promise<void>;
saveReader(input: { name: string; grade: Grade; interests: string[] }): Promise<void>;
saveBaseline(outcome: ReadingOutcome, meta: { startedAt: string; recordingId: Id | null }): Promise<void>;
skipBaseline(): Promise<void>;
finishSetup(): Promise<void>;
setReadingStyle(style: ReadingStyle): Promise<void>;
continueUnheard(): Promise<void>;
```

- [ ] **Kırmızı** (`sessionStore.test.ts`):
  1. Boş depo → `status: 'setup'`, `step: 'account'`.
  2. `createAccount`:
     - Veli `{ email, consent: { voiceProcessing, weeklyEmail, grantedAt }, setup: 'reader' }` olarak yazılır. `grantedAt` yalnız onayda.
     - Adım `'reader'` olur.
     - Çift çağrı tek veli yazar.
  3. `saveReader`:
     - Onayla: çocuk `defaultReadingStyle(grade)` ile yazılır, adım `'level'`, `passage.id` `'olcum-3a'`.
     - Onaysız: adım `'meet'`.
     - Sınıf 1: `font: 'school'`.
  4. `saveBaseline`:
     - `Assessment` yazılır: `passageId`, `date` bugün, `level`; sonuçta `readingStyle` ve `recordingId` var.
     - Adım `'meet'` olur, `baseline` dolar.
  5. `skipBaseline` → adım `'meet'`, `baseline: null`, ölçüm yazılmaz.
  6. `finishSetup` → velide `setup` yok; `status: 'ready'`, bugünün verisi.
  7. `setup`'sız kayıtlı veli (Faz 2 demo profili) doğrudan `ready`.
  8. `setReadingStyle` → çocuk yazılır ve yayınlanır.
  9. `continueUnheard`:
     - Süren seansa `unheard: true` yazılır.
     - Ardından okumada `skipUnheardReading` ilerletir.
     - Seans yoksa ya da bittiyse hiçbir şey yapmaz.
- [ ] → FAIL.
- [ ] Uygula. `readData` ya hazır veriyi ya kurulum verisini döner:
  - veli yoksa `'account'`;
  - velide `setup` varsa o adım;
  - `'level'`de metin `listPassages(grade)[0]`;
  - `'meet'`de `baseline` son ölçüm.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(session): carry the setup, the reading style and P14 in the store`.

### Task 4: Geliştirme parametreleri ve boş depo

**Dosyalar:** `src/features/dev/params/devParams.ts` (+test), `prepareDevelopment.ts`, `prepareSetupStep.ts` (yeni, +test), `src/test/sessionStore.ts`, `e2e/dev-params.spec.ts`, ürün adresi açan uçtan uca testler (`routes.spec.ts`, `no-external-requests.spec.ts`, `smoke.spec.ts`, gerekirse ötekiler), `docs/mimari.md` ("Depolama ve örnek veri"), `CLAUDE.md` (komut satırı).

**Üretir:**

```ts
export type SetupParam = 'hesap' | 'okuyucu' | 'seviye' | 'tanisma';
DevParams: { demo?: DemoMode | 'bos'; setup?: SetupParam; step?; scenario?; consentOff? };
export function prepareSetupStep(services: SessionStoreServices, step: SetupParam, options: { consent: boolean }): Promise<void>;
DemoSessionOptions.setup?: SetupParam; // testlerde boş depo ve kurulum adımları
```

- [ ] **Kırmızı:**
  1. `devParams`: `?demo=bos`, `?kurulum=seviye`, `?kurulum=tanisma&onay=kapali` okunur; bilinmeyen değer yok sayılır.
  2. `prepareSetupStep` her adımı depoya doğru yazar:
     - `okuyucu`: veli (`veli@example.com`, onaylı);
     - `seviye`: + Deniz, 3. sınıf, ilgi alanları demo profilinden;
     - `tanisma`: + demo profilinin ilk ölçümü (58);
     - `onay=kapali` ile `tanisma` ölçümsüz.
  3. **Uçtan uca** (`dev-params.spec.ts`):
     - "a product address with no profile sets up the demo child" testi kalkar.
     - Yerine "`?kurulum=seviye` prepares the reader at the level step" gelir (vitrindeki depo sayaçlarıyla).
- [ ] → FAIL.
- [ ] Uygula:
  - Profil yokken demo kendiliğinden kurulmaz.
  - `?demo=bos` depoyu boşaltır.
  - `?kurulum=` depoyu boşaltıp adımı Task 3'ün eylemleriyle hazırlar.
  - Ürün adresi açan uçtan uca testler ilk adreste `?demo=cocuk-sabahi` alır.
- [ ] → PASS. `pnpm check`. `caffeinate -u -t 2; caffeinate -d -i pnpm e2e` → geçer.
- [ ] Commit: `feat(dev): open an empty store and the setup steps from the address`.

### Task 5: Kurulum koruması ve yönlendirme

**Dosyalar:** `src/features/onboarding/paths.ts` (yeni), `SetupGuard.tsx`, `OnboardingGuard.tsx` (yeni), `src/app/routes.ts`, `src/app/router.tsx`, `router.test.tsx`, `src/features/session/SessionGuard.tsx`, `RoadPage.tsx`, `AlbumPage.tsx`, `StudioPage.tsx`, `e2e/dev-params.spec.ts`, `e2e/routes.spec.ts`.

**Üretir:**

```ts
export const onboardingPaths: Readonly<Record<SetupPlace, string>>; // account → /kurulum/hesap …
export function setupRedirect(setup: SetupData | null, pathname: string): string | null;
```

- [ ] **Kırmızı** (`router.test.tsx`):
  1. Boş depo: `/` → `/kurulum/hesap`.
  2. `'level'` adımında `/seans/oku`, `/veli` ve `/kitaplik` → `/kurulum/seviye`.
  3. Kurulum bitmiş: `/kurulum/hesap` → `/`.
  4. `'reader'` adımında `/kurulum/tanisma` → `/kurulum/okuyucu`.
  5. Boş depoyla `/gelistirme/vitrin` açılır.
  6. Depo yüklenirken "Hazırlanıyor…" görünür, yönlendirme olmaz.
- [ ] **Uçtan uca:**
  - `dev-params.spec.ts` › "an empty store opens the onboarding".
  - `routes.spec.ts`'te kurulum adresleri `?kurulum=<adım>` ile açılır.
- [ ] → FAIL.
- [ ] Uygula:
  - `SetupGuard` bütün ürün kabuklarını, `OnboardingGuard` kurulum adreslerini sarar.
  - Geliştirme rotaları korumaların dışında kalır.
  - `SessionGuard`'ın profil yok dalı ve sayfalardaki `TODO(phase 3)` dalları kalkar.
- [ ] → PASS. `pnpm check`. `pnpm e2e e2e/routes.spec.ts e2e/dev-params.spec.ts` → geçer.
- [ ] Commit: `feat(app): send every product address through the setup`.

### Task 6: Ortak bileşenler: alan hatası, pencere, seçim düğmesi

**Dosyalar:**
- `src/components/TextField/*`
- `src/components/Dialog/*` (yeni)
- `src/components/ChoicePills/*` (yeni)
- `src/features/session/ExitDialog.tsx`, `TextLayer.tsx` (pencereye taşınır)
- `src/features/dev/showcase/*` (vitrin)
- `src/components/FormControls.test.tsx`, `Dialog.test.tsx`
- `src/styles/tokens-extra.css`

**Üretir:**

```tsx
TextField({ …; error?: string; hint?: string; inputMode?: 'text' | 'email' | 'numeric' })
Dialog({ open: boolean; title: string; onClose: () => void; actions?: ReactNode; className?: string; children: ReactNode })
ChoicePills<T extends string>({ label: string; options: readonly { value: T; label: string }[];
  mode: 'single' | 'multiple'; value: readonly T[]; onChange: (value: T[]) => void; max?: number; className?: string })
```

- [ ] **Kırmızı:**
  1. `TextField` hata verince `aria-invalid="true"` olur, hata metni `aria-describedby` ile bağlanır; ipucu da öyle.
  2. `Dialog`:
     - `open` olunca modal açılır, başlık pencerenin adıdır.
     - `Esc` `onClose` çağırır.
     - Kapanınca odak açan öğeye döner.
  3. `ChoicePills`, `single` kipinde:
     - Radyo grubudur; ok tuşlarıyla gezilir.
     - Seçim tektir.
  4. `ChoicePills`, `multiple` kipinde:
     - `aria-pressed` düğmelerdir.
     - `max: 3` dolunca öteki düğmeler `aria-disabled` olur ve dokunuş seçimi değiştirmez.
     - Seçili düğme yeniden dokununca bırakılır.
  5. G6'nın metin katmanı ve çıkış onayı testleri `Dialog` ile aynen geçer.
- [ ] → FAIL.
- [ ] Uygula. Seçim düğmesinin değerleri (yükseklik, kenar, yarıçap, seçili zemin ve onay işareti) K2 tasarımından ölçülür. Token'da olmayan değerler kaynağıyla `tokens-extra.css`'e girer. Vitrine üç bileşen de eklenir.
- [ ] → PASS. `pnpm check`. Vitrin görüntüsü (`pnpm shots '/gelistirme/vitrin'`) taşmasız.
- [ ] Commit: `feat(components): add field errors, a dialog and choice pills`.

### Task 7: Kurulum çatısı

**Dosyalar:** `src/app/shells/OnboardingShell.tsx` (+CSS), `src/features/onboarding/OnboardingLayout.tsx` (+CSS, +test), `e2e/routes.spec.ts`.

**Üretir:**

```tsx
OnboardingLayout({ step: 1 | 2 | 3 | 4; companion: { expression?: CompanionExpression; bubble?: ReactNode };
  action?: ReactNode; children: ReactNode })
```

- [ ] **Kırmızı:**
  1. `OnboardingLayout`:
     - "Kurulum adımı 2 / 4" ilerlemesi ve "2 / 4" sayacı;
     - balon ve eylem düğmesi çizilir;
     - pano yalnız 1000 px'ten itibaren görünür (sınıf düzeyinde; çizim uçtan uca testte).
  2. **Uçtan uca** (`routes.spec.ts`):
     - 768 px'te Tıkır ve pano gizli, içerik tam genişlikte.
     - 1180 px'te pano görünür.
     - İki bölmeli düzen testinde kurulum yalnız 1000 px'ten itibaren iki bölmeli sayılır.
- [ ] → FAIL.
- [ ] Uygula. Kabuk yalnız `data-shell="onboarding"` çerçevesini ve `Outlet`'i tutar; panoyu, ilerlemeyi ve eylem çubuğunu `OnboardingLayout` çizer. 700–719 px'lik eski alt alta dizilme kalkar.
- [ ] → PASS. `pnpm check`. `pnpm e2e e2e/routes.spec.ts`.
- [ ] Commit: `refactor(onboarding): let each step draw its own panel and action`.

### Task 8: K1 Veli hesabı

**Dosyalar:** `src/features/onboarding/AccountPage.tsx` (+CSS, +test), `src/i18n/tr.ts`, `src/app/router.tsx`, `src/features/onboarding/pages.tsx`.

**Kullanır:** Task 3 (`createAccount`), Task 6 (`TextField`, `Dialog`, `Checkbox`), Task 7.

- [ ] **Kırmızı** (`AccountPage.test.tsx`):
  1. **İçerik (tasarımdan birebir):**
     - başlık "Veli hesabı" ve alt metin;
     - "E-posta" (`ad@ornek.com`), "Parola" ("En az 8 karakter");
     - onay cümlesi ve notu, "Ses verisi nasıl kullanılır?";
     - haftalık e-posta, "Hesabı oluştur";
     - balon "Merhaba! Çocuğunuz okurken ben dinlerim.";
     - iki kutu işaretsiz.
  2. **Doğrulama:**
     - Geçersiz e-posta ve 7 karakterlik parola → iki hata metni.
     - Odak e-posta alanında.
     - Depoya yazı yok.
  3. **Onaysız açıklama:** Kutu işaretsizken görünür, işaretlenince gizlenir.
  4. **Bilgi penceresi:** Taslak metinle açılır, "Kapat" kapatır.
  5. **Onayla gönderme:**
     - Veli yazılır, adres `/kurulum/okuyucu`.
     - Depodaki bütün kayıtların JSON'unda yazılan parola yok.
  6. **Onaysız:** `voiceProcessing: false`, `grantedAt` yok.
- [ ] → FAIL.
- [ ] Uygula.
- [ ] Görüntü: `pnpm shots '/kurulum/hesap?kurulum=hesap'` → K1 ile karşılaştır, farkları yaz, düzelt. Onaysız açıklama ayrıca bakılır (tasarımı yok).
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(onboarding): build the parent account (K1)`.

### Task 9: K2 Okuyucu profili

**Dosyalar:** `src/features/onboarding/ReaderPage.tsx` (+CSS, +test), `src/i18n/tr.ts`, `src/features/session/paths.ts` (`/kurulum/seviye` dinleyen adreslere), router.

**Kullanır:** Task 3 (`saveReader`), Task 6 (`ChoicePills`), Task 1.

- [ ] **Kırmızı:**
  1. **İçerik:**
     - "Okuyucuyu tanıyalım" ve alt metni;
     - "Okuyucunun adı" (`Deniz`), "Sınıfı", dört sınıf;
     - "Nelerden hoşlanır?" ve sekiz ilgi alanı;
     - "0 / 3 seçildi", "Devam et";
     - balon "Sevdiği konuları seçin, hikâyeleri ona göre kurarım.".
  2. **İlgi alanları:** Üç seçilince "3 / 3 seçildi", dördüncü pasif.
  3. **Doğrulama:** Ad boş ve sınıf yok → iki hata.
  4. **Onayla "Devam et":**
     - Mikrofon dokunuşta açılır (`audio.start`).
     - Çocuk yazılır (ad kırpılmış, `defaultReadingStyle(3)`).
     - Adres `/kurulum/seviye`.
  5. **Onaysız:** `audio.start` çağrılmaz, adres `/kurulum/tanisma`.
  6. **1. sınıf:** `font: 'school'` (ölçüt 4).
- [ ] → FAIL. Uygula.
- [ ] Görüntü: `pnpm shots --dokun "3. sınıf" --dokun Uzay --dokun Futbol --dokun Dinozorlar '/kurulum/okuyucu?kurulum=okuyucu'` → K2 ile karşılaştır.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(onboarding): build the reader profile (K2)`.

### Task 10: Yazı ayarının okuma metinlerine uygulanması

**Dosyalar:**
- `src/features/reading/ReadingStyleScope.tsx` (+test, yeni)
- `src/styles/tokens-extra.css` (öznitelik kuralları)
- `src/features/session/ListenPage.tsx`, `ReadPage.tsx`, `TextLayer.tsx` ve testleri
- `e2e/reading-text.spec.ts`

**Üretir:** `ReadingStyleScope({ style: ReadingStyle; className?: string; children: ReactNode })`: `data-reading-font`, `data-reading-size`, `data-reading-spacing` yazan bir kap.

- [ ] **Kırmızı:**
  1. `ReadingStyleScope` öznitelikleri yazar.
  2. G3, G4 (dinlenen ve dinlemesiz) ve G6'nın metin katmanında metin kabı çocuğun ayarını taşır. Testler okul harfi, boyut 3, aralık 2 ayarlı çocukla yapılır.
  3. **Uçtan uca** (`reading-text.spec.ts`): Vitrindeki kaymasız vurgu sınaması okul harfleriyle ve dört boyutla da kelime kaydırmaz.
- [ ] → FAIL. Uygula.
- [ ] → PASS. `pnpm check`. `pnpm e2e e2e/reading-text.spec.ts`.
- [ ] Commit: `feat(reading): show every reading text in the child's reading style`.

### Task 11: K3 Seviye tespiti

**Dosyalar:**
- `src/features/onboarding/LevelPage.tsx` (+CSS, +test)
- `src/features/reading/useReadingRecorder.ts` (yeni; G4'teki kayıt mantığı buraya taşınır)
- `src/features/session/ReadPage.tsx`, `MicrophoneProblem.tsx`, `sessionContext.ts`
- `src/services/listener/scenarios.ts`, `src/app/services.ts`
- `src/i18n/tr.ts`

**Kullanır:** Task 2 (`passageChapter`), Task 3 (`saveBaseline`, `skipBaseline`), Task 10.

**Üretir:**

```ts
SessionDevices.listener(kind: 'warmup' | 'reading' | 'assessment', attempt: Attempt): ListenerChoice;
ScenarioSet.assessment: FakeScenario; // typical: 60 sn, 64 kelime, demo profilinin ilk ölçümünün hataları
useReadingRecorder(options: { enabled: boolean; recorder: Recorder; audio: AudioCapture; running: boolean }):
  { start(): void; finish(): Promise<Id | null>; discard(): void };
MicrophoneProblem({ kind; onRetry; afterRetry?: { label: string; onChoose: () => void } });
```

- [ ] **Kırmızı:**
  1. **İçerik:**
     - "1 dakikalık okuma";
     - "Deniz metni sesli okusun. Hata yapması sorun değil; başlangıç noktasını arıyoruz.";
     - ilk sayfa, "1:00 kaldı";
     - balon "Hazır olduğunda başla. Dinliyorum.".
  2. **`typical` ölçüm senaryosu:**
     - Mikrofon açılır, 22 sn sonra "0:38 kaldı" ve ikinci sayfa.
     - 60 sn'de okuma kendiliğinden biter.
     - Ölçüm yazılır: 58 doğru kelime, doğruluk 0,906, öğretim düzeyi, `olcum-3a`, kayıt kimliği.
     - Adres `/kurulum/tanisma`.
  3. **Erken bitirme:** "Okumayı bitir" ilk kelimeye kadar pasif; erken bitirme okunanla yazar.
  4. **Duraklatma:** Geri sayımı ve kaydı durdurur.
  5. **Mikrofon reddi:**
     - "Yeniden dene" sonrası "Seviye tespitini atla" çıkar.
     - Dokununca ölçüm yazılmaz, adres `/kurulum/tanisma`.
     - "Yeniden dene"den önce atlama düğmesi yoktur.
  6. **G4 aynen:** G4'ün 3. okuma ve kayıt testleri `useReadingRecorder` ile aynen geçer.
- [ ] → FAIL. Uygula.
- [ ] Görüntü: `pnpm shots --dokun "Duraklatıldı. Sürdürmek için dokun" --bekle "Dinliyor. Duraklatmak için dokun" --ileri 22000 '/kurulum/seviye?kurulum=seviye'` → K3 ile karşılaştır.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(onboarding): build the level check (K3)`.

### Task 12: K4 Tıkır ile tanışma

**Dosyalar:** `src/features/onboarding/MeetPage.tsx` (+CSS, +test), `src/i18n/tr.ts`.

**Kullanır:** Task 3 (`finishSetup`), `firstTarget`, `LineChart`, `withGenitiveSuffix`.

- [ ] **Kırmızı:**
  1. **Ölçümle:**
     - "58", "doğru kelime", "bir dakikada", "Doğruluk %91", "Öğretim düzeyi";
     - "İlk hedef: 6 haftada 70", grafik etiketleri "Bugün 58" ve "6. hafta 70";
     - üç madde;
     - "Deniz’in başlangıç noktası belli oldu.";
     - balon "Merhaba Deniz! Sen okurken ben dinlerim, takılırsan yardım ederim.".
  2. **Düzey etiketi:** Serbest düzeyde "Serbest düzey"; endişe düzeyinde düzey etiketi yok.
  3. **Onaysız:**
     - Sayılar, alt başlık ve iki madde yok;
     - balon "Merhaba Deniz! Her gün birlikte bir bölüm okuyacağız.";
     - tek madde "Her gün 12 dakikalık bir bölüm".
  4. **Onaylı ama atlanmış:** Tasarımın balonu, sayı yok.
  5. **"İlk bölüme başla":** Kurulum biter, adres `/`, G1 "Merhaba Deniz".
- [ ] → FAIL. Uygula.
- [ ] Görüntü: `pnpm shots '/kurulum/tanisma?kurulum=tanisma'` → K4 ile karşılaştır; `'/kurulum/tanisma?kurulum=tanisma&onay=kapali'` taşma için.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(onboarding): build meeting Tıkır (K4)`.

### Task 13: Veli kapısı, girişler ve çıkışlar

**Dosyalar:**
- `src/features/parent/ParentGate.tsx` (+CSS, +test), `parentGateState.ts` (yeni)
- `src/services/tabSettings.ts` (bekleme anahtarı)
- `src/app/router.tsx`, `src/app/shells/ChildShell.tsx`, `ParentShell.tsx`, `ShellNav.module.css`
- `src/features/session/RoadPage.tsx` (telefondaki kilit düğmesi)
- `src/features/dev/params/devParams.ts` (`&kapi=acik`, yalnız geliştirme)
- `src/i18n/tr.ts`
- `e2e/routes.spec.ts`, `e2e/no-external-requests.spec.ts`, `e2e/support/parentGate.ts` (yeni)

**Kullanır:** Task 2 (`gateQuestion`, `isGateAnswer`), aygıtların `random`'ı.

- [ ] **Kırmızı:**
  1. **Kapalı kapı:** `/veli` kapıyı gösterir ("Veli alanı", sabit rastgelelikle "47 + 38 = ?"); veli kabuğu çizilmez.
  2. **Doğru cevap:** V1 açılır; veli alanında gezinince kapı açık kalır.
  3. **Üç yanlış:**
     - "30 saniye sonra yeniden deneyebilirsiniz.", alan ve düğme pasif.
     - 30 sn sonra yeni soru gelir.
     - Bekleme, yeniden çizimde (yenileme) sürer.
  4. **Yeniden sorma:** "Çocuk ekranı"na dönüp gelince kapı yeniden sorar.
  5. **Girişler ve çıkışlar:**
     - Telefonda G1'in "Veli alanı" düğmesi `/veli`'ye gider.
     - Tablette çocuk rayında "Veli alanı", veli rayında "Çocuk ekranı" bağlantısı.
     - Telefonda veli şeridinde "Çocuk ekranı" düğmesi.
  6. **Etiket:** Veli kabuğunda "Deniz, 3. sınıf".
  7. **Uçtan uca:** Veli rotalarını açan testler kapıyı yardımcıyla geçer (sorudaki sayıları ekrandan okuyup toplamı yazar).
- [ ] → FAIL. Uygula.
- [ ] `&kapi=acik` geliştirme parametresi kapıyı o sekmede açar; ekran görüntüleri ve uçtan uca testler için. Satır içi `MODE` denetimiyle üretimden düşer.
- [ ] Görüntü:
  - kapı (`/veli?demo=veli-haftasonu`, tasarımı yok, taşma);
  - telefonda G1 (`/?demo=cocuk-sabahi`, kilit düğmesi; G1 tasarımıyla fark listesine);
  - telefonda V1 (`/veli?demo=veli-haftasonu&kapi=acik`, çıkış düğmesi).
- [ ] → PASS. `pnpm check`. `pnpm e2e e2e/routes.spec.ts e2e/no-external-requests.spec.ts`.
- [ ] Commit: `feat(parent): guard the parent area with the parent gate`.

### Task 14: V4 Yazı ayarı

**Dosyalar:** `src/features/parent/ReadingStylePage.tsx` (+CSS, +test), `src/features/parent/views.ts` (yeni: önizleme metni ve sonuç cümlesi), `src/i18n/tr.ts`, `scripts/shots.ts` (anahtar rolü, gerekirse).

**Kullanır:** Task 1 (`trialComparison`, `trialReadingStyle`), Task 3 (`setReadingStyle`), Task 10 (`ReadingStyleScope`), Task 2 (`withGenitiveSuffix`).

- [ ] **Kırmızı:**
  1. **İçerik:**
     - "Yazı ayarı", "Deniz’in okuma metinleri bu ayarla görünür.";
     - "Önizleme", "Kayıp Fenerin İzinde", "Deniz sırt çantasını omzuna aldı. Tıkır kulaklarını dikti ve rüzgârı dinledi." (`veli-haftasonu`, son okunan bölüm 4);
     - iki yazı tipi kartı, dört boyut, üç aralık;
     - "Hangi ayar daha iyi?" kartı.
  2. **Yazı tipi:** "Okul harfleri" seçilince önizleme kabı `data-reading-font="school"` olur ve çocuk yazılır.
  3. **Boyut ve aralık:** "En büyük" ve "Daha açık" aynı biçimde.
  4. **Sonuç satırları:**
     - Anahtar açık (demo): "Net harfler, normal aralık", "Şu anki ayar", "69", "Net harfler, açık aralık", "Denenen ayar", "72" ve tasarımın cümlesi.
     - Kapalıyken satırlar yok.
  5. **Sonuç cümlesi:** Her durumun cümlesi (`views.ts` birim testi; plandaki tablo).
- [ ] → FAIL. Uygula. Önizleme kutusunun yüksekliği en büyük boyut ve en açık aralığa göre sabit.
- [ ] Görüntü (tasarımın üç durumu):
  - varsayılan: `pnpm shots '/veli/yazi?demo=veli-haftasonu&kapi=acik'`;
  - `--dokun "Okul harfleri" --dokun "En büyük" --dokun "Daha açık"` (`@okul-buyuk`);
  - `--dokun "Küçük" --dokun "Ölçümlerde iki ayarı dene"` (`@kucuk-kapali`).
  - Her biri V4 ile karşılaştırılır; `@okul-buyuk`'un sonuç satırları bilinen fark.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(parent): build the reading style setting (V4)`.

### Task 15: P14 seansta

**Dosyalar:** `src/features/session/WarmupPage.tsx`, `ReadPage.tsx`, testleri, `src/i18n/tr.ts`.

**Kullanır:** Task 3 (`continueUnheard`), Task 11 (`MicrophoneProblem.afterRetry`).

- [ ] **Kırmızı:**
  1. **G4'te mikrofon reddi:**
     - "Yeniden dene" sonrası "Bugün dinlemeden oku" çıkar.
     - Dokununca seans `unheard` olur, metnin tamamı dinlemesiz görünür.
     - Üç "Okumayı bitir" → G6; G5 atlanır.
  2. **G2:** Aynı düğmeyle kartlar "Sıradaki kelime" ile geçilir.
  3. **Seansın ortasında:**
     - 1. okuma dinlenip yazıldıktan sonra mikrofon düşer, seans dinlemesiz sürer.
     - Yazılı okuma kalır; G7'de sayı yok.
  4. **Düğmenin zamanı:** "Yeniden dene"den önce görünmez.
  5. **Yenileme:** `unheard` seans dinlemesiz açılır; mikrofon açılmaz.
- [ ] → FAIL. Uygula. "Dinlenir mi" her yerde `consent.voiceProcessing && !session.unheard`.
- [ ] → PASS. `pnpm check`.
- [ ] Commit: `feat(session): read on unheard when the microphone cannot be used (P14)`.

### Task 16: Uçtan uca testler

**Dosyalar:** `e2e/onboarding.spec.ts`, `e2e/reading-style.spec.ts`, `e2e/parent-gate.spec.ts`, `e2e/session-p14.spec.ts`, `e2e/no-external-requests.spec.ts`.

- [ ] Testler (Chromium ve WebKit):
  1. **`onboarding.spec.ts` › "an empty device sets up the parent and the reader, measures the level and opens the first chapter"** (ölçüt 1, 3, 4):
     - `?demo=bos` ile K1, K2 (3. sınıf), K3 (saat 60 sn), K4.
     - K4'te "58" ve "6. haftada 70".
     - G1 "Merhaba Deniz"; depoda ölçüm ve çocuk.
  2. **"without the consent the setup skips the level check and never opens the microphone"** (ölçüt 2): `getUserMedia` 0, K4 sayısız.
  3. **`reading-style.spec.ts` › "the reading style chosen on V4 shows in G3, G4 and K3"** (ölçüt 5): okuma metninin hesaplanmış `font-family` ve `font-size` değeri.
  4. **"the preview keeps its height and the controls stay in place for every size and spacing"** (ölçüt 6): on iki birleşimde önizleme yüksekliği ve denetimlerin konumu sabit.
  5. **`parent-gate.spec.ts` › "the parent area opens only through the gate"** (ölçüt 7): yanlış, bekleme (saat), doğru, gezinme, çıkış ve yeniden sorma.
  6. **`session-p14.spec.ts` › "a refused microphone lets the child read on unheard to the end of the day"** (ölçüt 9): onaylı demo, reddedilen `getUserMedia`, G7'de "71" yok, G1 "Bugünlük bitti".
  7. **`no-external-requests.spec.ts`:** kurulumun baştan sona yürünmesi.
- [ ] `caffeinate -u -t 2; caffeinate -d -i pnpm e2e e2e/onboarding.spec.ts e2e/reading-style.spec.ts e2e/parent-gate.spec.ts e2e/session-p14.spec.ts e2e/no-external-requests.spec.ts` → geçer.
- [ ] Commit: `test(e2e): run the setup, the reading style, the gate and P14 end to end`.

### Task 17: Belgeler, karşılaştırma ve denetim

**Dosyalar:** `docs/mimari.md`, `docs/ekranlar.md`, `docs/dinleme-hatti.md`, `docs/kararlar.md`, `CLAUDE.md`, bu plan.

- [ ] Belgeler:
  - `docs/mimari.md`:
    - kurulum durumu ve korumalar;
    - veli kapısı;
    - yazı ayarının uygulanması;
    - yeni geliştirme parametreleri;
    - `useReadingRecorder`.
  - `docs/ekranlar.md`: K1–K4 ve V4'ün tasarımsız ayrıntılarına gönderme.
  - `docs/dinleme-hatti.md`: ölçüm senaryosu ve K3.
  - `docs/kararlar.md`: değişiklik günlüğü.
- [ ] Tasarım karşılaştırması: K1–K4 ve V4'ün üç durumu bu plandaki komutlarla yeniden alınır; fark listeleri tamamlanır (ölçüt 8).
- [ ] Denetim:
  - `pnpm check`.
  - `pnpm build`; `dist/` içinde şu dizgiler 0 dosyada: `demo-profil`, `veli@example.com`, `gelistirme`, `fake-indexeddb`, `kapi=acik`, `tikir.gelistirme`.
  - `caffeinate -u -t 2; caffeinate -d -i pnpm e2e`.
  - Çıktılar "Kanıtlar"a yazılır.
- [ ] Commit: `docs: record phase 3 decisions and evidence`.

Sonra bütün dal bağımsız bir incelemeden geçer; düzeltmeler tek geçişte yapılır. Faz bitince dal `main`'e `--no-ff` birleştirilir ve gönderilir (ürün sahibinin kalıcı talimatı).

## Tasarım karşılaştırması

| Ekran | Komut |
|---|---|
| K1 | `pnpm shots '/kurulum/hesap?kurulum=hesap'` |
| K2 | `pnpm shots --dokun "3. sınıf" --dokun Uzay --dokun Futbol --dokun Dinozorlar '/kurulum/okuyucu?kurulum=okuyucu'` |
| K3 | `pnpm shots --dokun "Duraklatıldı. Sürdürmek için dokun" --bekle "Dinliyor. Duraklatmak için dokun" --ileri 22000 '/kurulum/seviye?kurulum=seviye'` |
| K4 | `pnpm shots '/kurulum/tanisma?kurulum=tanisma'` |
| V4 | `pnpm shots '/veli/yazi?demo=veli-haftasonu&kapi=acik'` (ve iki durumun `--dokun` adımları, Task 14) |

Uygulama sırasında her ekranın fark listesi buraya eklenir.

## Kanıtlar

Uygulama sırasında doldurulur.

## Uygulamada verilen kararlar

Uygulama sırasında doldurulur.
