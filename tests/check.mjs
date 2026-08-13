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
  'en/freediving/index.html': { lang: 'en', canonical: 'https://meregrupp.ee/en/freediving/' },
  'freedive-ee/index.html': { lang: 'en', canonical: 'https://freedive.ee/', staging: true },
};

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL  ' + msg); };
const ok = (msg) => console.log('ok    ' + msg);

const org = JSON.parse(read('data/organisation.json'));
const offers = JSON.parse(read('data/offers.json'));

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
const expectFiles = { 'https://meregrupp.ee/': 'index.html', 'https://meregrupp.ee/en/': 'en/index.html', 'https://meregrupp.ee/en/freediving/': 'en/freediving/index.html' };
for (const u of smUrls) {
  if (!expectFiles[u]) fail(`sitemap: ootamatu URL ${u}`);
  else existsSync(join(root, expectFiles[u])) ? ok(`sitemap: ${u} → fail olemas`) : fail(`sitemap: ${u} fail puudub`);
}
sm.includes('freedive-ee') ? fail('sitemap: staging-leht sitemapis!') : ok('sitemap: staging väljas');

/* --- toored hex-värvid ainult tokens.css-is (erandid dokumenteeritud) --- */
const hexAllowed = new Set(['assets/css/tokens.css', '404.html']);
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

/* --- vormid: required-väljad, honeypot, ei terviseandmeid, turundusnõusolek märkimata --- */
const b = read('en/freediving/index.html');
const forms = [...b.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]);
forms.length === 3 ? ok('Vaade B: 3 vormi') : fail(`Vaade B: vorme ${forms.length}, oodati 3`);
for (const [i, f] of forms.entries()) {
  f.includes('hp-field') ? ok(`vorm ${i + 1}: honeypot olemas`) : fail(`vorm ${i + 1}: honeypot puudub`);
  f.includes('privacy_consent') && f.includes('required') ? ok(`vorm ${i + 1}: privaatsusnõusolek required`) : fail(`vorm ${i + 1}: privaatsusnõusolek puudu`);
  /name="(health|medical)/i.test(f) ? fail(`vorm ${i + 1}: kogub terviseandmeid!`) : ok(`vorm ${i + 1}: terviseandmeid ei koguta`);
  /name="marketing_consent"[^>]*checked/.test(f) ? fail(`vorm ${i + 1}: turundusnõusolek eeltäidetud!`) : ok(`vorm ${i + 1}: turundusnõusolek märkimata`);
  f.includes('form-error-summary') ? ok(`vorm ${i + 1}: veakokkuvõte olemas`) : fail(`vorm ${i + 1}: veakokkuvõte puudub`);
}

/* --- analytics: ühtegi konto-ID-d pole kõvakodeeritud --- */
const aj = read('assets/js/analytics.js');
/G-[A-Z0-9]{6,}|GTM-[A-Z0-9]+|UA-\d+/.test(aj) ? fail('analytics.js: kõvakodeeritud konto ID') : ok('analytics.js: ID-sid pole');

/* --- offers.json väravad --- */
for (const r of offers.routes) {
  if (r.price != null && r.price_fact_status !== 'confirmed')
    fail(`offers.json: ${r.offer_id} hind täidetud ilma kinnituseta`);
}
ok('offers.json: kinnitamata hindu ei ole');

console.log('\n' + (failures ? `${failures} FAILURE(S)` : 'Kõik kontrollid läbitud.'));
process.exit(failures ? 1 : 0);
