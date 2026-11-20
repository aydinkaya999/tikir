# Kararlar

Neyin kesinleştiğini, neyin varsayım olduğunu ve neyin hâlâ açık olduğunu tutar. Her faza başlarken oku.

- **kesin:** Ürün sahibinin kararı. Değiştirmeden önce sor.
- **varsayım:** Başlamak için seçildi; itiraz gelmedikçe geçerli. Değişirse bu dosyayı ve etkilenen belgeyi birlikte güncelle.
- **açık:** Karar bekliyor. "Şimdilik" sütunundaki yer tutucuyla ilerle; kararı kendin verme.

## Ürün

| # | Konu | Karar | Durum | Şimdilik / not |
|---|---|---|---|---|
| P1 | Ad | "Tıkır": ürünün çalışma adı ve yoldaş karakterin adı | varsayım | Ad kodda tek yerde durur (`src/i18n/tr.ts`). Marka ve alan adı araştırması yapılmadı. |
| P2 | Kitle ve ton | 7–10 yaş, ilkokul 1–4. sınıf; macera tonu | kesin | |
| P3 | Ölçü | Bir dakikada doğru okunan kelime ve anlama. Hız ödüllendirilmez. | kesin | `docs/urun.md` bölüm 2 |
| P4 | Değişmez kurallar | `docs/urun.md` bölüm 4'teki 11 kural | kesin | |
| P5 | Günde tek seans | Kitaplıktan okunan kitap da günün seansı sayılır; ikinci seans açılmaz | varsayım | 9. kuralın yorumu |
| P6 | Puanlama | Yanlış okuma, ek hatası, atlama ve yardım alınan kelime düşülür; tekrar, ekleme ve kendini düzeltme düşülmez | varsayım | Bir okuma uzmanı ya da sınıf öğretmeniyle gözden geçirilecek |
| P7 | Başlangıç değerleri | Hedef kazancı (haftada 2), yeni hedef (+8), evcilleşme aralıkları (1, 2, 4 gün), sınıf eşikleri, duraksama eşikleri | varsayım | Hepsi `src/domain/config.ts` içinde parametre |
| P8 | Sınıf ortalaması çizgisi | 3. sınıf 90, 4. sınıf 98 | açık | Kaynakla doğrulanacak. Şimdilik bu değerler; doğrulanmazsa yayında çizgi gizlenir. |
| P9 | Okuyucu sayısı | Hesap başına tek okuyucu | varsayım | Kayıtlarda `childId` var; çoklu profil gelirse depo arayüzü genişler ve profil seçici tasarımı gerekir |
| P10 | Yazı ayarının yeri | Veli alanında; çocuk kendisi değiştiremez | varsayım | |
| P11 | Veli kapısı | İki basamaklı toplama sorusu (birler basamağında elde var, toplam 100'den küçük). Üç yanlışta 30 saniye beklenir; bekleme sayfa yenilense de sürer. Kapı, veli alanında gezinildikçe açık kalır; çocuk ekranına dönünce, sayfa yenilenince ya da sekme kapanınca yeniden sorar. Girişler: webde kenar çubuğu, tablette çocuk rayının altı, telefonda G1'in sağ üst köşesi. Çıkışlar bunların aynası | kesin | Ürün sahibi, 2026-11-20 (`docs/planlar/faz-3.md`, yanıt 1, 4 ve 8; kararlar 25–27). Faz 7'de mağaza kurallarıyla karşılaştırılacak. |
| P12 | Gelir modeli | Karar yok | açık | Ödeme ve abonelik için kodda yer açma |
| P13 | Onaysız seans | Veli ses onayı yoksa seans dinlemesiz yürür: mikrofon hiçbir adımda açılmaz; okuma sonucu, kelime kartı ve ses kaydı yazılmaz; G5 atlanır | kesin | Ürün sahibi, 2026-11-20. Ayrıntı: `docs/planlar/faz-2b.md`, karar 10. Tasarımı yok (`TODO(design)`); Faz 3'te K1'in onaysız yoluyla birlikte gözden geçirilir. |
| P14 | Onay var, mikrofon yok | Veli ses onayı verdiği hâlde mikrofon kullanılamıyorsa (izin reddi, mikrofon yok, hata) çocuk seansı yine bitirebilir. Sorun balonunda önce "Yeniden dene" çıkar; yeniden deneme de olmazsa "Bugün dinlemeden oku" seçeneği gelir. Seansın kalanı P13'ün dinlemesiz yolundan gider ve gün tamamlanmış sayılır (üst üste gün, sıradaki bölüm). Velinin karnesi dinlenmeden okunan günleri gösterir | kesin | Ürün sahibi, 2026-11-20 (Faz 2b son incelemesi, açık soru 7, A seçeneği). Faz 3'te yapılır; karnedeki satır Faz 4'te. Faz 3 planında kesinleşecekler: düğme ve balon metinleri (tasarımı yok, D15 gibi önerilir); seansın ortasında düşen mikrofon (dinlenen okumalar kalır, kalanı dinlemesiz; G7'nin sayısı); mikrofon izninin kurulumda veli yanındayken istenmesi (öneri). |

