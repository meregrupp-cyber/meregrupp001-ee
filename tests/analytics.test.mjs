#!/usr/bin/env node
/* assets/js/analytics.js käitumistest ilma brauserita (§20).
   Käivitus: node tests/analytics.test.mjs

   Miks nii: analytics.js on vanilla IIFE ilma moodulisüsteemita, seega ehitame minimaalse
   window/document/storage keskkonna ja laseme faili selle sees käima. Nii testime päris
   koodi, mitte selle koopiat. Kontrollitakse auditi P0 nõudeid:
     - üks tegevus = üks sündmus (event_id deduplikatsioon, ka "lehe värskenduse" järel);
     - isikuandmed ei jõua sündmuse parameetritesse;
     - ilma nõusolekuta ei kutsuta ühtegi pakkujat välja;
     - kampaaniaallikas säilib domeenihüppel (mg_or + utm väljuval lingil). */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

let failures = 0;
const fail = (m) => { failures++; console.error('FAIL  ' + m); };
const ok = (m) => console.log('ok    ' + m);
const eq = (a, b, m) => (a === b ? ok(m) : fail(`${m} (sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)})`));

const src = readFileSync(new URL('../assets/js/analytics.js', import.meta.url), 'utf8');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    _data: data
  };
}

/* Minimaalne DOM: ainult see, mida analytics.js päriselt puudutab. */
function makeEnv({ url = 'https://meregrupp.ee/', referrer = '', config = {}, storages } = {}) {
  const links = [];
  const created = [];
  const store = storages || { session: memoryStorage(), local: memoryStorage() };
  const el = (tag) => ({
    tagName: tag, className: '', dataset: {}, children: [], attributes: {},
    style: {}, innerHTML: '', textContent: '',
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] ?? null; },
    appendChild(c) { this.children.push(c); created.push(c); return c; },
    querySelector() { return el('div'); },
    addEventListener() {},
    remove() {}
  });

  const loc = new URL(url);
  const win = {
    MG_ANALYTICS_CONFIG: config,
    sessionStorage: store.session,
    localStorage: store.local,
    location: { href: loc.href, search: loc.search, pathname: loc.pathname, hostname: loc.hostname },
    navigator: {},
    console,
    URL,
    URLSearchParams,
    Date,
    Math,
    JSON,
    Object,
    document: {
      readyState: 'complete',
      documentElement: { lang: 'et' },
      referrer,
      head: el('head'),
      body: el('body'),
      createElement: el,
      addEventListener() {},
      querySelectorAll(sel) { return sel.startsWith('a[') ? links : []; }
    },
    _links: links,
    _createdScripts: created
  };
  win.window = win;
  return win;
}

function run(env) {
  vm.createContext(env);
  vm.runInContext(src, env);
  return env;
}

/* ---------------------------------------------------------------- 1. dedup */
{
  const env = run(makeEnv());
  env.mgConsent.grant();
  const sent = [];
  env.MG_ANALYTICS_CONFIG.ga4Id = ''; /* pakkujat pole → järjekord on ainus tõend */

  env.mgTrack('view_offer', { offer: 'rummu' });
  env.mgTrack('view_offer', { offer: 'rummu' });
  eq(env.mgEventQueue.length, 1, 'sama view_offer kaks korda → üks sündmus');

  env.mgTrack('view_offer', { offer: 'start' });
  eq(env.mgEventQueue.length, 2, 'teine pakkumine → uus sündmus');

  env.mgTrack('submit_lead', { offer: 'start', group_size_bucket: '2' });
  env.mgTrack('submit_lead', { offer: 'start', group_size_bucket: '2' });
  eq(env.mgEventQueue.length, 3, 'topeltsubmit → üks submit_lead');
  void sent;
}

