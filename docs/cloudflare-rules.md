# Cloudflare'i reeglid — meregrupp.ee

Origin on GitHub Pages (vt `CNAME`), mis **ei toeta** server-301-e ega kohandatud
vastusepäiseid. Kõik allolev tuleb seetõttu teha Cloudflare'is. Failis `_headers` on
samad väärtused versioonihalduses, aga GitHub Pages ei loe seda faili — Cloudflare on
ainus koht, kus need päriselt jõustuvad.

Iga reegli juures on kontrollkäsk. Reegel loetakse tehtuks alles siis, kui käsk annab
oodatud vastuse.

---

## 1. Vana freediving'i URL → päris 301 (audit P1)

**Probleem:** `https://meregrupp.ee/en/freediving/` vastab praegu `200` + meta-refresh +
JS-suunamine. Otsingumootorile on see vahepealne dokument, mitte suunamine.

**Reegel** — Rules → Redirect Rules → Create rule:

- Nimi: `legacy /en/freediving/ → freediving.meregrupp.ee`
- Kui (Custom filter expression):
  ```
  (http.host eq "meregrupp.ee" and starts_with(http.request.uri.path, "/en/freediving"))
  ```
- Siis: Static redirect
  - Type: **301** (Permanent)
  - URL: `https://freediving.meregrupp.ee/`
  - **Preserve query string: ON**

Kui soovitakse keeleversiooni säilitada, kasuta Dynamic redirect'i:
```
concat("https://freediving.meregrupp.ee/", "")
```
ja eraldi reeglit ET-teele (`/et/…`), kui subdomeenil on eraldi ET-URL.

**Kontroll:**
```bash
curl -sSI "https://meregrupp.ee/en/freediving/?utm_source=test" | head -n 5
# oodatud: HTTP/2 301  +  location: https://freediving.meregrupp.ee/?utm_source=test
# EI TOHI olla: HTTP/2 200
```

Repo `en/freediving/index.html` jääb varuteeks (canonical + refresh) juhuks, kui reegel
kustub. Kui reegel töötab, ei jõua ükski päring selle failini.

---

## 2. Turbepealkirjad (audit "Tehniline hügieen ja turve")

Rules → Transform Rules → **Modify Response Header** → Create rule, kohaldub kogu saidile
(`http.host eq "meregrupp.ee"`). Lisa **Set static**:

| Päis | Väärtus |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=(), payment=(), interest-cohort=()` |
| `X-Frame-Options` | `DENY` |

CSP käivitatakse **kõigepealt ainult Report-Only režiimis** (ei murra midagi, kogub rikkumisi):

```
Content-Security-Policy-Report-Only: default-src 'self'; base-uri 'self'; object-src 'none';
frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com
https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:
https://www.google-analytics.com https://www.facebook.com; font-src 'self'; media-src 'self';
connect-src 'self' https://www.google-analytics.com https://analytics.google.com
https://www.googletagmanager.com; form-action 'self'; upgrade-insecure-requests
```

Märkused CSP kohta:
- `'unsafe-inline'` on praegu vajalik, sest lehtedel on inline JSON-LD, aasta-skript ja
  paar `onclick` atribuuti. Kui CSP läheb kunagi jõustavaks (`Content-Security-Policy`),
  tuleb need enne asendada välise skripti või hash'idega.
- `https://www.googletagmanager.com` ja `connect.facebook.net` on vajalikud ainult siis,
  kui `assets/js/analytics-config.js` sisaldab GA4/GTM/Meta ID-d. Kui mõõtmist ei lülitata
  sisse, võib need CSP-st välja jätta.
- Kui vormi endpoint tuleb teisele hostile, lisa see `connect-src` JA `form-action` loendisse.

**Kontroll:**
```bash
curl -sSI https://meregrupp.ee/ | grep -iE "strict-transport|content-type-options|referrer-policy|permissions-policy|content-security"
```

---

## 3. AI-robotite vastuolu (audit P1)

Cloudflare võib serveerida oma hallatud robots.txt plokki repo faili kõrval. Kui
Cloudflare'i AI Crawl Control / "Block AI bots" keelab roboti, keda repo `robots.txt`
lubab, on tulemus vastuoluline.

Tegevus: Cloudflare → AI Crawl Control (varem "Bot fight / Block AI scrapers") → vali
üks poliitika ja lülita teine kiht välja, nii et robots.txt vastuses on iga roboti kohta
täpselt üks reegel.

**Kontroll:**
```bash
curl -sS https://meregrupp.ee/robots.txt
# iga User-agent tohib esineda täpselt ühe korra; OAI-SearchBot ja ChatGPT-User = Allow
```

---

## 4. Vahemälu

Audit mõõtis staatilistele varadele `Cache-Control` ~4 tundi. Versioonitud failid
(`/assets/img/<nimi>-<laius>.<ext>`, `/assets/fonts/*`) võivad saada aasta + `immutable`;
versioonimata CSS/JS lühikese aja + revalideerimise. Väärtused on failis `_headers` —
Cloudflare'is tee need Cache Rules'iga sama tabeli järgi.

**Kontroll:**
```bash
curl -sSI https://meregrupp.ee/assets/img/hero-poster-1440.avif | grep -i cache-control
# oodatud: public, max-age=31536000, immutable
```

---

## 5. Mida siin EI tehta

- Ei lisata konkureerivat redirect-kihti `freedive.ee` fragmentidele — need on lehe JS-is
  (vt `freedive-ee/DEPLOY.md`).
- Ei suunata kogu `freedive.ee` domeeni meregrupp.ee-le; värav jääb 200-ks.
