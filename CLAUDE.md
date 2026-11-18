# Tıkır

Türkçe okuyan 7–10 yaş çocuklar için dinleyen okuma koçu. Çocuk kısa bir metni sesli okur; uygulama dinler, takıldığı yerde yardım eder, takıldığı kelimeleri sonraki günlere taşır. Veli haftalık karne görür.

Bu depo web uygulamasıdır: React + TypeScript + Vite. Aynı kod ileride Capacitor ile iOS ve Android'e paketlenecek; o yüzden tarayıcıya özgü her şey bir servis arayüzünün arkasında durur.

## Önce ilgili belgeyi oku

Hepsini her seferinde okuma; yaptığın işe karşılık geleni oku.

| Ne yapıyorsan | Oku |
|---|---|
| Bir faza başlıyorsan | `docs/yol-haritasi.md` içindeki o faz, `docs/kararlar.md` |
| Bir ekran yapıyorsan | `docs/ekranlar.md` içindeki o ekran, `design/ekranlar/<kod>-*.html`, `design/png/<kod>-*.png` (klasörün kullanımı: `design/README.md`) |
| Bileşen ya da stil yazıyorsan | `docs/tasarim-sistemi.md`, `design/tokens.css` |
| Veri, servis, klasör yapısı | `docs/mimari.md` |
| Mikrofon, dinleme, okuma takibi | `docs/dinleme-hatti.md` |
| Bir ürün kuralından emin değilsen | `docs/urun.md` |
| Örnek içerik ya da demo verisiyle çalışıyorsan | `seed/README.md` |

`design/` ve `seed/` başvuru klasörleridir; içlerindeki dosyaları değiştirme.

## Komutlar

Node 26 (`.nvmrc`) ve pnpm 12 (`package.json` → `packageManager`). İlk kurulum: `pnpm install` ve `pnpm exec playwright install chromium webkit`.

- `pnpm dev`: geliştirme sunucusu (`http://localhost:5173`). Geliştirme sayfaları: `/gelistirme/vitrin` (bileşen vitrini) ve `/gelistirme/ses` (ses denemesi).
- `pnpm check`: tip denetimi + lint (ESLint, Stylelint, Prettier denetimi) + birim testleri. Her görevden sonra çalıştır.
- `pnpm test <dosya>`: tek test dosyası; bütün takım yerine bunu tercih et. Araya `--` koyma: `pnpm test -- <dosya>` bütün takımı koşar.
- `pnpm e2e`: Playwright uçtan uca testleri, Chromium ve WebKit'te. `e2e` kipinde derleyip (`dist-e2e/`) `vite preview` ile sınar; yankı sunucusunu da kendisi açar (açıksa onu kullanır). Tek dosya için: `pnpm e2e e2e/<ad>.spec.ts`. Kurulu Google Chrome'da: `E2E_CHROME=1 pnpm e2e e2e/audio-lab.spec.ts --project=chrome`.
- macOS'ta ekran uykudayken WebKit'in tıklamaları hedefini şaşırır (`<html> intercepts pointer events`). Gözetimsiz koşuda ekranı uyandırıp uyanık tut: `caffeinate -u -t 2; caffeinate -d -i pnpm e2e`.
- `pnpm echo-server`: ses denemesinin yankı sunucusu (`127.0.0.1:4318`). `pnpm dev` ve `vite preview`, `/gelistirme/yanki` adresini ona aktarır.
- `pnpm audio-trial`: ses denemesi sayfasını yerel ağda HTTPS ile sunar (`https://<ip>:4443/gelistirme/ses`, mkcert sertifikası) ve yankı sunucusunu açar. Gerçek cihaz adımları: `docs/ses-denemesi-sonuclari.md`.
- `pnpm cap:sync`: `cap` kipinde derler (`dist-cap/`, geliştirme sayfaları dahil) ve `ios/` ile `android/` projelerine kopyalar. Sonra `pnpm exec cap run ios --target <simülatör>` ya da `pnpm exec cap open ios|android`.
- `pnpm shots <rota> [<rota> …]`: rotaların 390 × 844, 1180 × 820 ve 1440 × 900 ekran görüntüsü. Dosyalar `shots/<ad>-telefon.png`, `-tablet.png` ve `-web.png` adlarıyla yazılır; `/` için ad `index`.
- `pnpm build`: üretim derlemesi (tip denetimi + `vite build`). Geliştirme sayfaları derlemeye girmez.
- `pnpm format`: Prettier ile biçimle.

