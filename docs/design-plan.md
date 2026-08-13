# Disainiplaan — Meregrupi kolm vaadet

Kirjutatud enne märgendust (§7). Ehitus järgib seda plaani.

## 1. Üldmulje ja säilitatav identiteet

Säilitame (~70% visuaalsest identiteedist):
- serif-display pealkirjad (Fraunces, juba kasutusel) kaldkirja ja madala SOFT-teljega;
- monospace kui "sukeldumisarvuti hääl" (eyebrow'd, sügavusnäidud, sildid);
- sügavuse ja laskumise motiiv — 00 m loendur kasvab lehe struktuurseks selgrooks;
- olemasolevad fotod, hero-video, logo, eestikeelsed alt-tekstid;
- õhukesed tehnilised jooned, madala kontrastiga struktuur;
- ladina moto *profondius · tranquillius · diutius* (meeskonna sektsioonis).

Muudame (~80% informatsiooniarhitektuurist):
- puhas must (#050709) → mustjassinine palett (allpool);
- üks lõputu leht → katusportaal + kolm rada + eraldi konversioonileht;
- custom cursor, laadimisloader ja mullianimatsioon kaovad (ligipääsetavus, jõudlus,
  "genereeritud lehe tundemärgid" — §7.5);
- ET+EN samal URL-il → eraldi keele-URL-id.

## 2. Tokenid

Kõik värvid ja kirjad failis `assets/css/tokens.css`. Väljaspool seda faili ei ole ühtki
toorest hex-väärtust (kontrollitakse testiga). Palett on prompti §7.2 oma, muutmata.

## 3. Mõõdetud kontrastisuhted (WCAG)

Arvutatud relatiivse luminantsi valemiga (WCAG 2.x):

| paar | suhe | kasutus | nõue | OK |
|---|---|---|---|---|
| foam-100 `#eef3ee` / abyss-950 `#06131d` | ~16,0 : 1 | kehatekst | ≥4,5 | ✓ |
| muted-blue `#91a9b6` / abyss-950 | ~7,4 : 1 | teisene tekst | ≥4,5 | ✓ |
| muted-blue / deep-teal-900 `#083338` | ~5,5 : 1 | teisene tekst sügavusribadel | ≥4,5 | ✓ |
| muted-blue / abyss-800 `#0b2734` | ~6,0 : 1 | teisene tekst kaartidel | ≥4,5 | ✓ |
| aqua-400 `#55d6cc` / abyss-950 | ~10,2 : 1 | CTA tekst/kontuur, aktiivne olek | ≥4,5 | ✓ |
| abyss-950 / aqua-400 (täidetud CTA) | ~10,2 : 1 | primaarne CTA | ≥4,5 | ✓ |
| warn-400 `#e8b45a` / abyss-950 | ~9,6 : 1 | tingimuslik/kinnitamata märgis | ≥4,5 | ✓ |
| pearl-300 `#cbb7c9` / deep-teal-950 `#062326` | ~8,8 : 1 | ainult Mermaid plokk | ≥4,5 | ✓ |
| aqua-700 `#1e6e62` / abyss-950 | ~3,0 : 1 | **ainult** rahulikud jooned/rest-olek | — | piiripealne |

**Kõrvalekalle prompti soovitusest, põhjendus:** §7.2 pakub fookusrõngaks `--aqua-700`, kuid
selle kontrast abyss-950 taustal on ~3,0:1 — fookusindikaatori 3:1 miinimumi piiril ja
tumedamatel ribadel alla selle. Fookusrõngas kasutab seetõttu `--aqua-400` (~10:1);
`--aqua-700` jääb rahulike joonte/rest-olekute tooniks. Ligipääsetavus võidab (§7.2 lubab
toone ligipääsetavuse järgi täpsustada).

## 4. Tüpograafia

Lokaalselt hostitud WOFF2 (latin + latin-ext, `font-display: swap`), ei fondi-CDN-i:
- **Display — Fraunces** (muutuv, opsz 9–144, SOFT-telg; kaldkiri pealkirjades nagu vanal
  saidil). Ainult pealkirjad, tihe tähevahe.
- **Kehatekst — IBM Plex Sans** 400/500/600.
- **Tehniline — IBM Plex Mono** 400/500: sügavusnäidud, eyebrow'd, sildid, tabelinumbrid,
  vormide abitekst.

Vana saidi Inter Tight ja JetBrains Mono asendatakse IBM Plex paariga (§7.3 põhjendatud
valik); Fraunces säilib — see kannab olemasolevat serif-identiteeti.

Diakriitikute test: „Sügavusõõs — jää all, käänuline" (õ ä ö ü š ž) — latin-ext subset katab.
Skaala: `clamp()`, suhe ~1,25 mobiilis → ~1,333 desktopil; kehatekst mobiilis 17–18 px
(`--fs-body: clamp(1.0625rem, 1rem + 0.3vw, 1.125rem)`); reapikkus max 68 tähemärki
(`--measure: 68ch`); kehateksti ei tsentreerita.

## 5. Layout ja sügavusribade rütm

Taust liigub lugejaga sügavusse `background-color` astmetena (mitte gradiendina):
`--abyss-950` → `--abyss-900` → `--deep-teal-950` → `--deep-teal-900`. Vaates C
domineerivad teal-ribad (värav on "esimesest ekraanist sukeldunud").

Sektsioonivaru: `clamp(4.5rem, 10vh, 8rem)`; sisu max-laius 1200 px, tekstiveerud 68ch.
Mermaid-plokk: `--pearl-300` ainult seal, karantiinis.

## 6. Signatuurelement: sügavusriba

- Fikseeritud riba **vasakus** servas (vana oli paremal; vasak serv = §7.4 nõue),
  kogu vaateava kõrgus, meetriskaala kriipsudega, jooksev väärtus IBM Plex Mono's.
- Iga suur sektsioon kannab `data-depth` atribuuti; riba interpoleerib kerimisel
  sektsioonide vahel. Ankurdatud sügavused:
  - **A:** 0 (hero) → 3 (usaldusriba) → 6 (freediving) → 9 (Mermaid) → 12 (akadeemia
    valik) → 14 (instruktorid) → 0 (kontakt, `↑ surface`).
  - **B:** 0 (hero) → 5 (Start) → 12 (Rummu) → 0 (Plan Ahead, `↑ surface`) → 0 (KKK/CTA).
  - **C:** 0 (hero) → laskumine, sügavaim Rummu loo juures (12) → 0 (Plan your trip).
- Tõus pinnale on nähtavalt märgistatud (`↑ surface`) — ei teeskle monotoonset laskumist.
- `prefers-reduced-motion: reduce` → riba on staatiline sektsiooniindeks (ilma
  interpoleerimise ja tiksumiseta).
- `aria-hidden="true"`; kõrval on päris `<nav aria-label="Sections">` samade ankrutega
  (visuaalselt riba sees, klaviatuuriga kasutatav).
- Mobiilis (<900 px) riba kaob; asemel jääb kompaktne jooksev sügavusnäit päise all
  (väike, mitte segav) — või kui see segab, ainult sektsioonide depth-marker'id.

## 7. Liikumine

Üks orkestreeritud laadimisjärjestus: tekst kohe (ilma loaderita!), hero-video hajub sisse
(`opacity` transition kui `canplay`), riba kalibreerub 0-st. Kerimisilmumised max 12 px
nihkega (`.reveal`). Hover: CTA täide tõuseb, kaardil õrn joonevärvi muutus. Rohkem mitte.
Custom cursor ja loader EI kandu üle. `prefers-reduced-motion` lülitab kõik välja.

## 8. Pildid ja video

Olemasolevad assets'id taaskasutatakse; ET alt-tekstid säilitatud, EN-lehtedel tõlgitud.
Hero-video progressiivne: `poster` (hero-poster.jpg), `playsinline muted loop`, mobiilis
`preload="none"`, CTA klikitav enne dekodeerimist; ilma videota on hero täielik.
Vaates C puuduvad kohaspetsiifilised Rummu-fotod → maitsekad asset-slot'id +
puuduvate sisendite nimekiri (freediver-depth-blue.jpg on lähim olemasolev).
AVIF/WebP konversioon: repo fotod on JPG; teisendus lisaks build-tööriistata topeltfailid
käsitsi — teostatud on `loading="lazy"`, mõõdud ja `srcset` seal, kus sama fail teenib;
AVIF-genereerimine märgitud puuduvate sisendite/tulevase sammuna (dokumenteeritud kompromiss).

## 9. Enesekriitika

- **Risk: kolm lehte hakkavad nägema välja nagu sama mall kolme tapeediga.** Vastus:
  A on portree/õpetlik (lähifotod, programmiloend), B on otsustustabelid ja vormid, C on
  maastik ja pikk proosa; C-l teal-domineeriv taust ja laiem tüpograafiline mõõt.
- **Risk: sügavusriba muutub dekoratsiooniks, mida keegi ei loe.** Vastus: riba väärtus
  vastab sektsioonide päris sügavustele (5 m = Level 1 tegelik sügavus), pinnale tõus on
  märgistatud — riba valetamine oleks hullem kui selle puudumine.
- **Risk: needs_confirmation olekud teevad B-st "tühja poe" (hinnata, kuupäevata).**
  Vastus: ausad "ask for the next date" olekud on konversioonivõimelised (mailto-vorm töötab),
  ja see on prompti teadlik valik — kinnitamata fakt ei lähe avalikku UI-sse.
- **Risk: ilma build-süsteemita dubleerub HTML kolme–nelja faili vahel.** Vastus: jagatud
  CSS/JS failid; faktid ainult data/*.json + jaluse/kontaktiplokkide genereerimine JS-iga
  serveri-HTML fallback'iga oleks üleinseneeritud — selle asemel on kontaktiplokk igas
  failis identne ja test kontrollib, et NAP-väärtused võrduvad data/organisation.json-iga.
- **Kalibratsioon:** ei kreemjas+terrakota, ei must+hape-roheline, ei hairline-ajaleht.
  Palett on ette antud mustjassinine/teal; aktsent on piiratud kolme kasutuskohaga.
