# Faz 0 planı: İskelet ve tasarım sistemi

> Durum: onaylandı (2026-11-18). Uygulama `faz-0` dalında yürür. Her görevin sonunda `pnpm check` çalışır; geçerse görevin kutuları işaretlenir ve aynı commit'e girer. Dalın birleştirilmesi ve push ürün sahibinin kararıdır.

**Amaç:** Araçlar ve `pnpm` komutları, token'lar ve depodan sunulan yazı tipleri, envanterdeki bütün bileşenler ve vitrin, okuma metni, beş kabuk, bütün rotalar (boş), Türkçe metin ve okunabilirlik alan mantığı.

**Kaynak belgeler:** `docs/yol-haritasi.md` (Faz 0 ve kabul ölçütleri), `docs/kararlar.md`, `docs/mimari.md`, `docs/tasarim-sistemi.md`, `docs/ekranlar.md` (rotalar), `docs/urun.md` (sınıf eşikleri, sözlük), `design/README.md`.

**Yığın:** Node 26 LTS, pnpm 12, Vite 8, React 19, React Router 8, TypeScript 6.0, Vitest 5 + jsdom + Testing Library, Playwright (Chromium ve WebKit), ESLint 10, Stylelint 18, Prettier 3.

**Kapsam dışı:** ekranların içeriği, servisler, depolama, Zustand ve `idb` (Faz 2), vitrindeki demo profil düğmeleri (Faz 2).

## Görev listesi

- [x] Task 0: Plan dosyası
- [x] Task 1: Ortam: Node 26 ve pnpm (commit yok)
- [x] Task 2: Proje iskeleti
- [x] Task 3: Lint ve biçim
- [x] Task 4: Playwright, `pnpm e2e` ve `pnpm shots`
- [x] Task 5: `domain/text.ts`
- [x] Task 6: `domain/readability.ts` ve sınıf eşikleri
- [x] Task 7: Stiller, yazı tipleri ve `tr.ts`
- [ ] Task 8: Yönlendirme, ikonlar ve vitrin iskeleti
- [ ] Task 9: Button ve IconButton
- [ ] Task 10: Chip, Card, PageCard ve SpeechBubble
- [ ] Task 11: Companion, Monster, Tile ve BookCover
- [ ] Task 12: Checkbox, TextField, TextArea, Switch, SegmentedControl ve OptionCard
- [ ] Task 13: StepTiles ve MicButton
- [ ] Task 14: StatCard, LineChart ve ProgressBar
- [ ] Task 15: ReadingText, PhraseText ve RaceBar
- [ ] Task 16: Vitrin testi
- [ ] Task 17: Çocuk ve veli kabukları
- [ ] Task 18: Seans kabuğu
- [ ] Task 19: Odak ve kurulum kabukları
- [ ] Task 20: Dış istek yok ve CSP
- [ ] Task 21: Kabuk karşılaştırması
- [ ] Task 22: Belgeler
- [ ] Task 23: Kabul ölçütleri yürüyüşü (commit yok)

## Onaylanan kararlar

1. **Node 26 LTS.** `.nvmrc` = `26`, `engines.node` = `>=26`. mise yalnız bu klasörde 26 kullanır; genel ayar değişmez. Güncel `react-router` en az Node 22.22, `jsdom` ve `stylelint` en az 22.22.2 istiyor; yereldeki 22.14 yetmiyordu.
2. **TypeScript 6.0.x.** En güncel kararlı sürüm 7.0.2, ama `typescript-eslint` yalnız 6.1'den eskisini destekliyor. Destek gelince yükseltilir.
3. **Token'da olmayan değerler `src/styles/tokens-extra.css` dosyasında.** `tokens.css`, `design/tokens.css` dosyasının birebir kopyasıdır. Tasarım HTML'inin kullandığı ama `tokens.css` dosyasında olmayan yazı boyutu, köşe ve gölge değerleri rol adıyla `tokens-extra.css` dosyasında durur; her satırda tasarımdaki kaynağı yazar. Renk, yazı boyutu, köşe, gölge ve yazı ailesi için sabit değer yalnız bu iki dosyada olabilir; Stylelint denetler.
4. **Albüm ve Stüdyo rotaları:** `/album` ve `/studyo`, çocuk kabuğunda boş sayfa. `docs/ekranlar.md` rota tablosuna eklenir.
5. **MicButton'ın tasarımda olmayan iki durumu** (onaylı metin):
   - duraklatıldı: beyaz zemin, lacivert mikrofon ikonu, halka yok; ad "Duraklatıldı. Sürdürmek için dokun";
   - izin yok: beyaz zemin, soluk ikon, `--color-line` kesik kenarlık; ad "Mikrofon izni yok".
   İkisi de `TODO(design)`.
6. **CSP:** yalnız üretim derlemesinde meta etiketi: `default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'`. Geliştirme sunucusunda yok. Dış istek testi CSP ihlalini de yakalar.
7. **Geliştirme rotaları** `import.meta.env.MODE !== 'production'` iken açıktır. `pnpm build` bunları içermez. `pnpm e2e` ayrı bir `e2e` kipi derlemesini (`dist-e2e/`) `vite preview` ile sınar. `pnpm shots` geliştirme sunucusunu kullanır.
8. **Heceleme ve kesme işareti:** heceler birleşince kelimeyi aynen verir: `Tıkır’ın` → `Tı-kı-r’ın`. Sayımda kesme işareti yok sayılır (3 hece).
9. **`levelCheck(input: string | readonly string[], grade)`**:
   - dizi verilirse cümle sayısı dizinin uzunluğudur; düz metin verilirse `splitSentences` ile bölünür;
   - dönüş `{ stats, limits, withinSyllableLimit, withinSentenceLimit, ok }`;
   - Ateşman puanı yalnız raporlanır, `ok` sonucunu etkilemez;
   - hesap yuvarlanmamış değerle yapılır; yuvarlama yalnız gösterimdedir.
