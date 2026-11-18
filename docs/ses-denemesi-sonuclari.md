# Ses denemesi sonuçları

Faz 1'in gerçek cihaz denemeleri (`docs/yol-haritasi.md` → Faz 1, `docs/dinleme-hatti.md` bölüm 5). Bu dosya hem yönergedir hem de sonuçların yazıldığı yerdir.

## Amaç ve kural

- Amaç: mikrofondan sunucuya giden ses yolunun gerçek cihazlarda çalıştığını ve gecikmesini görmek. Tanıma yok.
- Denemeleri insan yapar. Yapılmayan deneme için "tuttu" denmez; boş satır boş kalır.
- Denemeyi bir yetişkin yapar (`docs/kararlar.md` T16). Çocuk sesi kaydedilmez.
- WAV dosyalarını depoya ekleme, içlerinde ses var. Tabloya dosya adını yaz.

## Hazırlık

**Mac**

1. Depoda bir kez `pnpm install`. mkcert kurulu değilse `brew install mkcert`, ardından `mkcert -install`.
2. Güvenlik duvarı: Sistem Ayarları → Ağ → Güvenlik Duvarı → Seçenekler. "Tüm gelen bağlantıları engelle" (Block all incoming connections) açıksa deneme süresince kapat. `node` için "Gelen bağlantılara izin ver" seç. Deneme bitince eski haline getir. Bu yapılmazsa telefon sayfayı açamaz (Faz 1'de bu Mac'te görüldü).
3. `pnpm audio-trial`. Betik sertifikayı bu Mac'in o anki ağ adresleri için yeniden üretir, sayfayı derler ve iki sunucuyu açar. Ekrana şunları yazar:
   - sayfanın adresleri (`https://<ip>:4443/gelistirme/ses`);
   - telefona kurulacak kök sertifikanın yolu (`…/mkcert/rootCA.pem`).
4. Mac ve cihazlar aynı Wi-Fi ağında olmalı. Bitince Ctrl+C iki sunucuyu da kapatır.

**iPhone'a kök sertifika (bir kez)**

1. `rootCA.pem` dosyasını AirDrop ile iPhone'a gönder.
2. Ayarlar → Genel → VPN ve Aygıt Yönetimi → indirilen profili yükle.
3. Ayarlar → Genel → Hakkında → Sertifika Güven Ayarları → mkcert sertifikası için tam güveni aç.

**Android'e kök sertifika (bir kez)**

1. `rootCA.pem` dosyasını tablete gönder.
2. Ayarlar → Güvenlik → Şifreleme ve kimlik bilgileri → Sertifika yükle → CA sertifikası. Menü adları üreticiye göre değişir; ayarlarda "CA sertifikası" diye aratılabilir.

## Okunacak metin

Her ortamda aynı metin okunur: `seed/kayip-fenerin-izinde.json`, 4. bölüm ("Dar Patika"), 1. sayfa. Anlam ünitesi işaretleri ekranda olmadığı gibi burada da yok.

> Deniz sırt çantasını omzuna aldı. Tıkır kulaklarını dikti ve rüzgârı dinledi. Dar patika, çam ağaçlarının arasından yukarıya kıvrılıyordu. “Fener bu tepenin ardında olmalı,” dedi Deniz.

## Ayar setleri

Sayfadaki üç anahtar: Yankı giderme, Gürültü bastırma, Otomatik kazanç. Mikrofon kapalıyken değiştirilir.

- **A:** üçü açık (varsayılan, tarayıcıların da varsayılanı).
- **B:** üçü kapalı.

## Ortamlar

| # | Ortam | Adres |
|---|---|---|
| 1 | Masaüstü Chrome (bu Mac) | `https://localhost:4443/gelistirme/ses` |
| 2 | iPhone Safari | `https://<ip>:4443/gelistirme/ses` |
| 3 | iPhone'da ana ekrana eklenmiş hali | 2'deki sayfa → Paylaş → Ana Ekrana Ekle → "Web Uygulaması Olarak Aç" açık → ana ekrandaki simgeyle aç |
| 4 | Android Chrome (orta sınıf tablet) | `https://<ip>:4443/gelistirme/ses` |
| 5–6 | Uygulama kabuğu (iOS, Android) | Aşağıda, "Uygulama kabuğu" bölümünde |

