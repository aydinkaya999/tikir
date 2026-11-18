# Tasarım klasörü

Tasarım tuvalinden dışa aktarılmış başvuru dosyaları. **Salt okunur:** buradaki dosyaları değiştirme, uygulamadan bunlara bağlantı verme.

| Yol | Ne |
|---|---|
| `ekranlar/*.html` | 19 ekranın üç boyuttaki hali; her biri tek başına açılan bir sayfa (63 dosya) |
| `png/*.png` | Aynı sayfaların ekran görüntüleri |
| `png/ozet/*.png` | Bir ekranın üç boyutu yan yana (hızlı bakış için) |
| `ekranlar.json` | Ekran listesi: kod, ad, cihaz, genişlik, yükseklik, dosya yolları |
| `tokens.css` | Renk, yazı, köşe, gölge ve boşluk değişkenleri. Faz 0'da `src/styles/tokens.css` olarak kopyalanır. |
| `tokens.json` | Aynı değerler ve yazı ayarı kademeleri (`readingSettings`) |
| `svg/` | Tıkır (6 yüz ifadesi), kelime canavarları, çini karolar; `ikonlar.json` içinde 40 ikonun çizimi |

## Dosya adları

`<kod>-<ad>-<cihaz>.html`, örnek: `G4-oku-tablet.html`.

- Kod: `G` günlük seans, `K` ilk kurulum, `U` kitaplık ve kitap üretimi, `V` veli karnesi.
- Cihaz ve tasarım boyutu: `telefon` 390 × 844, `tablet` 1180 × 820, `web` 1440 × 900. `V4` telefonda 1248 px yüksekliktedir (sayfa kayar).
- `@` ile biten adlar aynı ekranın başka bir durumudur: `V4-yazi-ayari-web@okul-buyuk.html`, `V4-yazi-ayari-web@kucuk-kapali.html`.

## Nasıl okunur

- **Düzen, ölçü ve metin için kaynak HTML dosyasıdır.** PNG hızlı bakış ve karşılaştırma içindir. İkisi çelişirse HTML geçerlidir.
- Sayfayı tarayıcıda açıp inceleyebilirsin; aynı boyuttaki ekranlar arasındaki bağlantılar çalışır (G1 → G2 → … → G7).
- Stiller satır içi yazılmıştır. Bu yalnız tasarım aracının çıktı biçimidir; uygulamada aynı görünümü CSS Modules ve `tokens.css` değişkenleriyle kur. Satır içi stil kopyalama.
- Renk ve ölçü değerlerini HTML'den değil `tokens.css` dosyasından al. HTML'de gördüğün her renk orada bir değişkene karşılık gelir.
- Sayfaların başındaki Google Fonts bağlantısı yalnız önizleme içindir. Uygulama yazı tiplerini depodan sunar.
- SVG çizimleri `svg/` klasöründen al; HTML içindeki kopyaları ayıklama.
- Erişilebilirlik adları (`aria-label`) tasarımın parçasıdır; aynen kullan.
- Ekranlardaki sayılar ve adlar örnektir (Deniz, 3. sınıf). Bilinen tutarsızlıklar `docs/kararlar.md` içinde listeli.

## Tasarımda olmayanlar

Basılı ve odaklı durumlar, yükleniyor, boş, hata ve izin durumları çizilmedi. Varsayılanları `docs/ekranlar.md` sonunda ve `docs/tasarim-sistemi.md` içindedir.