10. **Yazı tipi aile adı.** Fontsource paketi aileyi "Atkinson Hyperlegible Next Variable" adıyla tanımlar. `fonts.css`, paketin dosyalarıyla kendi `@font-face` tanımlarını yazar: aile adı token'daki adla aynıdır, yalnız latin ve latin-ext, yalnız normal stil. Didact Gothic: 400, latin ve latin-ext.
11. **Veli kabuğu** HTML'deki gibi kurulur. Webde lacivert şerit ve çocuk etiketi yok, "Veli alanı" kenar çubuğundadır. Zemin beyazdır. Gezinme adları boyuta göre değişir.
12. **Telefon ve tablette veli alanına giriş yok.** Tasarıma bir şey eklenmez; kodda `TODO(design)` kalır.
13. **Noktalama:** veride kelimeden ayrıdır (`leading`, `trailing`). Ekranda tasarımdaki gibi kelimeyle aynı `span` içinde durur.
14. **Bileşenler `tr.ts` dosyasını içe aktarmaz.** Metin ve `aria-label` prop ile gelir. Kabuklar ve sayfalar `tr.ts` kullanır. Vitrinde bölüm başlıkları bileşenlerin kod adlarıdır. Örnek metinler tasarımdan, okuma örnekleri `seed/` klasöründen alınır.
15. **ReadingText, PhraseText ve RaceBar** `src/features/reading` altında durur.
16. **Boş sayfa yalnız kabuğu gösterir.** Odak kabuğunun başlığı kabuğa ait olduğu için U3 ve U4'te görünür. Seans ve kurulum kabukları Tıkır'ı varsayılan yüz ifadesiyle çizer. Balon, denetimler ve çıkış onayı içerikle gelir (Faz 2–3).
17. **Bilinmeyen rota** `/` adresine yönlendirilir.
18. **`.claude/skills` klasörü depoda yok.** Faz 0'ı etkilemez.

## Her görevde geçerli kurallar

- CLAUDE.md kuralları geçerlidir: arayüz metni yalnız `src/i18n/tr.ts` içinde ve tasarımdan birebir; emoji yok; ikonlar `ikonlar.json` dosyasından; `any` yok; `design/` ve `seed/` değişmez.
- Katman yönü: `features` → `services` → `domain`. `domain` hiçbir şeyi içe aktarmaz. `components` yalnız `styles` ve `domain` tiplerini bilir.
- Ölçü, metin ve `aria-label` için kaynak `design/ekranlar/*.html`. Renk ve ölçü değerleri token'lardan gelir.
- Davranışı olan her şey önce testle yazılır: test önce kırmızı görülür, sonra yeşil.
- Her görevin son adımı: `pnpm check` geçer, görevin kutuları işaretlenir, commit atılır. Commit mesajları İngilizce ve Conventional Commits biçiminde.

## Görevler

### Task 0: Plan dosyası

- [x] `faz-0` dalını aç.
- [x] Onaylanan planı bu dosyaya yaz.
- [x] Commit: `docs: add phase 0 plan`

### Task 1: Ortam: Node 26 ve pnpm (commit yok)

- [x] `.nvmrc` = `26` (dosya Task 2'de commit'e girer). `mise install` ile Node 26'yı kur.
- [x] Node 26 altına güncel pnpm'i kur (`npm install -g pnpm@<güncel>`), çünkü Node 26 corepack getirmez.
- [x] Doğrulama: bu klasörde `node -v` → `v26.x`, `pnpm -v` → `12.x`.

### Task 2: Proje iskeleti

**Dosyalar:** `package.json`, `pnpm-lock.yaml`, `.nvmrc`, `.gitignore`, `index.html`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `src/main.tsx`, `src/app/App.tsx`, `src/app/App.test.tsx`, `src/test/setup.ts`, `docs/kararlar.md`.

- [x] `package.json`:
  - `"private": true`, `"type": "module"`;
  - `packageManager` kurulu pnpm sürümü, `engines.node` `>=26`;
  - betikler: `dev`, `build` (`tsc -b && vite build`), `preview`, `typecheck` (`tsc -b`), `test` (`vitest run`), `check` (şimdilik typecheck + test).
- [x] Paketler (kurulum anındaki güncel sürüm): `react`, `react-dom`; geliştirme için `vite`, `@vitejs/plugin-react`, `typescript@6.0`, `@types/react`, `@types/react-dom`, `@types/node`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.
- [x] `index.html`:
  - `<html lang="tr">`, `charset=utf-8`;
  - viewport `width=device-width, initial-scale=1, viewport-fit=cover`;
  - `<link rel="icon" href="data:,">` (favicon isteği gitmez);
  - `<title>Tıkır</title>`.