## Tasarım

| # | Konu | Karar | Durum | Şimdilik / not |
|---|---|---|---|---|
| D1 | Yön | Çini macera (`docs/tasarim-sistemi.md`) | kesin | |
| D2 | Yazı | Tek aile: Atkinson Hyperlegible Next. Besley kullanılmaz. | kesin | |
| D3 | Okul harfleri | Hangi yazı tipi olacağı | açık | Adaylar: TTKB Dik Temel Abece (lisansı ve webde kullanım koşulları öğrenilecek), Andika. Yer tutucu: Didact Gothic. Tek değişken: `--font-school`. Faz 3'te yer tutucu kaldı (ürün sahibi, 2026-11-20). |
| D4 | Boyutlar | Telefon, tablet ve web eşit öncelikli | kesin | |
| D5 | Hazır malzeme | Emoji, hazır ikon kütüphanesi ve hazır bileşen kiti yok | kesin | |
| D6 | Tasarımı olmayan durumlar | `docs/ekranlar.md` sonundaki varsayılanlar | varsayım | Kodda `// TODO(design)`; tasarım gelince değişir |
| D7 | Albüm ve Stüdyo | Tasarım bekliyor | açık | Asgari liste ekranları. Rotalar Faz 0'da açıldı: `/album`, `/studyo` (çocuk kabuğu). |
| D8 | Tıkır'ın çizimi | Son hali onaylanmadı | açık | `design/svg` içindeki çizimler |
| D9 | Hareket | Tasarımda tanımlanmadı | varsayım | `docs/tasarim-sistemi.md` → "Hareket" |
| D10 | Token'da olmayan tasarım değerleri | `src/styles/tokens-extra.css`, rol adıyla ve tasarımdaki kaynağıyla | varsayım | Tasarım HTML'i `tokens.css` dosyasının tanımlamadığı yazı boyutları, köşeler ve halka gölgeleri kullanıyor. Sabit değer yalnız `tokens.css` (birebir kopya), `tokens-extra.css` ve `fonts.css` içinde; Stylelint denetler. |
| D11 | MicButton'ın çizilmemiş durumları | Duraklatıldı: beyaz zemin, halka yok, ad "Duraklatıldı. Sürdürmek için dokun". İzin yok: soluk ikon, kesik kenarlık, ad "Mikrofon izni yok". | varsayım | Faz 0 planıyla onaylandı; kodda `TODO(design)`. |
| D12 | `design` senaryosunun sayfaları | `design` senaryosunda G3 ve G4, içeriğin 1–2. sayfasını tek sayfa gösterir ("1 / 2") | kesin | Ürün sahibi, 2026-11-19 (12. soru). Öteki senaryolarda her içerik sayfası bir sayfadır. Ayrıntı: `docs/planlar/faz-2a.md`, karar 3. |
| D13 | G1 balonu | Tablet ve webde her bölüm için genel kalıp: "Bugün {n}. bölümü okuyoruz: {başlık}. Hazırsan başlayalım." | kesin | Ürün sahibi, 2026-11-20. Tasarımdaki cümle 4. bölüme özgü ve içerikte yok. Bölümün kendi cümlesi gelince (C6) o kullanılır. |
| D14 | G6'da yanlış cevap | Doğru seçenek sakin biçimde işaretlenir; ilgili cümle metinde vurgulanmaz | kesin | Ürün sahibi, 2026-11-20. Sorularda cevabın cümlesi yok (C7); gelince vurgu eklenir. |
| D15 | Tasarımı olmayan durumların metinleri | `docs/planlar/faz-2b.md` → "Tasarımı olmayan durumların metinleri" | varsayım | Faz 2b planıyla onaylandı (2026-11-20); kodda `TODO(design)`. Tasarım gelince değişir. |
| D16 | Tasarımı olmayan durumların metinleri (Faz 3) | `docs/planlar/faz-3.md` → "Tasarımı olmayan durumların metinleri". K1'in "Ses verisi nasıl kullanılır?" metni taslaktır | varsayım | Faz 3 planıyla onaylandı (2026-11-20); kodda `TODO(design)`, bilgi penceresinde `TODO(legal)` (yayından önce KVKK incelemesi). |