/* ------------------------------------------- 2. dedup püsib lehe värskendusel */
{
  const storages = { session: memoryStorage(), local: memoryStorage() };
  const first = run(makeEnv({ storages }));
  first.mgConsent.grant();
  first.mgTrack('submit_lead', { offer: 'start' });
  eq(first.mgEventQueue.length, 1, 'esimene submit_lead läks kirja');

  /* sama sessionStorage = sama sessioon, uus leht (tänuleht / F5) */
  const second = run(makeEnv({ url: 'https://meregrupp.ee/thanks/', storages }));
  second.mgTrack('submit_lead', { offer: 'start' });
  eq(second.mgEventQueue.length, 0, 'tänulehe värskendus ei korda submit_lead sündmust');
}

/* ---------------------------------------------------------------- 3. PII */
{
  const env = run(makeEnv());
  env.mgTrack('submit_lead', {
    offer: 'start', name: 'Mari Maasikas', email: 'mari@example.com',
    phone: '+372 5105573', message: 'tere', group_size_bucket: '2'
  });
  const p = env.mgEventQueue[0].params;
  ['name', 'email', 'phone', 'message'].forEach((k) => {
    p[k] === undefined ? ok(`PII väli "${k}" ei jõua sündmusse`) : fail(`PII väli "${k}" lekkis: ${p[k]}`);
  });
  eq(p.offer, 'start', 'mitte-PII väli säilib');
  eq(typeof p.event_id, 'string', 'sündmusel on event_id');
}

/* ------------------------------------------------- 4. nõusolekuta ei saadeta */
{
  const env = run(makeEnv({ config: { ga4Id: 'G-TESTONLY', crossDomains: ['meregrupp.ee'] } }));
  env.mgTrack('view_offer', { offer: 'start' });
  eq(env.mgConsent.get(), null, 'vaikimisi nõusolekut ei ole');
  eq(env._createdScripts.filter((s) => s.tagName === 'script').length, 0,
    'nõusolekuta ei laadita ühtegi välist skripti');
  eq(env.mgEventQueue.length, 1, 'sündmus jääb mällu ootele');

  env.mgConsent.grant();
  const scripts = env._createdScripts.filter((s) => s.tagName === 'script');
  scripts.length === 1 && /googletagmanager\.com/.test(scripts[0].src)
    ? ok('nõusoleku järel laaditakse GA4 tag täpselt üks kord')
    : fail('GA4 tag ei laadinud nõusoleku järel: ' + JSON.stringify(scripts.map((s) => s.src)));
}

/* ------------------------------------------- 5. kampaaniaallikas üle domeenide */
{
  const env = makeEnv({
    url: 'https://freediving.meregrupp.ee/?utm_source=freedive_ee&utm_medium=referral&utm_campaign=gateway&mg_or=google.com',
    config: { crossDomains: ['meregrupp.ee', 'freediving.meregrupp.ee', 'freedive.ee'] }
  });
  const link = { href: 'https://meregrupp.ee/en/', getAttribute() { return null; } };
  env._links.push(link);
  run(env);

  const attr = env.mgAttribution();
  eq(attr.source, 'freedive_ee', 'kampaania allikas loetakse URL-ist');
  eq(attr.referrer, 'google.com', 'algne viitaja liigub mg_or parameetriga kaasa');

  /* domeenihüpe ilma UTM-ita ei tohi allikat kustutada */
  const next = makeEnv({ url: 'https://meregrupp.ee/en/', storages: { session: env.sessionStorage, local: env.localStorage } });
  run(next);
  eq(next.mgAttribution().source, 'freedive_ee', 'allikas säilib järgmisel lehel ilma UTM-ita');
  eq(next.mgAttribution().referrer, 'google.com', 'algne viitaja säilib');

  const decorated = new URL(env._links[0].href);
  eq(decorated.searchParams.get('utm_source'), 'freedive_ee', 'väljuv link saab kampaania kaasa');
  eq(decorated.searchParams.get('mg_or'), 'google.com', 'väljuv link kannab algset viitajat');

  next.mgTrack('view_offer', { offer: 'start' });
  eq(next.mgEventQueue[0].params.campaign_source, 'freedive_ee', 'sündmus kannab õiget allikat');
}

console.log('\n' + (failures ? `${failures} FAILURE(S)` : 'Analytics: kõik kontrollid läbitud.'));
process.exit(failures ? 1 : 0);
