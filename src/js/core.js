// Espace de noms, petits utilitaires, bulle d'information.
(function () {
  'use strict';
  const A = window.A = { widgets: {}, D: window.__DONNEES || {}, C: window.__CONTENU || {} };

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  A.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);

  // h('div', {class: 'x', onclick: fn}, enfant, 'texte', ...) -> élément DOM
  A.h = function (tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach((x) => x != null && x !== false && el.append(x));
      else el.append(c);
    }
    return el;
  };
  const NS = 'http://www.w3.org/2000/svg';
  A.s = function (tag, attrs) {
    const el = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') el.textContent = v; else el.setAttribute(k, v);
    }
    for (let i = 2; i < arguments.length; i++) { const c = arguments[i]; if (c != null && c !== false) el.append(c); }
    return el;
  };

  // Nombres à la française : 1 234,57 (espace fine insécable, virgule, vrai signe moins).
  A.fmt = function (x, d) {
    if (x == null || !isFinite(x)) return '–';
    d = d == null ? 0 : d;
    const neg = x < 0;
    const s = Math.abs(x).toFixed(d);
    if (parseFloat(s) === 0) return (0).toFixed(d).replace('.', ',');
    let [ent, dec] = s.split('.');
    ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '−' : '') + ent + (dec ? ',' + dec : '');
  };
  A.signe = (x, d) => (x > 0 ? '+' : '') + A.fmt(x, d);
  A.pct = (x, d) => A.fmt(100 * x, d == null ? 1 : d) + ' %';
  A.eur = (x) => A.fmt(x, 0) + ' €';
  A.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  A.debounce = function (fn, ms) { let t; return function () { clearTimeout(t); const a = arguments, c = this; t = setTimeout(() => fn.apply(c, a), ms); }; };
  let compteur = 0;
  A.uid = (p) => (p || 'id') + '-' + (++compteur);

  // Générateur pseudo-aléatoire reproductible (mulberry32) + loi normale.
  A.alea = function (graine) {
    let a = graine >>> 0;
    const u = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    u.normale = function () { let x = 0, y = 0; while (x === 0) x = u(); y = u(); return Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * y); };
    return u;
  };

  // Bulle d'information (survol des graphiques). Le contenu est construit en DOM, jamais en HTML brut.
  const bulle = () => document.getElementById('bulle');
  A.bulle = {
    montrer(titre, lignes, x, y) {
      const b = bulle(); if (!b) return;
      b.textContent = '';
      if (titre) b.append(A.h('b', { text: titre }));
      (lignes || []).forEach((l) => b.append(A.h('div', { class: 'l' }, A.h('span', { text: l[0] }), A.h('span', { text: l[1] }))));
      b.hidden = false;
      const r = b.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
      let px = x + 14, py = y + 14;
      if (px + r.width > W - 8) px = x - r.width - 14;
      if (py + r.height > H - 8) py = y - r.height - 14;
      b.style.left = Math.max(8, px) + 'px'; b.style.top = Math.max(8, py) + 'px';
    },
    cacher() { const b = bulle(); if (b) b.hidden = true; }
  };

  A.ICONES = {
    ok: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cle: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5a5.5 5.5 0 0 0-3 10.1V15h6v-2.4a5.5 5.5 0 0 0-3-10.1zM7.5 17.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    piege: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3l8 14H2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 8.5v4M10 14.8v.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
})();
