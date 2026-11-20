# Yol haritası

Her faz bir Claude Code oturumudur (büyükse ikiye bölünür). Faz, kabul ölçütlerinin **hepsi kanıtla** tutunca biter. Sırayı değiştirme: her faz bir öncekinin üstüne kurulur.

| Faz | Konu | Arka uç gerekir mi |
|---|---|---|
| 0 | İskelet ve tasarım sistemi | Hayır |
| 1 | Ses denemesi | Hayır (yerel yankı betiği) |
| 2 | Günlük seans | Hayır |
| 3 | İlk kurulum, veli kapısı, yazı ayarı | Hayır |
| 4 | Veli karnesi ve haftalık ölçüm | Hayır |
| 5 | Kitaplık ve kitap üretimi | Hayır (sahte üretici) |
| 6 | Arka uç ve gerçek dinleme | Evet |
| 7 | PWA ve mağaza paketleme | Evet |

Faz 5'in sonunda elde, arka uçsuz, tamamı tıklanabilir ve sahte dinleyiciyle çalışan bir ürün olur. Gerçek çocuklarla ilk denemeler bu sürümle, dinleyiciyi bir yetişkinin elle oynamasıyla yapılabilir.

---

## Faz 0: İskelet ve tasarım sistemi

**Oku:** `docs/mimari.md`, `docs/tasarim-sistemi.md`, `design/README.md`.

**Kapsam**

- Proje kurulumu: Vite, React, TypeScript strict, pnpm, ESLint, Prettier, Vitest, Testing Library, Playwright. `pnpm check` betiği.
- `pnpm shots <rota>`: verilen rotanın 390 × 844, 1180 × 820 ve 1440 × 900 ekran görüntülerini `shots/` klasörüne yazan Playwright betiği (klasör `.gitignore` içinde). Tasarımla karşılaştırma bununla yapılır.
- `src/styles`: `design/tokens.css` kopyası, depoda barındırılan yazı tipleri, genel stiller, `<html lang="tr">`.
- `docs/tasarim-sistemi.md` envanterindeki bütün bileşenler ve `/gelistirme/vitrin` sayfası (her bileşen, her durumuyla).
- Okuma metni bileşeni (`ReadingText`, `PhraseText`) bütün kelime durumlarıyla.
- Beş kabuk, üç kırılma noktasında.
- `docs/ekranlar.md` içindeki bütün rotalar, içi boş sayfalar olarak.
- `src/domain/text.ts` ve `readability.ts` (heceleme, kelimeye ayırma, Ateşman) ve testleri.
- `src/i18n/tr.ts` iskeleti.

**Kapsam dışı:** ekranların içeriği, servisler, depolama.

**Kabul ölçütleri**

1. `pnpm check`, `pnpm build` ve `pnpm e2e` hatasız geçer.
2. Vitrin sayfası envanterdeki her bileşeni gösterir; 390, 1180 ve 1440 px genişlikte taşma yoktur.
3. Kabuklar üç genişlikte tasarımla aynı düzeni verir: G1 (çocuk), G4 (seans), U3 (odak), K1 (kurulum), V1 (veli) ekranlarının kabuk kısımları karşılaştırıldı ve farklar listelendi.
4. Okuma metninde vurgu ilerlerken hiçbir kelimenin konumu değişmez (Playwright testi var).
5. `docs/mimari.md` içindeki heceleme ve Ateşman sınama örneklerinin hepsi birim testi olarak geçer.
6. Sayfa yüklenirken ve gezinirken kendi kökeni dışına hiçbir ağ isteği çıkmaz (Playwright testi var).
7. `CLAUDE.md` içindeki komutlar bölümü gerçek komutlarla güncel.

---

## Faz 1: Ses denemesi

**Oku:** `docs/dinleme-hatti.md` bölüm 1 ve 5.

**Kapsam**

- `AudioCapture` arayüzü ve `WebAudioCapture`.
- `/gelistirme/ses` sayfası: izin, düzey göstergesi, 10 saniye kaydet ve çal, yankı gecikmesi ölçümü, cihaz raporu.
- `scripts/echo-server`: çerçeveleri geri gönderen yerel WebSocket betiği.
- `docs/ses-denemesi-sonuclari.md` şablonu.
- İkinci yarı (macOS ve Xcode ya da Android Studio varsa): asgari Capacitor yapılandırması ve aynı sayfanın uygulama kabuğunda çalıştırılması.

**Kapsam dışı:** konuşma tanıma, seans ekranları.

**Kabul ölçütleri**

1. Örnekleme hızı dönüştürücü ve çerçeveleyici birim testleri geçer.
2. Masaüstü Chrome'da sayfa uçtan uca çalışır: izin, düzey, kayıt, geri çalma, yankı ölçümü, rapor indirme.
3. İzin reddi ve mikrofonsuz cihaz durumları çökmeden, açıklamasıyla gösterilir.
4. Sayfadan çıkınca ve sekme gizlenince mikrofon bırakılır.
5. Gerçek cihaz denemeleri için adım adım yönerge sonuç şablonunda yazılı. Bu denemeleri insan yapar; yapılmadan "tuttu" denmez.
6. İkinci yarı yapıldıysa: uygulama kabuğunda alınan ses boş değil (düzey göstergesi ve geri çalma ile doğrulandı) ve sonuç şablona işlendi.

