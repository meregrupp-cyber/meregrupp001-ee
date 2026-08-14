# Vastus auditile 2026-08-14 — meregrupp.ee repo

Auditi fail: `Meregrupp_portaalide_audit_2026-08-14.md` (neli kanalit).
See repo katab **ainult** `meregrupp.ee` (ET `/`, EN `/en/`) ja `freedive.ee` värava
staging-koopia (`freedive-ee/`). `freediving.meregrupp.ee`, live-`freedive.ee` origin,
Cloudflare, Facebook ja analüütikakontod on väljaspool — need on loetletud failis
`docs/owner-actions.md` koos kontrollkäskudega.

## Tehtud (P0)

| Auditi punkt | Mis muutus |
|---|---|
| avalikud tootmismärkmed | „Programmide arv tuleb loendist…" / „The program count comes from this list…" eemaldatud mõlemast keeleversioonist; test hoiab ära tagasituleku |
| ET keeleparandused | „buddy-põhimõte" → „paarilise põhimõte"; „registreeritud med õde" → „registreeritud õde"; „muinasvrakile sukelduja" → „muinasvraki sukelduja"; CTA-d „Explore Rummu" → „Avasta Rummu", „Plan Ahead" → „Plaani ette" |
| EN keeleparandused | „in the pool and theory room" → „…and in theory sessions"; „08 paths through the depth" → „08 paths into the deep"; eestikeelne manifest märgitud `<q lang="et">` ja tõlgitud; jutumärgi/mõttekriipsu vahe korras |
| vormide valeliid | `assets/js/forms.js`: mailto-teesklus välja. Endpoint puudub → vorm ei teeskle saatmist, vaid näitab ausat teadet otsekontaktiga. Endpoint olemas → `submit_lead` alles pärast HTTP 2xx |
| mõõtmine ei tööta | `assets/js/analytics.js` on nüüd päris adapter: nõusolekuvärav, GA4/GTM/Meta pakkujad, `event_id` deduplikatsioon, domeenideülene omistamine, PII-filter. ID-d tulevad `assets/js/analytics-config.js`-st (tühi šabloon) |

## Tehtud (P1)

| Auditi punkt | Mis muutus |
|---|---|
| `llms.txt` faktiomanik | lisatud kanooniliste faktiallikate tabel; parandatud vale väide, nagu suunaks `freedive.ee` broneerimiseks `meregrupp.ee`-le (õige siht on subdomeen); „booking" → „päring/inquiry" |
| `robots.txt` AI-reeglid | lisatud selge `OAI-SearchBot: Allow` (ChatGPT Search nähtavus), `ChatGPT-User: Allow`; GPTBoti treeningureegel märgitud eraldi omaniku otsuseks; Cloudflare'i vastuolu kirjeldatud `docs/cloudflare-rules.md` p 3 |
| mobiili LCP / hero | `hero.mp4` 7,7 MB → 0,60 MB, `hero.webm` 0,84 MB → 0,37 MB (heliriba maha, mõistlik bitikiirus). Video allikad lisab JS ainult siis, kui ei ole reduced-motion, Save-Data, 2G ega kitsas ekraan — mobiilis videot **ei laadita üldse** |
| pildid | AVIF/WebP/JPEG variandid `assets/img/` (`srcset`/`sizes`, mõõdud paigas); logo 233 KB → 23 KB; hero-poster 450 KB → ~5 KB (AVIF 640) |
| turbepäised | väärtused failis `_headers` + täpsed Cloudflare Transform Rule'id (`docs/cloudflare-rules.md`), CSP alustab Report-Only režiimis |
| vana URL 301 | `docs/cloudflare-rules.md` p 1: täpne Redirect Rule + `curl -I` kontroll. Repo leht `en/freediving/` jääb varuteeks (GitHub Pages ei suuda 301-e) |
| puutesihtmärgid | menüü, keelevalik, jaluse lingid ja sügavusriba punktid said ≥24–44 px klikiala |
| `freedive.ee` värav (staging) | lingisildid näitasid `meregrupp.ee`, aga viisid subdomeenile — parandatud; „booking site" → `freediving.meregrupp.ee` ja päringu sõnastus; rajaankrud (`#start/#rummu/#plan`) lisatud; „fundive" defineeritud esmakasutusel |

## Mõõdetud tulemus

Mobiilivaate esimene laadimine (`/`, 390 px, tühi vahemälu, kohalik server):

| | enne | pärast |
|---|---:|---:|
| kokku | **2168 KB** | **501 KB** |
| hero-video | 821 KB (Chrome/WebM) või **7,7 MB** (iOS/MP4) | **0 KB** — mobiilis ei laadita |
| hero-pilt | 450 KB (JPEG poster) | ~5 KB (AVIF 640) |
| logo | 233 KB × 2 | 23 KB × 2 |

Pärast jäänud suurim plokk on fondid (368 KB) — see on eraldi järgmine samm, mitte
auditi punkt.

## Testid

```
node tests/check.mjs          # staatiline kontroll (canonical, JSON-LD, NAP, hinnad,
                              # tootmismärkmed, keeleparandused, robots, llms, _headers,
                              # responsive pildid, hero-video suurus, varade olemasolu)
node tests/analytics.test.mjs # dedup, PII, nõusolek, domeenideülene omistamine
node tests/e2e.mjs            # brauser: video laadimise tingimused, 320 px, H-tasemed,
                              # ilma JS-ita sisu (vajab playwright'i; muidu SKIP)
```

Kõik kolm läbivad. E2E kinnitab: lauaarvutis video laaditakse, mobiilis ja
reduced-motion režiimis mitte; 320 px vaates ei teki horisontaalset kerimist; ilma
JavaScriptita on kolm rada, kontakt ja hero-pilt olemas.

## Rollback

Kõik muudatused on ühes PR-is ja puhtalt failipõhised — `git revert` taastab eelmise
oleku. Meediafailid: `assets/hero.mp4` ja `assets/hero.webm` on üle kirjutatud
(uuesti kodeeritud); originaalid on git-ajaloos eelmises commit'is. Uued variandid
`assets/img/` all on lisandused — vanad `assets/*.jpg` failid on alles ja endiselt
viidatud JSON-LD-s.

Migratsioone ega andmebaasimuudatusi ei ole.

## Mida see PR EI tee

Vt `docs/owner-actions.md`. Lühidalt: vormide endpoint ja e-post/CRM, GA4/GTM/Meta ID-d,
Cloudflare'i reeglid (301, turbepäised, robots-vastuolu), subdomeeni `/start/ /rummu/
/plan/…` lehed ja sealsed vormid, live-`freedive.ee` origin, Facebooki avalik profiil,
Search Console / Bing ning päris seadmete vastuvõtutest. Ükski neist ei ole selles repos
lahendatav ja ühtegi neist ei ole siin teeseldud.