## Kod kuralları

- Kod, tanımlayıcılar, yorumlar ve commit mesajları İngilizce. Arayüz metinleri Türkçe ve yalnız `src/i18n/tr.ts` içinde durur; geliştirme sayfalarının metni `src/features/dev/` içinde (`docs/kararlar.md` T17).
- Arayüz metinlerini tasarım dosyalarından birebir al. Kendin yazma, çevirme, kısaltma.
- Alan terimlerinin kod adları `docs/urun.md` sonundaki sözlükte. Yeni ad uydurma.
- TypeScript `strict`; `any` yok.
- Stil: CSS Modules ve `src/styles/tokens.css` değişkenleri. Renk, yazı boyutu, yarıçap ve gölge için sabit değer yazma. Tasarımda olup `tokens.css` dosyasında olmayan değer, kaynağıyla birlikte `src/styles/tokens-extra.css` dosyasına eklenir; Stylelint denetler. Tailwind, hazır bileşen kiti, CSS-in-JS yok.
- Arayüzde emoji yok. İkonlar `design/svg/ikonlar.json` içindeki çizimlerden gelir.
- Bileşenler mikrofona, ağa ve depolamaya doğrudan dokunmaz; `src/services` altındaki arayüzleri kullanır.
- `src/domain` saf mantıktır: React ve tarayıcı API'si içermez, tamamı birim testlidir.
- Yeni bağımlılık eklemeden önce gerekçesini `docs/kararlar.md` dosyasına yaz. Sürümleri hafızadan yazma; kurulum anındaki güncel kararlı sürümü kullan.

## Türkçe metin

- `<html lang="tr">`.
- Büyük-küçük harf çevirisi yalnız `toLocaleUpperCase('tr-TR')` ve `toLocaleLowerCase('tr-TR')` ile. CSS `text-transform: uppercase` kullanma.
- Okuma metinlerinde `font-variant-ligatures: no-common-ligatures` (fi bitişimi i'nin noktasını yutar).
- Heceleme ve okunabilirlik hesapları `docs/mimari.md` içindeki kurallara ve sınama örneklerine uyar.

## Çocuk ve mahremiyet kuralları

- IMPORTANT: Ses kaydı ve mikrofon dinlemesi yalnız veli onayı kayıtlıyken başlar (`consent.voiceProcessing`) (geliştirme sayfası istisnası: `docs/kararlar.md` T16).
- Çalışma anında üçüncü taraf adrese istek yok: yazı tipleri depoda barındırılır, analitik ve izleme kütüphanesi eklenmez.
- Çocuk ekranlarında puan, rozet, sıralama, başka çocukla kıyas ve olumsuz kıyas yok. Ayrıntı `docs/urun.md` bölüm 4.
- Veli alanı (`/veli/*`) veli kapısının arkasındadır.

## Erişilebilirlik

- Dokunma hedefi en az 44 px. Odak halkası görünür. `prefers-reduced-motion` desteklenir.
- Gerçek `button`, `a`, `input` ve `label` kullan; `div` üzerine tıklama bağlama.
- Metin karşıtlığı en az 4,5:1. `design/tokens.css` renk çiftleri buna göre seçildi; yeni çift uydurma.

## Çalışma biçimi

- Bir faz, bir oturum. Faza başlarken plan çıkar ve onay bekle; onaylanan plan `docs/planlar/faz-<n>.md` içinde durur.
- Tasarımı olmayan bir ekran ya da durumla karşılaşırsan `docs/ekranlar.md` sonundaki varsayılanı uygula ve `// TODO(design)` bırak. Tasarımda olmayan özellik ekleme.
- Çocuğun okuyacağı içeriği (metin, soru, kelime listesi) uydurma. `seed/` içinde yoksa dur ve sor.
- Bir ekranı bitirmeden önce 390, 1180 ve 1440 px genişlikte ekran görüntüsü al, `design/png` içindeki karşılığıyla karşılaştır, farkları listele ve düzelt.
- Bir işi "bitti" diye bildirirken kanıt göster: çalıştırdığın komut ve çıktısı, ekran görüntüsü.
- Küçük, tek amaçlı commit'ler (Conventional Commits). Push ve PR yalnız istenince.
- Bir karar değiştiyse `docs/kararlar.md` dosyasını, bir komut değiştiyse bu dosyayı güncelle.
- When compacting, preserve: the current phase number, the remaining tasks of that phase, the list of modified files and the last failing check.
