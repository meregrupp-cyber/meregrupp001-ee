/* Meregrupp — mõõtmiskiht (§12, §13).

   Mida see fail teeb:
   1. NÕUSOLEK. Enne nõusolekut ei laadita ühtegi kolmanda osapoole skripti ega saadeta
      ühtegi baiti välja. Nõusolekuriba kuvatakse ainult siis, kui omanik on
      assets/js/analytics-config.js failis mõõtmise ID määranud.
   2. ADAPTER. Üks sündmusnimede skeem (vt EVENTS allpool) → GA4 (gtag) või GTM dataLayer
      ja soovi korral Meta Pixel. Konto-ID-sid siin failis EI OLE.
   3. DEDUPLIKATSIOON. Iga sündmus saab event_id. Sama event_id ei lähe akna jooksul
      teist korda välja — üks tegevus = üks sündmus, ka lehe värskendamisel (tänuleht).
   4. OMISTAMINE ÜLE DOMEENIDE. Esimene kampaaniaallikas ja algne viitaja salvestatakse
      sessiooni ning lisatakse väljuvatele linkidele (freedive.ee → freediving.meregrupp.ee),
      nii et allikas ei muutu domeenipiiril "direct'iks".
   5. PII-KEELD. Nimi, e-post, telefon ja vabatekst ei jõua kunagi analüütikasse.

   Avalik API:
     mgTrack(name, params, opts)   — saada sündmus (opts.dedupeKey, opts.dedupeWindowMs)
     mgConsent.get() / .grant() / .deny() / .onChange(fn)
     mgAttribution()               — {source, medium, campaign, term, content, route, referrer, landing}
     mgGetUtm()                    — vormide metaandmed (tagasiühilduvus)
     window.mgEventQueue           — kõik sündmused mälus (arendus/kontroll) */
