// Outils de la partie 3 (électrification au Burkina Faso) : double différence 2×2 (avec choix
// du groupe de comparaison), tendances annuelles et placebo, effets fixes, erreurs-types groupées.
(function () {
  'use strict';
  const A = window.A, h = A.h, S = A.stats, fmt = A.fmt;
  const E = A.D.elec || { loc: [], annees: [], series: [] };
  const AN = E.annees, pts = (v, d) => A.signe(100 * v, d == null ? 1 : d) + ' point' + (Math.abs(100 * v) >= 2 ? 's' : '');
  const TRAITE = (an) => an === 2008 || an === 2009;
  const TEMOINS = { c1517: { nom: 'Électrifiées en 2015-2017 (énoncé)', f: (an) => an >= 2015 && an <= 2017 }, c1014: { nom: 'Électrifiées en 2010-2014', f: (an) => an >= 2010 && an <= 2014 }, tous: { nom: 'Toutes les autres (2010-2017)', f: (an) => an >= 2010 } };
  const table = function (tete, lignes) {
    const t = h('table'); t.append(h('thead', null, h('tr', null, tete.map((c, i) => h('th', { class: i ? 'd' : '', text: c })))));
    const b = h('tbody'); lignes.forEach((l) => b.append(h('tr', null, l.map((c, i) => h('td', { class: i ? 'd' : '', html: A.inline(String(c)) }))))); t.append(b);
    return h('div', { class: 'table-boite' }, t);
  };
  // Observations (localité × année) d'un plan : groupe traité, groupe témoin, années exclues.
  function plan(temoin, avant, apres) {
    const X = [], y = [], g = [], cel = [[0, 0, 0, 0], [0, 0, 0, 0]];   // cel[traité][période] = somme, n
    E.loc.forEach(([an, , nl], id) => {
      const t = TRAITE(an) ? 1 : temoin(an) ? 0 : -1; if (t < 0) return;
      AN.forEach((a, j) => { if (nl[j] === '-') return; const p = avant(a) ? 0 : apres(a) ? 1 : -1; if (p < 0) return; const v = +nl[j]; X.push([1, t, p, t * p]); y.push(v); g.push(id); cel[t][p * 2] += v; cel[t][p * 2 + 1]++; });
    });
    const moy = (t, p) => cel[t][p * 2] / cel[t][p * 2 + 1];
    return { X, y, g, m: { T0: moy(1, 0), T1: moy(1, 1), C0: moy(0, 0), C1: moy(0, 1) }, nT: E.loc.filter((l) => TRAITE(l[0])).length, nC: E.loc.filter((l) => !TRAITE(l[0]) && temoin(l[0])).length };
  }

  // ------------------------------------------------- 3.3 / 3.4 double différence
  A.widgets.did = function (el, p) {
    const g = A.gabarit(el, 'La double différence, pas à pas', 'Part des localités dont la lumière est détectée par satellite (`nl_extensive`). Passe d’une comparaison naïve à la double différence, puis change le groupe de comparaison pour voir ce qui se passe quand il est mal choisi.');
    const etat = { temoin: 'c1517', etape: p.etape || 'did' };
    g.commandes.append(A.choix('Comparaison', [['apres', '① Après seulement'], ['avantapres', '② Avant / après'], ['did', '③ Double différence']], etat.etape, (v) => { etat.etape = v; dessiner(); }),
      A.choix('Groupe de comparaison', Object.keys(TEMOINS).map((k) => [k, TEMOINS[k].nom]), etat.temoin, (v) => { etat.temoin = v; dessiner(); }));
    g.legende.append(A.legende([{ c: 's1', nom: 'Traitées (électrifiées en 2008-2009)', type: 'ligne' }, { c: 's2', nom: 'Groupe de comparaison', type: 'ligne' }, { c: 's1', nom: 'Traitées sans électricité (hypothèse)', type: 'tiret' }]));
    function dessiner() {
      const P = plan(TEMOINS[etat.temoin].f, (a) => a <= 2007, (a) => a >= 2010), m = P.m, e = etat.etape;
      const dd = (m.T1 - m.T0) - (m.C1 - m.C0), contre = m.T0 + (m.C1 - m.C0), reg = S.mco(P.X, P.y, { groupes: P.g });
      const G = A.graphe(g.zone, { nom: 'Part des localités éclairées avant et après, groupe traité et groupe de comparaison', ratio: 0.5, hmax: 380, x: { dom: [0.55, 2.75], grad: [1, 2], fmt: (v) => (v === 1 ? 'Avant (2003-2007)' : 'Après (2010-2014)') }, y: { dom: [0, 0.5], fmt: (v) => fmt(100 * v, 0) + ' %', titre: 'Localités éclairées' } }).axes();
      G.segment(1, m.C0, 2, m.C1, 't2'); G.segment(1, m.T0, 2, m.T1, 't1');
      [[1, m.C0, 'c2'], [2, m.C1, 'c2'], [1, m.T0, 'c1'], [2, m.T1, 'c1']].forEach(([x, y, c]) => G.point(x, y, c, 5));
      G.texte(1, m.T0, fmt(100 * m.T0, 1) + ' %', { ancre: 'end', dx: -9, dy: -5 }); G.texte(1, m.C0, fmt(100 * m.C0, 1) + ' %', { ancre: 'end', dx: -9, dy: 14 });
      const accolade = (ya, yb, txt) => { const s2 = G.segment(2.09, ya, 2.09, yb, 'tink'); s2.setAttribute('stroke-width', 2.5); [ya, yb].forEach((yy) => G.marques.append(A.s('line', { x1: G.px(2.09) - 5, x2: G.px(2.09) + 5, y1: G.py(yy), y2: G.py(yy), class: 'trait tink' }))); G.texte(2.09, (ya + yb) / 2, txt, { dx: 10, dy: 4 }); };
      let txt;
      if (e === 'apres') { accolade(m.C1, m.T1, pts(m.T1 - m.C1));
        txt = '<p><b>① Après seulement</b> : ' + fmt(100 * m.T1, 1) + ' % − ' + fmt(100 * m.C1, 1) + ' % = <b>' + pts(m.T1 - m.C1) + '</b>. Cette différence contient l’effet du réseau <em>et</em> l’écart qui existait déjà avant (' + pts(m.T0 - m.C0) + ') : c’est un <b>biais de sélection</b>.</p>';
      } else if (e === 'avantapres') { G.segment(1, m.T0, 2, m.T0, 't1 tirets'); accolade(m.T0, m.T1, pts(m.T1 - m.T0));
        txt = '<p><b>② Avant / après chez les traitées</b> : ' + fmt(100 * m.T1, 1) + ' % − ' + fmt(100 * m.T0, 1) + ' % = <b>' + pts(m.T1 - m.T0) + '</b>. Cette différence contient l’effet du réseau <em>et</em> tout ce qui a changé pour tout le monde entre les deux périodes (' + pts(m.C1 - m.C0) + ' dans le groupe de comparaison) : c’est un <b>biais de tendance</b>.</p>';
      } else { G.segment(1, m.T0, 2, contre, 't1 tirets'); G.point(2, contre, 'c1', 4).setAttribute('opacity', 0.55); accolade(contre, m.T1, 'effet : ' + pts(dd));
        txt = '<p><b>③ Double différence</b> : (' + fmt(100 * m.T1, 1) + ' − ' + fmt(100 * m.T0, 1) + ') − (' + fmt(100 * m.C1, 1) + ' − ' + fmt(100 * m.C0, 1) + ') = ' + fmt(100 * (m.T1 - m.T0), 1) + ' − ' + fmt(100 * (m.C1 - m.C0), 1) + ' = <b>' + pts(dd) + '</b>. La ligne en tirets est ce qu’auraient fait les traitées sans électricité <em>si</em> elles avaient suivi la même évolution que le groupe de comparaison (tendances parallèles) : ' + fmt(100 * contre, 1) + ' % au lieu des ' + fmt(100 * m.T1, 1) + ' % observés.</p>';
      }
      if (etat.temoin !== 'c1517') txt += '<p><b>Attention au groupe de comparaison</b> : ' + (etat.temoin === 'c1014' ? 'ces localités sont elles-mêmes raccordées <em>pendant</em> la période « après »' : 'une partie de ces localités est raccordée <em>pendant</em> la période « après »') + '. Leur lumière augmente donc à cause de leur propre électrification (' + pts(m.C1 - m.C0) + ' au lieu de +0,9 point), et la double différence retranche une partie de l’effet qu’on cherche : elle tombe à ' + pts(dd) + ' au lieu de +38,0 points.</p>';
      g.lecture.innerHTML = txt;
      g.apres.textContent = '';
      g.apres.append(table(['', 'Avant (2003-2007)', 'Après (2010-2014)', 'Variation'], [
        ['Traitées (' + P.nT + ' localités)', fmt(100 * m.T0, 2) + ' %', fmt(100 * m.T1, 2) + ' %', pts(m.T1 - m.T0, 2)],
        ['Comparaison (' + P.nC + ' localités)', fmt(100 * m.C0, 2) + ' %', fmt(100 * m.C1, 2) + ' %', pts(m.C1 - m.C0, 2)],
        ['Écart traitées − comparaison', pts(m.T0 - m.C0, 2), pts(m.T1 - m.C1, 2), '**' + pts(dd, 2) + '**']]),
        h('div', { class: 'chiffres' }, A.chiffre('Coefficient de treated × post', fmt(reg.b[3], 4), fmt(reg.n) + ' observations'), A.chiffre('Erreur-type robuste HC1', fmt(reg.seHC1[3], 4), 't = ' + fmt(reg.b[3] / reg.seHC1[3], 1)), A.chiffre('Erreur-type groupée par localité', fmt(reg.seCL[3], 4), reg.G + ' localités, t = ' + fmt(reg.b[3] / reg.seCL[3], 1))));
    }
    A.adapter(g.zone, dessiner);
  };

  // --------------------------------------------- 3.6 tendances et placebo
  A.widgets.tendances = function (el) {
    const g = A.gabarit(el, 'Les deux groupes année par année', 'Avant 2008, les deux courbes évoluent-elles de la même façon ? La zone grisée (2008-2009) correspond aux années de raccordement du groupe traité, exclues de l’estimation.');
    const VARS = { nl_extensive: ['Localités éclairées (nl_extensive)', (v) => fmt(100 * v, 0) + ' %', (v) => fmt(100 * v, 1) + ' %'], nl_intensive_hat: ['Intensité lumineuse (nl_intensive_hat)', (v) => fmt(v, 1), (v) => fmt(v, 3)], nschool_elec: ['Écoles primaires électrifiées', (v) => fmt(v, 1), (v) => fmt(v, 2)], n_students_public: ['Élèves du primaire public', (v) => fmt(v, 0), (v) => fmt(v, 1)] };
    const etat = { v: 'nl_extensive', tiers: false, k: 2005 };
    const serie = (t, v) => AN.map((a) => { const l = E.series.find((r) => r.treated === t && r.year === a); return l && l[v] != null ? l[v] : null; });
    const milieu = AN.map((a, j) => { let sm = 0, n = 0; E.loc.forEach(([an, , nl]) => { if (an >= 2010 && an <= 2014 && nl[j] !== '-') { sm += +nl[j]; n++; } }); return sm / n; });
    const select = h('select', { id: A.uid('sel'), 'aria-label': 'Variable' });
    Object.keys(VARS).forEach((k) => select.append(h('option', { value: k, text: VARS[k][0] })));
    select.addEventListener('change', () => { etat.v = select.value; dessiner(); });
    g.commandes.append(h('label', { class: 'commande' }, h('span', { text: 'Variable' }), select), A.case('Ajouter les localités électrifiées en 2010-2014', false, (v) => { etat.tiers = v; dessiner(); }));
    const placebo = h('div', { class: 'lecture' }), legende = h('div');
    g.legende.append(legende);
    const cur = A.curseur('Placebo : faux traitement à partir de', 2004, 2007, 1, etat.k, (v) => String(v), (v) => { etat.k = v; majPlacebo(); });
    g.apres.append(h('div', { class: 'commandes', style: 'margin-top:14px' }, cur), placebo);
    function majPlacebo() {
      const P = plan(TEMOINS.c1517.f, (a) => a <= 2007 && a < etat.k, (a) => a <= 2007 && a >= etat.k), r = S.mco(P.X, P.y), t = r.b[3] / r.seHC1[3];
      placebo.innerHTML = '<p><b>Double différence placebo</b> sur 2003-2007 seulement, avec une période « après » fictive à partir de ' + etat.k + ' : interaction = <b>' + pts(r.b[3]) + '</b> (erreur-type HC1 ' + fmt(100 * r.seHC1[3], 1) + ' point, t = ' + fmt(t, 2) + ', p = ' + fmt(S.pBilaterale(t), 2) + '). ' + (Math.abs(t) < 1.96 ? 'On ne détecte aucun « effet » à une date où il ne s’est rien passé : les deux groupes évoluaient de façon comparable.' : 'Un « effet » apparaît avant tout traitement : signal d’alerte sur les tendances parallèles.') + (etat.k === 2005 ? ' C’est le placebo demandé à la question 3.6 (c).' : '') + '</p>';
    }
    function dessiner() {
      const v = etat.v, T = serie(1, v), Cm = serie(0, v), tiers = etat.tiers && v === 'nl_extensive';
      const tout = T.concat(Cm, tiers ? milieu : []).filter((x) => x != null), lo = Math.min(0, Math.min.apply(null, tout)), hi = Math.max.apply(null, tout) * 1.12;
      legende.textContent = '';
      legende.append(A.legende([{ c: 's1', nom: 'Traitées (2008-2009)', type: 'ligne' }, { c: 's2', nom: 'Comparaison (2015-2017)', type: 'ligne' }].concat(tiers ? [{ c: 's3', nom: 'Électrifiées en 2010-2014', type: 'ligne' }] : [])));
      const etroit = (g.zone.clientWidth || 680) < 520;
      const G = A.graphe(g.zone, { nom: 'Évolution annuelle de ' + VARS[v][0] + ' par groupe', ratio: 0.5, hmax: 380, x: { dom: [2002.6, 2014.4], grad: AN.filter((a) => !etroit || a % 2 === 1), fmt: (a) => String(a) }, y: { dom: [lo, hi], fmt: VARS[v][1], titre: VARS[v][0] } });
      G.rect(2007.5, lo, 2009.5, hi, 'zone-grise'); G.axes();
      const tracer = (ys, t, c) => { const P = AN.map((a, i) => [a, ys[i]]).filter((q) => q[1] != null); G.chemin(P, t); P.forEach((q) => G.point(q[0], q[1], c, 3.6)); };
      tracer(Cm, 't2', 'c2'); if (tiers) tracer(milieu, 't3', 'c3'); tracer(T, 't1', 'c1');
      G.reticule(AN, (i) => [String(AN[i]), [['Traitées', T[i] == null ? 'non disponible' : VARS[v][2](T[i])], ['Comparaison', Cm[i] == null ? 'non disponible' : VARS[v][2](Cm[i])]].concat(tiers ? [['Électrifiées 2010-2014', VARS[v][2](milieu[i])]] : [])]);
      g.lecture.innerHTML = v === 'nl_extensive' ? '<p>De 2003 à 2007, les deux courbes sont basses et quasi plates, avec un écart stable de 2 à 3 points. Après le raccordement, les traitées passent à ' + fmt(100 * T[7], 1) + ' % en 2010, puis bondissent à ' + fmt(100 * T[9], 1) + ' % en 2012, l’année où le satellite VIIRS, plus sensible, entre dans la série. Le groupe de comparaison reste sous ' + fmt(100 * Math.max.apply(null, Cm) + 0.5, 0) + ' %.' + (tiers ? ' La courbe verte montre pourquoi on n’utilise pas les localités raccordées en 2010-2014 comme témoins : elles s’allument à leur tour pendant la période « après ».' : '') + '</p>' : '<p>' + (v === 'nl_intensive_hat' ? 'Variable définie seulement pour les localités éclairées au moins une fois (139 sur 297).' : 'Variable scolaire disponible jusqu’en 2012 seulement : la période « après » se réduit à 2010-2012.') + '</p>';
    }
    g.apres.append(A.vueTable('Voir les moyennes annuelles (nl_extensive)', ['Année', 'Traitées', 'Comparaison', 'Électrifiées 2010-2014'], AN.map((a, i) => [a, fmt(100 * serie(1, 'nl_extensive')[i], 1) + ' %', fmt(100 * serie(0, 'nl_extensive')[i], 1) + ' %', fmt(100 * milieu[i], 1) + ' %'])));
    A.adapter(g.zone, dessiner); majPlacebo();
  };

  // -------------------------------------------------------- 3.7 effets fixes
  A.widgets.effetsfixes = function (el) {
    const g = A.gabarit(el, 'Ce que retirent les effets fixes', 'Quatre localités fictives sur six années. Deux sont électrifiées après l’année 3 (effet réel : **+3**). Elles partent de niveaux très différents et subissent les mêmes chocs annuels. Retire les effets fixes un par un.');
    const NIV = [8, 3, 6, 1], TR = [1, 1, 0, 0], CHOC = [0, 1, -0.5, 0.8, 1.5, 0.4], EFFET = 3, T = 6;
    const brut = NIV.map((n, i) => CHOC.map((c, t) => n + c + (TR[i] && t >= 3 ? EFFET : 0)));
    const moyL = brut.map((l) => S.moyenne(l)), sansL = brut.map((l, i) => l.map((v) => v - moyL[i]));
    const moyT = CHOC.map((_, t) => S.moyenne(sansL.map((l) => l[t]))), sansLT = sansL.map((l) => l.map((v, t) => v - moyT[t]));
    const ETATS = { brut, sansL, sansLT };
    let etape = 'brut', courant = brut.map((l) => l.slice());
    g.commandes.append(A.choix('Données', [['brut', 'Brutes'], ['sansL', '− effets fixes de localité'], ['sansLT', '− effets fixes d’année aussi']], etape, (v) => { const de = courant.map((l) => l.slice()), vers = ETATS[v]; etape = v; A.animer(700, (e) => { courant = de.map((l, i) => l.map((x, t) => x + (vers[i][t] - x) * e)); dessiner(); }); }));
    g.legende.append(A.legende([{ c: 's1', nom: 'Localités électrifiées après l’année 3', type: 'ligne' }, { c: 's2', nom: 'Localités de comparaison', type: 'ligne' }]));
    const TXT = {
      brut: '<p><b>Données brutes.</b> Les localités ont des niveaux très différents (de 1 à 8) et toutes montent et descendent ensemble au gré des chocs annuels. L’effet de l’électrification est noyé dans ces deux sources de variation.</p>',
      sansL: '<p><b>Effets fixes de localité retirés.</b> Chaque localité est recentrée sur sa propre moyenne : les différences permanentes de niveau (taille, situation, lumière de départ) ont disparu. On ne compare plus des localités entre elles, mais chaque localité à elle-même dans le temps. Restent les chocs communs à chaque année.</p>',
      sansLT: '<p><b>Effets fixes d’année retirés aussi.</b> Chaque année est recentrée : ce qui touchait tout le monde la même année a disparu. Il ne reste que l’évolution <em>propre</em> aux localités électrifiées : après l’année 3, elles sont 3 au-dessus des autres (+1,5 contre −1,5), exactement l’effet. C’est la double différence.</p>'
    };
    function dessiner() {
      const G = A.graphe(g.zone, { nom: 'Quatre localités fictives, données brutes puis sans effets fixes', ratio: 0.46, hmax: 340, x: { dom: [0.7, 6.3], grad: [1, 2, 3, 4, 5, 6], fmt: (v) => 'Année ' + v }, y: { dom: [-4, 13.5], titre: 'Résultat' } }).axes();
      G.verticale(3.5, 't0 tirets'); G.texte(3.5, 13.5, 'électrification', { dx: 6, dy: 12, cls: 'etq2' });
      courant.forEach((l, i) => { const P = l.map((v, t) => [t + 1, v]); G.chemin(P, TR[i] ? 't1' : 't2'); P.forEach((q) => G.point(q[0], q[1], TR[i] ? 'c1' : 'c2', 3.6)); });
      g.lecture.innerHTML = TXT[etape];
    }
    A.adapter(g.zone, dessiner);
  };

  // ---------------------------------------------- 3.8 erreurs-types groupées
  A.widgets.cluster = function (el) {
    const g = A.gabarit(el, 'Pourquoi grouper les erreurs-types ? Une simulation sans aucun effet', 'On simule 400 panels identiques au tien (59 localités traitées, 238 de comparaison, 5 années avant, 5 après), mais où l’électrification n’a **aucun effet**. Les erreurs d’une même localité sont corrélées d’une année à l’autre avec la force que tu choisis.');
    const etat = { rho: 0.66 }, GT = 59, GC = 238, T = 10, R = 400;
    g.commandes.append(A.curseur('Corrélation des erreurs d’une année à l’autre', 0, 0.95, 0.01, etat.rho, (v) => fmt(v, 2), A.debounce((v) => { etat.rho = v; dessiner(); }, 60)),
      h('button', { class: 'btn petit', type: 'button', onclick: (ev) => { etat.rho = 0.66; ev.target.closest('.commandes').querySelector('.commande').regler(0.66); dessiner(); } }, 'Valeur de tes données (0,66)'));
    function simuler() {
      const u = A.alea(Math.round(etat.rho * 1000) + 11), G = GT + GC, n = G * T, y = new Float64Array(n), rho = etat.rho, k = Math.sqrt(1 - rho * rho);
      const est = []; let sHC = 0, sCL = 0, rejHC = 0, rejCL = 0;
      for (let r = 0; r < R; r++) {
        const sm = [0, 0, 0, 0];
        for (let i = 0; i < G; i++) { let e = u.normale(); const tr = i < GT ? 2 : 0; for (let t = 0; t < T; t++) { if (t) e = rho * e + k * u.normale(); y[i * T + t] = e; sm[tr + (t >= 5 ? 1 : 0)] += e; } }
        const nc = [GC * 5, GC * 5, GT * 5, GT * 5], mo = sm.map((v, c) => v / nc[c]), dd = (mo[3] - mo[2]) - (mo[1] - mo[0]);
        let vHC = 0, vCL = 0;
        for (let i = 0; i < G; i++) { const tr = i < GT ? 2 : 0; let sg = 0; for (let t = 0; t < T; t++) { const c = tr + (t >= 5 ? 1 : 0), signe = (c === 3 || c === 0) ? 1 : -1, psi = signe * (y[i * T + t] - mo[c]) / nc[c]; vHC += psi * psi; sg += psi; } vCL += sg * sg; }
        const seHC = Math.sqrt(vHC * n / (n - 4)), seCL = Math.sqrt(vCL * (G / (G - 1)) * ((n - 1) / (n - 4)));
        est.push(dd); sHC += seHC; sCL += seCL; if (Math.abs(dd / seHC) > 1.96) rejHC++; if (Math.abs(dd / seCL) > 1.96) rejCL++;
      }
      return { vrai: S.ecartType(est), hc: sHC / R, cl: sCL / R, rejHC: rejHC / R, rejCL: rejCL / R };
    }
    function dessiner() {
      const r = simuler(), max = Math.max(r.vrai, r.hc, r.cl) * 1.3;
      const NOMS = ['Dispersion réelle des estimations', 'Erreur-type HC1 (moyenne)', 'Erreur-type groupée (moyenne)'], COURT = ['Réelle', 'HC1', 'Groupée'], etroit = (g.zone.clientWidth || 680) < 520;
      const G = A.graphe(g.zone, { nom: 'Dispersion réelle des estimations comparée aux erreurs-types HC1 et groupées', ratio: 0.38, hmin: 210, hmax: 280, x: { dom: [0.4, 3.6], grad: [1, 2, 3], fmt: (v) => (etroit ? COURT : NOMS)[v - 1] }, y: { dom: [0, max], fmt: (v) => fmt(v, 3) } }).axes();
      [[r.vrai, 'cink'], [r.hc, 'c2'], [r.cl, 'c1']].forEach(([v, c], i) => { G.barre(i + 1, v, 24, c); G.texte(i + 1, v, fmt(v, 4), { ancre: 'middle', dy: -7 }); });
      g.lecture.innerHTML = '<p>Avec une corrélation de <b>' + fmt(etat.rho, 2) + '</b> : la vraie dispersion des estimations est de ' + fmt(r.vrai, 4) + '. L’erreur-type HC1, qui traite les 2 970 observations comme indépendantes, annonce ' + fmt(r.hc, 4) + ' (' + fmt(100 * r.hc / r.vrai, 0) + ' % de la réalité) ; l’erreur-type groupée par localité annonce ' + fmt(r.cl, 4) + ' (' + fmt(100 * r.cl / r.vrai, 0) + ' %).</p><p>Conséquence : alors qu’il n’y a aucun effet, un test à 5 % en « trouve » un dans <b>' + fmt(100 * r.rejHC, 0) + ' %</b> des simulations avec HC1, contre ' + fmt(100 * r.rejCL, 0) + ' % avec les erreurs groupées (on attend 5 %). ' + (etat.rho < 0.05 ? 'Sans corrélation, les deux erreurs-types se valent.' : 'Plus les erreurs persistent, plus HC1 surestime l’information réellement disponible.') + '</p>';
    }
    A.adapter(g.zone, dessiner);
  };
})();