- [x] TypeScript ayarları:
  - `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `erasableSyntaxOnly`;
  - `moduleResolution: bundler`, `jsx: react-jsx`, `resolveJsonModule`;
  - uygulama `src/`; Node tarafı ayar dosyaları, `scripts/` ve `e2e/`.
- [x] Vitest iki proje:
  - `*.test.ts` dosyaları `node` ortamında (domain saf kalsın);
  - `*.test.tsx` dosyaları `jsdom` ortamında, `src/test/setup.ts` ile (jest-dom).
- [x] Önce test: `src/app/App.test.tsx` → `App` bir `main` alanı çizer. Kırmızı gör, sonra `App` ve `main.tsx` (StrictMode) yazılır.
- [x] `.gitignore`: `node_modules`, `dist`, `dist-e2e`, `shots/`, `test-results/`, `playwright-report/`, `blob-report/`, `coverage/`, `.superpowers/`, `.DS_Store`.
- [x] `docs/kararlar.md`:
  - Bağımlılıklar tablosuna bu görevin paketleri;
  - T11 (Node 26) ve TypeScript 6 kararı;
  - değişiklik günlüğüne bir satır.
- [x] Doğrulama: `pnpm check` ve `pnpm build` geçer; `pnpm dev` açılır, sayfada `lang="tr"` görünür.
- [x] Commit: `chore: scaffold Vite React TypeScript app`

### Task 3: Lint ve biçim

**Dosyalar:** `eslint.config.js`, `stylelint.config.js`, `.prettierrc.json`, `.prettierignore`, `package.json`, `docs/kararlar.md`.

- [x] Paketler: `eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y` (ESLint 10 eş-bağımlılık uyarısı bilinçli olarak susturulur), `stylelint`, `prettier`.
- [x] ESLint (`--max-warnings 0`):
  - `@eslint/js` önerilenleri, `typescript-eslint` strict ve tip bilgili kuralları, react-hooks, react-refresh, jsx-a11y önerilenleri.
  - Proje kuralları:
    - `src/domain/**`: yalnız `./` ile başlayan içe aktarma; `Date.now()` ve argümansız `new Date()` yok (test dosyaları hariç).
    - `src/components/**`: `features`, `app`, `services` ve `i18n` içe aktarılamaz.
    - `src/domain/**` ve `src/components/**`: `window`, `document`, `navigator`, `localStorage`, `sessionStorage`, `indexedDB`, `fetch`, `XMLHttpRequest`, `WebSocket` yok.
    - `src/**/*.tsx` (vitrin ve testler hariç): boş olmayan JSX metni yok; `aria-label`, `alt`, `title` ve `placeholder` içinde boş olmayan düz dizgi yok.
    - Her yerde `toUpperCase()` ve `toLowerCase()` yok; `text.ts` içindeki Türkçe yardımcılar kullanılır.
- [x] Stylelint:
  - `color-no-hex`, `color-named: never`; renk işlevleri yasak.
  - Yalnız `var(--…)` (ve `inherit`, `currentColor`, `transparent`, `none`, `0`, `50%` gibi anahtar değerler) şu özelliklerde: renkler, `background`, `font-size`, `font-family`, `font-weight`, `border-radius`, `box-shadow`.
  - `text-transform: uppercase` yasak.
  - `src/styles/tokens.css` ve `src/styles/tokens-extra.css` muaf.
- [x] Prettier: `singleQuote`, `printWidth: 100`. Biçimlenmez: `design/`, `seed/`, `docs/`, `*.md`, derleme ve rapor klasörleri, `.superpowers/`, `pnpm-lock.yaml`.
- [x] Betikler:
  - `lint` = `eslint . --max-warnings 0 && stylelint "src/**/*.css" && prettier --check .`
  - `format` = `prettier --write .`
  - `check` = `pnpm typecheck && pnpm lint && pnpm test`
- [x] Doğrulama: `pnpm check` geçer. Commit'e girmeyen geçici örneklerle her kuralın hata verdiği çıktı gösterilir, sonra örnekler silinir. Örnekler: domain'de React içe aktarma, `<div onClick>`, JSX metni, `toUpperCase()`, CSS'te `#fff`, `font-size: 13px`, `text-transform: uppercase`.
- [x] Commit: `chore: add lint and format checks`

### Task 4: Playwright, `pnpm e2e` ve `pnpm shots`

**Dosyalar:** `playwright.config.ts`, `e2e/smoke.spec.ts`, `scripts/shots.ts`, `src/app/env.ts`, `package.json`, `docs/kararlar.md`.

- [x] Paket: `@playwright/test`. Tarayıcılar: `pnpm exec playwright install chromium webkit`.
- [x] `src/app/env.ts`: `export const devToolsEnabled: boolean = import.meta.env.MODE !== 'production'`.
- [x] `playwright.config.ts`:
  - `testDir: 'e2e'`, projeler `chromium` (Desktop Chrome) ve `webkit` (Desktop Safari);
  - `baseURL` `http://localhost:4317`;
  - `webServer`: `vite build --mode e2e --outDir dist-e2e` ve ardından `vite preview --outDir dist-e2e --port 4317 --strictPort`, `reuseExistingServer: false`.
- [x] `e2e/smoke.spec.ts`: `/` açılır; `html` öğesinin `lang` değeri `tr`; `main` görünür.
- [x] `scripts/shots.ts` (Node 26 doğrudan çalıştırır):
  - Vite geliştirme sunucusunu JS API ile boş bir kapıda açar;
  - her rota için telefon 390×844, tablet 1180×820 ve web 1440×900 tam sayfa görüntü alır (`deviceScaleFactor: 1`, `document.fonts.ready` beklenir);
  - dosya adı `shots/<ad>-telefon.png` (tablet, web aynı biçimde); `/` için ad `index`, diğer rotalarda `/` → `-`, sorgu karakterleri `-` olur;
  - birden çok rota alır, rota `/` ile başlamazsa hata verir.
