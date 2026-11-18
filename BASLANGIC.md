# Başlangıç

Bu paket, Tıkır'ın web uygulamasını Claude Code'a kodlatmak için gerekenleri içerir. Bu dosya insanlar içindir; Claude Code'un kendi yönergesi `CLAUDE.md` dosyasıdır.

## Pakette ne var

| Yol | Ne | Ne zaman okunur |
|---|---|---|
| `CLAUDE.md` | Claude Code'un her oturumda kendiliğinden yüklediği kısa yönerge: kurallar, komutlar, hangi işte hangi belgenin okunacağı | Her oturum |
| `docs/yol-haritasi.md` | Sekiz faz; her fazın kapsamı ve kabul ölçütleri | Faz başında |
| `docs/kararlar.md` | Kesinleşenler, varsayımlar, açık konular ve senin yanıtlaman gereken sorular | Faz başında |
| `docs/urun.md` | Ürün kuralları, ölçü formülleri, sözlük | Gerektiğinde |
| `docs/ekranlar.md` | 19 ekranın rotası, durumları, kuralları; tasarımı olmayan durumların varsayılanları | Ekran yaparken |
| `docs/tasarim-sistemi.md` | Renk, yazı, biçim, bileşen envanteri, kabuklar | Bileşen yaparken |
| `docs/mimari.md` | Teknoloji seçimi, klasör yapısı, veri tipleri, servis arayüzleri, Türkçe metin kuralları | Kod yapısında |
| `docs/dinleme-hatti.md` | Mikrofon katmanı, dinleyici sözleşmesi, sahte dinleyici, ses denemesi | Faz 1, 2 ve 6 |
| `design/` | Tasarımın dışa aktarımı: 63 sayfa, ekran görüntüleri, renk ve ölçü değerleri, çizimler | Ekran yaparken |
| `seed/` | Örnek içerik: seri kitabın 5 bölümü, ölçüm metinleri, örnek kitaplar, demo profili | Faz 2'den başlayarak |
| `.claude/skills/faz` | `/faz 2` komutu: bir fazı plan, uygulama ve kanıtla yürütür | Sen çağırırsın |
| `.claude/skills/ekran` | `/ekran G4` komutu: tek ekranı kurar ya da tasarımla karşılaştırıp düzeltir | Sen çağırırsın |

## Bir kerelik hazırlık

1. Bilgisayarda Git, Node.js (güncel LTS) ve pnpm olsun. Claude Code kurulu değilse: https://code.claude.com/docs/en/quickstart
2. Paketi boş bir klasöre aç. `.claude` klasörü gizlidir; kopyalarken geride kalmasın.
3. Depoyu başlat:

   ```bash
   git init
   git add -A
   git commit -m "chore: add starter kit"
   ```

4. `docs/kararlar.md` sonundaki "Ürün sahibinin yanıtlaması gerekenler" listesine bak. İlk oturumdan önce önemli olan tek madde birincisidir (React ve TypeScript). Değiştireceğin karar varsa dosyada düzeltip commit et.

## İlk oturum: Faz 0

1. Klasörde `claude` yaz.
2. `/context` yaz: "Memory files" altında `CLAUDE.md` görünmeli. `/` yazınca listede `faz` ve `ekran` görünmeli.
3. Şu istemi yapıştır:

   ```text
   Bu depoda Tıkır adlı web uygulamasını kuracağız. Depoda henüz kod yok; belgeler, tasarımın dışa aktarımı ve örnek içerik var.

   Önce şunları oku: CLAUDE.md, docs/yol-haritasi.md içindeki Faz 0, docs/kararlar.md, docs/mimari.md, docs/tasarim-sistemi.md, design/README.md. Tasarımı tanımak için design/png/ozet/ içinden G1-yol, G4-oku, K1-veli-hesabi, U3-kartlarla-kitap ve V1-ozet görüntülerine bak.

   Sonra Faz 0 için bir plan yaz ve onayımı bekle. Planda şunlar olsun:
   - sırayla görevler; her biri tek commit büyüklüğünde ve nasıl doğrulanacağıyla birlikte
   - kuracağın bağımlılıklar ve gerekçeleri
   - oluşacak klasör yapısı
   - belgelerde çelişen, eksik ya da belirsiz gördüğün yerler ve her biri için önerin

   Onayladığım planı docs/planlar/faz-0.md dosyasına işaret kutulu görev listesi olarak yaz. Sonra görev görev uygula: her görevden sonra pnpm check çalıştır, geçince commit at ve görevi işaretle. Faz 0'ın kapsamı dışına çıkma; ekranların içini doldurma.

   Bitince Faz 0'ın yedi kabul ölçütünü tek tek yürü ve her biri için kanıt göster: çalıştırdığın komut ve çıktısı ya da ekran görüntüsünün yolu. Tutmayan ya da doğrulayamadığın ölçütü "tuttu" diye yazma.
   ```

   Kısa yol: aynı işi `/faz 0` komutu da yapar. İlk oturumda uzun istemi öneririm; ne istediğini açıkça görürsün.

