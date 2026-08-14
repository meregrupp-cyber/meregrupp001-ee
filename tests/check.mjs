#!/usr/bin/env node
/* Minimaalne hooldatav testikiht (§20). Käivitus: node tests/check.mjs
   Ilma sõltuvusteta — regex-põhised kontrollid staatilise HTML-i peale. */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

const pages = {
  'index.html': { lang: 'et', canonical: 'https://meregrupp.ee/' },
  'en/index.html': { lang: 'en', canonical: 'https://meregrupp.ee/en/' },
  'freedive-ee/index.html': { lang: 'en', canonical: 'https://freedive.ee/', staging: true },
};

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL  ' + msg); };
const ok = (msg) => console.log('ok    ' + msg);

const org = JSON.parse(read('data/organisation.json'));
const offers = JSON.parse(read('data/offers.json'));

/* /en/freediving/ on kolinud subdomeenile — path on canonical+refresh viiteleht */
{
  const p = read('en/freediving/index.html');
  p.includes('rel="canonical" href="https://freediving.meregrupp.ee/"') ? ok('en/freediving: canonical → subdomeen') : fail('en/freediving: canonical vale');
  /http-equiv="refresh" content="0; url=https:\/\/freediving\.meregrupp\.ee\//.test(p) ? ok('en/freediving: meta-refresh olemas') : fail('en/freediving: meta-refresh puudub');
  p.includes("location.replace('https://freediving.meregrupp.ee/' + location.search + location.hash)") ? ok('en/freediving: JS säilitab query+hash') : fail('en/freediving: JS-suunamine puudu');
}

/* --- lehepõhised kontrollid --- */
for (const [file, meta] of Object.entries(pages)) {
  const html = read(file);

  // täpselt üks H1
  const h1s = html.match(/<h1[\s>]/g) || [];
  h1s.length === 1 ? ok(`${file}: üks H1`) : fail(`${file}: H1 arv ${h1s.length}`);

  // lang
  new RegExp(`<html lang="${meta.lang}"`).test(html)
    ? ok(`${file}: lang=${meta.lang}`) : fail(`${file}: vale <html lang>`);

  // canonical
  html.includes(`rel="canonical" href="${meta.canonical}"`)
    ? ok(`${file}: canonical ${meta.canonical}`) : fail(`${file}: canonical puudu/vale`);

  // staging noindex; production-lehtedel EI tohi noindex olla
  const hasNoindex = /<meta name="robots" content="noindex"/.test(html);
  if (meta.staging) hasNoindex ? ok(`${file}: staging noindex olemas`) : fail(`${file}: staging ilma noindexita`);
  else !hasNoindex ? ok(`${file}: noindex puudub (õige)`) : fail(`${file}: production-leht kannab noindex!`);

  // JSON-LD parsib ja Organization @id on ühine
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) fail(`${file}: JSON-LD puudub`);
  for (const b of blocks) {
    try {
      const data = JSON.parse(b[1]);
      const graph = data['@graph'] || [data];
      const orgNode = graph.find((n) => JSON.stringify(n['@type'] || '').includes('Organization') || n['@id'] === 'https://meregrupp.ee/#organization');
      if (orgNode && orgNode['@id'] !== 'https://meregrupp.ee/#organization')
        fail(`${file}: Organization @id erineb: ${orgNode['@id']}`);
      else ok(`${file}: JSON-LD parsib, Organization @id ühine`);
    } catch (e) { fail(`${file}: JSON-LD ei parsi: ${e.message}`); }
  }

  // NAP andmefailist (§3.7): kui leht sisaldab kontaktiplokki, peavad väärtused klappima
  if (html.includes('@meregrupp.ee') && !html.includes(org.email)) fail(`${file}: e-post ei vasta data/organisation.json väärtusele`);
  if (/\+372/.test(html) && !html.includes(org.phone) ) fail(`${file}: telefon ei vasta data/organisation.json väärtusele (${org.phone})`);
  if (/Kauri tee/.test(html) && !html.includes(org.address.street)) fail(`${file}: aadress ei vasta data/organisation.json väärtusele`);

  // keelatud avaldamata faktid: hind ei tohi esineda üheski avalikus vaates (needs_confirmation)
  if (/€\s?\d|\d+\s?(EUR|eur)\b/.test(html)) fail(`${file}: sisaldab hinda, aga kõik hinnad on needs_confirmation`);
  else ok(`${file}: hindu ei avaldata`);

  // AIDA organisatsiooniväited keelatud (§3.6); isiklik kvalifikatsioon on samuti kinnituseta väljas
  if (/AIDA/i.test(html)) fail(`${file}: sisaldab AIDA-stringi — vajab omaniku kinnitust (§3.6)`);
  else ok(`${file}: AIDA-väiteid pole`);

  // siselingid: suhtelised href-id peavad lahenema failiks
  for (const m of html.matchAll(/href="([^"#?]+?)(?:[#?][^"]*)?"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    let p = href;
    const baseDir = dirname(join(root, file));
    let target = p.startsWith('/') ? join(root, p) : join(baseDir, p);
    if (target.endsWith('/')) target = join(target, 'index.html');
    if (!existsSync(target) && !existsSync(target + '/index.html'))
      fail(`${file}: katkine siselink ${href}`);
  }

  // lehe sisesed ankrud (#id) peavad eksisteerima
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    const id = m[1];
    if (!new RegExp(`id="${id}"`).test(html)) fail(`${file}: ankur #${id} ilma id-ta`);
  }
}