## Teknik

| # | Konu | Karar | Durum | Şimdilik / not |
|---|---|---|---|---|
| T1 | Platform | Önce web. Aynı kod sonra Capacitor ile iOS ve Android'e paketlenir. | kesin | Asıl risk uygulama kabuğunda mikrofon; Faz 1'in ikinci yarısında denenir |
| T2 | Ön yüz | React + TypeScript + Vite | varsayım | Ekipte React ve TypeScript deneyimi olup olmadığı yanıtlanmadı. Değişecekse Faz 0'dan önce değişmeli. |
| T3 | Stil | CSS Modules + CSS değişkenleri | varsayım | Tasarım kendine özgü; hazır kit görünümü bozar |
| T4 | Durum ve yönlendirme | Zustand, React Router | varsayım | |
| T5 | Arka uç zamanı | Faz 0–5 arka uçsuz; veri cihazda (IndexedDB) | varsayım | Hesap o cihazda kalır. Parola saklanmaz ve gönderilmez. |
| T6 | Arka uç yığını | Python + FastAPI + PostgreSQL | varsayım | Faz 6 ayrı tasarım belgesiyle başlar |
| T7 | Konuşma tanıma | Sağlayıcı ve yaklaşım | açık | `FakeListener`. Karar, değerlendirme düzeneğinin ölçümüyle verilir (`docs/dinleme-hatti.md` bölüm 4). |
| T8 | Model okuma sesi | Tıkır'ın sesi nereden gelecek | açık | Tarayıcının konuşma sentezi; cihazda Türkçe ses yoksa sessiz, zamanlı vurgu. Faz 2a'dan beri: her anlam ünitesi ayrı bir konuşma, duraklatma iptal edip üniteyi yeniden başlatır, 1,5 sn içinde başlamayan ya da hata veren ünite sessiz zamanlanır; sessiz zamanlama yavaşta saniyede 2,8, normalde 3,5 hece ve ünite başına 250 ms (`docs/planlar/faz-2a.md`, karar 11). Yalnız cihazdaki Türkçe ses kullanılır (`localService`); çevrimiçi ses metni üçüncü tarafa gönderdiği için seçilmez (T12), öyle bir cihazda sessiz zamanlama çalışır. Başlayıp bitmeyen ünite, yavaş hece süresinin iki katı artı 2 sn sonra bitmiş sayılır. Faz 2b'den beri: bir ünite başlamaz ya da hata verirse sayfanın kalanı beklemeden sessiz zamanlanır; sonraki sayfa ve her kelime sesi yeniden dener (ürün sahibi, 2026-11-20; Faz 2b planı, karar 8). |
| T9 | Ses biçimi | 16 kHz, tek kanal, 16 bit PCM, 20 ms çerçeve | varsayım | Faz 6'da seçilen tanıma yoluna göre gözden geçirilir |
| T10 | Dil | Kod, yorum ve commit İngilizce; arayüz Türkçe ve tek dilli | varsayım | Çeviri kütüphanesi yok; metinler `src/i18n/tr.ts` |
| T11 | Araçlar | pnpm, Node LTS, Vitest, Testing Library, Playwright | varsayım | Faz 0'da Node 26 LTS (`.nvmrc`, `engines`) ve pnpm 12 (`packageManager`) seçildi. Güncel `react-router`, `jsdom` ve `stylelint` en az Node 22.22 istiyor. |
| T14 | TypeScript sürümü | 6.0.x | varsayım | Güncel kararlı sürüm 7.0, ama `typescript-eslint` yalnız 6.1'den eskisini destekliyor. Destek gelince 7'ye geçilir. |
| T15 | İçerik güvenlik politikası | Derlenen sayfada meta etiketi: `default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'` | varsayım | Geliştirme sunucusunda yok (Vite'in satır içi yenileme betiğini engellerdi). `e2e/no-external-requests.spec.ts` dış istekleri ve CSP ihlallerini yakalar. Faz 7'de mağaza denetimiyle gözden geçirilir. |
| T12 | Üçüncü taraf | Çalışma anında dış adrese istek yok; analitik ve reklam yok | kesin | Yazı tipleri depoda barındırılır |
| T13 | Depo düzeni | Kök web uygulaması; `server/` sonra; `ios/` ve `android/` Capacitor ile | varsayım | |
| T16 | Ses denemesi sayfasında veli onayı | `/gelistirme/ses` mikrofonu veli onayı kaydı olmadan açar: Faz 1'de depo ve `consent.voiceProcessing` yok, sayfa üretim derlemesine girmez, denemeyi yetişkin yapar | kesin | Ürün sahibi, 2026-11-19. Ürün ekranlarındaki onay denetimi ve testi Faz 2'de seansla gelir. |
| T17 | Geliştirme sayfalarının metinleri | `src/features/dev/` içinde, `src/i18n/tr.ts` dışında: `tr.ts` üretim paketine girer, geliştirme sayfaları girmez | varsayım | Tasarımları yok; ses denemesi sayfasının metinleri Faz 1 planıyla onaylandı (`docs/planlar/faz-1.md`). Emoji denetimi bu metinleri de tarar. |
| T18 | Ses yakalama ayarları ve açılış sırası | Varsayılan: yankı giderme, gürültü bastırma ve otomatik kazanç açık (tarayıcıların varsayılanı). Sıra: `getUserMedia` → `AudioContext` → AudioWorklet → `resume()`; tek kanala tarayıcı indirger | varsayım | Ses denemesinin ayar setleri (`docs/ses-denemesi-sonuclari.md`) gelince gözden geçirilecek. Chromium'da gürültü bastırma sabit bir tonu ~19 dB bastırıyor (Faz 1'de ölçüldü). |
| T19 | Capacitor deneme yapılandırması | appId `com.tikir.app`; webDir `dist-cap`; `cap` derleme kipi (geliştirme sayfaları dahil, CSP aynı); uygulama `/gelistirme/ses` ile açılır (`cap` kipinde `src/appShellStart.ts` yönlendirir, `main.tsx`'in ilk içe aktarması; `server.appStartPath` iOS'ta dosya yolu sayılıp uygulamayı kapattığı için kullanılmaz, ürün sahibi 2026-11-19); iOS mikrofon izni metni "Tıkır, sesli okumayı dinlemek için mikrofonu kullanır."; Android `RECORD_AUDIO` ve `MODIFY_AUDIO_SETTINGS`; Capacitor CLI'ın kullanım verisi kapalı | varsayım | Yalnız Faz 1 ses denemesi için. Uygulama kimliği, izin metinleri ve başlangıç yolu Faz 7'de kesinleşir. Kullanım verisi ayarı makineye kaydedilir: her makinede bir kez `pnpm exec cap telemetry off`. Uygulama içinden yankı testi yok: aynı köken yok, CSP, iOS ATS ve Android ağ güvenliği ayarı gerekirdi. |
| T20 | Yankı ölçümü ve cihaz denemesi yolu | Yankı sunucusu `scripts/echo-server.ts` (`ws`, yalnız `127.0.0.1:4318`). Vite'in geliştirme ve önizleme sunucusu `/gelistirme/yanki` adresini ona aktarır; sayfa kendi kökenine bağlanır, CSP değişmez. Gerçek cihaz için `pnpm audio-trial` mkcert sertifikasıyla HTTPS açar | varsayım | Chromium ve WebKit'te `default-src 'self'` aynı kökenli `ws:` bağlantısını engellemiyor (Faz 1'de ölçüldü). Uygulama kabuğunda aynı köken olmadığı için kabuktan yankı testi kapsam dışı. |
| T21 | Okuma kaydı | `PcmRecorder`: `AudioCapture` çerçeveleri 16 kHz, tek kanal, 16 bit WAV'a çevrilir, IndexedDB'nin `recordings` deposunda `ArrayBuffer` olarak durur ve Faz 1'in `WavPlayer`'ıyla çalınır. En çok 5 dakika; G5'in dalga biçimi için 64 düzey kayıtla saklanır | varsayım | `docs/mimari.md`'deki `MediaRecorderRecorder` yerine: `AudioCapture` akışı değil çerçeveyi verir, CSP'ye `media-src` gerekmez, yol Faz 1'de cihaz denemesine hazırlandı. Boyut saniyede 32 KB, iki dakikalık okuma yaklaşık 3,8 MB. Faz 2a planı, karar 10. |
| T22 | Seansın mikrofonu | Sayfada tek `AudioCapture`. Dinleyen adıma götüren dokunuş (G1 "Başla" ya da "Sürdür", G3 "Sıra sende", G5 "Baştan kaydet") ya da mikrofon düğmesi açar; adres dinleyen bir adım (G2, G4) değilse kök düzeydeki kural kapatır. Onay denetimi `useMicrophone`'dadır | varsayım | Faz 2b planı, karar 6. Ekran kapanınca kapatma işi kurala taşındı: StrictMode'da ekranın ikinci takılması, önceki ekranın açtığı mikrofonu kapatıyordu. iPhone'da yardım seslendirmesi sırasında açık mikrofon cihaz denemesinde bakılır. |

## İçerik

| # | Konu | Karar | Durum | Şimdilik / not |
|---|---|---|---|---|
| C1 | Seri kitap | "Kayıp Fenerin İzinde", 12 bölüm | açık | 1–5. bölüm örnek olarak yazıldı; 6–12 yazılacak. Hepsi bir editörün ve bir sınıf öğretmeninin elinden geçmeli. |
| C2 | Ölçüm metinleri | Her sınıf için eş güçlükte en az 6 metin | açık | 5 örnek metin var (3. sınıf için 2, diğerleri için 1) |
| C3 | Örnek kitaplar | Sahte üreticinin döndürdüğü kitap ve velinin eklediği örnek | varsayım | `seed/ornek-kitaplar.json` |
| C4 | İçerik sorumlusu | Metinleri kimin yazacağı ve denetleyeceği | açık | Kod içerik uydurmaz; eksik içerik için dur ve sor |
| C5 | Okuma metnindeki rakamlar | Okuma metnindeki rakamlar okunuşlarıyla eşlenir; yazılı sayı tek kelimedir | kesin | Ürün sahibi, 2026-11-19 (14. soru). Ayrıntı: `docs/planlar/faz-2a.md`, karar 2. Ondalık, yüzde, saat ve binlik ayracı henüz yok. |
| C6 | Bölümlerin G1 giriş cümlesi | Tıkır'ın G1 balonunda bölüme özgü cümle | açık | Şimdilik D13 kalıbı. İçerik yazarı yazarsa içeriğe eklenir. |
| C7 | Soruların cevap cümlesi | G6'da yanlış cevapta vurgulanacak metin cümlesi | açık | Şimdilik vurgu yok (D14). İçerik her soruya cümlesini eklerse G6'da vurgulanır. |

## Hukuk ve mağaza

| # | Konu | Karar | Durum | Şimdilik / not |
|---|---|---|---|---|
| L1 | Ses verisi | Onay metni, saklama süresi, silme yolu | açık | Metinler taslak. Yayından önce hukuki inceleme (KVKK) gerekir. |
| L2 | Mağaza kuralları | Çocuk kategorisi, veli kapısı, ödeme | açık | Faz 7'de güncel kurallar okunup denetlenir |

## Tasarımdaki örnek veri tutarsızlıkları

Tuvaldeki ekranlar tek bir andan değil, ayrı ayrı örnek anlardan çizildi. Aşağıdaki farklar bilinir; kodda **kural** geçerlidir, sayıyı tasarıma uydurmak için kuralı bozma.

1. V1 ve V3'te doğruluk %94 yazar; 76 kelime ve 5 hata formülle %93 eder.
2. G2'de "kıvrılıyordu" için 2 doğru okuma kalmıştır, G7'de aynı gün evcilleşmiş görünür. Kurala göre aynı gün olamaz.
3. G1 "4 gün üst üste" der; V1'deki hafta şeridinde çarşamba boştur. Demo profilinde seri 2 gündür.
4. G4'teki an (19. saniyede 15. kelime, hayalet 2 kelime geride) gerçek tempolardan türemez. `design` senaryosu hayaleti sabitler.
5. Tarihler ("16 Kasım Pazar") 2025 takvimine göredir. Demo profilinde günler görelidir.
6. U4 "180 kelime, 2,6 hece, 7 kelime" der; örnek kitabın gerçek değerleri 176 kelime, 2,5 hece ve 5,9 kelimedir. Ekranda gerçek hesap görünür.
7. V3'teki bant etiketi "%90–98"dir; sınıflama yuvarlanmamış değerle yapılır (%99'un altı öğretim düzeyi).
8. G5 "12 bölümün 4’ü kayıtlı" der; demo profilinin eski seanslarında ses kaydı yoktur, uygulama "12 bölümün 1’i kayıtlı" gösterir (Faz 2b).
9. G3 o anki üniteyi "yukarıya kıvrılıyordu." gösterir ve "0:21 / 0:47" der; bizim zamanlamamızda bu ünite 0:16,5 ile 0:20 arasında okunur, 0:21'de sıradaki ünite vurgulanır. Telefon tasarımı aynı anda başka bir üniteyi ("Dar patika,") vurgular. Ekran görüntüsü 0:18'de alınır (Faz 2b).
10. V4'ün "okul harfi, büyük" durumu (`@okul-buyuk`) sonuç satırlarında yine "Net harfler, normal aralık · 69" ve "Net harfler, açık aralık · 72" gösterir; kurala göre (`docs/urun.md` bölüm 7) ayar değişince karşılaştırma yeni ayar çiftiyle sıfırdan başlar ve bu durumda satırlar başka olur (Faz 3).

