# Tasarım sistemi

Yön: **çini macera**. İznik çinisinden alınmış lacivert, kobalt, turkuaz, safran ve mercan; her yüzeyde kalın lacivert kontur; karoların altında "çini kalınlığı" veren sert, bulanıksız gölge. Yumuşak gölge, degrade ve emoji yok.

Kaynaklar:

- Değerler: `design/tokens.css` (CSS değişkenleri) ve `design/tokens.json`. Faz 0'da `src/styles/tokens.css` olarak kopyalanır.
- Görünüm: `design/ekranlar/*.html` (tarayıcıda açılır, bağlantılar çalışır) ve `design/png/*.png`.
- Çizimler: `design/svg/`.

HTML dosyaları satır içi stille yazılmıştır; bu yalnız tasarım aracının biçimidir. Uygulamada aynı görünümü CSS Modules ve değişkenlerle kur.

## Renkler

| Değişken | Değer | Kullanım |
|---|---|---|
| `--color-ink` | #13235B | metin, kontur, sert gölge |
| `--color-cobalt` | #2347C5 | ana eylem, hayalet çerçevesi, grafik çizgisi |
| `--color-cobalt-light` | #DDE5FB | bilgi ve öneri kartı zemini |
| `--color-turquoise` | #19B5B0 | Tıkır, dinleme, tamamlanan adım, açık anahtar |
| `--color-turquoise-light` | #D3F3F1 | Tıkır'ın karnı, açık zeminler |
| `--color-turquoise-dark` | #0A6B68 | turkuaz üzerine metin gerektiğinde |
| `--color-saffron` | #FFC233 | o anki kelime, seçili durum, bugünün karosu |
| `--color-saffron-light` | #FFF0C2 | açık vurgu zemini |
| `--color-coral` | #F0563A | canavarlar, kayıt |
| `--color-coral-light` | #FFE0D9 | açık mercan zemin |
| `--color-coral-dark` | #B2311B | hata alt çizgisi, uyarı metni |
| `--color-white` | #FFFFFF | kart zemini |
| `--color-ground` | #EDF3FA | sayfa zemini |
| `--color-line` | #C5D2E8 | ince ayraç, kilitli kenarlık |
| `--color-muted` | #465383 | ikincil metin, henüz okunmamış kelime |
| `--color-hesitation` | #B97A00 | duraksama alt çizgisi |

Metin yalnız şu çiftlerle yazılır (hepsi en az 4,5:1): lacivert ya da soluk metin → beyaz, zemin, safran, açık kobalt; beyaz metin → kobalt, lacivert, koyu mercan.

## Yazı

- Tek aile: **Atkinson Hyperlegible Next**, ağırlıklar 400–800. Başlık, arayüz ve varsayılan okuma metni aynı ailedir.
- Okul harfleri seçeneği için ikinci aile (yer tutucu: Didact Gothic). Yalnız okuma metninde ve Yazı ayarı ekranındaki örnekte kullanılır.
- Yazı tipleri depoda barındırılır (`@fontsource-variable/atkinson-hyperlegible-next`, `latin` ve `latin-ext` alt kümeleri). Google Fonts bağlantısı kullanılmaz; `design/ekranlar` içindeki bağlantı yalnız önizleme içindir.

| Rol | Telefon | Tablet | Web | Ağırlık |
|---|---|---|---|---|
| Sayfa başlığı (`--size-h1`) | 27 | 34 | 34 | 800 |
| Bölüm başlığı (`--size-h2`) | 20 | 23 | 22 | 800 |
| Gövde (`--size-body`) | 16 | 18 | 17 | 500 |
| Küçük (`--size-small`) | 14 | 15 | 14 | 600–700 |
| Okuma metni (`--size-reading`) | 22 | 27 | 25 | 400 |

Satır aralığı: arayüz 1,35; gövde 1,45; okuma metni 1,75; anlam üniteli görünüm 1,85.

## Okuma metni

Bu uygulamanın en önemli bileşeni. Kurallar:

