// Outils des « bases » : moindres carrés, erreur-type et intervalle de confiance,
// lecture d'un test (où tombe la statistique ?), logarithmes et pourcentages.
(function () {
  'use strict';
  const A = window.A, h = A.h, S = A.stats, fmt = A.fmt;

  // Données communales partagées par plusieurs outils.
  A.communes = (function () {
    const C = A.D.communes; if (!C) return [];
    const k = {}; C.colonnes.forEach((c, i) => { k[c] = i; });
    return C.lignes.map((l) => ({ nom: l[k.nom], region: l[k.region], prix: l[k.prix], rev: l[k.rev_hab], ventes: l[k.n_ventes], p25: l[k.p25], p75: l[k.p75], napp: l[k.n_app], pop: l[k.pop],
      lprix: Math.log(l[k.prix]), lrev: Math.log(l[k.rev_hab]), W: +(l[k.region] === 'W'), B: +(l[k.region] === 'B') }));
  })();
  A.REG = { F: { nom: 'Flandre', c: 's1', p: 'c1', t: 't1', f: 'f1' }, W: { nom: 'Wallonie', c: 's2', p: 'c2', t: 't2', f: 'f2' }, B: { nom: 'Bruxelles', c: 's3', p: 'c3', t: 't3', f: 'f3' } };

  // ---------------------------------------------------------------- 1. MCO
  A.widgets.mco = function (el) {
    const g = A.gabarit(el, 'Trouve toi-même la droite des moindres carrés', 'Douze communes belges réelles. Règle la **pente** et la **constante** : les traits verticaux sont les **résidus** (l’écart entre le prix observé et le prix prédit par ta droite). La méthode des MCO choisit la droite qui rend la somme de leurs carrés la plus petite possible.');
    const u = A.alea(7), tous = A.communes.filter((c) => c.region !== 'B' && c.ventes > 60), pts = [];
    while (pts.length < 12) { const c = tous[Math.floor(u() * tous.length)]; if (!pts.includes(c)) pts.push(c); }
    const x = pts.map((c) => c.rev / 1000), y = pts.map((c) => c.prix / 1000);
    const m = S.mco(x.map((v) => [1, v]), y), b0 = m.b[0], b1 = m.b[1];
    const etat = { pente: 8, cst: 120 };
    const scr = (c, p) => y.reduce((s, yi, i) => s + Math.pow(yi - c - p * x[i], 2), 0);
    const cPente = A.curseur('Pente (k€ de prix par k€ de revenu)', -5, 40, 0.5, etat.pente, (v) => fmt(v, 1), (v) => { etat.pente = v; dessiner(); });
    const cCst = A.curseur('Constante (k€)', -600, 400, 5, etat.cst, (v) => fmt(v, 0), (v) => { etat.cst = v; dessiner(); });
    const bouton = h('button', { class: 'btn plein', type: 'button', onclick: () => {
      const d = { p: etat.pente, c: etat.cst };
      A.animer(900, (e) => { etat.pente = d.p + (b1 - d.p) * e; etat.cst = d.c + (b0 - d.c) * e; cPente.regler(Math.round(etat.pente * 2) / 2); cCst.regler(Math.round(etat.cst / 5) * 5); dessiner(); });
    } }, 'Laisser les MCO trouver la droite');
    g.commandes.append(cPente, cCst, bouton);
    function dessiner() {
      const G = A.graphe(g.zone, { nom: 'Douze communes, leur prix médian selon le revenu par habitant, et une droite réglable', x: { dom: [19, 33], titre: 'Revenu par habitant (milliers d’euros)' }, y: { dom: [100, 650], titre: 'Prix médian (milliers d’euros)' } }).axes();
      x.forEach((xi, i) => G.segment(xi, y[i], xi, A.clamp(etat.cst + etat.pente * xi, 100, 650), 't2'));
      G.fonction((v) => etat.cst + etat.pente * v, 'tink');
      const P = pts.map((c, i) => ({ x: x[i], y: y[i], c }));
      P.forEach((p) => G.point(p.x, p.y, 'c1', 4.5));
      G.survolProche(P, (p) => [p.c.nom, [['Revenu par habitant', A.eur(p.c.rev)], ['Prix médian', A.eur(p.c.prix)], ['Prix prédit par ta droite', A.eur(1000 * (etat.cst + etat.pente * p.x))], ['Résidu', A.signe(1000 * (p.y - etat.cst - etat.pente * p.x), 0) + ' €']]]);
      const s = scr(etat.cst, etat.pente), smin = scr(b0, b1), sct = y.reduce((t, yi) => t + Math.pow(yi - S.moyenne(y), 2), 0);
      g.lecture.innerHTML = '<p>Somme des carrés des résidus avec ta droite : <b>' + fmt(s, 0) + '</b> — le minimum possible est <b>' + fmt(smin, 0) + '</b>' + (s < smin * 1.02 ? ' : tu y es.' : ' (' + fmt(s / smin, 1) + ' fois plus).') + '</p><p>La droite des MCO pour ces douze communes : prix = ' + fmt(b0, 0) + ' + <b>' + fmt(b1, 1) + '</b> × revenu. Lecture de la pente : une commune dont le revenu par habitant est plus élevé de 1 000 € a, en moyenne, un prix médian plus élevé de ' + fmt(b1 * 1000, 0) + ' €. Le R² vaut ' + fmt(1 - smin / sct, 2) + ' : la droite « explique » ' + fmt(100 * (1 - smin / sct), 0) + ' % des écarts de prix entre ces communes.</p>';
    }
    A.adapter(g.zone, dessiner);
  };

  // ------------------------------------------ 2. erreur-type et intervalle
  A.widgets.echantillon = function (el) {
    const g = A.gabarit(el, 'D’où vient l’erreur-type ? Tire des échantillons', 'On connaît ici la « vérité » : sur les 551 communes, l’élasticité du prix au revenu vaut **1,444**. Imagine que tu ne puisses observer que *n* communes tirées au hasard. Chaque tirage donne une estimation différente : leur dispersion, c’est exactement ce que mesure l’**erreur-type**.');
    const C = A.communes, VRAI = S.mco(C.map((c) => [1, c.lrev]), C.map((c) => c.lprix)).b[1];
    const etat = { n: 60, est: [], dernier: null, couverts: 0 };
    const u = A.alea(2026);
    function tirer(k) {
      for (let r = 0; r < k; r++) {
        const X = [], y = [];
        for (let i = 0; i < etat.n; i++) { const c = C[Math.floor(u() * C.length)]; X.push([1, c.lrev]); y.push(c.lprix); }
        const m = S.mco(X, y); if (!m) continue;
        const b = m.b[1], se = m.seHC1[1], couvre = Math.abs(b - VRAI) <= 1.96 * se;
        etat.est.push(b); etat.dernier = { b, se, couvre }; if (couvre) etat.couverts++;
      }
      dessiner();
    }
    g.commandes.append(
      A.choix('Taille de l’échantillon', [[30, 'n = 30'], [60, 'n = 60'], [150, 'n = 150'], [400, 'n = 400']], etat.n, (v) => { etat.n = +v; etat.est = []; etat.dernier = null; etat.couverts = 0; dessiner(); }),
      h('button', { class: 'btn', type: 'button', onclick: () => tirer(1) }, 'Tirer 1 échantillon'),
      h('button', { class: 'btn plein', type: 'button', onclick: () => tirer(200) }, 'En tirer 200'),
      h('button', { class: 'btn', type: 'button', onclick: () => { etat.est = []; etat.dernier = null; etat.couverts = 0; dessiner(); } }, 'Effacer'));
    function dessiner() {
      const a = 0.2, b = 2.7, nb = 50, pas = (b - a) / nb, cases = new Array(nb).fill(0);
      etat.est.forEach((e) => { const i = Math.floor((e - a) / pas); if (i >= 0 && i < nb) cases[i]++; });
      const hmax = Math.max(6, Math.max.apply(null, cases));
      const G = A.graphe(g.zone, { nom: 'Répartition des élasticités estimées sur des échantillons aléatoires', ratio: 0.46, hmin: 220, x: { dom: [a, b], titre: 'Élasticité estimée sur l’échantillon' }, y: { dom: [0, hmax * 1.25], titre: 'Nombre de tirages' } }).axes();
      const largeur = (G.px(a + pas) - G.px(a)) - 2;
      cases.forEach((c, i) => { if (c) G.barre(a + (i + 0.5) * pas, c, largeur, 'c1'); });
      G.verticale(VRAI, 'tink'); G.texte(VRAI, hmax * 1.25, 'vraie valeur 1,444', { dx: 6, dy: 12 });
      if (etat.dernier) { const d = etat.dernier, yb = hmax * 1.12; G.intervalle(A.clamp(d.b - 1.96 * d.se, a, b), A.clamp(d.b + 1.96 * d.se, a, b), yb, 't2'); G.point(A.clamp(d.b, a, b), yb, 'c2', 4.5); }
      const n = etat.est.length;
      if (!n) { g.lecture.innerHTML = '<p>Tire un premier échantillon de ' + etat.n + ' communes. Le point orange sera son estimation, la barre orange son intervalle de confiance à 95 %.</p>'; return; }
      const d = etat.dernier, sd = n > 1 ? S.ecartType(etat.est) : NaN;
      g.lecture.innerHTML = '<p>Dernier tirage : élasticité estimée <b>' + fmt(d.b, 3) + '</b>, erreur-type calculée par R sur ce seul échantillon <b>' + fmt(d.se, 3) + '</b>, intervalle à 95 % [' + fmt(d.b - 1.96 * d.se, 2) + ' ; ' + fmt(d.b + 1.96 * d.se, 2) + '] — il ' + (d.couvre ? 'contient' : '<b>ne contient pas</b>') + ' la vraie valeur.</p>' +
        (n > 1 ? '<p>Sur ' + fmt(n) + ' tirages : les estimations se dispersent avec un écart-type de <b>' + fmt(sd, 3) + '</b>. C’est cette dispersion que l’erreur-type cherche à deviner à partir d’un seul échantillon. ' + fmt(100 * etat.couverts / n, 0) + ' % des intervalles contiennent la vraie valeur (on en attend environ 95 %).</p>' : '') +
        '<p>Passe à un échantillon plus grand : l’histogramme se resserre. Quatre fois plus d’observations divisent l’erreur-type par deux (elle diminue comme 1/√n).</p>';
    }
    for (let r = 0; r < 80; r++) { const X = [], y = []; for (let i = 0; i < etat.n; i++) { const c = C[Math.floor(u() * C.length)]; X.push([1, c.lrev]); y.push(c.lprix); } const m = S.mco(X, y); if (m) { const couvre = Math.abs(m.b[1] - VRAI) <= 1.96 * m.seHC1[1]; etat.est.push(m.b[1]); etat.dernier = { b: m.b[1], se: m.seHC1[1], couvre }; if (couvre) etat.couverts++; } }
    A.adapter(g.zone, dessiner);
  };

  // ----------------------------------------------- 3. lecture d'un test
  const TESTS = {
    interaction: { nom: '1.13 (b) — élasticités flamande et wallonne égales ?', loi: 'normale', stat: 2.594, h0: 'θ_W = 0 : même élasticité en Flandre et en Wallonie', unite: 't' },
    bp16: { nom: '1.14 (b) — Breusch-Pagan, modèle 1.6, régresseurs', loi: 'khi2', ddl: 1, stat: 82.62, h0: 'variance des erreurs constante (homoscédasticité)', unite: 'LM' },
    bp19: { nom: '1.14 (b) — Breusch-Pagan, modèle 1.9, régresseurs', loi: 'khi2', ddl: 3, stat: 9.26, h0: 'variance des erreurs constante (homoscédasticité)', unite: 'LM' },
    bp19v: { nom: '1.14 (b) — Breusch-Pagan, modèle 1.9, ln(ventes)', loi: 'khi2', ddl: 1, stat: 0.483, h0: 'la variance ne dépend pas du nombre de ventes', unite: 'LM' },
    garcons: { nom: '2.5 (b) — deux garçons = deux filles ?', loi: 'normale', stat: -5.292, h0: 'twoboys et twogirls ont le même coefficient', unite: 't' },
    ecart: { nom: '2.10 (b) — les deux instruments donnent-ils le même effet ?', loi: 'normale', stat: -1.961, h0: 'même effet estimé avec twoboys et avec twogirls', unite: 'z' },
    sargan: { nom: '2.11 — suridentification (Sargan / J)', loi: 'khi2', ddl: 1, stat: 3.856, h0: 'tous les instruments sont exogènes', unite: 'J' },
    hausman: { nom: '2.12 — morekids est-il exogène ? (Hausman)', loi: 'normale', stat: -0.626, h0: 'morekids est exogène (MCO et 2SLS estiment la même chose)', unite: 't' },
    placebo: { nom: '3.6 (c) — double différence placebo', loi: 'normale', stat: 0.467, h0: 'aucune divergence entre les groupes avant le traitement', unite: 't' },
    did: { nom: '3.8 — effet de l’électrification (erreurs groupées)', loi: 'normale', stat: 8.59, h0: 'l’électrification n’a aucun effet sur la lumière', unite: 't' }
  };
  A.widgets.loi = function (el, p) {
    const g = A.gabarit(el, 'Où tombe la statistique de test ?', 'Un test compare un nombre calculé sur tes données (la **statistique**) à ce qu’on obtiendrait par pur hasard **si l’hypothèse nulle H₀ était vraie** (la courbe). Si la statistique tombe dans une zone où le hasard seul l’envoie rarement (zone colorée), on rejette H₀.');
    const etat = { test: TESTS[p.test] ? p.test : 'sargan', seuil: 0.05, stat: null };
    const select = h('select', { id: A.uid('sel'), 'aria-label': 'Test' });
    Object.keys(TESTS).forEach((k) => select.append(h('option', { value: k, text: TESTS[k].nom })));
    select.value = etat.test;
    select.addEventListener('change', () => { etat.test = select.value; etat.stat = null; reconstruire(); });
    const zoneCurseur = h('span');
    g.commandes.append(h('label', { class: 'commande' }, h('span', { text: 'Test du travail' }), select), A.choix('Seuil', [[0.1, '10 %'], [0.05, '5 %'], [0.01, '1 %']], etat.seuil, (v) => { etat.seuil = +v; dessiner(); }), zoneCurseur);
    function critique(T) {
      if (T.loi === 'normale') return { 0.1: 1.645, 0.05: 1.96, 0.01: 2.576 }[etat.seuil];
      let a = 0, b = 60; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (1 - S.khi2CDF(m, T.ddl) > etat.seuil) a = m; else b = m; } return (a + b) / 2;
    }
    function reconstruire() {
      const T = TESTS[etat.test]; if (etat.stat == null) etat.stat = T.stat;
      zoneCurseur.textContent = '';
      const max = T.loi === 'normale' ? 6 : Math.max(14, T.ddl * 6);
      zoneCurseur.append(A.curseur('Et si la statistique valait…', T.loi === 'normale' ? -6 : 0, max, 0.01, A.clamp(etat.stat, T.loi === 'normale' ? -6 : 0, max), (v) => fmt(v, 2), (v) => { etat.stat = v; dessiner(); }),
        h('button', { class: 'btn petit', type: 'button', style: 'margin-left:10px', onclick: () => { etat.stat = T.stat; reconstruire(); } }, 'Valeur du travail'));
      dessiner();
    }
    function dessiner() {
      const T = TESTS[etat.test], norm = T.loi === 'normale', a = norm ? -4.5 : 0, b = norm ? 4.5 : Math.max(12, T.ddl * 5), c = critique(T);
      const dens = (x) => norm ? S.normalePDF(x) : S.khi2PDF(x, T.ddl);
      let ymax = norm ? 0.42 : 0; if (!norm) { for (let i = 1; i <= 200; i++) ymax = Math.max(ymax, dens(a + (b - a) * i / 200)); ymax = Math.min(ymax, T.ddl === 1 ? 1.1 : ymax) * 1.08; }
      const G = A.graphe(g.zone, { nom: 'Loi de la statistique sous l’hypothèse nulle, zone de rejet et valeur observée', ratio: 0.42, hmin: 210, x: { dom: [a, b], titre: norm ? 'Statistique (loi normale centrée réduite sous H₀)' : 'Statistique (loi du khi-deux à ' + T.ddl + ' degré' + (T.ddl > 1 ? 's' : '') + ' de liberté sous H₀)' }, y: { dom: [0, ymax], masque: true, sansGrille: true } }).axes();
      const courbe = (de, vers) => { const pts = []; for (let i = 0; i <= 80; i++) { const x = de + (vers - de) * i / 80; pts.push([x, Math.min(dens(x), ymax)]); } return pts; };
      const zone = (de, vers) => { const haut = courbe(de, vers); G.bande(haut.map((q) => [q[0], 0]), haut, 'f2'); };
      if (norm) { zone(a, -c); zone(c, b); } else zone(c, b);
      G.chemin(courbe(norm ? a : 0.02, b), 'tink');
      const xs = A.clamp(etat.stat, a, b);
      G.verticale(xs, 't1').setAttribute('stroke-width', 2.5);
      G.texte(xs, ymax, T.unite + ' = ' + fmt(etat.stat, 2) + (etat.stat !== xs ? ' (hors cadre)' : ''), { dx: xs > (a + b) / 2 ? -6 : 6, dy: 14, ancre: xs > (a + b) / 2 ? 'end' : 'start' });
      const pres = Math.abs(G.px(xs) - G.px(c)) < 78, aGauche = pres && xs >= c;
      G.texte(c, 0, 'seuil ' + fmt(c, 2), { dy: -6, dx: aGauche ? -5 : 4, ancre: aGauche ? 'end' : 'start', cls: 'etq2' });
      const pv = norm ? S.pBilaterale(etat.stat) : 1 - S.khi2CDF(etat.stat, T.ddl), rejet = pv < etat.seuil;
      const ptxt = pv < 0.0001 ? 'inférieure à 0,0001' : 'de ' + fmt(pv, pv < 0.1 ? 4 : 2);
      g.lecture.innerHTML = '<p><b>H₀</b> : ' + A.esc(T.h0) + '.</p><p>Statistique ' + fmt(etat.stat, 2) + ', valeur critique à ' + fmt(100 * etat.seuil, 0) + ' % : ' + fmt(c, 2) + (norm ? ' (en valeur absolue)' : '') + '. La <b>p-valeur</b> est ' + ptxt + ' : si H₀ était vraie, le hasard donnerait une statistique au moins aussi extrême ' + (pv < 0.0001 ? 'moins d’une fois sur 10 000' : 'dans ' + fmt(100 * pv, pv < 0.1 ? 1 : 0) + ' % des cas') + '.</p><p><b>' + (rejet ? 'On rejette H₀' : 'On ne rejette pas H₀') + '</b> au seuil de ' + fmt(100 * etat.seuil, 0) + ' %. ' + (rejet ? '' : 'Attention : ne pas rejeter ne prouve pas que H₀ est vraie, seulement que les données ne la contredisent pas assez.') + '</p>';
    }
    A.adapter(g.zone, reconstruire);
  };

  // ------------------------------------------- 4. logarithmes et pourcentages
  A.widgets.logpct = function (el) {
    const g = A.gabarit(el, 'Une différence de logarithmes est (presque) un pourcentage', 'Déplace la variation. Pour les petites variations, 100 × Δln et le vrai pourcentage se confondent ; pour les grandes, ils s’écartent. C’est toute l’histoire de « l’approximation usuelle » de la question 1.7.');
    const etat = { g: 0.05 };
    g.commandes.append(A.curseur('Variation réelle', -60, 150, 1, 5, (v) => A.signe(v, 0) + ' %', (v) => { etat.g = v / 100; dessiner(); }),
      h('button', { class: 'btn petit', type: 'button', onclick: (ev) => { etat.g = Math.exp(0.895) - 1; ev.target.closest('.commandes').querySelector('.commande').regler(Math.round(etat.g * 100)); dessiner(); } }, 'Exemple : Bruxelles (δ = 0,895)'));
    function dessiner() {
      const G = A.graphe(g.zone, { nom: 'Variation exacte en pourcentage comparée à cent fois la différence de logarithmes', ratio: 0.5, x: { dom: [-60, 150], titre: 'Variation exacte (%)', fmt: (v) => A.signe(v, 0) }, y: { dom: [-100, 150], titre: '100 × Δln', fmt: (v) => A.signe(v, 0) } }).axes();
      G.fonction((x) => x, 't0');
      G.fonction((x) => 100 * Math.log(1 + x / 100), 't1');
      const x = 100 * etat.g, y = 100 * Math.log(1 + etat.g);
      G.segment(x, x, x, y, 't2'); G.point(x, y, 'c1', 5); G.point(x, x, 'c0', 4);
      G.texte(150, 150, 'si les deux étaient égaux', { ancre: 'end', dy: 16, dx: -4, cls: 'etq2' });
      G.texte(150, 100 * Math.log(2.5), '100 × Δln', { ancre: 'end', dy: -8, dx: -4 });
      g.lecture.innerHTML = '<p>Variation exacte : <b>' + A.signe(x, 1) + ' %</b>. Différence de logarithmes : ln(' + fmt(1 + etat.g, 3) + ') = ' + fmt(Math.log(1 + etat.g), 4) + ', soit <b>' + A.signe(y, 1) + '</b> « points de log ». Écart : ' + fmt(Math.abs(x - y), 1) + ' point' + (Math.abs(x - y) >= 2 ? 's' : '') + '.</p><p>Dans l’autre sens, la formule exacte est <b>100 × (exp(Δ) − 1)</b> : un coefficient de ' + fmt(Math.log(1 + etat.g), 3) + ' devant une indicatrice signifie ' + A.signe(x, 1) + ' %, pas ' + A.signe(y, 1) + ' %.</p>';
    }
    A.adapter(g.zone, dessiner);
  };
})();