## Ürün sahibinin yanıtlaması gerekenler

1. Ekipte React ve TypeScript bilen var mı? (T2)
2. Bir hesapta birden çok çocuk olacak mı? (P9)
3. Okul harfleri için hangi yazı tipi kullanılacak? (D3)
4. Bölümleri ve ölçüm metinlerini kim yazacak, kim denetleyecek? (C1, C2, C4)
5. Puanlama kuralını ve eşikleri gözden geçirecek bir okuma uzmanı ya da sınıf öğretmeni var mı? (P6, P7, P8)
6. Arka uç için Python + FastAPI uygun mu? (T6)
7. Capacitor denemesi için bir Mac ve bir iPhone var mı? (T1)
8. Gelir modeli ne olacak? (P12)

Faz 0'da tasarımla belgeler karşılaştırılırken çıkanlar:

9. K2 (sınıf, ilgi alanları) ve U2'deki ("Sınıf düzeyi", "Uzunluk") 48 px yuvarlak seçim düğmeleri bileşen envanterinde yok. Envanter K2 için OptionCard diyor, ama K2'de seçim kartı yok. Envantere bir bileşen olarak eklensin mi? (Faz 3'ten önce) Yanıtlandı (2026-11-20): eklenir, `ChoicePills` (Faz 3 planı, yanıt 6).
10. U1 ve U4 kapaklarında `design/svg` içinde olmayan bir çini deseni var (açık kobalt zeminde safran yıldız). Şimdilik kapaklar mevcut altı desenle kuruluyor. (Faz 5'ten önce)
11. Telefon ve tablette çocuk ekranından veli alanına giden yol yok; "Veli alanı" bağlantısı yalnız webde. (Faz 3'ten önce) Yanıtlandı (2026-11-20): tablette çocuk rayının altında, telefonda G1'in sağ üst köşesinde kilitli "Veli alanı"; çıkış bunun aynası (Faz 3 planı, yanıt 1 ve 8; P11).
12. G4 tasarımında 4. bölümün "1 / 2" sayfası, içerikteki 1. ve 2. sayfanın birleşimi. İçerikte bu bölüm 6 sayfa. Faz 2'deki `design` senaryosu hangisini izlesin? (Faz 2'den önce) Yanıtlandı (2026-11-19): D12.
13. İki bölmeli kabukların alt alta dizilmiş hâli çizilmedi (içerik 720 px altında: seans ve odak kabuğunda 700–783 px, kurulum kabuğunda 700–719 px). Şimdilik bölmeler sırasını koruyarak alt alta dizilir; kurulumda kobalt pano sayfanın başına geçer (`TODO(design)`). Ayrıca kurulum kabuğunda pano tablette 420 px sabit: 768 px'lik dikey tablette form sütununa 260 px kalır. Pano bu genişliklerde daralsın mı, yoksa kurulum telefon düzenine mi geçsin? (Faz 1'den önce) Kurulum için yanıtlandı (2026-11-20): 1000 px'in altında kurulum telefon düzenine geçer, pano gizlenir (Faz 3 planı, yanıt 7). Seans ve odak kabuğunun alt alta dizilmiş hâli açık kalır.
14. Okuma metninde rakamlar kelime sayılmıyor: "Deniz 3 elma aldı." metninde "3" önceki kelimeye yapışık görünür, kelime sayısına ve dinleme beklentisine girmez; "100’ü" yalnız "ü" olarak okunur. Rakamlar okuma metinlerinde hiç olmamalı mı (içerik kuralı), yoksa okunuşlarıyla ("üç") mı eşlensin? (Faz 2'den önce) Yanıtlandı (2026-11-19): C5.
15. Veli onay verdiği hâlde mikrofon kullanılamıyorsa çocuk seansı bitirebilsin mi? (Faz 2b son incelemesi) Yanıtlandı (2026-11-20): P14.

## Bağımlılıklar

Faz 0'da doldurulur. Sonradan eklenen her paket için bir satır yaz.

| Paket | Ne için | Eklendiği faz |
|---|---|---|
| `react`, `react-dom` | Arayüz (T2) | 0 |
| `vite`, `@vitejs/plugin-react` | Derleme ve geliştirme sunucusu (T2) | 0 |
| `typescript` (6.0.x) | Strict tip denetimi; neden 7 değil: T14 | 0 |
| `@types/react`, `@types/react-dom`, `@types/node` | Tipler. Node tipleri yalnız testlerde, ayar dosyalarında ve betiklerde | 0 |
| `vitest` | Birim ve bileşen testleri (T11) | 0 |
| `jsdom` | Bileşen testleri için DOM ortamı | 0 |
| `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | Bileşen testleri: rol ve erişilebilir adla sorgu, klavye ve işaretçi etkileşimi, DOM eşleyicileri | 0 |
| `eslint`, `@eslint/js`, `typescript-eslint`, `globals` | Lint; tip bilgili strict kurallar. CLAUDE.md'deki katman, metin ve harf çevirisi kuralları da burada denetlenir | 0 |
| `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | Hook kuralları; Vite'in canlı yenilemesini bozan dışa aktarımları yakalar | 0 |
| `eslint-plugin-jsx-a11y` | Erişilebilirlik: div'e tıklama, etiket ve rol kuralları. Eş-bağımlılık aralığı ESLint 9'da bitiyor; ESLint 10 ile denendi ve çalışıyor. Uyarı `pnpm-workspace.yaml` içinde susturuldu | 0 |
| `stylelint` | CSS'te sabit renk, yazı boyutu, köşe ve gölge yasağı; `text-transform: uppercase` yasağı (CLAUDE.md "Stil") | 0 |
| `prettier` | Biçim | 0 |
| `@playwright/test` | Uçtan uca testler (Chromium ve WebKit) ve `pnpm shots` ekran görüntüleri (T11) | 0 |
| `@fontsource-variable/atkinson-hyperlegible-next` | Tek yazı ailesi, depodan sunulur (D2, T12). `src/styles/fonts.css` paketin dosyalarını token'daki aile adıyla bağlar | 0 |
| `react-router` | Yönlendirme (T4); rotalar `docs/ekranlar.md`, geliştirme sayfaları tembel yüklenir ve üretim derlemesine girmez | 0 |
| `@fontsource/didact-gothic` | Okul harfleri yer tutucusu (D3). Türkçe harflerin hepsi bu yazı tipinden çiziliyor (Faz 0'da denetlendi) | 0 |
| `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli` | Uygulama kabuğu (T1, T19): aynı web kodu iOS ve Android uygulamasında. Faz 1'de yalnız ses denemesi için; CLI geliştirme bağımlılığı, `@capacitor/core` CLI'ın istediği çekirdek | 1 |
| `ws`, `@types/ws` | Yerel yankı sunucusu (`scripts/echo-server.ts`, T20): çerçeveleri olduğu gibi geri gönderir. Node'da yerleşik WebSocket sunucusu yok; protokolü elle yazmak yerine yaygın, bağımlılıksız paket. Yalnız geliştirme bağımlılığı, uygulamaya girmez | 1 |
| `idb` | IndexedDB'yi söz (promise) arayüzüyle saran küçük, bağımlılıksız paket; `IndexedDbRepository` ve kayıt deposu bunun üstünde (`docs/mimari.md`, "Yığın"; Faz 2a planı, karar 12) | 2 |
| `fake-indexeddb` | Vitest'te IndexedDB: depo ve kayıt testleri bellekte çalışan gerçek bir IndexedDB uygulamasına karşı koşar. Yalnız geliştirme bağımlılığı | 2 |
| `zustand` | Seans durumu (T4; `docs/mimari.md` → "Yığın"): seans deposu, depoya yazan eylemleri ve ekranların okuduğu durumu tek yerde tutar. Küçük, bağımlılıksız; React bağlamında `useStore` ile okunur | 2 |

## Değişiklik günlüğü

- 2026-11-18: İlk sürüm (başlangıç paketi).
- 2026-11-18: Faz 0: Node 26 LTS ve pnpm 12 (T11), TypeScript 6.0 (T14), ilk bağımlılıklar.
- 2026-11-18: Faz 0: CSP (T15); `tokens-extra.css` (D10); MicButton'ın çizilmemiş durumları (D11); Albüm ve Stüdyo rotaları (D7); yanıt bekleyen sorulara 9–12. maddeler eklendi.
- 2026-11-18: Faz 0 son incelemesi: 13. soru (iki bölmeli kabukların alt alta dizilmiş hâli, kurulum panosunun dikey tablette genişliği) ve 14. soru (okuma metninde rakamlar) eklendi.
- 2026-11-19: Faz 1: ses denemesi sayfasında onay istisnası (T16), geliştirme sayfası metinleri (T17), ses yakalama ayarları ve açılış sırası (T18).
- 2026-11-19: Faz 1: yankı ölçümü ve cihaz denemesi yolu (T20), `ws` bağımlılığı, sonuç şablonu (`docs/ses-denemesi-sonuclari.md`).
- 2026-11-19: Faz 1: Capacitor deneme yapılandırması (T19) ve dört Capacitor paketi; `server.appStartPath` yerine `cap` kipinde açılış yönlendirmesi (ürün sahibinin onayıyla).
- 2026-11-20: Faz 2a planı onaylandı: rakamların okunuşu (C5) ve `design` senaryosunun sayfaları (D12); 12. ve 14. sorular yanıtlandı.
- 2026-11-20: Faz 2a: `idb` ve `fake-indexeddb` bağımlılıkları; okuma kaydı (T21); seslendirme ayrıntısı (T8 notu); `docs/mimari.md` ve `docs/dinleme-hatti.md` güncellendi (tarih, ilerleme, servis klasörleri, yardım akışı, senaryo tablosu).
- 2026-11-20: Faz 2b planı onaylandı: dinlemesiz seans (P13), G1 balonu (D13), G6'da yanlış cevap (D14), tasarımı olmayan durumların metinleri (D15), seslendirmenin geri dönüşü (T8 notu), seansın mikrofonu (T22); açık içerik soruları C6 ve C7.
- 2026-11-20: Faz 2b: G1–G7, Albüm ve Stüdyo; seans durum makinesi ve deposu (`docs/mimari.md` → "Seans durum makinesi"); geliştirme adres parametrelerinin son hali; tasarım tutarsızlıklarına 8. ve 9. maddeler; `docs/dinleme-hatti.md` (dinlemesiz seans, elle kip, seslendirmenin geri dönüşü) ve `docs/ekranlar.md` (G1 balonu, G2 karoları, G5 dalga biçimi, G6 yanlış cevap) güncellendi.
- 2026-11-20: Faz 2b sonrası: onay var ama mikrofon yoksa dinlemeden devam (P14); `docs/ekranlar.md`'deki mikrofon sorunu varsayılanı ve yol haritasındaki Faz 3 ve Faz 4 buna göre güncellendi.
- 2026-11-20: Faz 3 planı onaylandı: veli kapısı (P11 kesin), tasarımı olmayan durumların metinleri (D16), D3'te yer tutucu, 9., 11. ve 13. sorular yanıtlandı, tasarım tutarsızlıklarına 10. madde.