4. Planı oku. Bağımlılık listesi ve "belirsiz gördüğüm yerler" bölümü en çok dikkat isteyen kısımdır. Düzeltmek istediğini söyle, sonra onayla.
5. Faz bitince kanıtları oku, sonra kendin bak: `pnpm dev` çalıştır, `/gelistirme/vitrin` sayfasını telefon, tablet ve geniş ekran boyutlarında aç.

## Sonraki oturumlar

Her faz yeni bir oturumdur: `/clear` yaz ya da `claude` komutunu yeniden başlat, sonra fazın komutunu ver.

| Komut | Bitince elinde ne olur | İnsan işi |
|---|---|---|
| `/faz 0` | İskelet, bütün bileşenler, vitrin sayfası, boş rotalar | Vitrine bak |
| `/faz 1` | Ses deneme sayfası | Gerçek cihazlarda dene: iPhone Safari, Android Chrome ve mümkünse Capacitor kabuğu. Yolun asıl riski burada ölçülür. |
| `/faz 2` | Günlük seans (G1–G7), sahte dinleyiciyle baştan sona | Akışı bir çocukla dene; dinleyiciyi klavyeden sen oynat |
| `/faz 3` | İlk kurulum, veli kapısı, yazı ayarı | Onay metnini hukukçuya göster |
| `/faz 4` | Veli karnesi ve haftalık ölçüm | Sayıları örnek veriyle karşılaştır |
| `/faz 5` | Kitaplık ve kitap üretimi (sahte üretici) | Arka uçsuz, tamamı tıklanabilir ürün: ilk kullanıcı denemeleri |
| Faz 6, 7 | Arka uç, gerçek dinleme, mağaza paketleri | Önce ayrı tasarım belgesi gerekir |

Faz 2 büyüktür; plan onu iki oturuma böler (2a ve 2b). İkinci oturumda `/faz 2 2b ile devam et` yaz. Yarıda kalan her faz böyle sürer: plan `docs/planlar/` altında durur, komut kaldığı görevden devam eder.

Tek bir ekranı düzeltmek ya da tasarımla yeniden karşılaştırmak için: `/ekran G4`.

## İşe yarayan alışkanlıklar

- **Önce plan.** `Shift+Tab` ile plan moduna geçersen Claude dosyaları okur ama değiştirmez. Planı beğenmeden uygulamaya geçirme.
- **Kanıt iste.** "Bitti" sözüne değil komut çıktısına ve ekran görüntüsüne bak. Kabul ölçütleri bunun için yazıldı.
- **İki düzeltmede olmadıysa baştan.** Aynı konuyu iki kez düzelttiysen `/clear` yaz ve öğrendiğini katarak yeniden iste.
- **Geri al.** `Esc` iki kez ya da `/rewind` konuşmayı ve dosyaları önceki bir noktaya döndürür.
- **Kaldığın yerden.** `claude --continue` son oturumu açar.
- **İkinci göz.** Faz kapanırken şunu ekleyebilirsin: "Bir alt ajanla bu fazın farkını docs/yol-haritasi.md içindeki kabul ölçütlerine göre denetlet; yalnız ölçütü etkileyen eksikleri bildir."
- **Belgeler canlıdır.** Bir karar değişince `docs/kararlar.md` ve ilgili belge birlikte güncellenir. Claude aynı hatayı yineliyorsa kuralı `CLAUDE.md` içine tek satırla ekle; dosyayı kısa tut.

## Bulutta çalıştırmak istersen

Depoyu GitHub'a gönder ve claude.ai/code üzerinden ya da terminalden `claude --cloud "..."` ile bir bulut oturumu başlat. Oturum depoyu GitHub'dan klonlar; yerelde kalan commit'leri görmez, o yüzden önce push et. Faz 1'in cihaz denemeleri ve Capacitor işleri yerel makine ister.

## Pakette bilerek yapılan varsayımlar

Soru sormadan ilerlemek için seçtiklerim. Hepsi `docs/kararlar.md` içinde, durumlarıyla birlikte:

- Ön yüz React + TypeScript + Vite; stil CSS Modules.
- İlk altı faz (0–5) arka uçsuz; veri cihazda durur, dinleme sahte dinleyiciyle yapılır.
- Arka uç geldiğinde Python + FastAPI + PostgreSQL.
- Konuşma tanıma sağlayıcısı seçilmedi; ölçümle seçilecek.
- Okul harfleri için yazı tipi seçilmedi; yer tutucu var.
- Hesap başına tek okuyucu.
- Bölümler, ölçüm metinleri ve örnek kitaplar örnek içeriktir; yayından önce bir editörün ve bir sınıf öğretmeninin elinden geçmeli.