- Okuma metninin yazı tipi, boyutu ve harf aralığı çocuğun yazı ayarından gelir. Kapsayıcıya şu değişkenleri ver, metin onları kullansın: `--reading-font`, `--reading-size`, `--reading-letter-spacing`, `--reading-word-spacing`.
- Her kelime ayrı bir `span`. Durum stilleri:

| Durum | Stil |
|---|---|
| okunmuş | renk lacivert |
| okunmamış | renk soluk (`--color-muted`) |
| o anki kelime | zemin safran, `box-shadow: 0 0 0 4px` safran, köşe 3 px, ağırlık 600 |
| hayaletin kelimesi | `outline: 2.5px dashed` kobalt, `outline-offset: 4px`, köşe 4 px |
| duraksama | `text-decoration: underline dotted` `--color-hesitation`, kalınlık 3 px, uzaklık 6 px |
| hata | `text-decoration: underline wavy` `--color-coral-dark`, kalınlık 2 px, uzaklık 6 px |

- **Vurgu satırı kaydırmamalı.** O anki kelimenin kalınlaşması genişliğini değiştirir ve satır sonlarını oynatır. Her kelime, 600 ağırlıktaki halinin genişliğini baştan ayırsın (örneğin görünmez bir kalın kopya ile). Vurgu ilerlerken tek bir kelime bile yer değiştirmemeli; bunun için bir Playwright testi yaz.
- Durum yalnız renkle anlatılmaz: duraksama ve hata alt çizgi biçimiyle de ayrılır.
- `text-wrap: pretty`, `font-variant-ligatures: no-common-ligatures`, heceleme (`hyphens`) kapalı.
- **Anlam üniteli görünüm (G3):** üniteler arasında 2 px genişlikte, 0,85 em yükseklikte, `--color-line` renginde ince dikey çizgi (yatay boşluk 9 px). O anki ünite safran zeminli (`box-shadow: 0 0 0 5px`).

## Biçim değerleri

- Kontur: `2.5px solid` lacivert (etiketlerde 2 px).
- Köşe: karo 12, bölmeli denetim 14, düğme 16, balon 18, kart 20, sayfa kartı 22, etiket tam yuvarlak.
- Sert gölge ("çini kalınlığı"): karo `0 3px 0`, düğme `0 4px 0`, kart `0 5px 0`, sayfa kartı `0 6px 0`; hepsi lacivert, bulanıklık yok.
- Basılı durum (tasarımda çizilmedi): öğe 2 px aşağı iner, gölgesi 2 px kısalır.
- Odak halkası (tasarımda çizilmedi): `outline: 3px solid` kobalt, `outline-offset: 2px`.

## Bileşenler

Ölçülerin tamamı HTML dosyalarındadır; aşağıdaki liste envanter ve adlandırmadır. Önce bunları `/gelistirme/vitrin` sayfasında kur.

| Bileşen | Özet | Görüldüğü yer |
|---|---|---|
| `Button` | Türler: `primary` (kobalt), `saffron`, `secondary` (beyaz), `dark`, `danger` (koyu mercan). Yükseklik 52, büyük 60. İkonlu, tam genişlik seçenekleri | her yerde |
| `IconButton` | Yuvarlak, 52 px; mikrofon düğmesi daha büyük | seans denetimleri |
| `MicButton` | Durumlar: dinliyor, duraklatıldı, izin yok. `aria-label` duruma göre değişir | G2, G4, K3 |
| `Chip` | Tam yuvarlak etiket, isteğe bağlı ikon | G1, G4, V1 |
| `Card` | Beyaz ya da açık kobalt zemin; gölgeli ve gölgesiz | her yerde |
| `PageCard` | Okuma sayfası: üstte kitap adı ve sayfa sayacı | G3, G4, V4 |
| `SpeechBubble` | Tıkır'ın balonu; ok solda ya da üstte | seans, kurulum |
| `Companion` | Tıkır; yüz ifadeleri: `normal`, `listen`, `talk`, `happy`, `sleep`, `think` | seans, kurulum |
| `Monster` | Kelime canavarı; iki tür, `wild` (mercan) ve `tamed` (safran) | G2, G7, V2 |
| `Tile` | Çini karo; `done`, `today`, `locked` | G1, kurulum panosu |
| `StepTiles` | Seansın beş adım göstergesi | seans kabuğu |
| `RaceBar` | Hayalet yarışı çubuğu | G4 |
| `SegmentedControl` | Bölmeli seçim; seçili bölme safran | U2, V4 |
| `OptionCard` | Büyük seçim kartı; seçili olan safran ve gölgeli | K2, U3, V4 |
| `Switch` | 62 × 34 ray, 23 px düğme; açıkken turkuaz | V4 |
| `Checkbox`, `TextField`, `TextArea` | Form öğeleri | K1, U2 |
| `StatCard` | Büyük sayı ve açıklaması | G7, K4, V1, V3 |
| `LineChart` | Altı haftalık çizgi; hedef ve sınıf ortalaması çizgileri | K4, V1 |
| `ProgressBar` | İnce ilerleme çubuğu | U1 |
| `BookCover` | Çini desenli kapak | U1, U4 |