- [x] Betikler: `e2e` = `playwright test`, `shots` = `node scripts/shots.ts`.
- [x] Doğrulama: `pnpm e2e` iki tarayıcıda geçer. `pnpm shots /` üç dosya üretir; `sips` boyutları 390, 1180 ve 1440 gösterir.
- [x] Commit: `test: add Playwright e2e and shots script`

### Task 5: `domain/text.ts`

**Dosyalar:** `src/domain/text.ts`, `src/domain/text.test.ts`.

**Üretir:**

```ts
export interface Token { word: string; leading: string; trailing: string; spaceAfter: boolean }
export function toUpperTr(text: string): string
export function toLowerTr(text: string): string
export function tokenize(text: string): Token[]
export function splitSentences(text: string): string[]
export function splitPhraseUnits(sentence: string): string[]
export function syllabify(word: string): string[]
export function countSyllables(word: string): number
```

- Kelime harf dizisidir (`\p{L}`). Kesme işaretiyle (`’` ya da `'`) gelen ek kelimeye dahildir. Tırnak ve noktalama `leading` ya da `trailing` olur.
- Harf içermeyen parça önceki kelimenin `trailing` alanına eklenir.
- `splitSentences`: cümle `.`, `!`, `?` ya da `…` ile biter. Ardından metin biter ya da (açılış tırnağından sonra) büyük harf gelir. Kapanış tırnağından sonra küçük harfle süren söz bölünmez.
- `syllabify`:
  - her hecede bir ünlü vardır (`aeıioöuüâîû`, `toLowerTr` ile bakılır);
  - iki ünlü arasındaki ünsüzlerin yalnız sonuncusu sağa geçer;
  - kesme işareti bulunduğu yerde kalır, böylece `syllables.join('') === word`.
- `countSyllables` = ünlü sayısı.

- [x] Önce testler:
  - mimari'deki 13 heceleme örneği birebir (tablo testi);
  - `Tıkır’ın` → `['Tı','kı','r’ın']`, 3 hece;
  - `IŞIK` → `['I','ŞIK']`;
  - `tokenize('“Fener bu tepenin ardında olmalı,” dedi')` → `“` leading, `,”` trailing;
  - `Tıkır’ın` tek kelime;
  - `splitSentences`: Ateşman örneği 2 cümle; `“Işığım geri geliyor!” diye bağırdı.` 1 cümle; `…` ile biten cümle;
  - `splitPhraseUnits('Dar patika, | çam ağaçlarının arasından | yukarıya kıvrılıyordu.')` → 3 ünite;
  - `toUpperTr('istanbul ılık')` → `İSTANBUL ILIK`; `toLowerTr('İSTANBUL IŞIK')` → `istanbul ışık`.
- [x] Kırmızıyı gör (`pnpm test src/domain/text.test.ts`), sonra yaz, yeşili gör.
- [x] Commit: `feat(domain): add Turkish text utilities`

### Task 6: `domain/readability.ts` ve sınıf eşikleri

**Dosyalar:** `src/domain/types.ts`, `src/domain/config.ts`, `src/domain/readability.ts`, `src/domain/readability.test.ts`.

**Üretir:**

```ts
// types.ts
export type Grade = 1 | 2 | 3 | 4
export type Sentence = string[]   // anlam üniteleri
export type Page = Sentence[]
// config.ts
export interface GradeLimits { maxSyllablesPerWord: number; maxWordsPerSentence: number }
export const gradeLimits: Readonly<Record<Grade, GradeLimits>>   // 1: 2,2/5  2: 2,4/6  3: 2,7/8  4: 2,9/10
// readability.ts
export interface TextStats { words: number; sentences: number; syllables: number; syllablesPerWord: number; wordsPerSentence: number; atesman: number }
export function atesman(syllablesPerWord: number, wordsPerSentence: number): number   // 198.825 − 40.175·x1 − 2.610·x2
export function textStats(sentences: readonly string[]): TextStats
export interface LevelCheck { stats: TextStats; limits: GradeLimits; withinSyllableLimit: boolean; withinSentenceLimit: boolean; ok: boolean }
export function levelCheck(input: string | readonly string[], grade: Grade): LevelCheck
```

- `textStats`: ` | ` ünite ayraçlarını yok sayar. Hiç kelime yoksa bütün sayılar 0 olur; bu durumda `ok` false.
- Sınır dahildir (`≤`).

- [x] Önce testler:
  - Ateşman sınaması: 11 kelime, 2 cümle; iki ondalığa yuvarlanınca x1 2,55, x2 5,5; bir ondalığa yuvarlanınca puan 82,2;
  - `atesman(28/11, 5.5)` yaklaşık 82,21 (erken yuvarlama yok);
  - `seed/` içindeki 12 metnin `stats` alanları birebir: 5 bölüm, 5 ölçüm metni, 2 örnek kitap;
  - dizi girdisinde cümle sayısı dizinin uzunluğudur;
  - eşikler: `olcum-4a` 1. sınıfta iki tavanı da aşar, 4. sınıfta geçer; `olcum-3b` 2. sınıfta hece tavanını aşar ama cümle tavanında kalır;
  - sınır değerinde geçer;
  - boş metin `ok` false döner.
- [x] Kırmızı, sonra yeşil.
- [x] Commit: `feat(domain): add Atesman score and levelCheck`

### Task 7: Stiller, yazı tipleri ve `tr.ts`