---

## Faz 2: Günlük seans

**Oku:** `docs/urun.md`, `docs/ekranlar.md` → "Günlük seans", `docs/dinleme-hatti.md` bölüm 2 ve 3, `docs/mimari.md`.

Büyük bir fazdır. Planı iki oturuma böl: **2a** alan mantığı, servisler ve okuma bileşenleri; **2b** ekranlar ve akış.

**Kapsam**

- `src/domain`: `scoring`, `stuckWords`, `ghost`, `goals` ve testleri.
- Servisler: `Repository` (IndexedDB, `seed/` ile dolar), `FakeListener` (dört hazır senaryo ve elle kip), `Narrator`, `Recorder`.
- Seans durum makinesi ve G1–G7 ekranları.
- Demo profili yükleyicisi ve geliştirme adres parametreleri (`docs/mimari.md` → "Depolama ve örnek veri"); profil yoksa `cocuk-sabahi` kipi kendiliğinden yüklenir. `pnpm shots` bu parametrelerle her seans adımının görüntüsünü alabilir.
- Tasarımı olmayan durumlar: mikrofon izni reddi, seanstan çıkış onayı, bugün bitti durumu, Albüm ve Stüdyo asgari ekranları.

**Kapsam dışı:** kurulum akışı (profil `seed/demo-profil.json` ile gelir), veli ekranları, kitap üretimi.

**Kabul ölçütleri**

1. Uçtan uca test: `cocuk-sabahi` kipinde, `typical` senaryosuyla G1'den G7'ye bir seans tamamlanır. G1, G2 ve G7, `seed/demo-profil.json` → `expected` içindeki değerleri gösterir.
2. `design` senaryosunda G4 ekran görüntüsü tasarımdaki anı gösterir (duraksama, hata, hayalet ve o anki kelime aynı kelimelerde).
3. 3 saniyelik duraksamada yardım balonu açılır, kelime hecelenmiş görünür ve seslendirilir; kelime `helped` olarak kaydedilir.
4. Üçüncü okuma kaydedilir, G5'te dinlenir, "Baştan kaydet" yeni kayıt alır.
5. Sayfa yenilenince seans kaldığı adımdan sürer.
6. Seans bitince sonuçlar depodadır, takılınan kelimeler karta dönüşmüştür, G1 "bugün bitti" durumundadır.
7. Tarih bir gün ileri alınınca (test saatiyle) sıradaki bölüm açılır, ısınmada dünün kelimeleri gelir ve G4'te "dün" imleci görünür.
8. Veli onayı kapalıyken mikrofon hiçbir adımda açılmaz (test var).
9. Çocuğa gösterilen hiçbir metinde olumsuz fark yoktur: gerideyken sayı görünmez, G7'deki fark yalnız artıysa çıkar (test var).
10. G1–G7'nin her biri üç genişlikte tasarımla karşılaştırıldı; farklar listelendi.

---

## Faz 3: İlk kurulum, veli kapısı, yazı ayarı

**Oku:** `docs/ekranlar.md` → "İlk kurulum" ve V4, `docs/urun.md` bölüm 7 ve 8.

**Kapsam**

- K1–K4 akışı; hesap ve profil depoya yazılır.
- Yönlendirme korumaları (profil yoksa kuruluma).
- Veli kapısı.
- V4 Yazı ayarı ve `readingStyle` alan mantığı; ayarın bütün okuma metinlerine uygulanması.
- Onay varken mikrofon kullanılamayınca seansın dinlemeden sürmesi (`docs/kararlar.md` P14). Öneri: mikrofon izni kurulumda, veli yanındayken istenir; plan aşamasında kesinleşir.

**Kabul ölçütleri**

1. Boş depoyla açılan uygulama kuruluma yönlenir; K1'den K4'e akış tamamlanınca G1 açılır.
2. Ses onayı kutusu varsayılan olarak işaretsizdir. Onaysız tamamlanan kurulumda K3 atlanır ve seansta mikrofon açılmaz.
3. K3'te 1 dakikalık okuma `FakeListener` ile, süreli senaryoyla ve `seed/olcum-metinleri.json` içindeki sınıf metniyle yapılır; K4'teki sayılar `scoring` ve `goals` hesabından gelir (58 doğru kelime için ilk hedef 70).
4. Sınıfa göre varsayılan yazı tipi doğru atanır (1–2. sınıf okul harfleri, 3–4. sınıf net harfler).
5. V4'te yapılan seçim önizlemeye anında yansır; aynı ayar G3, G4 ve K3 metinlerinde görünür (uçtan uca test).
6. V4 önizleme kutusunun yüksekliği dört boyut ve üç aralık kademesinde değişmez; altındaki denetimler yer değiştirmez.
7. Veli kapısı geçilmeden `/veli/*` açılmaz; üç yanlışta bekletir.
8. K1–K4 ve V4 (üç durumuyla) tasarımla karşılaştırıldı.
9. Onay varken mikrofon kullanılamıyorsa çocuk "Yeniden dene"den sonra "Bugün dinlemeden oku" ile seansı G7'ye kadar bitirir ve gün tamamlanmış sayılır (P14; uçtan uca test).