İkonlar: 24 × 24, yalnız çizgi, kalınlık 2,2, yuvarlak uç; renk `currentColor`. Çizimler `design/svg/ikonlar.json`.

## Kabuklar ve kırılma noktaları

| Genişlik | Düzen | Gezinme |
|---|---|---|
| 700 px altı | Tek sütun | Altta çubuk |
| 700–1199 px | İki bölmeli | Solda 104 px ray |
| 1200 px ve üstü | Kenar çubuklu, içerik en çok 1280 px | Solda 248–272 px kenar çubuğu |

Tasarım boyutları: telefon 390 × 844, tablet 1180 × 820, web 1440 × 900.

- **Çocuk kabuğu:** Yol, Kitaplık, Albüm, Stüdyo. Webde kenar çubuğunun altında kilit ikonlu "Veli alanı".
- **Seans kabuğu:** gezinme yok; kapat, adım karoları, sayaç, Tıkır, denetim çubuğu.
- **Odak kabuğu:** geri düğmesi ve başlık (U3, U4).
- **Kurulum kabuğu:** ilerleme göstergesi; geniş ekranda solda kobalt pano.
- **Veli kabuğu:** lacivert üst şerit, beş öğeli gezinme. Çocuk ekranlarından sakin: karo deseni ve Tıkır yok.

Ek kurallar:

- İki bölmeli düzenler içerik genişliği 720 px altına inerse alt alta dizilir.
- Güvenli alan boşluklarını kullan: `env(safe-area-inset-*)` (Capacitor için şart).
- Telefonda sabit alt çubuklu ekranlarda içerik çubuğun altında kalmaz.

## Hareket

Tasarımda hareket tanımlanmadı. Varsayılan: azı karar.

- O anki kelime vurgusu geçişsiz yer değiştirir; gecikme okumayı böler.
- Tıkır'ın yüz ifadesi 150 ms içinde değişir.
- Düğme basılışı 80 ms.
- `prefers-reduced-motion` açıkken hiçbir geçiş çalışmaz.

## Erişilebilirlik

- Tıkır'ın yardım balonu `aria-live="polite"` bölgesidir.
- Mikrofon düğmesinin adı durumu söyler: "Dinliyor. Duraklatmak için dokun".
- Grafiklerin metin karşılığı vardır (V1 tasarımındaki `aria-label` örnektir).
- Seçim denetimleri `aria-pressed` ya da gerçek `radio` kullanır.

## Yapma

- Degrade, bulanık gölge, cam efekti.
- Emoji ve hazır ikon kütüphanesi.
- Tamamı büyük harf etiket; `text-transform: uppercase`.
- Başlığın tek kelimesini farklı renge boyamak.
- İkinci bir yazı ailesini başlıklarda kullanmak (Besley bilerek kaldırıldı: "fi" bitişimi i'nin noktasını yutuyordu).