**Dosyalar:** `src/styles/tokens.css`, `src/styles/tokens-extra.css`, `src/styles/fonts.css`, `src/styles/global.css`, `src/main.tsx`, `src/i18n/tr.ts`, `src/i18n/tr.test.ts`, `src/design-copies.test.ts`, `e2e/smoke.spec.ts`, `package.json`, `docs/kararlar.md`.

- [x] Paketler: `@fontsource-variable/atkinson-hyperlegible-next`, `@fontsource/didact-gothic`.
- [x] Önce testler:
  - `design-copies.test.ts`: `src/styles/tokens.css` ile `design/tokens.css` bayt bayt aynı. Kopya listesi sonraki görevlerde ikonlar ve SVG'lerle büyür.
  - `tr.test.ts`: `tr` içindeki hiçbir dizgide emoji (`\p{Extended_Pictographic}`) yok.
- [x] `tokens.css` kopyalanır. `tokens-extra.css` bir açıklama başlığıyla açılır; değerleri, onları kullanan görev ekler.
- [x] `fonts.css` (karar 10):
  - Atkinson: 200–800 değişken, `woff2-variations`;
  - Didact Gothic: 400;
  - ikisi de latin ve latin-ext, `font-display: swap`, paketteki `unicode-range` değerleri.
- [x] `global.css`:
  - `box-sizing`;
  - `body`: zemin `--color-ground`, metin `--color-ink`, yazı `--font-text`, `--size-body`, `--weight-medium`, `--leading-body`;
  - `:focus-visible` için `outline: 3px solid var(--color-cobalt)` ve `outline-offset: 2px`;
  - `prefers-reduced-motion: reduce` iken geçiş ve canlandırma yok;
  - form öğeleri `font: inherit`.
- [x] `tr.ts`: `const appName = 'Tıkır'`; `export const tr = { appName, … } as const`. Diğer metinler, onları kullanan görevde eklenir.
- [x] e2e duman testine eklenir: `Atkinson Hyperlegible Next` yüklendi (`document.fonts.check`) ve kendi kökeninden bir `.woff2` isteği gitti.
- [x] Bir kerelik denetim: Didact Gothic ğ, ş, ı, İ, Ğ ve Ş harflerini içeriyor mu? Sonuç "Kanıtlar" bölümüne yazılır.
- [x] Commit: `feat(styles): add tokens, fonts, global styles and tr skeleton`

### Task 8: Yönlendirme, ikonlar ve vitrin iskeleti

**Dosyalar:** `src/app/routes.ts`, `src/app/router.tsx`, `src/app/App.tsx`, `src/components/Icon/Icon.tsx`, `src/components/Icon/icons.json`, `src/components/Icon/Icon.test.tsx`, `src/features/dev/ShowcasePage.tsx`, `ShowcasePage.module.css`, `src/features/dev/AudioLabPage.tsx`, `src/design-copies.test.ts`, `package.json`, `docs/kararlar.md`.

- [ ] Paket: `react-router`.
- [ ] `routes.ts`:
  - `screenPaths`: ekran kodu → yol (G1–G7, K1–K4, U1–U4, V1–V4; `ekranlar.md` tablosu);
  - `extraPaths`: `album`, `studio`;
  - `devPaths`: `showcase` = `/gelistirme/vitrin`, `audio` = `/gelistirme/ses`.
  Testler de yolları buradan okur.
- [ ] `router.tsx`:
  - geliştirme rotaları yalnız `devToolsEnabled` iken eklenir ve tembel yüklenir;
  - `*` rotası `/` adresine yönlendirir;
  - `/` şimdilik boş sayfa.
- [ ] `Icon`, önce test: `aria-hidden`, 24 px `viewBox`, `currentColor` çizgi. `{ name: IconName; size?: number; className?: string }`; `IconName` = `icons.json` anahtarları; `icons.json`, `design/svg/ikonlar.json` kopyasıdır (kopya testine eklenir).
- [ ] Vitrin iskeleti: her bileşen bir `section[data-component="<Ad>"]` içinde, başlığı bileşenin kod adı. İlk bölüm 40 ikonlu `Icon` tablosu. Ses denemesi sayfası boş.
- [ ] Doğrulama:
  - `pnpm check`;
  - `pnpm build` sonrası `grep -rE "gelistirme|ShowcasePage" dist/` boş;
  - `pnpm shots /gelistirme/vitrin`.
- [ ] Commit: `feat(app): add router, icons and showcase skeleton`

### Task 9: Button ve IconButton

**Üretir:**

- `Button`: `{ variant?: 'primary'|'saffron'|'secondary'|'dark'|'danger'; size?: 'regular'|'large'; icon?: IconName; fullWidth?: boolean; to?: string }` + `button` öznitelikleri. `to` verilince router bağlantısı olur.
  - Yükseklik 52, büyükte 60; kontur, köşe 16, gölge `--lift-button`.
  - Basılınca 2 px iner ve gölgesi 2 px kısalır (80 ms).
  - Pasif durumu vardır.
- `IconButton`: `{ icon: IconName; label: string; size?: 44|48|52; raised?: boolean; to?: string }`. Yuvarlaktır; `label` erişilebilir addır.

- [ ] Önce testler: rol ve erişilebilir ad; `to` verilince bağlantı ve `href`; pasif durum.
- [ ] Ölçüler G1, G4, K1 ve U3 HTML'inden. Vitrinde her tür, her boyut, ikonlu, tam genişlik ve pasif.
- [ ] Doğrulama: `pnpm check`; vitrinin üç genişlikte görüntüsü tasarımdaki düğmelerle karşılaştırılır.
- [ ] Commit: `feat(components): add Button and IconButton`

