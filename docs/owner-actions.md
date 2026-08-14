# OWNER ACTION / BLOCKED — mida see repo ise ära teha ei saa

Alus: `Meregrupp_portaalide_audit_2026-08-14.md`. Selles failis on ainult need auditi
punktid, mille lahendus **ei ole** meregrupp.ee lähtekoodis: võõras repo, Cloudflare'i
seadistus, kolmanda osapoole konto, päris seade või omaniku otsus. Iga rida ütleb, mis on
vaja, kes teeb ja kuidas tulemust kontrollida.

Repo sees tehtud töö on kirjas `git log`'is ja PR-kirjelduses.

---

## 1. Vormide vastuvõtt (audit P0) — BLOCKED: pole endpoint'i ega repo

`meregrupp.ee` **ei sisalda ühtegi vormi** — kolm päringuvormi elavad subdomeeni repos
(`freediving.meregrupp.ee`) ja `plan-your-trip` vorm freedive.ee origin'is. Selles repos
on parandatud ainult jagatav brauserikiht `assets/js/forms.js`: mailto-teesklus on välja
võetud, `submit_lead` käivitub ainult HTTP 2xx järel, ilma endpoint'ita näidatakse ausat
teadet otsekontaktiga.

Omaniku/arendaja teha:

1. Vali vastuvõtja (nt Cloudflare Pages Function/Worker + e-post või CRM). **Saladusi ei
   commit'ita** — endpoint ja võtmed keskkonnamuutujatena.
2. Endpoint peab tegema: serveripoolne valideerimine, honeypot, rate limit, payload-piir,
   CORS ainult meregrupp.ee / freediving.meregrupp.ee / freedive.ee origin'itele,
   struktureeritud liidikirje (rada, keel, leht, viitaja, UTM-id, ajavahemik, grupi suurus,
   kogemus, kontakt, nõusoleku versioon).
3. Automaatkinnitus kliendile + struktureeritud teavitus tiimile.
4. Rajapõhised tänuolekud (Start / Rummu / Plan) — `data-thanks` vormil.
5. Seadista `window.MG_FORMS_CONFIG = { endpoint: '…' }` (või `data-endpoint` vormil).

Kontroll: üks testpäring → 2xx, üks liidikirje, üks automaatkinnitus, täpselt üks
`submit_lead` sündmus.

## 2. Mõõtmine (audit P0) — OWNER ACTION: konto-ID-d

Kood on valmis (`assets/js/analytics.js`, skeem `docs/analytics-events.md`). Puudu on
ainult ID-d:

1. Täida `assets/js/analytics-config.js` → `ga4Id` **või** `gtmId` (mitte mõlemat) ja
   soovi korral `metaPixelId`.
2. GA4-s: loo `submit_lead`, `qualified_lead`, `booking_confirmed` konversioonideks.
3. Kontrolli DebugView'is: üks testpäring = üks `submit_lead`, `campaign_source` säilib
   ka siis, kui tulla `freedive.ee` kaudu.

Kuni ID-d on tühjad: nõusolekuriba ei kuvata, ühtegi välist skripti ei laadita, sündmused
jäävad ainult `window.mgEventQueue`'sse.

## 3. Cloudflare (audit P0/P1) — OWNER ACTION

Täpsed reeglid, väärtused ja kontrollkäsud: **`docs/cloudflare-rules.md`**.

- `/en/freediving/` → päris **301** (praegu 200 + meta refresh);
- turbepäised: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  CSP kõigepealt **Report-Only**;
- robots.txt vastuolu: Cloudflare'i hallatud AI-blokk vs repo `robots.txt`;
- vahemälu: versioonitud varadele pikk immutable (vt `_headers`).

## 4. Subdomeen `freediving.meregrupp.ee` (audit P0/P1) — BLOCKED: teine repo

Selle repo muudatused ei jõua subdomeenile. Seal on teha:

- kolme vormi `mailto:` action ja tühi `MG_FORM_ENDPOINT` → päris endpoint (vt punkt 1);
- indekseeritavad lehed `/start/`, `/rummu/`, `/plan/`, `/safety/`, `/faq/`, `/team/`,
  `/book/` — ilma `freedive.ee` sihtkohatekste dubleerimata;
- avalikud tootmismärkmed („Photo slot: a real Rummu gallery…" jt) välja;
- auditi eestikeelsed keeleparandused (tabel auditi ptk „Õigekiri, terminoloogia ja
  toimetus"): „ajakavale", „vabasukeldumisreis", „paarilise põhimõte", „juhendaja",
  „toimumisotsus", „registreeritud õde" jne;
- pealkirjatasemete (H1–H3) järjekord ja liiga väikesed puutesihtmärgid;
- `assets/js/analytics.js` ja `assets/js/forms.js` võib sellest repost üle võtta —
  need on kirjutatud jagatavaks.

## 5. `freedive.ee` origin (audit P0/P1) — BLOCKED: eraldi origin

Repos on ainult staging-koopia (`freedive-ee/index.html`), mis läheb live'i käsitsi
(`freedive-ee/DEPLOY.md`). Auditi leitud vead **praegusel live-lehel**
(`day.The`, `guide.A`, `here.Current`, `share onfreedive.ee`, „same a personal reply")
on vanas sisus — cutover'iga kaovad, sest uus leht ei sisalda neid tekste. Kuni cutover'it
ei ole, on need parandused live-origin'is käsitsi teha.

Lisaks: `/plan-your-trip/` vormi tühi `data-endpoint` ja lubadus automaatkinnitusest —
kas ühendada endpoint (punkt 1) või eemaldada lubadus, kuni teenus töötab.

## 6. Facebook (audit P0) — OWNER ACTION, Claude Code ei lahenda

- Page Intro / esimene kategooria: **freediving courses and guided dives in Estonia**;
- CTA-nupp → `freediving.meregrupp.ee` sobivale päringuteele;
- About-linkidesse subdomeen esimeseks, ebavajalik hinnatase (`££`) maha;
- kinnitatud (pinned) ingliskeelne postitus kolme rajaga + UTM-lingid;
- kaanepilt uuesti eksportida nii, et vasak „START" plokk ei jää profiilipildi alla;
- „Plan Ahead" kirjeldada 6–12 kuu ette planeeritava Eesti vabasukeldumisreisina;
- „Estonia's most unique location" → kontrollitav sõnastus, nt „a distinctive flooded
  quarry in Estonia";
- Meta Events Manager alles pärast nõusolekupõhise Pixeli tööle saamist (punkt 2).

## 7. Search Console / Bing (audit P1) — OWNER ACTION

Verifitseerida kõik kolm domeeni, esitada sitemap'id, kontrollida URL Inspectioniga
kanoonilist versiooni, taotleda uuesti indekseerimist ja jälgida 90 päeva
(`docs/90-day-review.md`).

## 8. Päris seadmete vastuvõtutest (audit) — OWNER ACTION

Emulatsioon ei asenda päris seadet. Enne reklaamiliikluse avamist läbida auditi
testmaatriks: iPhone SE + iPhone 15/16 (Safari), iPad, Android Chrome, Windows 11
Chrome + Edge, macOS Safari. Igas keskkonnas kogu teekond: sihtlink → pakkumine → vorm →
kinnitus → liidikirje → üks analüütikasündmus. Testida ka JavaScriptita.

## 9. Kinnitust ootavad faktid — vt `docs/needs-confirmation.md`

Sh: vastuseaja standard („kaks tööpäeva" vs „ei lubata"), GPTBoti treeningupoliitika,
kutsenimetused (registreeritud õde, muinasvraki sukelduja / „Ancient Shipwreck Diver"),
Mermaid Sport lansseerimise aeg.
