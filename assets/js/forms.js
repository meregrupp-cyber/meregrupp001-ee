/* Meregrupp — vormikiht (§12).

   REEGEL: vorm kas jõuab päris vastuvõtusüsteemi või ütleb ausalt, et ei jõua.
   Vahepealset "avame sinu meilikliendis mustandi ja loeme selle liidiks" varianti EI OLE —
   just see tekitas analüütikasse valeliide (audit 2026-08-14, P0).

   Kaks olekut:

   A) ENDPOINT ON SEADISTATUD (form[data-endpoint] või window.MG_FORMS_CONFIG.endpoint)
      - valideerimine, veakokkuvõte ja fookus esimesele veale;
      - honeypot (.hp-field) + ajalõks (alla 4 s täidetud vorm = robot);
      - POST fetch'iga, nupp lukus saatmise ajaks;
      - submit_lead AINULT pärast HTTP 2xx vastust;
      - õnnestumisel raja tänuleht (data-thanks) või data-msg-ok;
      - vea korral veateade koos otsekontaktiga — mitte vaikne kadu.

   B) ENDPOINT PUUDUB (või action on mailto:)
      - vorm EI teeskle saatmist: submit blokeeritakse ja kuvatakse nähtav teade koos
        otsese kontaktivõimalusega (data-fallback-html või data-mailto);
      - ühtegi konversioonisündmust ei saadeta.

   Endpoint'i nõuded on kirjas docs/owner-actions.md (serveripoolne valideerimine,
   rate limit, CORS, struktureeritud liidikirje, automaatkinnitus). Selle faili ülesanne
   on ainult brauseripool. */
(function () {
  'use strict';

  var CONFIG = window.MG_FORMS_CONFIG || {};
  var MIN_FILL_MS = 4000;

  document.querySelectorAll('form[data-offer]').forEach(function (form) {
    var offer = form.dataset.offer;
    var lang = document.documentElement.lang || 'en';
    var endpoint = form.dataset.endpoint || CONFIG.endpoint || '';
    var action = form.getAttribute('action') || '';
    var status = form.querySelector('.form-status');
    var startedAt = 0;

    if (/^mailto:/i.test(action)) {
      /* mailto-action jätaks JS-ita kasutajale poolik-mustandi ja meile mõõtmata liidi */
      form.removeAttribute('action');
      if (window.console) console.error('[mg] form[data-offer="' + offer + '"]: mailto action eemaldatud — vaja on päris endpoint.');
      endpoint = form.dataset.endpoint || CONFIG.endpoint || '';
    }

    form.addEventListener('focusin', function () {
      if (startedAt) return;
      startedAt = Date.now();
      window.mgTrack && window.mgTrack('start_form', { offer: offer, language: lang });
    }, { once: true });

    /* --- B: endpoint puudub → aus teade, mitte vale edu --- */
    if (!endpoint) {
      form.setAttribute('data-mg-state', 'no-endpoint');
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!status) return;
        status.className = 'form-status active err';
        status.innerHTML = form.dataset.fallbackHtml ||
          (lang.indexOf('et') === 0
            ? 'Vormi vastuvõtt ei ole veel ühendatud, seega me ei saa seda päringut kätte. Kirjuta palun otse: <a href="mailto:meregrupp@gmail.com">meregrupp@gmail.com</a>.'
            : 'The form endpoint is not connected yet, so this request would not reach us. Please write directly: <a href="mailto:meregrupp@gmail.com">meregrupp@gmail.com</a>.');
        status.setAttribute('tabindex', '-1');
        status.focus();
      });
      return;
    }

    /* --- A: päris endpoint --- */
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var hp = form.querySelector('.hp-field input');
      if (hp && hp.value) return; /* robot — vaikne drop */

      var summary = form.querySelector('.form-error-summary');
      var errors = [];
      form.querySelectorAll('.field.invalid, .check.invalid').forEach(function (f) { f.classList.remove('invalid'); });
      form.querySelectorAll('[required]').forEach(function (input) {
        var ok = input.type === 'checkbox' ? input.checked : input.value.trim() !== '';
        if (ok && input.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        input.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) {
          var field = input.closest('.field, .check');
          if (field) field.classList.add('invalid');
          var label = form.querySelector('label[for="' + input.id + '"]');
          errors.push({ input: input, name: label ? label.textContent.trim() : input.name });
        }
      });
      if (errors.length) {
        if (summary) {
          summary.classList.add('active');
          summary.querySelector('ul').innerHTML = errors.map(function (e) {
            return '<li><a href="#' + e.input.id + '">' + e.name + '</a></li>';
          }).join('');
          summary.setAttribute('tabindex', '-1');
          summary.focus();
        } else {
          errors[0].input.focus();
        }
        return;
      }
      if (summary) summary.classList.remove('active');

      /* ajalõks alles pärast valideerimist: päris kasutajat ei tohi vaikselt dropp'ida */
      if (startedAt && Date.now() - startedAt < MIN_FILL_MS) return;

      var data = new FormData(form);
      var utm = (window.mgGetUtm && window.mgGetUtm()) || {};
      Object.keys(utm).forEach(function (k) { data.append(k, utm[k]); });
      data.append('offer', offer);
      data.append('language', lang);
      data.append('page_url', location.href.split('#')[0]);
      data.append('consent_version', form.dataset.consentVersion || '');

      var btn = form.querySelector('[type="submit"]');
      if (btn && btn.disabled) return; /* topeltsubmit */
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = '…'; }
      if (status) { status.className = 'form-status active'; status.textContent = form.dataset.msgSending || (lang.indexOf('et') === 0 ? 'Saadan…' : 'Sending…'); }

      var groupSize = data.get('group_size') || '';

      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);

          /* Konversioon läheb mõõtmisse ALLES siin — 2xx järel. PII ei lähe kaasa. */
          window.mgTrack && window.mgTrack('submit_lead', {
            offer: offer,
            language: lang,
            group_size_bucket: groupSize === '' ? 'unknown' : (parseInt(groupSize, 10) > 2 ? '3plus' : String(groupSize)),
            horizon: data.get('travel_window') ? 'future' : 'near'
          }, { dedupeKey: offer + '|' + (data.get('travel_window') || '') + '|' + groupSize });

          var thanks = form.dataset.thanks;
          if (thanks) { location.assign(thanks); return; }
          if (status) {
            status.className = 'form-status active ok';
            status.textContent = form.dataset.msgOk || (lang.indexOf('et') === 0 ? 'Päring on meil käes.' : 'We have your request.');
            status.setAttribute('tabindex', '-1');
            status.focus();
          }
          form.reset();
        })
        .catch(function () {
          if (status) {
            status.className = 'form-status active err';
            status.innerHTML = form.dataset.msgErr ||
              (lang.indexOf('et') === 0
                ? 'Saatmine ebaõnnestus. Proovi uuesti või kirjuta otse: <a href="mailto:meregrupp@gmail.com">meregrupp@gmail.com</a>.'
                : 'Sending failed. Please try again or write directly: <a href="mailto:meregrupp@gmail.com">meregrupp@gmail.com</a>.');
            status.setAttribute('tabindex', '-1');
            status.focus();
          }
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        });
    });
  });
})();