### Task 10: Chip, Card, PageCard ve SpeechBubble

- `Chip`: `{ icon?: IconName; tone?: 'white'|'saffron'|'saffronLight'|'turquoiseLight'|'cobaltLight' }`. Tam yuvarlak, 2 px kontur.
- `Card`: `{ tone?: 'white'|'cobaltLight'|'turquoiseLight'; lifted?: boolean }`. Köşe 20.
- `PageCard`: `{ title: string; counter?: string }`. Köşe 22, gölge `--lift-page`.
- `SpeechBubble`: `{ arrow?: 'left'|'top'; live?: boolean }`. `live` ise `aria-live="polite"`.

- [ ] Önce testler: içerik, başlık ve sayaç; `aria-live`.
- [ ] Vitrine eklenir. Görüntü G1, G4, K1 ve V1 ile karşılaştırılır.
- [ ] Commit: `feat(components): add Chip, Card, PageCard and SpeechBubble`

### Task 11: Companion, Monster, Tile ve BookCover

- SVG'ler `src/assets/illustrations/` altına kopyalanır (kopya testine eklenir) ve `<img>` ile çizilir.
- `Companion`: `{ expression?: 'normal'|'listen'|'talk'|'happy'|'sleep'|'think'; size: number; label?: string }`. `label` varsa `alt` olur, yoksa süs görseli sayılır. Yüz değişimi 150 ms.
- `Monster`: `{ kind: 1|2; state: 'wild'|'tamed'; size: number; label?: string }`.
- `Tile`: `{ state: 'done'|'today'|'locked'; pattern?: 1|2|3|4|5|6; size?: number }`. Ölçü ve görünüm G1 ve kurulum panosundan.
- `BookCover`: çini desenli kapak; ölçüler U1 ve U4'ten.

- [ ] Önce testler: `alt` ya da süs görseli; ifadeye göre doğru görsel.
- [ ] Vitrine eklenir (6 ifade, 2 tür × 2 durum, 3 karo durumu, kapaklar).
- [ ] Commit: `feat(components): add Companion, Monster, Tile and BookCover`

### Task 12: Checkbox, TextField, TextArea, Switch, SegmentedControl ve OptionCard

- `Checkbox`: gerçek `input[type=checkbox]` + `label`; satır en az 44 px.
- `TextField` ve `TextArea`: gerçek `label` ile bağlı alan.
- `Switch`: `button[role=switch]` + `aria-checked`. Ray 62×34, düğme 23 px; açıkken turkuaz.
- `SegmentedControl`: gerçek `radio` grubu; seçili bölme safran; köşe 14.
- `OptionCard`: `button[aria-pressed]`; seçiliyken safran, gölgeli ve onay işaretli.

- [ ] Önce testler: Switch'in tıklama ve boşluk tuşuyla açılıp kapanması; SegmentedControl'de seçim ve ok tuşları; OptionCard'da `aria-pressed`; Checkbox'ta etikete tıklayınca işaretlenmesi; TextField'ın etiketle bulunması.
- [ ] Vitrine eklenir. Görüntü K1, K2, U2, U3 ve V4 ile karşılaştırılır.
- [ ] Commit: `feat(components): add form controls`

### Task 13: StepTiles ve MicButton

- `StepTiles`: `{ steps: { key: string; label: string }[]; current: number | null; label: string }`.
  - `ol[aria-label]`; geçerli adım `aria-current="step"`.
  - Bitenler turkuaz ve onaylı, geçerli safran ve gölgeli, sıradakiler beyaz ve `--color-line` kenarlı.
  - Adlar 700 px ve üstünde görünür.
- `MicButton`: `{ state: 'listening'|'paused'|'denied'; labels: Record<state, string>; size?: 'regular'|'large' }` (76 ve 84 px). Halka yalnız dinlerken (`--ring-mic`). Durum görünümleri karar 5'e göre.

- [ ] Önce testler: `aria-current`; MicButton'ın adı duruma göre değişir.
- [ ] Vitrine eklenir. Görüntü G4 ile karşılaştırılır.
- [ ] Commit: `feat(components): add StepTiles and MicButton`

### Task 14: StatCard, LineChart ve ProgressBar

- `StatCard`: `{ value: string; label: string; tone?: 'hero'|'plain' }` + ek içerik yuvası. Ölçüler V1 ve G7'den.
- `LineChart`: `{ points: number[]; labels: string[]; yTicks: number[]; target?: { value: number; label: string }; average?: { value: number; label: string }; label: string }`. `svg[role=img]` ve `aria-label`; ortalama yoksa ortalama çizgisi çizilmez.
- `ProgressBar`: `{ value: number; label: string }`, `role="progressbar"` ve `aria-valuenow`.

- [ ] Önce testler: grafiğin adı, nokta sayısı ve ortalamanın olmaması; ilerleme değeri.
- [ ] Vitrinde V1 tasarımındaki örnek değerler kullanılır. Görüntü V1 ve U1 ile karşılaştırılır.
- [ ] Commit: `feat(components): add StatCard, LineChart and ProgressBar`

### Task 15: ReadingText, PhraseText ve RaceBar

**Dosyalar:** `src/features/reading/*`, `e2e/reading-text.spec.ts`.

