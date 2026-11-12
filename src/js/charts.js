// Graphiques SVG dessinés à l'échelle réelle du conteneur (le texte reste lisible sur téléphone).
// Couleurs = variables CSS (clair/sombre sans redessiner). Marques fines, grille discrète,
// légende toujours présente dès deux séries, bulle au survol, tableau de données en complément.
(function () {
  'use strict';
  const A = window.A, s = A.s, h = A.h;

  function pasJoli(etendue, cible) {
    const brut = etendue / Math.max(1, cible), p = Math.pow(10, Math.floor(Math.log10(brut))), f = brut / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  function graduations(dom, log, cible) {
    if (log) {
      const out = [], a = Math.floor(Math.log10(dom[0])), b = Math.ceil(Math.log10(dom[1]));
      for (let e = a; e <= b; e++) [1, 1.5, 2, 3, 5, 7].forEach((mant) => { const v = mant * Math.pow(10, e); if (v >= dom[0] * 0.999 && v <= dom[1] * 1.001) out.push(v); });
      if (out.length > cible + 2) return out.filter((v) => { const mant = v / Math.pow(10, Math.floor(Math.log10(v) + 1e-9)); return Math.abs(mant - 1) < 1e-6 || Math.abs(mant - 2) < 1e-6 || Math.abs(mant - 5) < 1e-6; });
      return out;
    }
    const pas = pasJoli(dom[1] - dom[0], cible), out = [];
    for (let v = Math.ceil(dom[0] / pas - 1e-9) * pas; v <= dom[1] + pas * 1e-9; v += pas) out.push(Math.abs(v) < pas * 1e-9 ? 0 : +v.toPrecision(12));
    return out;
  }
  const decimales = (pas) => Math.max(0, Math.min(4, -Math.floor(Math.log10(pas) + 1e-9)));

  // o : { x: {dom, log, titre, fmt, grad}, y: {...}, h, ratio, hmin, hmax, marges, nom }
  A.graphe = function (hote, o) {
    hote.classList.add('graphe');
    hote.textContent = '';
    const L = Math.max(260, Math.floor(hote.clientWidth || 680));
    const H = o.h || Math.round(A.clamp(L * (o.ratio || 0.58), o.hmin || 230, o.hmax || 420));
    const etroit = L < 460;
    const m = Object.assign({ h: 14, d: 14, b: o.x && o.x.titre ? 46 : 28, g: o.y && o.y.titre ? 58 : 44 }, o.marges);
    const svg = s('svg', { viewBox: '0 0 ' + L + ' ' + H, width: L, height: H, role: 'img', 'aria-label': o.nom || 'Graphique' });
    hote.append(svg);
    const ech = function (axe, p0, p1) {
      const d = axe.dom, lg = !!axe.log, t = (v) => (lg ? Math.log(v) : v), a = t(d[0]), b = t(d[1]);
      const f = (v) => p0 + (t(v) - a) / (b - a) * (p1 - p0);
      f.inv = (p) => { const u = a + (p - p0) / (p1 - p0) * (b - a); return lg ? Math.exp(u) : u; };
      return f;
    };
    const X = o.x || { dom: [0, 1] }, Y = o.y || { dom: [0, 1] };
    const px = ech(X, m.g, L - m.d), py = ech(Y, H - m.b, m.h);
    const G = { svg, L, H, m, px, py, etroit, x0: m.g, x1: L - m.d, y0: H - m.b, y1: m.h };
    const fond = s('g', { class: 'grille' }), axes = s('g'), marques = s('g'), dessus = s('g');
    svg.append(fond, axes, marques, dessus);
    G.marques = marques; G.dessus = dessus;

    G.axes = function () {
      const gx = X.grad || graduations(X.dom, X.log, etroit ? 4 : 7), gy = Y.grad || graduations(Y.dom, Y.log, H < 280 ? 4 : 6);
      const dx = X.fmt || ((v) => A.fmt(v, gx.length > 1 ? decimales(Math.abs(gx[1] - gx[0])) : 0));
      const dy = Y.fmt || ((v) => A.fmt(v, gy.length > 1 ? decimales(Math.abs(gy[1] - gy[0])) : 0));
      if (!Y.sansGrille) gy.forEach((v) => fond.append(s('line', { x1: G.x0, x2: G.x1, y1: py(v), y2: py(v) })));
      if (X.grille) gx.forEach((v) => fond.append(s('line', { x1: px(v), x2: px(v), y1: G.y0, y2: G.y1 })));
      if (!Y.masque) gy.forEach((v) => axes.append(s('text', { x: G.x0 - 8, y: py(v) + 4, 'text-anchor': 'end', text: dy(v) })));
      if (!X.masque) gx.forEach((v) => axes.append(s('text', { x: px(v), y: G.y0 + 17, 'text-anchor': 'middle', text: dx(v) })));
      axes.append(s('line', { class: 'base', x1: G.x0, x2: G.x1, y1: G.y0, y2: G.y0 }));
      // Un titre d'axe trop long pour la place disponible perd sa parenthèse, puis est abrégé.
      const tenir = (t, place) => { const cap = Math.floor(place / 6.9); if (t.length <= cap) return t; const court = t.replace(/\s*\([^)]*\)\s*$/, ''); return court.length <= cap ? court : court.slice(0, Math.max(4, cap - 1)) + '…'; };
      if (X.titre) axes.append(s('text', { class: 'axe-titre', x: Math.max(L / 2, (G.x0 + G.x1) / 2 - 20), y: H - 6, 'text-anchor': 'middle', text: tenir(X.titre, L - 16) }));
      if (Y.titre) axes.append(s('text', { class: 'axe-titre', x: 13, y: (G.y0 + G.y1) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 13 ' + (G.y0 + G.y1) / 2 + ')', text: tenir(Y.titre, G.y0 - G.y1 + 20) }));
      return G;
    };
    const dansX = (v) => A.clamp(v, Math.min(X.dom[0], X.dom[1]), Math.max(X.dom[0], X.dom[1]));
    G.point = function (x, y, cls, r, couche) { const c = s('circle', { cx: px(x), cy: py(y), r: r || 4, class: (cls || 'c1') + ' anneau' }); (couche || marques).append(c); return c; };
    G.segment = function (xa, ya, xb, yb, cls, couche) { const l = s('line', { x1: px(xa), y1: py(ya), x2: px(xb), y2: py(yb), class: 'trait ' + (cls || 't1') }); (couche || marques).append(l); return l; };
    G.chemin = function (pts, cls, couche) {
      const d = pts.filter((p) => isFinite(p[0]) && isFinite(p[1])).map((p, i) => (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1)).join('');
      const e = s('path', { d, class: 'trait ' + (cls || 't1') }); (couche || marques).append(e); return e;
    };
    // Courbe d'une fonction y = f(x), échantillonnée régulièrement à l'écran et coupée au cadre.
    G.fonction = function (f, cls, de, a, couche) {
      de = dansX(de == null ? X.dom[0] : de); a = dansX(a == null ? X.dom[1] : a);
      const pts = [], pa = px(de), pb = px(a), n = 60, ymin = Math.min(Y.dom[0], Y.dom[1]), ymax = Math.max(Y.dom[0], Y.dom[1]);
      for (let i = 0; i <= n; i++) { const x = px.inv(pa + (pb - pa) * i / n), y = f(x); if (y >= ymin * (Y.log ? 0.98 : 1) - 1e-9 && y <= ymax * 1.0001 + 1e-9) pts.push([x, y]); }
      return G.chemin(pts, cls, couche);
    };
    G.bande = function (bas, haut, cls) {
      const pts = bas.concat(haut.slice().reverse());
      const e = s('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1)).join('') + 'Z', class: cls || 'f1', stroke: 'none' });
      marques.append(e); return e;
    };
    // Barre verticale : extrémité « donnée » arrondie, pied carré sur la ligne de base.
    G.barre = function (x, y, largeur, cls, base) {
      const xc = px(x), w = Math.min(24, Math.max(2, largeur)), yb = py(base == null ? Math.max(0, Math.min(Y.dom[0], Y.dom[1])) : base), yt = py(y), r = Math.min(4, w / 2, Math.abs(yb - yt));
      const haut = yt < yb, sg = haut ? 1 : -1;
      const d = 'M' + (xc - w / 2) + ' ' + yb + 'L' + (xc - w / 2) + ' ' + (yt + sg * r) + 'Q' + (xc - w / 2) + ' ' + yt + ' ' + (xc - w / 2 + r) + ' ' + yt + 'L' + (xc + w / 2 - r) + ' ' + yt + 'Q' + (xc + w / 2) + ' ' + yt + ' ' + (xc + w / 2) + ' ' + (yt + sg * r) + 'L' + (xc + w / 2) + ' ' + yb + 'Z';
      const e = s('path', { d, class: cls || 'c1' }); marques.append(e); return e;
    };
    G.rect = function (xa, ya, xb, yb, cls) { const e = s('rect', { x: Math.min(px(xa), px(xb)), y: Math.min(py(ya), py(yb)), width: Math.abs(px(xb) - px(xa)), height: Math.abs(py(yb) - py(ya)), class: cls || 'c1' }); marques.append(e); return e; };
    G.texte = function (x, y, txt, o2) { o2 = o2 || {}; const e = s('text', { x: px(x) + (o2.dx || 0), y: py(y) + (o2.dy || 0), 'text-anchor': o2.ancre || 'start', class: o2.cls || 'etq', text: txt }); (o2.couche || dessus).append(e); return e; };
    G.verticale = function (x, cls) { const e = s('line', { x1: px(x), x2: px(x), y1: G.y0, y2: G.y1, class: 'trait ' + (cls || 't0'), 'stroke-width': 1.2 }); marques.append(e); return e; };
    G.horizontale = function (y, cls) { const e = s('line', { x1: G.x0, x2: G.x1, y1: py(y), y2: py(y), class: 'trait ' + (cls || 't0'), 'stroke-width': 1.2 }); marques.append(e); return e; };
    // Intervalle horizontal (estimation ± IC) pour les graphiques « en forêt ».
    G.intervalle = function (xa, xb, y, cls) { const g = s('g'); g.append(s('line', { x1: px(xa), x2: px(xb), y1: py(y), y2: py(y), class: 'trait ' + (cls || 't1') })); [xa, xb].forEach((v) => g.append(s('line', { x1: px(v), x2: px(v), y1: py(y) - 5, y2: py(y) + 5, class: 'trait ' + (cls || 't1') }))); marques.append(g); return g; };

    // Survol « point le plus proche » : pts = [{x, y, ...}], info(p) -> [titre, [[libellé, valeur]…]].
    G.survolProche = function (pts, info, auChangement) {
      const marqueur = s('circle', { r: 7, fill: 'none', class: 'tink', 'stroke-width': 2, visibility: 'hidden' });
      dessus.append(marqueur);
      const ecran = pts.map((p) => [px(p.x), py(p.y)]);
      const bouger = function (ev) {
        const r = svg.getBoundingClientRect(), k = L / r.width, mx = (ev.clientX - r.left) * k, my = (ev.clientY - r.top) * k;
        let meilleur = -1, dmin = 34 * 34;
        for (let i = 0; i < ecran.length; i++) { const dx = ecran[i][0] - mx, dy = ecran[i][1] - my, d = dx * dx + dy * dy; if (d < dmin) { dmin = d; meilleur = i; } }
        if (meilleur < 0) { marqueur.setAttribute('visibility', 'hidden'); A.bulle.cacher(); if (auChangement) auChangement(null); return; }
        marqueur.setAttribute('cx', ecran[meilleur][0]); marqueur.setAttribute('cy', ecran[meilleur][1]); marqueur.setAttribute('visibility', 'visible');
        const t = info(pts[meilleur]); A.bulle.montrer(t[0], t[1], ev.clientX, ev.clientY);
        if (auChangement) auChangement(pts[meilleur]);
      };
      svg.addEventListener('pointermove', bouger); svg.addEventListener('pointerdown', bouger);
      svg.addEventListener('pointerleave', () => { marqueur.setAttribute('visibility', 'hidden'); A.bulle.cacher(); if (auChangement) auChangement(null); });
    };
    // Réticule vertical pour les séries temporelles : xs = abscisses, info(i) -> [titre, lignes].
    G.reticule = function (xs, info) {
      const trait = s('line', { y1: G.y0, y2: G.y1, class: 'trait tink', 'stroke-width': 1, visibility: 'hidden' });
      dessus.append(trait);
      const bouger = function (ev) {
        const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) * L / r.width;
        let i = 0, d = Infinity; xs.forEach((x, j) => { const e = Math.abs(px(x) - mx); if (e < d) { d = e; i = j; } });
        trait.setAttribute('x1', px(xs[i])); trait.setAttribute('x2', px(xs[i])); trait.setAttribute('visibility', 'visible');
        const t = info(i); A.bulle.montrer(t[0], t[1], ev.clientX, ev.clientY);
      };
      svg.addEventListener('pointermove', bouger); svg.addEventListener('pointerdown', bouger);
      svg.addEventListener('pointerleave', () => { trait.setAttribute('visibility', 'hidden'); A.bulle.cacher(); });
    };
    return G;
  };

  // Redessine quand la largeur du conteneur change.
  A.adapter = function (hote, dessiner) {
    let largeur = 0;
    const maj = () => { const l = Math.floor(hote.clientWidth); if (l && Math.abs(l - largeur) > 2) { largeur = l; dessiner(); } };
    if (window.ResizeObserver) new ResizeObserver(A.debounce(maj, 80)).observe(hote); else window.addEventListener('resize', A.debounce(maj, 120));
    largeur = Math.floor(hote.clientWidth); dessiner();
  };

  A.legende = function (items) {
    return h('div', { class: 'legende' }, items.map((it) => h('span', null, h('i', { class: it.type === 'ligne' ? 'ligne' : it.type === 'tiret' ? 'tiret' : '', style: (it.type ? 'border-top-color:' : 'background:') + 'var(--' + it.c + ')' }), it.nom)));
  };

  // Tableau de données sous un graphique (alternative accessible au survol).
  A.vueTable = function (titre, colonnes, lignes) {
    const table = h('table');
    table.append(h('thead', null, h('tr', null, colonnes.map((c, i) => h('th', { class: i ? 'd' : '', text: c })))));
    const corps = h('tbody'); table.append(corps);
    lignes.forEach((l) => corps.append(h('tr', null, l.map((c, i) => h('td', { class: i ? 'd' : '', text: String(c) })))));
    return h('details', { class: 'vue-table' }, h('summary', { text: titre || 'Voir les données du graphique' }), h('div', { class: 'table-boite' }, table));
  };

  // Commandes de widget.
  A.curseur = function (nom, min, max, pas, valeur, format, surChange) {
    const id = A.uid('c'), sortie = h('output', { for: id, text: format(valeur) });
    const input = h('input', { type: 'range', id, min, max, step: pas, value: valeur });
    input.addEventListener('input', () => { const v = parseFloat(input.value); sortie.textContent = format(v); surChange(v); });
    const el = h('label', { class: 'commande', for: id }, h('span', null, nom, sortie), input);
    el.regler = (v) => { input.value = v; sortie.textContent = format(v); };
    return el;
  };
  A.choix = function (nom, options, valeur, surChange) {
    const groupe = A.uid('g'), seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': nom });
    options.forEach((o) => {
      const input = h('input', { type: 'radio', name: groupe, value: o[0], id: A.uid('r') });
      if (o[0] === valeur) input.checked = true;
      input.addEventListener('change', () => { if (input.checked) surChange(o[0]); });
      seg.append(h('label', null, input, h('span', { text: o[1] })));
    });
    return h('div', { class: 'commande' }, h('span', { text: nom }), seg);
  };
  A.case = function (nom, coche, surChange) {
    const input = h('input', { type: 'checkbox', id: A.uid('k') });
    input.checked = !!coche;
    input.addEventListener('change', () => surChange(input.checked));
    return h('label', { class: 'coche' }, input, nom);
  };
  A.chiffre = (libelle, valeur, detail) => h('div', { class: 'chiffre' }, h('small', { text: libelle }), h('b', { text: valeur }), detail ? h('em', { text: detail }) : null);

  // Petite animation (respecte « réduire les animations »).
  A.animer = function (ms, etape, fin) {
    const reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduit) { etape(1); if (fin) fin(); return; }
    const t0 = performance.now();
    const tic = (t) => { const u = Math.min(1, (t - t0) / ms), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; etape(e); if (u < 1) requestAnimationFrame(tic); else if (fin) fin(); };
    requestAnimationFrame(tic);
  };

  // Gabarit commun d'un widget : titre, aide, commandes, zone graphique, lecture.
  A.gabarit = function (el, titre, aide) {
    el.textContent = '';
    const g = { commandes: h('div', { class: 'commandes' }), legende: h('div'), zone: h('div'), lecture: h('div', { class: 'lecture' }), apres: h('div') };
    el.append(h('h4', { class: 'widget-titre', text: titre }));
    if (aide) el.append(h('p', { class: 'widget-aide', html: A.inline(aide) }));
    el.append(g.commandes, g.legende, g.zone, g.lecture, g.apres);
    return g;
  };
})();