/* --- ühilduvusankrud --- */
for (const id of ['programmid', 'meeskond', 'kontakt'])
  read('index.html').includes(`id="${id}"`) ? ok(`index.html: legacy-ankur #${id}`) : fail(`index.html: legacy-ankur #${id} puudub`);
for (const id of ['top', 'method', 'training', 'contact'])
  read('freedive-ee/index.html').includes(`id="${id}"`) ? ok(`freedive-ee: legacy-ankur #${id}`) : fail(`freedive-ee: legacy-ankur #${id} puudub`);

/* --- fragmendikaardistus katab eemaldatud sektsioonid --- */
const gw = read('freedive-ee/index.html');
gw.includes("'#courses'") && gw.includes("'#youth'")
  ? ok('freedive-ee: FRAGMENT_MAP katab #courses ja #youth') : fail('freedive-ee: FRAGMENT_MAP puudulik');

/* --- sitemap: ainult canonical 200-lehed, mitte staging --- */
const sm = read('sitemap.xml');
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const expectFiles = { 'https://meregrupp.ee/': 'index.html', 'https://meregrupp.ee/en/': 'en/index.html' };
for (const u of smUrls) {
  if (!expectFiles[u]) fail(`sitemap: ootamatu URL ${u}`);
  else existsSync(join(root, expectFiles[u])) ? ok(`sitemap: ${u} → fail olemas`) : fail(`sitemap: ${u} fail puudub`);
}
sm.includes('freedive-ee') ? fail('sitemap: staging-leht sitemapis!') : ok('sitemap: staging väljas');

