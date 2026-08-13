/* Meregrupp — jagatud käitumiskiht. Kõik on progressiivne täiendus:
   leht on täielik ja loetav ka ilma selle failita. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Fragmendialiaste kaardistus: loe location.hash, otsi tabelist, asenda.
     Iga leht võib defineerida window.FRAGMENT_MAP = { '#vana': '#uus' või absoluutne URL }. */
  var map = window.FRAGMENT_MAP || {};
  var h = location.hash;
  if (h && map[h]) {
    var target = map[h];
    if (target.charAt(0) === '#') {
      if (document.querySelector(target)) location.replace(location.pathname + location.search + target);
    } else {
      location.replace(target);
    }
  }

  /* Hero-video: hajub sisse alles siis, kui kaader on olemas. */
  var video = document.querySelector('.hero-media video');
  if (video && !reduced) {
    var ready = function () { video.classList.add('ready'); };
    if (video.readyState >= 2) ready();
    else video.addEventListener('canplay', ready, { once: true });
  }

  /* Kerimisilmumised (max 12 px nihe, vt design-plan §7). */
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* Sügavusriba: sektsioonid kannavad data-depth (meetrites); riba interpoleerib
     kerimisel sektsioonide vahel. Reduced-motion → staatiline indeks, väärtust ei tiksuta. */
  var rail = document.querySelector('.depth-rail');
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-depth]'));
  if (rail && sections.length) {
    var readout = rail.querySelector('.depth-readout');
    var progress = rail.querySelector('.depth-progress');
    var surfaceFlag = rail.querySelector('.depth-surface-flag');
    var maxDepth = sections.reduce(function (m, s) { return Math.max(m, parseFloat(s.dataset.depth)); }, 0) || 14;

    var current = function () {
      var mid = window.scrollY + window.innerHeight * 0.4;
      var prev = sections[0], next = sections[0];
      for (var i = 0; i < sections.length; i++) {
        var top = sections[i].offsetTop;
        if (top <= mid) { prev = sections[i]; next = sections[i + 1] || sections[i]; }
      }
      var d1 = parseFloat(prev.dataset.depth), d2 = parseFloat(next.dataset.depth);
      var t1 = prev.offsetTop, t2 = next.offsetTop;
      var t = t2 > t1 ? Math.min(1, Math.max(0, (mid - t1) / (t2 - t1))) : 0;
      return { depth: d1 + (d2 - d1) * t, rising: d2 < d1 };
    };

    var render = function () {
      var c = current();
      if (readout) readout.textContent = c.depth.toFixed(1).padStart(4, '0') + ' m';
      if (progress) progress.style.height = Math.min(100, (c.depth / maxDepth) * 100) + '%';
      if (surfaceFlag) surfaceFlag.textContent = c.rising ? '↑ surface' : '';
    };

    if (reduced) {
      /* staatiline sektsiooniindeks: näita sügavaimat märki, ei kerimissünkroonimist */
      if (readout) readout.textContent = '0–' + maxDepth + ' m';
    } else {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(function () { render(); ticking = false; }); }
      }, { passive: true });
      render();
    }

    /* skaala kriipsud */
    var scale = rail.querySelector('.depth-scale');
    if (scale && !scale.children.length) {
      for (var m = 0; m <= maxDepth; m += (maxDepth > 10 ? 2 : 1)) {
        var tick = document.createElement('div');
        tick.className = 'tick';
        tick.style.top = (m / maxDepth * 100) + '%';
        tick.innerHTML = '<span>' + m + '</span>';
        scale.appendChild(tick);
      }
      var p = document.createElement('div');
      p.className = 'depth-progress';
      scale.appendChild(p);
    }
  }

  /* Aktiivne sektsioonipunkt navigatsioonis */
  var navLinks = document.querySelectorAll('.sections-nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = byId[e.target.id];
        if (a) a.classList.toggle('active', e.isIntersecting);
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) so.observe(el);
    });
  }

  /* Programmide arv tuleb DOM-i andmemassiivist — mitte kõvakodeeritud tekstist.
     data-program-count elemendid saavad renderdatud plokkide arvu. */
  var rows = document.querySelectorAll('.program-row');
  document.querySelectorAll('[data-program-count]').forEach(function (el) {
    if (rows.length) el.textContent = String(rows.length).padStart(2, '0');
  });

  /* Mobiilimenüü: sulge <details> pärast valikut */
  var drawer = document.querySelector('.nav-drawer');
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { drawer.removeAttribute('open'); });
    });
  }
})();
