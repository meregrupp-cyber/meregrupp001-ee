/* Vormikiht (§12). AUS OLEK: sellel saidil ei ole vormide backend'i (GitHub Pages,
   staatiline). Seetõttu:

   1. MG_FORM_ENDPOINT on dokumenteeritud adapter: kui omanik seadistab päris endpoint'i
      (CRM/e-post/serverless), määrata allpool URL — vorm hakkab POST-ima sinna ja
      suunab õnnestumisel raja tänulehele (data-thanks atribuut), et konversioon oleks
      mõõdetav raja kaupa.
   2. Kuni endpoint'i EI OLE: submit EI teeskle õnnestumist. Valideerimise järel
      koostatakse kasutaja vastustest struktureeritud e-kiri ja avatakse tema enda
      meiliklient (mailto) — sama kanal, mida praegune sait kasutab. Kasutajale
      öeldakse ausalt, et kiri saadetakse tema meilikliendist.
   3. Ilma JS-ita: <form action="mailto:…" method="post" enctype="text/plain"> avab
      meilikliendi väljade sisuga või ei tee midagi — kunagi ei näita valet edu.

   Rämpspostikaitse: honeypot-väli (.hp-field) + ajakontroll (min 4 s täitmisaega).
   PII ei lähe analüütikasse — mgTrack filtreerib (analytics.js). */
(function () {
  'use strict';
  var MG_FORM_ENDPOINT = ''; /* ← omanik: päris endpoint'i URL siia (vt docs/needs-confirmation.md) */

  document.querySelectorAll('form[data-offer]').forEach(function (form) {
    var startedAt = 0;
    var offer = form.dataset.offer;
    var lang = document.documentElement.lang || 'en';

    form.addEventListener('focusin', function () {
      if (!startedAt) {
        startedAt = Date.now();
        window.mgTrack && window.mgTrack('start_form', { offer: offer, language: lang });
      }
    }, { once: true });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      /* honeypot + ajakontroll */
      var hp = form.querySelector('.hp-field input');
      if ((hp && hp.value) || (startedAt && Date.now() - startedAt < 4000)) {
        return; /* vaikne drop — robot */
      }

      /* valideerimine + veakokkuvõte + fookus esimesele veale */
      var summary = form.querySelector('.form-error-summary');
      var errors = [];
      form.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
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

      var status = form.querySelector('.form-status');
      var data = new FormData(form);
      var utm = (window.mgGetUtm && window.mgGetUtm()) || {};
      Object.keys(utm).forEach(function (k) { data.append(k, utm[k]); });

      var groupSize = data.get('group_size') || '';
      window.mgTrack && window.mgTrack('submit_lead', {
        offer: offer,
        group_size_bucket: groupSize === '' ? 'unknown' : (parseInt(groupSize, 10) > 2 ? '3plus' : groupSize),
        horizon: data.get('travel_window') ? 'future' : 'near',
        source: utm.utm_source || 'direct'
      });

      if (MG_FORM_ENDPOINT) {
        /* päris endpoint: POST + tänuleht */
        var btn = form.querySelector('[type="submit"]');
        if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = '…'; }
        fetch(MG_FORM_ENDPOINT, { method: 'POST', body: data })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            var thanks = form.dataset.thanks;
            if (thanks) location.assign(thanks);
            else if (status) { status.className = 'form-status active ok'; status.textContent = form.dataset.msgOk || 'Sent.'; }
          })
          .catch(function () {
            if (status) { status.className = 'form-status active err'; status.textContent = form.dataset.msgErr || 'Sending failed — please e-mail us directly.'; }
          })
          .then(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
        return;
      }

      /* endpoint puudub: aus mailto-koostamine kasutaja meilikliendis */
      var lines = [];
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (!el.name || el.closest('.hp-field')) return;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        lines.push(el.name + ': ' + el.value);
      });
      Object.keys(utm).forEach(function (k) { lines.push(k + ': ' + utm[k]); });
      var to = form.dataset.mailto;
      var subject = form.dataset.subject || ('Inquiry — ' + offer);
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      if (status) {
        status.className = 'form-status active ok';
        status.innerHTML = (form.dataset.msgMailto ||
          'Your e-mail app will open with this request pre-filled — press send there to reach us.');
      }
      location.href = href;
    });
  });
})();
