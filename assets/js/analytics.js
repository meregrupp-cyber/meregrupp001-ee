/* Keskne analytics-event helper (§13).
   Tootmiskonto ID-sid EI ole siin ega üheski failis kõvakodeeritud.
   Aktiveerimine: omanik seadistab window.MG_ANALYTICS = { send: function(name, params){…} }
   (nt GA4 gtag wrapper) PÄRAST nõusolekuloogika täitmist. Kuni seda pole, kogutakse
   sündmused mällu (mgEventQueue) — midagi ei saadeta kuhugi.
   PII-keeld: helper eemaldab võtmed, mis näevad välja nagu isikuandmed. */
(function () {
  'use strict';
  var PII_KEYS = /^(name|first|last|email|e-mail|phone|tel|whatsapp|address|message|notes?)$/i;
  window.mgEventQueue = window.mgEventQueue || [];

  window.mgTrack = function (eventName, params) {
    var clean = {};
    Object.keys(params || {}).forEach(function (k) {
      if (PII_KEYS.test(k)) return; /* isikuandmed ei lähe analüütikasse (§12) */
      var v = params[k];
      if (typeof v === 'string' && v.indexOf('@') !== -1) return;
      clean[k] = v;
    });
    if (window.MG_ANALYTICS && typeof window.MG_ANALYTICS.send === 'function') {
      try { window.MG_ANALYTICS.send(eventName, clean); } catch (e) { /* ei blokeeri UI-d */ }
    } else {
      window.mgEventQueue.push({ event: eventName, params: clean, t: Date.now() });
    }
  };

  /* UTM-ite säilitamine: loe URL-ist, hoia sessionStorage'is, lisa vormide
     peidetud metaandmeväljadele (mitte analüütikasse PII kõrvale). */
  try {
    var qs = new URLSearchParams(location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'route'].forEach(function (k) {
      if (qs.get(k)) utm[k] = qs.get(k);
    });
    if (Object.keys(utm).length) sessionStorage.setItem('mg_utm', JSON.stringify(utm));
    window.mgGetUtm = function () {
      try { return JSON.parse(sessionStorage.getItem('mg_utm') || '{}'); } catch (e) { return {}; }
    };
  } catch (e) { window.mgGetUtm = function () { return {}; }; }
})();
