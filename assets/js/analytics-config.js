/* Mõõtmise seadistus — TÜHI ŠABLOON.

   Siia EI commit'ita production-ID-sid. Omanik täidab väärtused deploy'l (või
   asendab faili build-sammus keskkonnamuutujatest). Kuni ID-d on tühjad:
   - ühtegi kolmanda osapoole skripti ei laadita,
   - nõusolekuriba ei kuvata,
   - sündmused jäävad ainult window.mgEventQueue'sse (arendaja vaade).

   Vt docs/analytics-events.md (sündmuseskeem) ja docs/owner-actions.md (mida omanik teeb). */
window.MG_ANALYTICS_CONFIG = {
  /* GA4 mõõtmise ID, nt "G-XXXXXXX". Tühi = GA4 välja lülitatud. */
  ga4Id: '',

  /* Google Tag Manager konteiner, nt "GTM-XXXXXXX". Kasuta KAS ga4Id VÕI gtmId, mitte mõlemat. */
  gtmId: '',

  /* Meta Pixel ID. Tühi = pikslit ei laadita. Laaditakse ainult nõusoleku järel. */
  metaPixelId: '',

  /* Domeenid, mille vahel kampaaniaallikas peab säilima (§13 cross-domain). */
  crossDomains: ['meregrupp.ee', 'freediving.meregrupp.ee', 'freedive.ee'],

  /* true = console.debug iga sündmuse ja vahelejäetud duplikaadi kohta. */
  debug: false
};