(function () {
  'use strict';

  var CONFIG = window.MG_ANALYTICS_CONFIG || {};
  var CONSENT_KEY = 'mg_consent_v1';
  var ATTR_KEY = 'mg_attribution_v1';
  var SENT_KEY = 'mg_sent_events_v1';
  var SESSION_KEY = 'mg_session_v1';

  /* Dokumenteeritud sündmuseskeem. Muu nimi läheb läbi, aga debug-režiimis hoiatatakse —
     nii ei teki vaikselt paralleelseid nimesid eri lehtedel. */
  var EVENTS = ['view_offer', 'select_date', 'start_form', 'submit_lead', 'qualified_lead',
    'booking_confirmed', 'join_waitlist'];

  /* Konversioonisündmused: neid ei tohi lehe värskendus korrata, seega pikk aken. */
  var CONVERSIONS = { submit_lead: 1, qualified_lead: 1, booking_confirmed: 1, join_waitlist: 1 };
  var WINDOW_DEFAULT = 10 * 1000;
  var WINDOW_CONVERSION = 30 * 60 * 1000;

  var PII_KEYS = /^(name|first|last|email|e-?mail|phone|tel|mobile|whatsapp|address|message|notes?|comment|health|medical)$/i;
  var LOOKS_LIKE_EMAIL = /@/;
  var LOOKS_LIKE_PHONE = /^[+()\d][\d\s().-]{6,}$/;

  var log = function () {
    if (CONFIG.debug && window.console) console.debug.apply(console, ['[mg]'].concat([].slice.call(arguments)));
  };

  /* ---------------------------------------------------------------- salvestus */
  var store = {
    get: function (area, key) {
      try { return window[area].getItem(key); } catch (e) { return null; }
    },
    set: function (area, key, value) {
      try { window[area].setItem(key, value); } catch (e) { /* private mode → mälu ainult */ }
    }
  };

  /* ---------------------------------------------------------------- omistamine */
  function readUrlAttribution() {
    var qs, out = {};
    try { qs = new URLSearchParams(location.search); } catch (e) { return out; }
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'route'].forEach(function (k) {
      var v = qs.get(k);
      if (v) out[k] = v.slice(0, 120);
    });
    /* mg_or = algne viitaja, mille eelmine domeen kaasa andis */
    var carried = qs.get('mg_or');
    if (carried) out.referrer = carried.slice(0, 200);
    return out;
  }

  function ownDomain(host) {
    var list = CONFIG.crossDomains || [];
    for (var i = 0; i < list.length; i++) {
      if (host === list[i] || host.slice(-(list[i].length + 1)) === '.' + list[i]) return true;
    }
    return false;
  }

  var attribution = (function () {
    var stored = {};
    try { stored = JSON.parse(store.get('sessionStorage', ATTR_KEY) || '{}'); } catch (e) { stored = {}; }
    var fresh = readUrlAttribution();

    /* Uus kampaania kirjutab vana üle; ilma utm_source'ita külastus EI kustuta olemasolevat
       allikat (nii säilib kampaania ka siselinkide ja domeenihüppe järel). */
    var next = fresh.utm_source ? fresh : stored;
    if (!fresh.utm_source) {
      Object.keys(fresh).forEach(function (k) { if (!next[k]) next[k] = fresh[k]; });
    }

    if (!next.referrer) {
      var ref = document.referrer || '';
      var host = '';
      try { host = ref ? new URL(ref).hostname : ''; } catch (e) { host = ''; }
      if (host && !ownDomain(host)) next.referrer = host;
    }
    if (!next.landing) next.landing = location.pathname;

    if (Object.keys(next).length) store.set('sessionStorage', ATTR_KEY, JSON.stringify(next));
    return next;
  })();

  window.mgAttribution = function () {
    return {
      source: attribution.utm_source || '',
      medium: attribution.utm_medium || '',
      campaign: attribution.utm_campaign || '',
      term: attribution.utm_term || '',
      content: attribution.utm_content || '',
      route: attribution.route || '',
      referrer: attribution.referrer || '',
      landing: attribution.landing || ''
    };
  };

  /* Tagasiühilduvus: vormikiht küsib UTM-e selle nimega. */
  window.mgGetUtm = function () {
    var out = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'route'].forEach(function (k) {
      if (attribution[k]) out[k] = attribution[k];
    });
    if (attribution.referrer) out.original_referrer = attribution.referrer;
    return out;
  };

  /* Väljuvad lingid teistele oma domeenidele saavad kampaaniaallika kaasa. */
  function decorateCrossDomainLinks() {
    var attr = window.mgAttribution();
    if (!attr.source && !attr.referrer) return;
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      var url;
      try { url = new URL(a.href); } catch (e) { return; }
      if (url.hostname === location.hostname || !ownDomain(url.hostname)) return;
      if (!url.searchParams.get('utm_source') && attr.source) {
        url.searchParams.set('utm_source', attr.source);
        if (attr.medium) url.searchParams.set('utm_medium', attr.medium);
        if (attr.campaign) url.searchParams.set('utm_campaign', attr.campaign);
      }
      if (attr.referrer && !url.searchParams.get('mg_or')) url.searchParams.set('mg_or', attr.referrer);
      a.href = url.toString();
    });
  }

  /* ---------------------------------------------------------------- nõusolek */
  var listeners = [];
  var consent = {
    get: function () { return store.get('localStorage', CONSENT_KEY); },
    grant: function () { set('granted'); },
    deny: function () { set('denied'); },
    onChange: function (fn) { listeners.push(fn); }
  };
  function set(state) {
    store.set('localStorage', CONSENT_KEY, state);
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { /* ei blokeeri */ } });
  }
  window.mgConsent = consent;

  /* ---------------------------------------------------------------- pakkujad */
  var provider = null; /* funktsioon (name, params) → saadab välja */

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
    return s;
  }

  function bootProviders() {
    if (provider) return;

    if (CONFIG.gtmId) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(CONFIG.gtmId));
      provider = function (name, params) { window.dataLayer.push(assign({ event: name }, params)); };
      log('GTM boot', CONFIG.gtmId);
    } else if (CONFIG.ga4Id) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4Id));
      window.gtag('js', new Date());
      window.gtag('consent', 'update', {
        analytics_storage: 'granted', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied'
      });
      window.gtag('config', CONFIG.ga4Id, {
        anonymize_ip: true,
        linker: { domains: CONFIG.crossDomains || [], accept_incoming: true }
      });
      provider = function (name, params) { window.gtag('event', name, params); };
      log('GA4 boot', CONFIG.ga4Id);
    }

    if (CONFIG.metaPixelId && !window.fbq) {
      /* Meta laaditakse ainult nõusoleku järel; event_id läheb kaasa, et serveripoolne
         CAPI-sündmus ja brauserisündmus loetaks Meta poolel ÜHEKS. */
      var n = window.fbq = function () { n.queue.push(arguments); };
      n.queue = [];
      loadScript('https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', CONFIG.metaPixelId);
      window.fbq('track', 'PageView');
      log('Meta Pixel boot');
    }
  }

  function assign(target, src) {
    Object.keys(src || {}).forEach(function (k) { target[k] = src[k]; });
    return target;
  }

  /* ---------------------------------------------------------------- deduplikatsioon */
  function sessionId() {
    var id = store.get('sessionStorage', SESSION_KEY);
    if (!id) {
      id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      store.set('sessionStorage', SESSION_KEY, id);
    }
    return id;
  }

  function sentMap() {
    try { return JSON.parse(store.get('sessionStorage', SENT_KEY) || '{}'); } catch (e) { return {}; }
  }

  function rememberSent(id, now) {
    var map = sentMap();
    map[id] = now;
    /* koristus: hoia ainult viimase poole tunni kirjed */
    Object.keys(map).forEach(function (k) { if (now - map[k] > WINDOW_CONVERSION) delete map[k]; });
    store.set('sessionStorage', SENT_KEY, JSON.stringify(map));
  }

  function stableKey(params) {
    return Object.keys(params).sort().map(function (k) { return k + '=' + params[k]; }).join('&');
  }

  /* ---------------------------------------------------------------- mgTrack */
  window.mgEventQueue = window.mgEventQueue || [];

  window.mgTrack = function (eventName, params, opts) {
    opts = opts || {};
    var clean = {};
    Object.keys(params || {}).forEach(function (k) {
      if (PII_KEYS.test(k)) return;
      var v = params[k];
      if (typeof v === 'string' && (LOOKS_LIKE_EMAIL.test(v) || LOOKS_LIKE_PHONE.test(v))) return;
      clean[k] = v;
    });

    if (CONFIG.debug && EVENTS.indexOf(eventName) === -1) log('tundmatu sündmusenimi:', eventName);

    var now = Date.now();
    var key = opts.dedupeKey || stableKey(clean);
    var eventId = sessionId() + '.' + eventName + '.' + key;
    var win = opts.dedupeWindowMs || (CONVERSIONS[eventName] ? WINDOW_CONVERSION : WINDOW_DEFAULT);
    var last = sentMap()[eventId];
    if (last && now - last < win) { log('duplikaat vahele jäetud:', eventName, eventId); return false; }
    rememberSent(eventId, now);

    var attr = window.mgAttribution();
    var payload = assign(assign({}, clean), {
      event_id: eventId,
      language: clean.language || document.documentElement.lang || '',
      campaign_source: attr.source || (attr.referrer ? 'referral' : 'direct'),
      campaign_medium: attr.medium || '',
      campaign_name: attr.campaign || '',
      original_referrer: attr.referrer || ''
    });

    window.mgEventQueue.push({ event: eventName, params: payload, t: now });

    if (consent.get() !== 'granted') { log('nõusolekuta järjekorda:', eventName); return true; }
    bootProviders();
    if (provider) {
      try { provider(eventName, payload); } catch (e) { /* mõõtmine ei tohi UI-d katkestada */ }
    }
    if (window.fbq && CONFIG.metaPixelId) {
      try { window.fbq('trackCustom', eventName, payload, { eventID: eventId }); } catch (e) { /* sama */ }
    }
    log('saadetud', eventName, payload);
    return true;
  };

  /* Nõusoleku andmisel saadetakse enne kogunenud sündmused välja (üks kord, sama event_id). */
  consent.onChange(function (state) {
    if (state !== 'granted') return;
    bootProviders();
    if (!provider) return;
    window.mgEventQueue.forEach(function (e) {
      if (e.sent) return;
      e.sent = true;
      try { provider(e.event, e.params); } catch (err) { /* ei blokeeri */ }
    });
  });

  /* ---------------------------------------------------------------- nõusolekuriba */
  var COPY = {
    et: {
      text: 'Kasutame mõõtmisküpsiseid ainult selleks, et näha, millised lehed ja rajad päriselt aitavad. Isikuandmeid analüütikasse ei saadeta.',
      ok: 'Nõustun', no: 'Ei soovi', label: 'Nõusolek mõõtmiseks'
    },
    en: {
      text: 'We use measurement cookies only to see which pages and routes actually help. No personal data is sent to analytics.',
      ok: 'Accept', no: 'Decline', label: 'Measurement consent'
    }
  };

  function consentBar() {
    if (!CONFIG.ga4Id && !CONFIG.gtmId && !CONFIG.metaPixelId) return; /* midagi ei mõõdeta */
    if (consent.get()) { if (consent.get() === 'granted') bootProviders(); return; }

    var lang = (document.documentElement.lang || 'en').slice(0, 2) === 'et' ? 'et' : 'en';
    var t = COPY[lang];
    var bar = document.createElement('div');
    bar.className = 'consent-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', t.label);
    bar.innerHTML = '<p></p><div class="consent-actions">' +
      '<button type="button" class="btn btn-primary" data-consent="grant"></button>' +
      '<button type="button" class="btn btn-quiet" data-consent="deny"></button></div>';
    bar.querySelector('p').textContent = t.text;
    bar.querySelector('[data-consent="grant"]').textContent = t.ok;
    bar.querySelector('[data-consent="deny"]').textContent = t.no;
    bar.addEventListener('click', function (ev) {
      var choice = ev.target.getAttribute && ev.target.getAttribute('data-consent');
      if (!choice) return;
      if (choice === 'grant') consent.grant(); else consent.deny();
      bar.remove();
    });
    document.body.appendChild(bar);
  }

  /* GA4 Consent Mode vaikeväärtused enne mis tahes tag'i laadimist. */
  if (CONFIG.ga4Id || CONFIG.gtmId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
      wait_for_update: 500
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    decorateCrossDomainLinks();
    consentBar();
  });
})();