- `ReadingText`: `{ page: Page; firstIndex?: number; currentIndex?: number | null; ghostIndex?: number | null; readCount?: number; marks?: Readonly<Record<number, 'hesitation' | 'error'>> }`.
  - Her kelime `span[data-word-index]`; noktalama aynı `span` içinde.
  - Durumlar: okunmuş lacivert; okunmamış soluk; o anki safran zemin, `--ring-word`, köşe 3, 600 ağırlık; hayalet kesik kobalt çerçeve, uzaklık 4, köşe 4; duraksama noktalı alt çizgi, 3 px, uzaklık 6; hata dalgalı alt çizgi, 2 px, uzaklık 6.
  - Her kelime, 600 ağırlıktaki halinin genişliğini görünmez, `aria-hidden` bir kalın kopyayla ayırır.
  - Kapsayıcı değişkenleri: `--reading-font`, `--reading-size`, `--reading-letter-spacing`, `--reading-word-spacing`. Varsayılanları token'lardan gelir.
  - `font-variant-ligatures: no-common-ligatures`, `text-wrap: pretty`, `hyphens: none`.
- `PhraseText`: `{ page: Page; currentUnit?: number | null; readUnits?: number }`. Üniteler arasında 2 px × 0,85 em ayraç, yatay boşluk 9 px. O anki ünite safran zeminli, `--ring-phrase`.
- `RaceBar`: `{ progress: number; ghost?: number | null; youLabel: string; ghostLabel: string }`. Hayalet yoksa yalnız "sen" imleci görünür. Ölçüler G4'ten.