---

## Faz 4: Veli karnesi ve haftalık ölçüm

**Oku:** `docs/ekranlar.md` → "Veli karnesi", `docs/urun.md` bölüm 2.

**Kapsam**

- V1–V3, gerçek seans ve ölçüm verisinden.
- Haftalık ölçüm akışı (çocuk tarafı, K3 kalıbı). Ölçerek seçme açıksa iki ayar arka arkaya.
- "Hedefi güncelle", "Isınmaya ekle", onay bekleyen kayıtlar listesi, hesap ve veri silme sayfası.
- Karnede dinlenmeden okunan günler (`docs/kararlar.md` P14).

**Kabul ölçütleri**

1. Demo profilinin `veli-haftasonu` kipinde V1–V4, `seed/demo-profil.json` → `expected` içindeki değerleri gösterir (test var). Tasarımdan bilinen farklar: doğruluk formülle %93 çıkar, tarihler bugüne göre kayar.
2. Grafik hedef çizgisini ve sınıf ortalamasını çizer; 1. ve 2. sınıfta ortalama çizgisi yoktur.
3. Haftalık yorum cümlesi en az üç durumda doğru seçilir: hedef geçildi, hedefe yaklaşıyor, bu hafta ölçüm yok.
4. Ölçüm akışı sonucu `Assessment` olarak kaydeder ve V3'te görünür.
5. Ölçerek seçme: dört ölçümden önce öneri yoktur; fark 5 kelimeden azsa "fark küçük" denir (birim testi var).
6. Veli bir kaydı silebilir; silinen kayıt depodan gerçekten kalkar (test var).
7. Veri yokken her ekranın boş durumu görünür.
8. V1–V3 üç genişlikte tasarımla karşılaştırıldı.

---

## Faz 5: Kitaplık ve kitap üretimi

**Oku:** `docs/ekranlar.md` → "Kitaplık ve kitap üretimi", `docs/urun.md` bölüm 6.

**Kapsam**

- U1–U4.
- `MockBookGenerator` (`docs/mimari.md`): kartlardan `seed/ornek-kitaplar.json` içindeki örnek kitap; veli metninden gerçek bölme (sayfa, cümle) ve gerçek seviye denetimi.
- Üretilen kitabın okuma akışına girmesi.

**Kabul ölçütleri**

1. U3'te üç seçim yapılmadan düğme pasiftir; Tıkır'ın özeti seçime göre değişir. Tasarımdaki seçim, tasarımdaki cümleyi ve başlığı birebir verir.
2. U2'de yapıştırılan metin için kelime sayacı canlıdır; üretim sonunda U4'teki hece ve kelime ortalamaları `levelCheck` çıktısıdır.
3. Sınıf eşiğini aşan metin için U4 uyarı gösterir.
4. U4'ten "Okumaya başla" günün seansını o kitapla başlatır (günü gelen kart varsa önce ısınma) ve akış G7'ye kadar çalışır.
5. Çocuk tarafında hiçbir serbest metin kutusu yoktur.
6. U1–U4 üç genişlikte tasarımla karşılaştırıldı.

---

## Faz 6: Arka uç ve gerçek dinleme

Bu faz ayrı bir tasarım belgesiyle başlar; burada yalnız sırası yazılı.

1. Değerlendirme düzeneği (`docs/dinleme-hatti.md` bölüm 4) ve kayıt toplama.
2. Aday dinleyicilerin ölçümü ve karar.
3. Arka uç iskeleti (FastAPI, PostgreSQL), hesap ve oturum, `HttpRepository`.
4. `RemoteListener`.
5. Kitap üretimi ve seslendirme.

Ön yüzde beklenen değişiklik: `src/app/services.ts` içinde uygulama seçimi ve yeni uygulama sınıfları. Ekranlara dokunmak gerekiyorsa arayüz tasarımı eksiktir; önce arayüzü düzelt.

---

## Faz 7: PWA ve mağaza paketleme

- PWA: bildirim dosyası, ikonlar, çevrimdışı kabuk, ana ekrana ekleme.
- Capacitor: iOS ve Android projeleri, güvenli alanlar, izin metinleri, uygulama simgesi ve açılış ekranı.
- Mağaza denetimi: veli kapısı, üçüncü taraf istek yok, veri silme yolu, çocuk kategorisi gereklilikleri, ödeme kuralları.
- Faz 1'de yerel ses eklentisi gerektiği ortaya çıktıysa burada sağlamlaştırılır.
