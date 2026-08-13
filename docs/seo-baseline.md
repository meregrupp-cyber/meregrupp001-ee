# SEO baseline — meregrupp.ee ja freedive.ee

Lähteseis kontrollitud 2026-08-13 (live-crawl + repositoorium `meregrupp001-ee`).
Vorm: `element | vanal saidil | Vaates A | Vaates B | Vaates C | märkus`.

Vaade A = `https://meregrupp.ee/` (ET) + `/en/` (EN) — see repo, GitHub Pages.
Vaade B = `https://freediving.meregrupp.ee/` (eraldi repo `mgfreediving001-ee`; vana
`/en/freediving/` path on viiteleht — vt märkus M1).
Vaade C = `freedive.ee` (eraldi sait Cloudflare'i taga; siin repos staging kaustas `freedive-ee/`, noindex).

## meregrupp.ee

| element | vanal saidil | Vaates A | Vaates B | Vaates C | märkus |
|---|---|---|---|---|---|
| Indekseeritavad URL-id | ainult `/` (üks HTML-fail) | `/` (ET), `/en/` (EN) | `/en/freediving/` | — | Uued URL-id lisatakse sitemap'i |
| title | `Meregrupp — Allvee Akadeemia \| Vabasukeldumine Eestis` | ET: säilitatud samana; EN: `Meregrupp — Aquatic Academy \| Freediving & Underwater Sports in Estonia` | `Freediving in Estonia \| Courses, Rummu Fundives & Trip Planning` | — | Klastrid: docs/keyword-ownership.csv |
| H1 | `Allvee Akadeemia` / `Aquatic Academy` (JS-vahetusega samal URL-il) | ET `/`: `Allvee Akadeemia`; EN `/en/`: `Aquatic Academy` | `Freediving in Estonia. Choose the route that fits your level and timing.` | — | Üks H1 lehe kohta |
| meta description | olemas (ET) | säilitatud ET-l; EN-il oma | oma, kursusekavatsus | — | |
| meta keywords | olemas | üle kantud | üle kantud (EN variant) | — | Legacy-signaal, säilitatud põhjendusega "ära kaota ilma põhjuseta" |
| meta author | `MTÜ Meregrupp` | üle kantud | üle kantud | — | |
| robots meta | `index, follow, max-image-preview:large, max-snippet:-1` | üle kantud | üle kantud | — | Staging-failid (freedive-ee/) kannavad `noindex` kuni cutover'ini |
| language meta | `Estonian` | ET-lehel säilitatud; EN-lehel `English` | `English` | — | |
| geo.region / geo.placename | `EE-37` / `Tallinn` | üle kantud mõlemale keelele | üle kantud | — | |
| canonical | `https://meregrupp.ee/` | ET `/` iseendale; EN `/en/` iseendale | `/en/freediving/` iseendale (vt M1) | — | Root'i canonical EI muutu — ET jääb `/` peale |
| hreflang | et, en, x-default → kõik `/` (defekt: kolm sama URL-i) | et → `/`, en → `/en/`, x-default → `/en/` | iseendale `en` (B on ainult EN) | — | Vana muster oli sisuliselt katkine; uus järgib prompti §9 riskivähendavat vaikelahendust |
| Open Graph | täielik (og:type/url/title/description/image 1200×630 + alt, site_name, locale et_EE + alternate en_US) | üle kantud, URL-id lehepõhised | oma OG, sama pilt kuni B-spetsiifiline OG-pilt olemas | — | `assets/og-image2.jpg` taaskasutatud |
| fb:app_id | `1281329930736127` | üle kantud | üle kantud | — | |
| Twitter card | täielik (summary_large_image + alt) | üle kantud | üle kantud | — | Vana twitter:description ütles "Üheksa programmi" — parandatud (vt content-assumptions) |
| JSON-LD | @graph: EducationalOrganization/LocalBusiness/SportsActivityLocation + WebSite + ItemList + BreadcrumbList | sama graaf parandatuna (vt defektid all) | Organization sama `@id` + WebPage + FAQPage | — | Defektid vanas: ItemList `numberOfItems: 8` aga org description ütleb "üheksat"; DPV ListItem dubleeritud position 5 kaks korda, ujumine (01) puudub; e-post `info@meregrupp.ee` erineb UI omast; areen 3×3 vs UI 4×4 |
| sitemap.xml | ainult `/`, hreflang kolm × sama URL | `/`, `/en/`, `/en/freediving/` õigete hreflang'idega | kaasatud | — | Ainult canonical 200-lehed |
| robots.txt | Allow all + AI-crawlerid (GPTBot, ChatGPT-User, Google-Extended, PerplexityBot, ClaudeBot, anthropic-ai, CCBot) lubatud | säilitatud muutmata | — | — | Crawler-poliitikat EI muudetud (prompti §14.3) |
| llms.txt | puudub | lisatud `/llms.txt` | kaetud sama failiga | — | Abistav avastusfail, mitte ranking-garantii |
| favicon | `assets/mgakalogoo.png` (png, ka apple-touch) | säilitatud | säilitatud | — | |
| 404 | `404.html` päris 404 staatusega, KUID meta-refresh 2 s → avaleht | meta-refresh eemaldatud, abistav 404 jääb | sama fail | — | Auto-redirect avalehele = soft-404 muster, prompti §6.1 keelab |
| Fragmendid | `#programmid`, `#meeskond`, `#kontakt` | id-d säilitatud uuel lehel | — | — | Ei vaja server-redirecte |
| Proton Drive lingid | 5 välist dokumendilinki (Freediving L1, Merineitsi L1, Allveevõitluse reeglid, MGVS, Basseinipääste) | säilitatud programmiplokkides seni, kuni HTML-vasted on olemas (§6.1) — freediving L1 link asendatud lingiga Vaatele B | Freediving L1 sisu kodu on B | — | Ühtki Proton-linki ei eemaldatud enne HTML-vaste olemasolu; freediving-programmi plokk lingib nüüd B-le, Proton-link säilib B lehel viitena kuni omanik kinnitab sisu |
| Analüütika / Search Console tokenid | ei leitud (ei GA, ei GTM, ei verifitseerimis-meta) | — | — | — | Midagi säilitada pole; event-helper lisatud ilma ID-deta |
| Sisu keelemudel | ET+EN korraga DOM-is, JS-lüliti, üks URL | eraldi URL-id `/` ja `/en/` | ainult EN | ainult EN | Vana muster eemaldatud indekseeritavatelt lehtedelt (§9, §14.3) |

## freedive.ee

| element | vanal saidil | Vaates C (staging) | märkus |
|---|---|---|---|
| Indekseeritavad URL-id | ainult `/` + fragmendid `#courses #method #training #youth #contact` | `/` jääb 200; fragmendikaardistus JS-is | Kursusefragmendid kaardistatakse Vaatele B |
| title | (kursusekavatsusega) | `Freediving Destination Estonia — Rummu, Baltic Sea & Ice` (sihtkohakavatsus) | |
| meta description | olemas (ainus SEO-element) | uus, sihtkohakavatsus | |
| canonical, OG, Twitter, hreflang, robots, JSON-LD, sitemap | **kõik puuduvad** | kõik lisatud staging'us; hreflang ainult iseendale `en` | Siin polnud midagi säilitada — ehitatud nullist |
| Kursused (L1 €180, L2), vanusepiirid, ujumisnõue, "join the group" | avalikult üleval | **eemaldatud**; asendatud üleandmislinkidega Vaatele B (`?utm_source=freedive_ee&utm_medium=referral&utm_campaign=gateway&route=…`) | Prompti §11 nõue; B peab olema live enne freedive.ee cutover'it |
| "Attention Deconcentration & Breathing" | olemas | säilitatud sihtkohasisuna ("How Estonians train") | Päris metoodiline eristaja |
| Aastaringne / jää-alune treening | olemas | säilitatud ja laiendatud sihtkohasisuna | |
| AIDA alla-16 piirtabel | olemas, omistatud AIDA-le | **EI kantud üle** — vajab omaniku otsust allika ja omistuse kohta (§3.6) | Kirjas needs-confirmation.md |
| AIDA sertifikaadilink (instruktori isiklik, eos.aidainternational.org/print_certificate/51738) | olemas | hoitud `needs_confirmation` olekus — isiklik kvalifikatsioon lubatud ainult omaniku kirjaliku kinnitusega | §3.6 |
| Kontakt | `meregrupp@gmail.com` (obfuskeeritud cdn-cgi kaudu), +372 510 5573, aadressi pole | NAP ühtsest `data/organisation.json` failist; e-posti lahknevus vajab omaniku otsust | docs/nap-inconsistencies.md |
| Cloudflare cdn-cgi e-posti kaitse | töötab | staging ei avalda paljast mailto'd enne samaväärset kaitset — kontakt suunatakse meregrupp.ee kontaktisektsioonile | §6.1 |

## merehunt.ee

Registreeritud ainult inventuuriks (§5): jaluses viidatud kolmas domeen. Sisu ei puudutatud.
Indekseerituse kontroll vajab Search Console'i ligipääsu — pole saadaval, märgitud puuduvaks allikaks.

## Puuduvad allikad (§5 lubatud erand)

- Google Search Console — ligipääsu pole; indekseeritud lehtede, top landing page'ide ja 404-raporti
  inventuur tegemata. `docs/90-day-review.md` eeldab, et omanik annab ligipääsu.
- Analüütika — saidil pole ühtegi analüütikaskripti, seega ajaloolisi landing page'e pole olemas.
- Serveri/CDN-logid — GitHub Pages ei anna logisid; Cloudflare'i logid vajavad omaniku kontot.

## M1 — Vaate B canonical'i otsus (LAHENDATUD 2026-08-13)

Selgus, et `freediving.meregrupp.ee` on olemas ja seda teenindab eraldi repo
`meregrupp-cyber/mgfreediving001-ee` (GitHub Pages + CNAME). Vaade B tõsteti sinna kui oma
lõplikule kodule (I etapi projektidokumendi §3 kohaselt): canonical on nüüd
`https://freediving.meregrupp.ee/`. Vana `/en/freediving/` path on canonical+meta-refresh
viiteleht, mis säilitab query-parameetrid ja fragmendi (GitHub Pages ei toeta server-301-e).
Subdomeeni vana ET-kursuseleht säilitati failina `index.legacy.html` (rollback) ja selle
ankrud kaardistati kliendipoolselt. Kursusekavatsuse klastrite omanik-URL on nüüd subdomeen
(vt keyword-ownership.csv).


## M2 — freedive.ee edasilükkamine (omaniku otsus 2026-08-13)

freedive.ee kasutab Cloudflare'i repot, millele selles sessioonis ligipääsu pole. Omaniku
otsus: jätta freedive.ee praegu puutumata ja teha värava cutover tulevikus. Staging
(`freedive-ee/` + DEPLOY.md) jääb valmis; staging'u üleandmislingid osutavad juba
`freediving.meregrupp.ee`-le, nii et tulevane deploy ei vaja linkide muutmist. Kuni
cutover'ini dubleerib live freedive.ee kursuseinfot (€180 jm) — see on teadaolev,
dokumenteeritud vaheolek, mille lahendab värava deploy.