- [ ] Önce bileşen testleri: her durumun özniteliği; metnin noktalamasıyla korunması; kalın kopyanın `aria-hidden` olması; hayaletsiz RaceBar; ünite sayısı ve o anki ünite.
- [ ] Vitrinde örnek metin: `seed/kayip-fenerin-izinde.json` 4. bölüm 1. sayfa (G4'teki an). Kelime ve hayalet konumu bir aralık denetimiyle oynatılır.
- [ ] Önce e2e testi: vurgu bütün kelimelerde ilerlerken her kelimenin kutusu (x, y, genişlik, yükseklik) değişmez. Üç genişlikte, varsayılan ayarla ve "okul harfi + en büyük boyut" ayarıyla, Chromium ve WebKit'te.
- [ ] Doğrulama: `pnpm check`, `pnpm e2e`. Görüntü G3 ve G4 ile karşılaştırılır.
- [ ] Commit: `feat(reading): add ReadingText, PhraseText and RaceBar`

### Task 16: Vitrin testi

- [ ] `e2e/showcase.spec.ts`:
  - envanterdeki her bileşenin bölümü vardır (20 satırdaki 22 bileşen, ReadingText, PhraseText, Icon);
  - 390, 1180 ve 1440 genişlikte sayfada ve her bölümde yatay taşma yok;
  - `reducedMotion: 'reduce'` iken düğmenin geçiş süresi 0;
  - düğme ve bağlantıların dokunma hedefi en az 44×44 px.
- [ ] Doğrulama: `pnpm e2e`; `pnpm shots /gelistirme/vitrin`.
- [ ] Commit: `test(e2e): check showcase inventory and overflow`

### Task 17: Çocuk ve veli kabukları

**Dosyalar:** `src/app/shells/ShellNav.tsx`, `ChildShell.tsx`, `ParentShell.tsx` (+ `.module.css`), sayfa dosyaları, `router.tsx`, `routes.ts`, `tr.ts`, `e2e/routes.spec.ts`, `docs/ekranlar.md`.

- [ ] `ShellNav`: tek `nav`, düzen CSS ile değişir:
  - 700 px altında altta çubuk;
  - 700–1199 px'te 104 px ray ve "Tıkır" yazısı;
  - 1200 px ve üstünde 248–272 px kenar çubuğu.
  Etkin öğe `aria-current="page"` alır. Telefon ve web adları farklıysa iki ad da çizilir, biri gizlenir. Güvenli alan boşlukları kullanılır. Telefonda içerik çubuğun altında kalmaz.
- [ ] `ChildShell`:
  - öğeler: Yol, Kitaplık, Albüm, Stüdyo;
  - webde altta kilitli "Veli alanı" → `/veli`;
  - zemin `--color-ground`;
  - telefon ve tablette veli girişi yok (`TODO(design)`).
- [ ] `ParentShell`:
  - öğeler: Özet, Takılınan yerler, Ölçüm, Yazı ayarı, Kitaplar (`/veli/kitap`);
  - telefon ve tablette lacivert şerit ("Veli alanı" ve çocuk etiketi; veri yoksa etiket yok);
  - webde "Veli alanı" alt başlığı ve "Çocuk ekranı" → `/`;
  - zemin beyaz.
- [ ] Rotalar: `/`, `/kitaplik`, `/album`, `/studyo`, `/veli`, `/veli/takilinan`, `/veli/olcum`, `/veli/yazi`, `/veli/kitap`. Boş sayfalar.
- [ ] Önce e2e (`routes.spec.ts`):
  - her rota doğru kabuğu (`data-shell`) ve etkin gezinme öğesini verir;
  - 390 px'te `main`, alt çubuğun altında kalmaz;
  - dokunma hedefleri en az 44 px.
- [ ] `docs/ekranlar.md` rota tablosuna Albüm ve Stüdyo eklenir.
- [ ] Doğrulama: `pnpm check`, `pnpm e2e`, `pnpm shots / /veli`.
- [ ] Commit: `feat(shell): add child and parent shells with routes`

### Task 18: Seans kabuğu

- [ ] `SessionShell`: `{ chapterLabel?: string; companion?: { expression?: CompanionExpression; bubble?: ReactNode }; controls?: ReactNode }`. Adım rotadan gelir. Tıkır her zaman çizilir (varsayılan `normal`).
  - Telefon: kapat ikon düğmesi (44 px), adı olmayan küçük adım karoları, "N / 5" sayacı; Tıkır içeriğin sonunda; denetimler altta beyaz çubukta.
  - Tablet: kapat (48 px), adlı adım karoları, sağda bölüm etiketi; iki sütun (1,75 / 1), sağda Tıkır (190 px), balon ve denetimler.
  - Web: beyaz üst şerit ("Tıkır", bölüm etiketi, adlı adımlar, "Seanstan çık" bağlantısı); içerik en çok 1280 px; iki sütun.
  - İçerik genişliği 720 px altına inerse sütunlar alt alta dizilir.
- [ ] Kapat şimdilik `/` adresine gider (onay penceresi Faz 2'de; `TODO(design)`).
- [ ] Rotalar: G2–G7. e2e rota testine eklenir.
- [ ] Doğrulama: `pnpm check`, `pnpm e2e`, `pnpm shots /seans/oku`.
- [ ] Commit: `feat(shell): add session shell with routes`

### Task 19: Odak ve kurulum kabukları

- [ ] `FocusShell`: `{ title: string; subtitle?: string; backTo: string; aside?: ReactNode; action?: ReactNode }`.
  - Webde beyaz üst şerit ("Tıkır" ve sağda "Kitaplık" bağlantısı).
  - Geri düğmesi 44 ya da 48 px.
  - Telefonda eylem altta beyaz çubukta.
  - U3: "Kitabını kur" / "Her sıradan bir kart seç.", geri `/kitaplik`. U4: "Kitabın hazır", geri `/kitaplik/kur`.
- [ ] `OnboardingShell`: `{ step: 1|2|3|4; bubble?: ReactNode; action?: ReactNode }`.
  - İlerleme göstergesinin adı "Kurulum adımı N / 4"; yanında "N / 4".
  - Tablet ve webde solda kobalt pano: "Tıkır" yazısı, Tıkır ve balon, altta çini şeridi. Panonun genişliği tablette 420 px, webde 380–520 px.
  - Telefonda eylem altta beyaz çubukta.
- [ ] Rotalar: U3, U4 (`/kitaplik/:bookId/hazir`), K1–K4. e2e rota testine eklenir.
- [ ] Doğrulama: `pnpm check`, `pnpm e2e`, `pnpm shots /kitaplik/kur /kurulum/hesap`.
- [ ] Commit: `feat(shell): add focus and onboarding shells with routes`

### Task 20: Dış istek yok ve CSP

- [ ] Önce e2e (`no-external-requests.spec.ts`):
  - bütün rotalar yüklenir; her kabukta gezinme bağlantılarına tıklanarak dolaşılır (telefon ve web genişliği);
  - kendi kökeni dışına giden istek listesi boş (`data:` ve `blob:` hariç);
  - CSP ihlali iletisi yok.
- [ ] `vite.config.ts`: yalnız derlemede çalışan küçük bir eklentiyle CSP meta etiketi (karar 6).
- [ ] Doğrulama: `pnpm e2e`; `dist/index.html` içinde CSP etiketi.
- [ ] Commit: `test(e2e): assert no cross-origin requests and add CSP`

### Task 21: Kabuk karşılaştırması

- [ ] `pnpm shots / /seans/oku /kitaplik/kur /kurulum/hesap /veli`.
- [ ] Her görüntü `design/png/<kod>-*.png` ile yan yana karşılaştırılır.
- [ ] Kabuk farkları düzeltilir; düzeltme başına bir commit (`fix(shell): …`).
- [ ] İçerikten gelen farklar (içerik Faz 2–5'te gelecek) "Kanıtlar" bölümüne yazılır.
- [ ] Commit: `docs: record shell comparison`

### Task 22: Belgeler

- [ ] `CLAUDE.md` "Komutlar" bölümü gerçek komutlarla güncellenir; her komut çalıştırılarak doğrulanır.
- [ ] `docs/kararlar.md`: bağımlılık tablosu tam; değişen kararlar; değişiklik günlüğü.
- [ ] `docs/mimari.md`: `styles` klasörü (`tokens-extra.css`) ve e2e kipi.
- [ ] Commit: `docs: update commands and decisions for phase 0`

### Task 23: Kabul ölçütleri yürüyüşü (commit yok)

- [ ] Yedi ölçüt tek tek yürünür. Her biri için çalıştırılan komut ve çıktısı ya da ekran görüntüsünün yolu gösterilir. Tutmayan ya da doğrulanamayan ölçüt "tuttu" diye yazılmaz.

## Kanıtlar

Task 7, 21 ve 23'te dolar.

### Yazı tipleri (Task 7)

- `pnpm exec vite build` yalnız dört yazı tipi dosyası üretir: Atkinson Hyperlegible Next değişken (latin, latin-ext) ve Didact Gothic 400 (latin, latin-ext). İtalik ve başka alt küme yok.
- `e2e/smoke.spec.ts` → "the interface font is loaded from our own origin": `fonts.css` kaldırılınca kırmızı (0 yüz yüklendi), geri gelince yeşil.
- Didact Gothic Türkçe harf denetimi (Chromium, tek seferlik; iki ayrı yedek aileyle ölçülen genişlik aynı çıktı): `ğ ş ı İ Ğ Ş ç ö ü Ç Ö Ü â î û` harflerinin hepsi Didact Gothic'ten çiziliyor, yedek yazı tipine düşen harf yok.
