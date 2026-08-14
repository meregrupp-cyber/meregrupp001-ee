#!/usr/bin/env node
/* Brauseritest (§20, audit "Seadmed, brauserid ja jõudlus").
   Käivitus:  npm i -D playwright && node tests/e2e.mjs
   Kui playwright ei ole paigaldatud, test teatab sellest ja väljub koodiga 0 —
   nii ei lõhu ta sõltuvusteta põhikontrolli (node tests/check.mjs).

   Mida kontrollitakse:
     1. mobiilivaates EI laadita hero-videot (LCP kaitse), lauaarvutis laaditakse;
     2. prefers-reduced-motion korral videot ei laadita üheski laiuses;
     3. horisontaalset kerimist ei teki 320 px laiuses;
     4. ilma JavaScriptita on põhisisu ja kontakt kättesaadavad;
     5. nõusolekuriba EI kuvata, kui mõõtmise ID-d ei ole seadistatud;
     6. igal lehel on täpselt üks H1 ja pealkirjatasemed ei hüppa üle taseme. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('SKIP  playwright ei ole paigaldatud (npm i -D playwright) — brauseritest jäi vahele.');
  process.exit(0);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml'
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0]);
  if (path.endsWith('/')) path += 'index.html';
  const file = join(root, path);
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('dir');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(await readFile(join(root, '404.html')).catch(() => 'not found'));
  }
});
await new Promise((r) => server.listen(0, r));
const base = 'http://127.0.0.1:' + server.address().port;

let failures = 0;
const fail = (m) => { failures++; console.error('FAIL  ' + m); };
const ok = (m) => console.log('ok    ' + m);

/* MG_CHROMIUM lubab osutada juba olemasolevale Chromiumile (CI-pilt, kus
   "playwright install" ei ole lubatud). Ilma selleta kasutatakse playwright'i oma. */
const browser = await chromium.launch(process.env.MG_CHROMIUM ? { executablePath: process.env.MG_CHROMIUM } : {});

async function videoRequests(opts, url = '/') {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const hits = [];
  page.on('request', (r) => { if (/hero\.(mp4|webm)/.test(r.url())) hits.push(r.url()); });
  await page.goto(base + url, { waitUntil: 'networkidle' });
  await ctx.close();
  return hits;
}

/* 1–2. video laadimise tingimused */
{
  const desktop = await videoRequests({ viewport: { width: 1440, height: 900 } });
  desktop.length ? ok('lauaarvuti: hero-video laaditakse') : fail('lauaarvuti: hero-videot ei laaditud');

  const mobile = await videoRequests({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.length === 0 ? ok('mobiil: hero-videot EI laadita (LCP kaitse)') : fail('mobiil: video laaditi ikkagi: ' + mobile[0]);

  const reduced = await videoRequests({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  reduced.length === 0 ? ok('reduced-motion: hero-videot ei laadita') : fail('reduced-motion: video laaditi');
}

/* 3. 320 px ilma horisontaalse kerimiseta + 6. pealkirjastruktuur */
for (const url of ['/', '/en/', '/freedive-ee/']) {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base + url, { waitUntil: 'load' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  overflow <= 1 ? ok(`${url} 320 px: horisontaalset kerimist ei ole`) : fail(`${url} 320 px: ülelaius ${overflow} px`);

  const levels = await page.$$eval('h1,h2,h3,h4', (els) => els.map((e) => Number(e.tagName[1])));
  const h1s = levels.filter((l) => l === 1).length;
  h1s === 1 ? ok(`${url}: täpselt üks H1`) : fail(`${url}: H1 arv ${h1s}`);
  let jump = null;
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) jump = `${levels[i - 1]}→${levels[i]}`;
  jump ? fail(`${url}: pealkirjatase hüppab üle (${jump})`) : ok(`${url}: pealkirjatasemed ei hüppa`);

  /* 5. nõusolekuriba ei tohi ilmuda, kui mõõtmise ID-d ei ole seadistatud */
  const bar = await page.$('.consent-bar');
  bar ? fail(`${url}: nõusolekuriba kuvatakse ilma mõõtmise ID-ta`) : ok(`${url}: nõusolekuriba ei kuvata (ID-sid pole)`);
  await ctx.close();
}

/* 4. ilma JavaScriptita jääb sisu ja kontakt alles */
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'load' });
  const text = await page.textContent('body');
  text.includes('meregrupp@gmail.com') ? ok('ilma JS-ita: kontakt on nähtav') : fail('ilma JS-ita: kontakti ei leia');
  const visibleRoutes = await page.$$eval('.route-card h3', (els) => els.map((e) => e.textContent.trim()));
  visibleRoutes.length >= 3 ? ok('ilma JS-ita: kolm rada on nähtavad') : fail('ilma JS-ita: rajad puuduvad');
  const still = await page.$('.hero-still');
  still ? ok('ilma JS-ita: hero-pilt on olemas (video ei laadi)') : fail('ilma JS-ita: hero-pilt puudub');
  await ctx.close();
}

await browser.close();
server.close();
console.log('\n' + (failures ? `${failures} FAILURE(S)` : 'E2E: kõik kontrollid läbitud.'));
process.exit(failures ? 1 : 0);
