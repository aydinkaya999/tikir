# Dinleme hattı

Ürünün en riskli parçası: çocuğun sesli okumasını, önceden bilinen bir metne göre izlemek. Bu belge üç şeyi tanımlar: mikrofon katmanı (şimdi yazılacak), sahte dinleyici (şimdi yazılacak) ve gerçek dinleyicinin planı (Faz 6).

## İlkeler

1. **Bilinen metne hizalama.** Serbest konuşma tanıma değil; beklenen kelime dizisi belli, aranan şey sapma.
2. **Yanlış alarm en pahalı hatadır.** Doğru okunan kelimeyi "hata" diye işaretlemek çocuğun güvenini kırar. Emin değilsen işaretleme.
3. **Geri bildirim gecikmesi görünür olmamalı.** O anki kelime vurgusu çocuğun sesinin gerisinde kalırsa ekran okumayı bozar.
4. **Arayüz, dinleyicinin kim olduğunu bilmez.** `ReadingListener` arayüzü sahte ve gerçek uygulama için aynıdır.

## 1. Mikrofon katmanı: `WebAudioCapture`

- `navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } })`. Yankı giderme, gürültü bastırma ve otomatik kazanç ayarları yapılandırılabilir olsun; hangisinin tanımaya yaradığı Faz 1'de ölçülecek.
- `AudioWorklet` içinde cihazın örnekleme hızından (44,1 ya da 48 kHz) 16 kHz'e indir, 16 bit tek kanal PCM üret, 20 ms'lik (320 örnek) çerçeveler halinde ana iş parçacığına gönder.
- Saniyede yaklaşık 20 kez ses düzeyi (RMS) olayı yayınla; mikrofon düğmesinin çevresindeki halka bununla canlanır.
- `start()` yalnız kullanıcı hareketinden çağrılır (tarayıcı kuralı).
- İzin reddi `denied`, cihaz yokluğu `unavailable`, kesinti `error` durumuna geçer; hiçbiri istisna fırlatıp ekranı çökertmez.
- Sekme gizlenince, adım değişince ve bileşen kaldırılınca mikrofon bırakılır (`track.stop()`); mikrofon ışığı gereksiz yanmaz.
- iPhone'da mikrofon açıkken hoparlör sesi kısılır. Bu yüzden Dinle adımında mikrofon kapalıdır ve kelime seslendirmesi sırasında dinleme duraklatılır.
- Veli onayı yoksa `start()` çağrılmaz; bu denetim servisin içinde değil, onu çağıran katmandadır ve testlidir.

Birim testleri: örnekleme hızı dönüştürücü (48 kHz ve 44,1 kHz girişten 16 kHz çıkış uzunluğu ve basit bir sinüsün korunması), çerçeveleyici (rastgele uzunlukta girdiden tam 320 örneklik çerçeveler).

## 2. Olaylar ve sonuç

Tipler `docs/mimari.md` içinde. Davranış sözleşmesi:

- `position`: beklenen kelime değişti. Arayüz o anki kelime vurgusunu buna göre taşır.
- `word`: bir kelime sonuçlandı (`correct` ya da bir sapma türü). Bir kelime için tam bir kez gelir.
- `hesitation`: geçerli kelimede sessizlik sürüyor. Her 500 ms'de bir, toplam süreyle gelir. Arayüz 3000 ms'de yardımı açar ve dinleyiciye bildirir (`help(index)`): kelime `helped` olarak sonuçlanır, kelime seslendirilirken dinleme duraklar, seslendirme bitince konum bir sonraki kelimeye geçer.
- `end`: metin bitti ya da durduruldu.
- `stop()` her zaman tutarlı bir sonuç döndürür: okunmayan kelimeler listede yer almaz, `wordsAttempted` son okunan kelimeye kadar sayılır.

Sapma türleri: `misread` (başka kelime ya da bozuk okuma), `suffix` (kök doğru, ek yanlış ya da eksik), `skipped`, `repeated`, `inserted`, `selfCorrected`, `helped`. Hangilerinin puandan düştüğü `docs/urun.md` bölüm 2'de.

## 3. Sahte dinleyici: `FakeListener`

Gerçek dinleyici gelene kadar bütün ürün bununla çalışır; testlerin ve tanıtımın da temelidir.

**Senaryo kipi (varsayılan):**

```ts
interface FakeScenario {
  wcpm?: number;                              // süresiz okuma: sonuçta çıkacak doğru kelime/dk, örn. 71
  timed?: { seconds: number; wordsRead: number };   // süreli okuma (K3, ölçüm): örn. 60 saniyede 76 kelime
  jitter?: number;                            // kelime süresindeki oynama, 0–1; verilmezse 0
  seed?: number;                              // aynı tohum aynı okumayı üretir; verilmezse 1
  miscues: { index: number; type: MiscueType }[];
  hesitations: { index: number; ms: number }[];
}
```