## Adımlar

Her ortamda sırayla:

1. Adresi aç. Sertifika uyarısı çıkarsa dur: kök sertifika kurulmamış ya da güvenilmemiş.
2. A setiyle "Mikrofonu aç". İzin sorulursa izin ver. "Durum" satırı "Açık" olmalı.
3. Konuş; "Ses düzeyi" çubuğu ve dBFS değeri sesle oynamalı. Konuşurken görülen en yüksek değeri tabloya yaz.
4. "10 saniye kaydet", metni oku. "Kaydı çal" ile dinle: anlaşılır mı, bozuk mu, boş mu? "Kaydı indir (WAV)" ile dosyayı al.
5. Mikrofonu kapat, B setine geç, 2–4. adımları yinele.
6. Mikrofonu yeniden aç ve "Yankı testini başlat". 500 çerçeve gider; ortanca ve 95. yüzdelik ms olarak çıkar.
7. "Raporu indir (JSON)". İndirme çalışmazsa sayfadaki JSON'un ekran görüntüsünü al.
8. Mikrofon açıkken sekmeyi ya da uygulamayı arka plana al. Telefonun mikrofon göstergesi (iPhone'da turuncu nokta) sönmeli; sayfaya dönünce "Durum" "Kapalı" olmalı.
9. Tarayıcının site ayarlarından mikrofon iznini reddet, sayfayı yenile, "Mikrofonu aç": açıklama cümlesi görünmeli ve sayfa çökmemeli. Sonra izni geri aç.

## Sonuçlar

### Ses

| # | Ortam | Ayar seti | Cihaz ve OS sürümü (elle) | Tarayıcı (rapordan) | Giriş hızı | Uygulanan ayarlar | Düzey (konuşurken, dBFS) | Geri çalma (anlaşılır / bozuk / boş) | WAV dosyası |
|---|---|---|---|---|---|---|---|---|---|
| 1A | Masaüstü Chrome | A | | | | | | | |
| 1B | Masaüstü Chrome | B | | | | | | | |
| 2A | iPhone Safari | A | | | | | | | |
| 2B | iPhone Safari | B | | | | | | | |
| 3A | iPhone ana ekran | A | | | | | | | |
| 3B | iPhone ana ekran | B | | | | | | | |
| 4A | Android Chrome | A | | | | | | | |
| 4B | Android Chrome | B | | | | | | | |

### Yol ve davranış

| # | Ortam | Yankı ortancası (ms) | Yankı 95. yüzdelik (ms) | Kayıp | Kaçan çerçeve | Sessiz çerçeve | Arka planda mikrofon bırakıldı mı | İzin reddi açıklaması göründü mü | Rapor dosyası | Not |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Masaüstü Chrome | | | | | | | | | |
| 2 | iPhone Safari | | | | | | | | | |
| 3 | iPhone ana ekran | | | | | | | | | |
| 4 | Android Chrome | | | | | | | | | |

"Kaçan çerçeve": tarayıcının mikrofondan hiç ses vermediği süre ve yolda kaybolan çerçeveler. "Sessiz çerçeve": örneklerinin hepsi sıfır olan çerçeve; sayı büyükse mikrofon ses vermeden çerçeve üretiyor demektir (`docs/dinleme-hatti.md` bölüm 1).

## Gözlemler ve karar önerisi

- Hangi ayar seti daha temiz duyuldu (cihaz cihaz):
- iPhone'da mikrofon açıkken ve kapalıyken çalma sesi:
- Ana ekran uygulamasında tarayıcıdan farklı davranan bir şey:
- Faz 6 için not (varsayılan ayarlar, gecikme beklentisi):

## Uygulama kabuğu

Capacitor kurulumu (Faz 1'in ikinci yarısı) yapılınca bu bölüm dolar.