/* --- toored hex-värvid ainult tokens.css-is (erandid dokumenteeritud) --- */
/* 404.html ja en/freediving/ viiteleht on teadlikult iseseisvad (inline-stiilid) */
const hexAllowed = new Set(['assets/css/tokens.css', '404.html', 'en/freediving/index.html']);
for (const f of ['index.html', 'en/index.html', 'en/freediving/index.html', 'freedive-ee/index.html', 'assets/css/site.css']) {
  const src = read(f).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const hex = src.match(/#[0-9a-fA-F]{3,8}\b(?![\w-])/g)?.filter((h) => !/^#[a-zA-Z]/.test(h) || /^#[0-9a-fA-F]{6}$/.test(h));
  const real = (src.match(/(?:color|background|border|fill|stroke)[^;{]*#[0-9a-fA-F]{3,8}/g) || []);
  if (real.length && !hexAllowed.has(f)) fail(`${f}: toores hex väljaspool tokens.css: ${real[0]}`);
  else ok(`${f}: hex-kontroll puhas`);
}

/* --- duplikaadikontroll: H1-d ei kordu vaadete vahel --- */
const h1texts = Object.keys(pages).map((f) => {
  const m = read(f).match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
});
new Set(h1texts).size === h1texts.length ? ok('H1-d on unikaalsed kõigis vaadetes') : fail('H1 dubleerub vaadete vahel: ' + h1texts.join(' | '));

/* Vormid elavad nüüd subdomeeni repos (mgfreediving001-ee) — seal on oma testikiht,
   mis kontrollib honeypot'i, nõusolekuid ja terviseandmete keeldu. */

/* --- analytics: ühtegi konto-ID-d pole kõvakodeeritud --- */
const aj = read('assets/js/analytics.js');
/G-[A-Z0-9]{6,}|GTM-[A-Z0-9]+|UA-\d+/.test(aj) ? fail('analytics.js: kõvakodeeritud konto ID') : ok('analytics.js: ID-sid pole');
const acfg = read('assets/js/analytics-config.js');
/* päris ID sisaldab numbrit; kommentaari näidised (G-XXXXXXX) ei ole ID-d */
/G-(?=[A-Z0-9]*\d)[A-Z0-9]{6,}|GTM-(?=[A-Z0-9]*\d)[A-Z0-9]{4,}|UA-\d+|\d{15,}/.test(acfg)
  ? fail('analytics-config.js: production-ID on commit\'itud — see fail peab jääma tühjaks šabloonideks')
  : ok('analytics-config.js: tühi šabloon, ID-sid pole');

/* --- audit 2026-08-14 P0: avalikus sisus ei ole tootmismärkmeid --- */
const PRODUCTION_NOTES = [
  /program count comes from/i,
  /programmide arv tuleb/i,
  /photo slot/i,
  /missing-inputs/i,
  /TODO|FIXME|LOREM IPSUM/i
];
for (const file of ['index.html', 'en/index.html', 'freedive-ee/index.html', '404.html']) {
  const html = read(file);
  const hit = PRODUCTION_NOTES.find((re) => re.test(html));
  hit ? fail(`${file}: avalik tootmismärkus (${hit})`) : ok(`${file}: tootmismärkmeid pole`);
}

/* --- audit P0: keeleparandused ei tohi tagasi tulla --- */
const BANNED = [
  ['index.html', /buddy-põhimõte/i, 'buddy-põhimõte → paarilise põhimõte'],
  ['index.html', /med õde/i, '„registreeritud med õde" → „registreeritud õde"'],
  ['index.html', /Explore Rummu|>Plan Ahead</, 'ET vaates tõlkimata CTA'],
  ['en/index.html', /theory room/i, '„in the pool and theory room"'],
  ['en/index.html', /paths through the depth/i, '„08 paths through the depth"']
];
for (const [file, re, label] of BANNED) {
  re.test(read(file)) ? fail(`${file}: ${label}`) : ok(`${file}: parandatud — ${label}`);
}

/* --- audit P0: vormikiht ei tohi mailto't edukaks lugeda --- */
const fj = read('assets/js/forms.js');
/location\.href\s*=\s*href/.test(fj) || /'mailto:'\s*\+/.test(fj)
  ? fail('forms.js: mailto-submit on tagasi — submit_lead tekiks ilma päris saatmiseta')
  : ok('forms.js: mailto-teesklust ei ole');
/MG_FORM_ENDPOINT/.test(fj)
  ? fail('forms.js: tühi MG_FORM_ENDPOINT konstant (audit P0)')
  : ok('forms.js: endpoint tuleb konfist/data-endpoint\'ist');
/r\.ok/.test(fj) && fj.indexOf("mgTrack('submit_lead'") > fj.indexOf('if (!r.ok)')
  ? ok('forms.js: submit_lead käivitub alles 2xx järel')
  : fail('forms.js: submit_lead ei ole 2xx taga');

/* --- audit P1: robots.txt AI-reeglid on üheselt mõistetavad --- */
{
  const robots = read('robots.txt');
  const agents = [...robots.matchAll(/^User-agent:\s*(\S+)/gim)].map((m) => m[1]);
  const dupes = agents.filter((a, i) => agents.indexOf(a) !== i);
  dupes.length ? fail(`robots.txt: korduv User-agent (${dupes.join(', ')})`) : ok('robots.txt: iga User-agent üks kord');
  /User-agent:\s*OAI-SearchBot\s*\nAllow:\s*\//i.test(robots)
    ? ok('robots.txt: OAI-SearchBot lubatud (ChatGPT Search nähtavus)')
    : fail('robots.txt: OAI-SearchBot reegel puudub');
  /User-agent:\s*ChatGPT-User\s*\nAllow:\s*\//i.test(robots)
    ? ok('robots.txt: ChatGPT-User lubatud') : fail('robots.txt: ChatGPT-User reegel puudub');
  robots.includes('Sitemap: https://meregrupp.ee/sitemap.xml') ? ok('robots.txt: sitemap viidatud') : fail('robots.txt: sitemap puudub');
}

/* --- audit P1: llms.txt räägib päris faktiomanikust --- */
{
  const llms = read('llms.txt');
  /freedive\.ee[^\n]*(lingib )?broneerimiseks meregrupp\.ee/i.test(llms)
    ? fail('llms.txt: väidab, et freedive.ee suunab broneerimiseks meregrupp.ee-le')
    : ok('llms.txt: freedive.ee suunab päringuks subdomeenile');
  llms.includes('freediving.meregrupp.ee') && /Kanoonilised faktiallikad/.test(llms)
    ? ok('llms.txt: faktiomanike tabel olemas') : fail('llms.txt: faktiomanike tabel puudub');
}

/* --- audit: turbepäiste väärtused elavad versioonihalduses --- */
{
  const h = read('_headers');
  for (const key of ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy',
    'Permissions-Policy', 'Content-Security-Policy-Report-Only']) {
    h.includes(key) ? ok(`_headers: ${key}`) : fail(`_headers: ${key} puudub`);
  }
  h.includes('immutable') ? ok('_headers: versioonitud varadele immutable-vahemälu') : fail('_headers: immutable-vahemälu puudub');
}

/* --- jõudlus: hero-video ei laadi enne JS-i otsust; pildid on responsive --- */
for (const file of ['index.html', 'en/index.html']) {
  const html = read(file);
  /<video[^>]*data-hero-video/.test(html) && !/<video[\s\S]{0,400}?<source/.test(html)
    ? ok(`${file}: hero-video allikad lisab JS (mobiilis ei laadita)`)
    : fail(`${file}: hero-video laadib allikaid ilma tingimusteta`);
  /<picture>[\s\S]*?type="image\/avif"[\s\S]*?type="image\/webp"/.test(html)
    ? ok(`${file}: AVIF/WebP variandid olemas`) : fail(`${file}: responsive pildivariandid puuduvad`);
  const imgs = [...html.matchAll(/<img[^>]*\ssrcset="([^"]+)"/g)].length;
  imgs >= 5 ? ok(`${file}: ${imgs} pilti srcset'iga`) : fail(`${file}: ainult ${imgs} pilti srcset'iga`);
}

/* --- kõik viidatud pildifailid on olemas (srcset + src) --- */
for (const [file, base] of [['index.html', ''], ['en/index.html', 'en'], ['freedive-ee/index.html', 'freedive-ee']]) {
  const html = read(file);
  const refs = new Set();
  for (const m of html.matchAll(/\s(?:src|srcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url && !/^(https?:|data:)/.test(url)) refs.add(url);
    }
  }
  let missing = 0;
  for (const url of refs) {
    const target = url.startsWith('/') ? join(root, url) : join(root, base, url);
    if (!existsSync(target)) { fail(`${file}: puuduv vara ${url}`); missing++; }
  }
  if (!missing) ok(`${file}: kõik ${refs.size} viidatud vara on olemas`);
}

/* --- hero-video suurus: audit mõõtis 7,7 MB MP4 (mobiili LCP 6,7 s) --- */
{
  const { statSync } = await import('node:fs');
  const mp4 = statSync(join(root, 'assets/hero.mp4')).size;
  mp4 < 1.5 * 1024 * 1024
    ? ok(`assets/hero.mp4: ${(mp4 / 1024 / 1024).toFixed(2)} MB (< 1,5 MB piir)`)
    : fail(`assets/hero.mp4: ${(mp4 / 1024 / 1024).toFixed(2)} MB — liiga suur`);
}

/* --- offers.json väravad --- */
for (const r of offers.routes) {
  if (r.price != null && r.price_fact_status !== 'confirmed')
    fail(`offers.json: ${r.offer_id} hind täidetud ilma kinnituseta`);
}
ok('offers.json: kinnitamata hindu ei ole');

console.log('\n' + (failures ? `${failures} FAILURE(S)` : 'Kõik kontrollid läbitud.'));
process.exit(failures ? 1 : 0);