- Kelime süresi hece sayısıyla orantılıdır; uzun kelime daha uzun sürer.
- **Süresiz okumada** toplam süre, sonuç tam `wcpm` çıkacak biçimde ölçeklenir: `seconds = correctWords × 60 / wcpm`. Sonuç ekranındaki sayı senaryodaki sayıdır.
- **Süreli okumada** ilk `wordsRead` kelime tam `seconds` sürecek biçimde ölçeklenir; süre dolunca okuma biter.
- Duraksama süreleri ölçeklemenin dışındadır; kalan süre kelimelere paylaştırılır.
- Benzetim saf bir işlevdir (`simulateReading(words, scenario)` → zaman damgalı `WordResult` listesi); `FakeListener` onu zamanlayıcıyla oynatır, demo profili yükleyicisi doğrudan sonucunu kullanır.
- Isınmada (tek kelime) senaryo verilmediyse kelime doğru sayılır.
- Aynı senaryo ve tohum her zaman aynı olay dizisini üretir (testlerde sahte zamanlayıcıyla).
- Hazır senaryolar üç okuma için ayrı `wcpm` taşır: `smooth` (hatasız; 80, 84, 88), `typical` (2 hata, 1 duraksama; 64, 68, 71), `struggling` (5 hata, 3 uzun duraksama; 42, 46, 50). `cocuk-sabahi` kipinde `typical` ile biten seans G7'de tasarımdaki sayıları verir: 71 doğru kelime, dünden 4 fazla.
- `design` (tasarımdaki G4 anını üretir: 2. okuma; "kulaklarını" kısa duraksama, "rüzgârı" yanlış okuma, "ağaçlarının" üzerinde 3 saniyeyi aşan duraksama ve açık yardım balonu; hayalet o anda "patika" üzerinde). Tasarımdaki an gerçek veriden türemediği için bu senaryo hayalet temposunu da sabitler (dakikada 40 kelime). Ekran görüntüsü yardım balonu açıkken alınır.
- Mikrofon gerçekten açılır ve düzey göstergesi gerçek sesle çalışır; yalnız tanıma sahtedir. Mikrofon izni yoksa sahte dinleyici de çalışmaz, böylece izin akışları gerçek gibi sınanır.

**Elle kip** (yalnız geliştirme derlemesinde, `/gelistirme` ayarından açılır): Boşluk = kelime doğru, `E` = yanlış okuma, `S` = atlama, `H` = 3 saniye duraksama. Gerçek bir çocukla tanıtım yaparken dinleyiciyi bir yetişkin oynar.

## 4. Gerçek dinleyici (Faz 6 planı)

Karar verilmedi; aşağıdaki çerçeve içinde ölçümle seçilecek.

```
tarayıcı ──PCM 16 kHz, 20 ms çerçeve──▶ WebSocket ──▶ sunucu: ses etkinliği → tanıma (kelime zamanlı) → beklenen metne hizalama → sapma sınıflandırma
        ◀──────────── olaylar (JSON): position, word, hesitation, end ─────────────
```

- **İstemci:** `RemoteListener`, `ReadingListener` arayüzünü uygular; bağlantı koparsa okuma kesilmez, olaylar bağlantı dönünce gelir, ekranda sakin bir bilgi görünür.
- **Hizalama:** tanınan kelimeler beklenen diziye yerleştirilir. Karşılaştırma Türkçe küçük harfe çevirerek, noktalama atılarak yapılır.
- **Ek hatası ayrımı:** beklenen ve duyulan kelime hecelere ayrılır; kök heceleri tutuyor, son heceler tutmuyorsa `suffix`, aksi halde `misread`.
- **Aday yaklaşımlar:** (a) kelime zamanı veren bir bulut tanıma servisi ve kendi hizalamamız; (b) kendi barındırdığımız açık kaynak model ve zorlamalı hizalama; (c) ileride cihaz içi tanıma. Hiçbirinin Türkçe çocuk sesindeki başarısı bilinmiyor; karar değerlendirme düzeneğinin sonucuna bağlı.
- **Hedefler (başlangıç değerleri):** doğru okunan kelimenin hatalı işaretlenme oranı %2'nin altında; o anki kelime vurgusunun gecikmesi ortanca 400 ms, 95. yüzdelik 800 ms'nin altında.
- **Mahremiyet:** ham ses yalnız veli onayıyla saklanır; saklanmayacaksa sunucu sesi işledikten sonra atar.

### Değerlendirme düzeneği (Faz 6'nın ilk işi)

1. En az 20 çocuktan, veli onayıyla, sınıf düzeyine uygun metinlerin sesli okuma kayıtları.
2. Her kayıt için elle etiket: kelime bazında doğru ya da sapma türü.
3. Betik: bir adayı bütün kayıtlarda çalıştırır; kelime bazında kesinlik ve duyarlılık, yanlış alarm oranı, gecikme dağılımı, `wcpm` farkı (insan etiketiyle) üretir.
4. Adaylar aynı tabloda karşılaştırılır; hedefleri tutturan en basit aday seçilir.

## 5. Ses denemesi (Faz 1)

Amaç: mikrofondan sunucuya giden yolun gerçek cihazlarda çalıştığını ve gecikmesini görmek. Tanıma yok.

`/gelistirme/ses` sayfası:

- İzin iste, durumu göster.
- Canlı düzey göstergesi.
- 10 saniye kaydet ve geri çal (16 kHz PCM'den WAV üret).
- Yankı testi: çerçeveleri `scripts/echo-server` betiğine WebSocket ile gönder, geri dönüş süresini ölç (ortanca ve 95. yüzdelik).
- Cihaz raporu: tarayıcı, işletim sistemi, giriş örnekleme hızı, uygulanan ses ayarları, kaçan çerçeve sayısı. JSON olarak indirilebilir.

Denenecek ortamlar (elle, gerçek cihaz): masaüstü Chrome, iPhone Safari, iPhone'da ana ekrana eklenmiş hali, Android Chrome (orta sınıf bir tablet). Sonuçlar `docs/ses-denemesi-sonuclari.md` dosyasına yazılır.

Fazın ikinci yarısı aynı sayfayı Capacitor kabuğunda dener (iOS için macOS ve Xcode, Android için Android Studio gerekir). Seçtiğimiz yolun asıl riski burasıdır: uygulama içi tarayıcıda mikrofon izni alınsa bile ses verisinin bozuk ya da boş geldiği örnekler var. Sonuç kötüyse yalnız ses için yerel bir eklenti yazılır ve `AudioCapture` arayüzünün ikinci uygulaması olur; arayüz ve ekranlar değişmez.
