// Outils de la partie 2 (enfants et travail des mères) : schéma causal, estimateur de Wald,
// simulation de l'endogénéité, compositions de la fratrie, « compliers ».
(function () {
  'use strict';
  const A = window.A, h = A.h, s = A.s, S = A.stats, fmt = A.fmt;
  const F = A.D.fert || { cellules: [] };
  // Moyennes par groupe à partir des 8 cellules (sexe 1 × sexe 2 × morekids).
  const somme = (filtre) => { const o = { n: 0, sw: 0, d: 0, nw: 0 }; F.cellules.forEach((c) => { if (filtre(c)) { o.n += c.n; o.sw += c.sw; o.d += c.mk * c.n; o.nw += c.nw; } }); o.work = o.sw / o.n; o.p = o.d / o.n; return o; };
  const Z0 = somme((c) => c.g1 !== c.g2), Z1 = somme((c) => c.g1 === c.g2);

  // ----------------------------------------------------------- schéma causal
  const JEUX = {
    enfants: { Z: ['Même sexe', '(samegender)'], X: ['3ᵉ enfant', '(morekids)'], Y: ['Semaines', 'travaillées'], U: ['Non observé :', 'préférences, carrière,', 'revenu du conjoint…'] },
    communes: { X: ['Revenu', 'des habitants'], Y: ['Prix', 'des maisons'], U: ['Non observé :', 'emplois, écoles,', 'cadre de vie…'] },
    generique: { Z: ['Instrument', 'Z'], X: ['Cause', 'supposée X'], Y: ['Résultat', 'Y'], U: ['Facteur caché', 'U'] }
  };
  const SCHEMAS = {
    mco: { nom: 'Le problème', texte: 'On veut la flèche **X → Y**. Mais un facteur non observé U agit à la fois sur X et sur Y : comparer les valeurs de Y selon X mélange l’effet de X et celui de U. C’est un **facteur de confusion** ; l’estimateur des MCO est biaisé.' },
    vi: { nom: 'La solution : un instrument', texte: 'L’instrument Z fait varier X (**pertinence**) sans être lié à U (**indépendance**) et sans agir sur Y autrement que par X (**exclusion**). La part de X provoquée par Z est donc « propre » : on n’utilise qu’elle.' },
    exclusion: { nom: 'Exclusion violée', texte: 'Si Z agit **directement** sur Y (flèche rouge) — par exemple si deux enfants de même sexe coûtent moins cher et réduisent le besoin d’un second salaire —, l’effet de Z sur Y ne passe plus seulement par X : la division de Wald attribue à X un effet qui n’est pas le sien.' },
    independance: { nom: 'Indépendance violée', texte: 'Si Z est **lié à U** (trait rouge) — par exemple si le sexe des enfants influençait le divorce, alors que l’échantillon ne garde que des femmes mariées —, Z n’est plus « comme tiré au sort » et hérite du problème de confusion.' },
    inverse: { nom: 'Causalité inverse', texte: 'Y peut aussi agir sur X (flèche rouge) : des maisons chères filtrent les ménages qui peuvent s’installer, donc le revenu des habitants est en partie une **conséquence** des prix. La pente mesure alors un mélange des deux sens.' }
  };
  A.widgets.dag = function (el, p) {
    const jeu = JEUX[p.jeu] ? p.jeu : 'enfants', N = JEUX[jeu];
    const dispo = jeu === 'communes' ? ['mco', 'inverse'] : jeu === 'generique' ? ['mco', 'vi'] : ['mco', 'vi', 'exclusion', 'independance'];
    let schema = dispo.includes(p.schema) ? p.schema : dispo[0];
    const g = A.gabarit(el, p.titre || 'Qui cause quoi ? Le schéma à avoir en tête', 'Chaque flèche se lit « agit sur ». Change de schéma pour voir ce que chaque hypothèse autorise ou interdit.');
    if (dispo.length > 1) g.commandes.append(A.choix('Schéma', dispo.map((k) => [k, SCHEMAS[k].nom]), schema, (v) => { schema = v; dessiner(); }));
    function dessiner() {
      g.zone.textContent = ''; g.zone.classList.add('graphe');
      const L = Math.max(280, Math.floor(g.zone.clientWidth || 640)), H = 250, lb = Math.min(132, L * 0.28), hb = 46;
      const svg = s('svg', { viewBox: '0 0 ' + L + ' ' + H, width: L, height: H, role: 'img', 'aria-label': 'Schéma causal : ' + SCHEMAS[schema].nom, class: 'schema' });
      g.zone.append(svg);
      const avecZ = !!N.Z && schema !== 'mco';
      const xX = (!avecZ && L < 560) ? lb / 2 + 4 : L / 2;
      const pos = { Z: [lb / 2 + 4, 178], X: [xX, 178], Y: [L - lb / 2 - 4, 178], U: [(xX + L - lb / 2 - 4) / 2, 44] };
      const fleche = function (a, b, cls, courbe) {
        let [x1, y1] = a, [x2, y2] = b;
        const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
        let chemin;
        if (courbe) { const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + courbe; chemin = 'M' + x1 + ' ' + y1 + 'Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2; }
        else chemin = 'M' + x1 + ' ' + y1 + 'L' + (x2 - ux * 7) + ' ' + (y2 - uy * 7);
        svg.append(s('path', { d: chemin, class: 'fleche ' + cls }));
        const ax = courbe ? (x2 - (x1 + x2) / 2) : ux, ay = courbe ? (y2 - (Math.max(y1, y2) + courbe)) : uy, an = Math.hypot(ax, ay), vx = ax / an, vy = ay / an;
        svg.append(s('polygon', { points: [x2, y2, x2 - vx * 11 - vy * 5.5, y2 - vy * 11 + vx * 5.5, x2 - vx * 11 + vy * 5.5, y2 - vy * 11 - vx * 5.5].join(' '), class: 'pointe ' + cls }));
      };
      const bord = (n, vers) => { const [x, y] = pos[n], [tx, ty] = pos[vers], dx = tx - x, dy = ty - y; if (Math.abs(dx) * hb > Math.abs(dy) * lb) return [x + Math.sign(dx) * (lb / 2 + 3), y + dy * (lb / 2 + 3) / Math.abs(dx)]; return [x + dx * (hb / 2 + 3) / Math.abs(dy), y + Math.sign(dy) * (hb / 2 + 3)]; };
      fleche(bord('U', 'X'), bord('X', 'U'), 'pale'); fleche(bord('U', 'Y'), bord('Y', 'U'), 'pale');
      fleche(bord('X', 'Y'), bord('Y', 'X'), schema === 'mco' || schema === 'inverse' ? 'vif' : '');
      if (avecZ) fleche(bord('Z', 'X'), bord('X', 'Z'), schema === 'vi' ? 'vif' : '');
      if (schema === 'exclusion') fleche([pos.Z[0], pos.Z[1] + hb / 2 + 3], [pos.Y[0], pos.Y[1] + hb / 2 + 3], 'mal', 38);
      if (schema === 'independance') { const a = [pos.Z[0], pos.Z[1] - hb / 2 - 3], b = [pos.U[0] - lb / 2 - 3, pos.U[1]]; svg.append(s('path', { d: 'M' + a[0] + ' ' + a[1] + 'Q' + a[0] + ' ' + b[1] + ' ' + b[0] + ' ' + b[1], class: 'fleche mal' })); }
      if (schema === 'inverse') fleche([pos.Y[0], pos.Y[1] + hb / 2 + 3], [pos.X[0], pos.X[1] + hb / 2 + 3], 'mal', 34);
      Object.keys(pos).forEach((n) => {
        if (!N[n] || (n === 'Z' && !avecZ)) return;
        const [x, y] = pos[n], lignes = N[n], hh = n === 'U' ? 16 * lignes.length + 14 : hb, w = n === 'U' ? Math.min(170, L * 0.42) : lb;
        svg.append(s('rect', { x: x - w / 2, y: y - hh / 2, width: w, height: hh, rx: 6, class: 'noeud' + (n === 'U' ? ' cache' : '') }));
        lignes.forEach((t, i) => svg.append(s('text', { x, y: y - (lignes.length - 1) * 8 + i * 16 + 4, 'text-anchor': 'middle', class: i === 0 && n !== 'U' ? 'etq' : 'etq2', text: t })));
      });
      const etq = (x, y, t, cls) => svg.append(s('text', { x, y, 'text-anchor': 'middle', class: cls || 'etq2', text: t }));
      if (L > 520) {
        etq((pos.X[0] + pos.Y[0]) / 2, pos.X[1] - 9, 'effet causal β₁');
        if (avecZ) etq((pos.Z[0] + pos.X[0]) / 2, pos.Z[1] - 9, 'pertinence');
        if (schema === 'exclusion') etq(L / 2, 243, 'effet direct interdit');
        if (schema === 'inverse') etq((pos.X[0] + pos.Y[0]) / 2, 243, 'tri des ménages');
      }
      g.lecture.innerHTML = A.md(SCHEMAS[schema].texte);
    }
    A.adapter(g.zone, dessiner);
  };

  // -------------------------------------------------- Wald : forme réduite / 1re étape
  A.widgets.wald = function (el) {
    const g = A.gabarit(el, 'L’estimateur de Wald : une division', 'Compare les mères selon le sexe de leurs deux premiers enfants. Le sexe change **un peu** la probabilité d’un troisième enfant (première étape) et **un peu** le travail (forme réduite). Le rapport des deux donne l’effet d’un troisième enfant.');
    const REEL = { pe: Z1.p - Z0.p, fr: Z1.work - Z0.work };
    const etat = { pe: REEL.pe, fr: REEL.fr };
    const cPe = A.curseur('Première étape (points de %)', 0.2, 20, 0.05, 100 * etat.pe, (v) => A.signe(v, 2), (v) => { etat.pe = v / 100; dessiner(); });
    const cFr = A.curseur('Forme réduite (semaines)', -2, 0, 0.005, etat.fr, (v) => A.signe(v, 3), (v) => { etat.fr = v; dessiner(); });
    g.commandes.append(cPe, cFr, h('button', { class: 'btn petit', type: 'button', onclick: () => { etat.pe = REEL.pe; etat.fr = REEL.fr; cPe.regler(100 * REEL.pe); cFr.regler(REEL.fr); dessiner(); } }, 'Valeurs réelles'));
    const gauche = h('div'), droite = h('div'), formule = h('div', { class: 'formule-grande' });
    g.zone.append(h('div', { class: 'deux-col' }, gauche, droite), formule);
    g.legende.append(A.legende([{ c: 's-mute', nom: 'Sexes différents (' + fmt(Z0.n) + ' mères)' }, { c: 's1', nom: 'Même sexe (' + fmt(Z1.n) + ' mères)' }]));
    function panneau(hote, titre, v0, v1, dom, f, etiquette) {
      hote.textContent = '';
      const zone = h('div');
      hote.append(h('div', { class: 'rubrique', text: titre }), zone, h('p', { class: 'note-pied', style: 'text-align:center;margin:2px 0 0', text: etiquette }));
      const G = A.graphe(zone, { nom: titre, h: 210, x: { dom: [0.3, 2.7], grad: [1, 2], fmt: (v) => (v === 1 ? 'Sexes différents' : 'Même sexe') }, y: { dom, fmt: (v) => f(v, 0) }, marges: { g: 46 } }).axes();
      G.barre(1, v0, 24, 'c0'); G.barre(2, v1, 24, 'c1');
      G.texte(1, v0, f(v0), { ancre: 'middle', dy: -7 }); G.texte(2, v1, f(v1), { ancre: 'middle', dy: -7 });
    }
    function dessiner() {
      const p1 = Z0.p + etat.pe, w1 = Z0.work + etat.fr, effet = etat.fr / etat.pe, reel = Math.abs(etat.pe - REEL.pe) < 1e-6 && Math.abs(etat.fr - REEL.fr) < 1e-6;
      panneau(gauche, 'Part des mères avec un 3ᵉ enfant', Z0.p, p1, [0, 0.65], (v, d) => fmt(100 * v, d == null ? 1 : d) + ' %', 'Première étape : ' + A.signe(100 * etat.pe, 2) + ' points');
      panneau(droite, 'Semaines travaillées en moyenne', Z0.work, w1, [0, 26], (v, d) => fmt(v, d == null ? 2 : d), 'Forme réduite : ' + A.signe(etat.fr, 3) + ' semaine');
      formule.innerHTML = A.math('\\frac{\\text{forme réduite}}{\\text{première étape}} = \\frac{' + fmt(etat.fr, 4) + '}{' + fmt(etat.pe, 4) + '} = ') + ' <b>' + fmt(effet, 2) + ' semaines</b>';
      g.lecture.innerHTML = '<p>Prends 100 mères de chaque groupe. Dans le groupe « même sexe », il y a <b>' + fmt(100 * etat.pe, 2) + ' troisièmes enfants de plus</b>, et ces 100 mères travaillent au total <b>' + fmt(-100 * etat.fr, 1) + ' semaines de moins</b>. Si toute la baisse vient de ces enfants supplémentaires (c’est la restriction d’exclusion), chacun « coûte » ' + fmt(-100 * etat.fr, 1) + ' / ' + fmt(100 * etat.pe, 2) + ' = <b>' + fmt(-effet, 1) + ' semaines</b>.</p>' +
        (reel ? '<p>Ce sont les vraies valeurs : on retrouve exactement l’estimation par variables instrumentales de la question 2.6 (−6,31).</p>' : etat.pe < 0.02 ? '<p><b>Instrument faible</b> : la première étape est proche de zéro. On divise par presque rien : la moindre erreur sur la forme réduite fait exploser le résultat.</p>' : '<p>Valeurs modifiées. Réduis la première étape vers zéro pour voir ce qu’est un instrument faible.</p>');
    }
    A.adapter(g.zone, dessiner);
  };

  // ------------------------------------ simulation : MCO biaisés, VI imprécise
  A.widgets.simiv = function (el) {
    const g = A.gabarit(el, 'Simulation : MCO précis mais biaisés, VI juste mais imprécise', 'Un monde inventé où l’on **connaît** la vérité : un 3ᵉ enfant réduit le travail de **5 semaines**. Une variable cachée (l’attachement à la carrière) réduit la probabilité d’un 3ᵉ enfant et augmente le travail. Chaque point est l’estimation obtenue sur un échantillon simulé.');
    const etat = { conf: 0.5, force: 0.5, n: 5000 }, BETA = -5, R = 250;
    let res = null;
    g.commandes.append(A.curseur('Force de la variable cachée', 0, 1.5, 0.05, etat.conf, (v) => fmt(v, 2), (v) => { etat.conf = v; }),
      A.curseur('Force de l’instrument', 0.02, 1.2, 0.01, etat.force, (v) => fmt(v, 2), (v) => { etat.force = v; }),
      A.choix('Taille d’échantillon', [[1000, '1 000'], [5000, '5 000'], [25000, '25 000']], etat.n, (v) => { etat.n = +v; }),
      h('button', { class: 'btn plein', type: 'button', onclick: (ev) => { const bt = ev.currentTarget; bt.disabled = true; bt.textContent = 'Calcul…'; setTimeout(() => { simuler(); dessiner(); bt.disabled = false; bt.textContent = 'Lancer ' + R + ' simulations'; }, 30); } }, 'Lancer ' + R + ' simulations'));
    g.legende.append(A.legende([{ c: 's2', nom: 'MCO' }, { c: 's1', nom: 'Variables instrumentales' }]));
    function simuler() {
      const u = A.alea(Math.floor(etat.conf * 1000 + etat.force * 100000 + etat.n)), mco = [], vi = []; let pe = 0;
      for (let r = 0; r < R; r++) {
        let n1 = 0, s1 = 0, n0 = 0, s0 = 0, nz1 = 0, xz1 = 0, yz1 = 0, nz0 = 0, xz0 = 0, yz0 = 0;
        for (let i = 0; i < etat.n; i++) {
          const U = u.normale(), Z = u() < 0.5 ? 1 : 0, X = (-0.35 + etat.force * Z - etat.conf * U + u.normale()) > 0 ? 1 : 0, Y = 20 + BETA * X + 6 * etat.conf * U + 14 * u.normale();
          if (X) { n1++; s1 += Y; } else { n0++; s0 += Y; }
          if (Z) { nz1++; xz1 += X; yz1 += Y; } else { nz0++; xz0 += X; yz0 += Y; }
        }
        const d = xz1 / nz1 - xz0 / nz0;
        mco.push(s1 / n1 - s0 / n0); vi.push((yz1 / nz1 - yz0 / nz0) / d); pe += d;
      }
      res = { mco, vi, pe: pe / R };
    }
    function dessiner() {
      const a = -20, b = 10;
      const G = A.graphe(g.zone, { nom: 'Estimations simulées par MCO et par variables instrumentales', ratio: 0.36, hmin: 210, hmax: 300, x: { dom: [a, b], titre: 'Effet estimé d’un 3ᵉ enfant (semaines)', grille: true }, y: { dom: [-0.6, 1.6], masque: true, sansGrille: true } }).axes();
      G.verticale(BETA, 'tink'); G.texte(BETA, 1.6, 'vérité : −5', { dx: 6, dy: 12 });
      if (!res) return;
      const j = A.alea(3); let hors = 0;
      [['mco', 1, 'c2', 'MCO'], ['vi', 0, 'c1', 'VI']].forEach(([k, y0, cls, nom]) => {
        res[k].forEach((v) => { if (v < a || v > b) { if (k === 'vi') hors++; return; } const pt = G.point(v, y0 + (j() - 0.5) * 0.6, cls, 2.6); pt.setAttribute('class', cls); pt.setAttribute('opacity', 0.55); });
        G.texte(b, y0 + 0.42, nom, { ancre: 'end', dx: -4, dy: 0 });
      });
      const mm = S.moyenne(res.mco), sm = S.ecartType(res.mco), med = S.mediane(res.vi), sv = S.ecartType(res.vi.filter((v) => v > -60 && v < 50));
      g.lecture.innerHTML = '<p><b>MCO</b> : estimations centrées sur ' + fmt(mm, 2) + ' (biais de ' + A.signe(mm - BETA, 2) + '), très groupées (écart-type ' + fmt(sm, 2) + '). ' + (Math.abs(mm - BETA) > 3 * sm ? 'Précis… mais faux : la vérité est en dehors du nuage.' : 'Sans variable cachée, les MCO sont justes <em>et</em> précis : inutile d’instrumenter.') + '</p>' +
        '<p><b>VI</b> : estimations centrées sur ' + fmt(med, 2) + ' (médiane), mais ' + fmt(sv / sm, 0) + ' fois plus dispersées (écart-type ' + fmt(sv, 2) + ')' + (hors ? ' ; ' + hors + ' estimations sortent du cadre' : '') + '. L’instrument déplace la probabilité d’un 3ᵉ enfant de ' + fmt(100 * res.pe, 1) + ' points en moyenne.' + (res.pe < 0.03 ? ' <b>Instrument faible</b> : les estimations partent dans tous les sens.' : '') + '</p>' +
        '<p>À essayer, en relançant à chaque fois : variable cachée à 0 (les MCO redeviennent justes), instrument à 0,15 (proche du vrai travail : il faut alors un échantillon énorme, d’où les 254 654 mères), puis instrument à 0,03 (la VI devient inutilisable).</p>';
    }
    simuler();
    A.adapter(g.zone, dessiner);
  };

  // ---------------------------------------------- 2.5 les quatre compositions
  A.widgets.compo = function (el) {
    const g = A.gabarit(el, 'Qui a un troisième enfant ? Les quatre compositions', 'Part des mères ayant plus de deux enfants selon le sexe des deux premiers (dans l’ordre des naissances), avec l’intervalle de confiance à 95 %.');
    const ORD = [['G', 'G', 'Garçon-garçon', 'G-G'], ['G', 'F', 'Garçon-fille', 'G-F'], ['F', 'G', 'Fille-garçon', 'F-G'], ['F', 'F', 'Fille-fille', 'F-F']];
    const pts = ORD.map(([a, b, nom, court], i) => { const o = somme((c) => c.g1 === a && c.g2 === b), se = Math.sqrt(o.p * (1 - o.p) / o.n); return { x: i + 1, y: o.p, n: o.n, se, nom, court, meme: a === b }; });
    g.legende.append(A.legende([{ c: 's1', nom: 'Deux enfants de même sexe' }, { c: 's-mute', nom: 'Un garçon et une fille' }]));
    g.apres.append(A.vueTable('Voir les valeurs', ['Composition', 'Mères', 'Plus de deux enfants', 'IC à 95 %'], pts.map((q) => [q.nom, fmt(q.n), fmt(100 * q.y, 2) + ' %', '[' + fmt(100 * (q.y - 1.96 * q.se), 2) + ' ; ' + fmt(100 * (q.y + 1.96 * q.se), 2) + ']'])));
    function dessiner() {
      const etroit = (g.zone.clientWidth || 680) < 480;
      const G = A.graphe(g.zone, { nom: 'Part des mères ayant un troisième enfant selon le sexe des deux premiers', ratio: 0.5, hmax: 360, x: { dom: [0.5, 4.5], grad: [1, 2, 3, 4], fmt: (v) => pts[v - 1][etroit ? 'court' : 'nom'] }, y: { dom: [0.33, 0.44], fmt: (v) => fmt(100 * v, 0) + ' %', titre: 'Mères avec plus de deux enfants' } }).axes();
      pts.forEach((q) => { const cls = q.meme ? 't1' : 't0'; G.segment(q.x, q.y - 1.96 * q.se, q.x, q.y + 1.96 * q.se, cls); [-1, 1].forEach((sg) => { const yy = q.y + sg * 1.96 * q.se; G.marques.append(s('line', { x1: G.px(q.x) - 6, x2: G.px(q.x) + 6, y1: G.py(yy), y2: G.py(yy), class: 'trait ' + cls })); }); G.point(q.x, q.y, q.meme ? 'c1' : 'c0', 5.5); G.texte(q.x, q.y, fmt(100 * q.y, 1) + ' %', { dx: 12, dy: 4 }); });
      G.survolProche(pts, (q) => [q.nom, [['Mères', fmt(q.n)], ['Plus de deux enfants', fmt(100 * q.y, 2) + ' %'], ['IC à 95 %', '[' + fmt(100 * (q.y - 1.96 * q.se), 2) + ' ; ' + fmt(100 * (q.y + 1.96 * q.se), 2) + ']']]]);
      g.lecture.innerHTML = '<p>Les deux compositions mixtes sont au même niveau (' + fmt(100 * pts[1].y, 1) + ' % et ' + fmt(100 * pts[2].y, 1) + ' %) : l’ordre garçon-fille ou fille-garçon ne change rien. Deux garçons ajoutent ' + A.signe(100 * (pts[0].y - pts[1].y), 1) + ' points, deux filles ' + A.signe(100 * (pts[3].y - pts[2].y), 1) + ' points : l’effet existe dans les deux cas, mais il est plus fort après deux filles.</p>';
    }
    A.adapter(g.zone, dessiner);
  };

  // ------------------------------------------------------ 2.14 les compliers
  A.widgets.compliers = function (el) {
    const g = A.gabarit(el, 'Pour quelles mères l’effet est-il mesuré ? Les « compliers »', 'Sous l’hypothèse de monotonie, les mères se répartissent en trois groupes selon leur réaction à l’instrument. La VI ne mesure l’effet que pour le groupe du milieu.');
    let inst = 'samegender';
    const DEF = { samegender: [(c) => c.g1 === c.g2, (c) => c.g1 !== c.g2, 'deux enfants de même sexe'], twoboys: [(c) => c.g1 === 'G' && c.g2 === 'G', (c) => c.g1 === 'G' && c.g2 === 'F', 'deux garçons (parmi les familles dont l’aîné est un garçon)'], twogirls: [(c) => c.g1 === 'F' && c.g2 === 'F', (c) => c.g1 === 'F' && c.g2 === 'G', 'deux filles (parmi les familles dont l’aînée est une fille)'] };
    g.commandes.append(A.choix('Instrument', [['samegender', 'samegender'], ['twoboys', 'twoboys'], ['twogirls', 'twogirls']], inst, (v) => { inst = v; dessiner(); }));
    function dessiner() {
      const a = somme(DEF[inst][0]), b = somme(DEF[inst][1]), toujours = b.p, jamais = 1 - a.p, comp = a.p - b.p;
      g.zone.textContent = '';
      const seg = (part, cls, nom) => h('div', { class: 'seg-part ' + cls, style: 'flex:' + part, title: nom + ' : ' + fmt(100 * part, 1) + ' %' }, part > 0.12 ? fmt(100 * part, 1) + ' %' : '');
      g.zone.append(h('div', { class: 'segbar', role: 'img', 'aria-label': 'Jamais : ' + fmt(100 * jamais, 1) + ' %, compliers : ' + fmt(100 * comp, 1) + ' %, toujours : ' + fmt(100 * toujours, 1) + ' %' }, seg(jamais, 'p0', 'Jamais de 3ᵉ enfant'), seg(comp, 'p1', 'Compliers'), seg(toujours, 'p2', 'Toujours un 3ᵉ enfant')),
        A.legende([{ c: 's-mute', nom: '« Never-takers » : pas de 3ᵉ enfant, quel que soit le sexe des deux premiers (' + fmt(100 * jamais, 1) + ' %)' }, { c: 's1', nom: '« Compliers » : un 3ᵉ enfant seulement parce que les deux premiers sont de même sexe (' + fmt(100 * comp, 1) + ' %)' }, { c: 's2', nom: '« Always-takers » : un 3ᵉ enfant de toute façon (' + fmt(100 * toujours, 1) + ' %)' }]));
      g.lecture.innerHTML = '<p>Instrument : ' + DEF[inst][2] + '. Sans l’instrument, ' + fmt(100 * b.p, 1) + ' % des mères ont un 3ᵉ enfant : ce sont les « always-takers ». Avec, ' + fmt(100 * a.p, 1) + ' % : les ' + fmt(100 * jamais, 1) + ' % restants sont les « never-takers ». La différence, <b>' + fmt(100 * comp, 1) + ' %</b>, ce sont les compliers — et c’est aussi la première étape.</p><p>L’estimation VI est l’effet moyen <em>pour ces mères-là</em> (un effet local, « LATE »). On ne peut pas les identifier une à une, et rien ne garantit que l’effet soit le même pour les autres. Change d’instrument : la part et la composition des compliers changent, ce qui peut expliquer que <code>twoboys</code> et <code>twogirls</code> ne donnent pas la même estimation.</p>';
    }
    dessiner();
  };
})();
