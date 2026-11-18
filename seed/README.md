# Örnek içerik

Uygulamanın arka uç gelene kadar kullandığı içerik ve tasarımlardaki örnek kullanıcının verisi. **Salt okunur:** içerik eksikse ya da yanlışsa uydurma, düzeltme; `docs/kararlar.md` içindeki C maddelerine göre dur ve sor.

| Dosya | Ne | Kullanan |
|---|---|---|
| `kayip-fenerin-izinde.json` | Seri kitabın ilk 5 bölümü: sayfalar, anlam üniteleri, 2 soru, büyüyen kelime zincirleri, seviye sayıları | Faz 2 |
| `olcum-metinleri.json` | 1 dakikalık okuma metinleri (1–4. sınıf) | Faz 3 (K3), Faz 4 (haftalık ölçüm) |
| `ornek-kitaplar.json` | U3 kartları ve cümle parçaları; sahte üreticinin döndürdüğü kitap; velinin eklediği örnek kitap | Faz 5, demo profili |
| `demo-profil.json` | Örnek kullanıcı Deniz: iki kip, zaman çizelgesi, beklenen ekran değerleri | Faz 2'den başlayarak |

## Biçim notları

- Kitap sayfalarında cümleler düz metindir; ` | ` işareti anlam ünitesi sınırıdır ve ekranda gösterilmez. Yüklerken `Sentence` dizisine çevir (`docs/mimari.md`).
- Soruların doğru yanıtı her zaman ilk seçenektir (`correctIndex: 0`); seçenekler ekranda karıştırılır.
- `stats` alanları başvuru hesabının çıktısıdır: `levelCheck` aynı sayıları vermelidir (ortalamalar iki, Ateşman puanı bir ondalığa yuvarlanmış). Cümle sayısı, dizideki cümle sayısıdır.
- `demo-profil.json` içindeki günler görelidir, okumalar sahte dinleyici senaryosu biçimindedir; yükleme kuralı `docs/mimari.md` → "Depolama ve örnek veri". `word` alanları yalnız okuyana yardım içindir, `index` geçerlidir. `stuckWords` kayıtlarında hece ve zincir yoktur: heceleri hesapla, zinciri kitapların `chains` alanından al.

Bütün metinler örnektir; yayından önce bir editörün ve bir sınıf öğretmeninin elinden geçecektir.
