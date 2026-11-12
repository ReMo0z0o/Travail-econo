// Outils de la partie 1 (communes belges) : fusions, précision d'une médiane, histogrammes,
// explorateur du nuage, formes fonctionnelles, catégorie de référence, biais de variable omise,
// centrage, hétéroscédasticité, graphique « en forêt ».
(function () {
  'use strict';
  const A = window.A, h = A.h, S = A.stats, fmt = A.fmt, REG = A.REG;
  const C = A.communes, K = (v) => v / 1000;
  const lig = (pts, f) => pts.map(f);
  const pctExp = (d) => A.signe(100 * (Math.exp(d) - 1), 1) + ' %';
  const table = function (tete, lignes) {
    const t = h('table'); t.append(h('thead', null, h('tr', null, tete.map((c, i) => h('th', { class: i ? 'd' : '', html: A.inline(c) })))));
    const b = h('tbody'); lignes.forEach((l) => b.append(h('tr', null, l.map((c, i) => h('td', { class: i ? 'd' : '', html: A.inline(String(c)) }))))); t.append(b);
    return h('div', { class: 'table-boite' }, t);
  };
  // Modèles de référence (calculés une fois sur les 551 communes).
  const MOD = (function () {
    if (!C.length) return {};
    const y = C.map((c) => c.lprix), yk = C.map((c) => K(c.prix));
    return {
      nn: S.mco(lig(C, (c) => [1, K(c.rev)]), yk), ll: S.mco(lig(C, (c) => [1, c.lrev]), y),
      ln: S.mco(lig(C, (c) => [1, K(c.rev)]), y), nl: S.mco(lig(C, (c) => [1, c.lrev]), yk),
      m9: S.mco(lig(C, (c) => [1, c.lrev, c.W, c.B]), y),
      m13: S.mco(lig(C, (c) => [1, c.lrev, c.W, c.B, c.lrev * c.W, c.lrev * c.B]), y),
      m15: S.mco(lig(C, (c) => { const a = c.napp || 0; return [1, c.lrev, c.W, c.B, Math.log(c.pop), a / (a + c.ventes)]; }), y)
    };
  })();
  A.MOD1 = MOD;

  // ------------------------------------------------------------ 1.1 fusions
  A.widgets.fusion = function (el) {
    const D = A.D.communes, g = A.gabarit(el, 'Les 14 fusions : retrouver les mêmes territoires dans les deux fichiers', 'Choisis une commune fusionnée. À gauche, les codes qui n’existent **que dans le fichier des ventes** (nouvelles communes) ; à droite, ceux qui n’existent **que dans le fichier fiscal** (anciennes communes). C’est exactement ce que renvoient les deux `anti_join()`.');
    let actif = 0;
    const select = h('select', { id: A.uid('sel'), 'aria-label': 'Commune fusionnée' });
    D.fusions.forEach((f, i) => select.append(h('option', { value: i, text: f.nom + ' (' + f.code + ')' })));
    select.addEventListener('change', () => { actif = +select.value; dessiner(); });
    g.commandes.append(h('label', { class: 'commande' }, h('span', { text: 'Nouvelle commune (découpage 2025)' }), select));
    function dessiner() {
      const f = D.fusions[actif], anciens = f.anciennes.map((a) => a.code);
      g.zone.textContent = '';
      const liste = (titre, items, estVif) => h('div', null, h('div', { class: 'rubrique', text: titre }), h('div', { class: 'puces' }, items.map((it) => h('span', { class: 'puce' + (estVif(it) ? ' vif' : ''), text: it.nom + ' ' + it.code }))));
      g.zone.append(h('div', { class: 'deux-col' }, liste('Seulement dans les ventes (' + D.seul_ventes.length + ')', D.seul_ventes, (it) => it.code === f.code), liste('Seulement dans le fiscal (' + D.seul_fisc.length + ')', D.seul_fisc, (it) => anciens.includes(it.code))));
      const pop = S.somme(f.anciennes.map((a) => a.pop)), rev = S.somme(f.anciennes.map((a) => a.rev));
      const lignes = f.anciennes.map((a) => [a.nom, a.code, fmt(a.pop), fmt(a.rev / 1e6, 1), A.eur(a.rev / a.pop)]);
      lignes.push(['**' + f.nom + ' (somme)**', '**' + f.code + '**', '**' + fmt(pop) + '**', '**' + fmt(rev / 1e6, 1) + '**', '**' + A.eur(rev / pop) + '**']);
      g.zone.append(table(['Commune', 'Code INS', 'Habitants', 'Revenu total (millions €)', 'Revenu par habitant'], lignes));
      const simple = S.moyenne(f.anciennes.map((a) => a.rev / a.pop)), anvers = f.code === '11002';
      g.lecture.innerHTML = '<p><b>Le bon calcul</b> : on additionne les revenus totaux et les habitants des anciennes communes, puis on divise : ' + fmt(rev / 1e6, 1) + ' millions € / ' + fmt(pop) + ' habitants = <b>' + A.eur(rev / pop) + '</b> par habitant.</p>' +
        '<p><b>L’erreur à éviter</b> : faire la moyenne simple des revenus par habitant donnerait ' + A.eur(simple) + ' (écart de ' + A.signe(simple - rev / pop, 0) + ' €), car chaque ancienne commune pèserait autant, quelle que soit sa taille.</p>' +
        (anvers ? '<p><b>Le piège d’Anvers</b> : son code 11002 existe dans les <em>deux</em> fichiers, donc aucun anti_join ne le signale. Une fusion directe associerait pourtant les ventes d’Anvers + Borsbeek au revenu de la seule ancienne Anvers (' + A.eur(f.anciennes[0].rev / f.anciennes[0].pop) + ' au lieu de ' + A.eur(rev / pop) + ') et à ' + fmt(f.anciennes[0].pop) + ' habitants au lieu de ' + fmt(pop) + '.</p>' :
          '<p>Sans reconstitution, le code ' + f.code + ' ne trouve aucun correspondant dans le fichier fiscal : la commune (' + fmt(f.n_ventes) + ' ventes, prix médian ' + A.eur(f.prix) + ') disparaîtrait de la base ou garderait un revenu manquant.</p>');
    }
    dessiner();
  };

  // ---------------------------------------------- 1.3 précision d'une médiane
  A.widgets.mediane = function (el) {
    const g = A.gabarit(el, 'Une médiane sur 17 ventes, une médiane sur 1 854 ventes', 'Chaque point est le prix médian qu’on aurait observé une « autre année », si les ventes étaient tirées au hasard dans la même distribution de prix (supposée normale, comme dans l’énoncé). Plus les points s’étalent, moins la médiane publiée est fiable.');
    const COM = [{ nom: 'Rouvroy', n: 17, med: 158.5, eiq: 172, cls: 'c2' }, { nom: 'Charleroi', n: 1854, med: 137.75, eiq: 90, cls: 'c1' }];
    const u = A.alea(17);
    COM.forEach((c) => { c.tirages = []; c.formule = 0.93 * c.eiq / Math.sqrt(c.n); });
    const tirer = (k) => { COM.forEach((c) => { const sd = c.eiq / 1.349; for (let r = 0; r < k; r++) { const x = new Float64Array(c.n); for (let i = 0; i < c.n; i++) x[i] = c.med + sd * u.normale(); x.sort(); c.tirages.push(c.n % 2 ? x[(c.n - 1) / 2] : (x[c.n / 2 - 1] + x[c.n / 2]) / 2); } if (c.tirages.length > 600) c.tirages = c.tirages.slice(-600); }); dessiner(); };
    g.commandes.append(h('button', { class: 'btn', type: 'button', onclick: () => tirer(1) }, 'Simuler 1 année'), h('button', { class: 'btn plein', type: 'button', onclick: () => tirer(200) }, 'Simuler 200 années'), h('button', { class: 'btn', type: 'button', onclick: () => { COM.forEach((c) => { c.tirages = []; }); dessiner(); } }, 'Effacer'));
    g.legende.append(A.legende(COM.map((c) => ({ c: c.cls === 'c1' ? 's1' : 's2', nom: c.nom + ' (' + fmt(c.n) + ' ventes)' }))));
    function dessiner() {
      const G = A.graphe(g.zone, { nom: 'Médianes simulées pour Rouvroy et Charleroi', ratio: 0.36, hmin: 200, hmax: 300, x: { dom: [20, 300], titre: 'Prix médian de l’échantillon (milliers d’euros)', grille: true }, y: { dom: [-0.6, 1.6], masque: true, sansGrille: true } }).axes();
      const j = A.alea(5);
      COM.forEach((c, r) => {
        const y0 = 1 - r;
        c.tirages.forEach((t) => { const p = G.point(A.clamp(t, 20, 300), y0 + (j() - 0.5) * 0.62, c.cls, 2.6); p.setAttribute('opacity', 0.55); p.setAttribute('class', c.cls); });
        G.segment(c.med, y0 - 0.42, c.med, y0 + 0.42, 'tink');
        G.texte(c.med, y0 + 0.42, c.nom + ' : médiane publiée ' + fmt(c.med * 1000, 0) + ' €', { dy: -5, dx: 5 });
      });
      const n = COM[0].tirages.length;
      g.lecture.innerHTML = '<p>Formule de l’énoncé, erreur-type ≈ 0,93 × (p75 − p25) / √n : <b>Rouvroy ' + fmt(COM[0].formule * 1000, 0) + ' €</b> (0,93 × 172 000 / √17), <b>Charleroi ' + fmt(COM[1].formule * 1000, 0) + ' €</b> (0,93 × 90 000 / √1 854), soit un rapport de ' + fmt(COM[0].formule / COM[1].formule, 0) + '.</p>' +
        (n > 20 ? '<p>Dans la simulation (' + n + ' années) : l’écart-type des médianes vaut ' + fmt(S.ecartType(COM[0].tirages) * 1000, 0) + ' € à Rouvroy et ' + fmt(S.ecartType(COM[1].tirages) * 1000, 0) + ' € à Charleroi. La formule donne bien l’ordre de grandeur de cette dispersion.</p>' : '<p>Lance la simulation pour comparer la dispersion réelle des médianes à la formule.</p>');
    }
    COM.forEach((c) => { const sd = c.eiq / 1.349; for (let r = 0; r < 150; r++) { const x = new Float64Array(c.n); for (let i = 0; i < c.n; i++) x[i] = c.med + sd * u.normale(); x.sort(); c.tirages.push(c.n % 2 ? x[(c.n - 1) / 2] : (x[c.n / 2 - 1] + x[c.n / 2]) / 2); } });
    A.adapter(g.zone, dessiner);
  };

  // ----------------------------------------------------- 1.4 histogrammes
  A.widgets.histos = function (el) {
    const g = A.gabarit(el, 'Distribution du prix et du revenu, en niveau et en logarithme', 'Compare la forme des quatre distributions. Le trait plein est la moyenne, le trait en tirets la médiane : quand ils se séparent, la distribution est asymétrique.');
    const etat = { v: 'prix', log: false };
    const NOM = { prix: 'Prix médian', rev: 'Revenu par habitant' };
    g.commandes.append(A.choix('Variable', [['prix', 'Prix médian'], ['rev', 'Revenu par habitant']], etat.v, (v) => { etat.v = v; dessiner(); }), A.choix('Échelle', [['niv', 'Niveau (€)'], ['log', 'Logarithme']], 'niv', (v) => { etat.log = v === 'log'; dessiner(); }));
    const asym = { prix: S.asymetrie(C.map((c) => c.prix)), lprix: S.asymetrie(C.map((c) => c.lprix)), rev: S.asymetrie(C.map((c) => c.rev)), lrev: S.asymetrie(C.map((c) => c.lrev)) };
    function dessiner() {
      const x = C.map((c) => etat.log ? Math.log(c[etat.v]) : K(c[etat.v])), min = Math.min.apply(null, x), max = Math.max.apply(null, x);
      const nb = 30, pas = (max - min) / nb, cases = new Array(nb).fill(0);
      x.forEach((v) => { cases[Math.min(nb - 1, Math.floor((v - min) / pas))]++; });
      const G = A.graphe(g.zone, { nom: 'Histogramme de ' + NOM[etat.v], ratio: 0.46, x: { dom: [min - pas / 2, max + pas / 2], titre: etat.log ? 'ln(' + (etat.v === 'prix' ? 'prix' : 'rev_hab') + '), montants en euros' : NOM[etat.v] + ' (milliers d’euros)' }, y: { dom: [0, Math.max.apply(null, cases) * 1.12], titre: 'Nombre de communes' } }).axes();
      const l = G.px(min + pas) - G.px(min) - 2, P = [];
      cases.forEach((c, i) => { const xc = min + (i + 0.5) * pas; if (c) G.barre(xc, c, l, etat.v === 'prix' ? 'c1' : 'c2'); P.push({ x: xc, y: c, i }); });
      const moy = S.moyenne(x), med = S.mediane(x);
      G.verticale(moy, 'tink'); G.verticale(med, 'tink tirets');
      G.survolProche(P, (p) => { const a = min + p.i * pas, b = a + pas, f = (v) => etat.log ? fmt(v, 2) + ' (soit ' + A.eur(Math.exp(v)) + ')' : A.eur(v * 1000); return [fmt(p.y) + ' commune' + (p.y > 1 ? 's' : ''), [['de', f(a)], ['à', f(b)]]]; });
      const cle = (etat.log ? 'l' : '') + etat.v, f = (v) => etat.log ? fmt(v, 3) : A.eur(v * 1000);
      g.lecture.innerHTML = '<p>Moyenne ' + f(moy) + ' (trait plein), médiane ' + f(med) + ' (tirets). Coefficient d’asymétrie : <b>' + fmt(asym[cle], 2) + '</b> — ' + (Math.abs(asym[cle]) < 0.1 ? 'distribution quasi symétrique.' : asym[cle] > 0 ? 'queue plus longue à droite (quelques communes très chères tirent la moyenne vers le haut).' : 'queue plus longue à gauche (quelques communes très pauvres s’écartent vers le bas).') + '</p>';
      g.apres.textContent = '';
      g.apres.append(h('div', { class: 'chiffres' }, A.chiffre('Asymétrie de prix', fmt(asym.prix, 2)), A.chiffre('Asymétrie de ln(prix)', fmt(asym.lprix, 2)), A.chiffre('Asymétrie de rev_hab', fmt(asym.rev, 2)), A.chiffre('Asymétrie de ln(rev_hab)', fmt(asym.lrev, 2))));
    }
    A.adapter(g.zone, dessiner);
  };

  // ------------------------------------------------ 1.5 à 1.13 explorateur
  A.widgets.nuage = function (el, p) {
    const g = A.gabarit(el, p.titre || 'Explorateur : 551 communes, prix médian et revenu par habitant', 'Chaque point est une commune (survole-la pour lire son nom). Change l’échelle et le modèle : la droite, son équation et son R² sont **recalculés en direct** sur les vraies données.');
    const etat = { ech: p.echelle === 'niveaux' ? 'niv' : 'log', mod: p.modele || 'unique', taille: p.taille === 'ventes', nom: p.commune || '' };
    const MODS = [['aucun', 'Aucune droite'], ['unique', 'Une seule droite'], ['paralleles', 'Droites parallèles (indicatrices)'], ['pentes', 'Une pente par région (interaction)']];
    g.commandes.append(A.choix('Échelles', [['niv', 'Niveaux'], ['log', 'Logarithmiques']], etat.ech, (v) => { etat.ech = v; dessiner(); }), A.choix('Modèle', MODS, etat.mod, (v) => { etat.mod = v; dessiner(); }));
    const idListe = A.uid('liste'), champ = h('input', { type: 'text', id: A.uid('com'), list: idListe, placeholder: 'ex. Rouvroy', value: etat.nom });
    champ.addEventListener('change', () => { etat.nom = champ.value; dessiner(); });
    g.commandes.append(h('label', { class: 'commande' }, h('span', { text: 'Repérer une commune' }), champ, h('datalist', { id: idListe }, C.map((c) => h('option', { value: c.nom })))), A.case('Taille des points = nombre de ventes', etat.taille, (v) => { etat.taille = v; dessiner(); }));
    g.legende.append(A.legende(['F', 'W', 'B'].map((r) => ({ c: REG[r].c, nom: REG[r].nom + ' (' + C.filter((c) => c.region === r).length + ')' }))));
    g.apres.append(A.vueTable('Voir les 551 communes en tableau', ['Commune', 'Région', 'Revenu par habitant (€)', 'Prix médian (€)', 'Ventes de maisons'], C.slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map((c) => [c.nom, REG[c.region].nom, fmt(c.rev), fmt(c.prix), fmt(c.ventes)])));
    function dessiner() {
      const log = etat.ech === 'log';
      const G = A.graphe(g.zone, { nom: 'Nuage de points du prix médian selon le revenu par habitant, 551 communes', ratio: 0.62, hmin: 300, hmax: 500, x: { dom: [12, 38], log, titre: 'Revenu net imposable par habitant (milliers d’euros' + (log ? ', échelle log)' : ')'), grad: log ? [13, 15, 20, 25, 30, 35] : null }, y: { dom: log ? [85, 900] : [0, 900], log, titre: 'Prix médian (milliers d’euros' + (log ? ', échelle log)' : ')'), grad: log ? [100, 150, 200, 300, 500, 800] : null } }).axes();
      const P = C.map((c) => ({ x: K(c.rev), y: K(c.prix), c }));
      P.forEach((q) => { const pt = G.point(q.x, q.y, REG[q.c.region].p, etat.taille ? A.clamp(1.2 + Math.sqrt(q.c.ventes) / 3.4, 2, 16) : 3.3); pt.setAttribute('opacity', etat.taille ? 0.5 : 0.72); if (etat.taille) pt.setAttribute('class', REG[q.c.region].p); });
      // Modèle : dans l'échelle choisie.
      const xv = (c) => log ? c.lrev : K(c.rev), y = C.map((c) => log ? c.lprix : K(c.prix));
      const inv = (v) => log ? Math.exp(v) / 1000 : v, tx = (r) => log ? Math.log(1000 * r) : r;
      let txt = '';
      const sg = (v, d) => (v < 0 ? ' − ' : ' + ') + fmt(Math.abs(v), d), Y = log ? 'ln(prix)' : 'prix', Xn = log ? 'ln(revenu)' : 'revenu';
      if (etat.mod === 'unique') {
        const m = S.mco(lig(C, (c) => [1, xv(c)]), y);
        G.fonction((r) => inv(m.b[0] + m.b[1] * tx(r)), 'tink');
        txt = '<p><b>' + Y + ' = ' + fmt(m.b[0], log ? 3 : 1) + sg(m.b[1], log ? 3 : 2) + ' × ' + Xn + '</b> &nbsp; (R² = ' + fmt(m.r2, 3) + ', erreur-type HC1 de la pente : ' + fmt(m.seHC1[1], log ? 3 : 2) + ')</p><p>' + (log ? 'En logarithmes, la pente est une <b>élasticité</b> : un revenu plus élevé de 1 % va de pair avec un prix plus élevé de ' + fmt(m.b[1], 2) + ' %.' : 'En niveaux : 1 000 € de revenu par habitant en plus vont de pair avec ' + fmt(m.b[1] * 1000, 0) + ' € de prix médian en plus.') + ' Regarde les couleurs : presque toute la Wallonie est sous la droite, tout Bruxelles au-dessus.</p>';
      } else if (etat.mod === 'paralleles') {
        const m = S.mco(lig(C, (c) => [1, xv(c), c.W, c.B]), y), d = { F: 0, W: m.b[2], B: m.b[3] };
        ['F', 'W', 'B'].forEach((r) => { const xs = C.filter((c) => c.region === r).map((c) => K(c.rev)); G.fonction((v) => inv(m.b[0] + d[r] + m.b[1] * tx(v)), REG[r].t, Math.min.apply(null, xs), Math.max.apply(null, xs)); });
        txt = '<p><b>' + Y + ' = ' + fmt(m.b[0], log ? 3 : 1) + sg(m.b[1], log ? 3 : 2) + ' × ' + Xn + sg(m.b[2], log ? 3 : 1) + ' × Wallonie' + sg(m.b[3], log ? 3 : 1) + ' × Bruxelles</b> &nbsp; (R² = ' + fmt(m.r2, 3) + ')</p><p>Même pente pour tous, mais une hauteur propre à chaque région (la Flandre sert de référence). ' + (log ? 'À revenu égal, le prix est ' + pctExp(m.b[2]) + ' en Wallonie et ' + pctExp(m.b[3]) + ' à Bruxelles par rapport à la Flandre.' : 'À revenu égal, le prix médian est ' + A.signe(m.b[2] * 1000, 0) + ' € en Wallonie et ' + A.signe(m.b[3] * 1000, 0) + ' € à Bruxelles par rapport à la Flandre.') + '</p>';
      } else if (etat.mod === 'pentes') {
        const m = S.mco(lig(C, (c) => [1, xv(c), c.W, c.B, xv(c) * c.W, xv(c) * c.B]), y);
        const co = { F: [m.b[0], m.b[1]], W: [m.b[0] + m.b[2], m.b[1] + m.b[4]], B: [m.b[0] + m.b[3], m.b[1] + m.b[5]] };
        ['F', 'W', 'B'].forEach((r) => { const xs = C.filter((c) => c.region === r).map((c) => K(c.rev)); G.fonction((v) => inv(co[r][0] + co[r][1] * tx(v)), REG[r].t, Math.min.apply(null, xs), Math.max.apply(null, xs)); });
        txt = '<p>Une droite par région (R² = ' + fmt(m.r2, 3) + '). ' + (log ? 'Élasticités' : 'Pentes (k€ de prix par k€ de revenu)') + ' : <b>Flandre ' + fmt(co.F[1], log ? 3 : 2) + '</b>, <b>Wallonie ' + fmt(co.W[1], log ? 3 : 2) + '</b>, <b>Bruxelles ' + fmt(co.B[1], log ? 3 : 2) + '</b>.</p><p>La pente wallonne est la plus forte ; celle de Bruxelles ne repose que sur 19 communes.</p>';
      } else txt = '<p>Regarde le nuage sans aucune droite : où se trouvent les communes bruxelloises ? et les wallonnes ? ' + (log ? 'En échelles logarithmiques, un même écart à l’écran représente un même <em>pourcentage</em>.' : 'En niveaux, le nuage s’élargit vers la droite : la dispersion des prix augmente avec le revenu.') + '</p>';
      g.lecture.innerHTML = txt;
      G.survolProche(P, (q) => [q.c.nom, [['Région', REG[q.c.region].nom], ['Revenu par habitant', A.eur(q.c.rev)], ['Prix médian', A.eur(q.c.prix)], ['Ventes de maisons', fmt(q.c.ventes)]]]);
      etat.nom.split(',').map((n) => A.norm(n)).filter(Boolean).forEach((n) => { const q = P.find((z) => A.norm(z.c.nom) === n); if (!q) return; const r = A.s('circle', { cx: G.px(q.x), cy: G.py(q.y), r: 8, fill: 'none', class: 'tink', 'stroke-width': 2.2 }); G.dessus.append(r); G.texte(q.x, q.y, q.c.nom, { dx: 11, dy: 4 }); });
    }
    A.adapter(g.zone, dessiner);
  };

  // ------------------------------------- 1.6 et 1.7 formes fonctionnelles
  A.widgets.formes = function (el) {
    const g = A.gabarit(el, 'Quatre formes fonctionnelles, quatre prédictions', 'Les quatre modèles de la question 1.6, estimés sur les mêmes 551 communes. Déplace le revenu de départ et d’arrivée : le tableau refait les calculs de la question 1.7.');
    const etat = { r0: 24, r1: 25, vif: 'll' };
    const F = { nn: { nom: 'Niveau-niveau', f: (r) => MOD.nn.b[0] + MOD.nn.b[1] * r }, ll: { nom: 'Log-log', f: (r) => Math.exp(MOD.ll.b[0] + MOD.ll.b[1] * Math.log(1000 * r)) / 1000 }, ln: { nom: 'Log-niveau', f: (r) => Math.exp(MOD.ln.b[0] + MOD.ln.b[1] * r) / 1000 }, nl: { nom: 'Niveau-log', f: (r) => MOD.nl.b[0] + MOD.nl.b[1] * Math.log(1000 * r) } };
    const c0 = A.curseur('Revenu de départ', 14, 34, 0.5, etat.r0, (v) => A.eur(v * 1000), (v) => { etat.r0 = v; dessiner(); });
    const c1 = A.curseur('Revenu d’arrivée', 15, 36, 0.5, etat.r1, (v) => A.eur(v * 1000), (v) => { etat.r1 = v; dessiner(); });
    const preset = (a, b, t) => h('button', { class: 'btn petit', type: 'button', onclick: () => { etat.r0 = a; etat.r1 = b; c0.regler(a); c1.regler(b); dessiner(); } }, t);
    g.commandes.append(c0, c1, h('div', { class: 'commande' }, h('span', { text: 'Cas de l’énoncé' }), h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, preset(24, 25, '(a) 24 000 → 25 000 €'), preset(20, 30, '(b) 20 000 → 30 000 €'))),
      A.choix('Courbe mise en avant', Object.keys(F).map((k) => [k, F[k].nom]), etat.vif, (v) => { etat.vif = v; dessiner(); }));
    function dessiner() {
      const G = A.graphe(g.zone, { nom: 'Prix prédit selon le revenu par les quatre modèles', ratio: 0.56, x: { dom: [12, 37], titre: 'Revenu par habitant (milliers d’euros)' }, y: { dom: [0, 700], titre: 'Prix médian prédit (milliers d’euros)' } }).axes();
      C.forEach((c) => { if (c.prix < 700000) { const pt = G.point(K(c.rev), K(c.prix), 'c0', 1.8); pt.setAttribute('class', 'c0'); pt.setAttribute('opacity', 0.45); } });
      G.verticale(etat.r0, 't0'); G.verticale(etat.r1, 't0');
      Object.keys(F).forEach((k) => { if (k !== etat.vif) G.fonction(F[k].f, 't0'); });
      const v = F[etat.vif]; G.fonction(v.f, 't1').setAttribute('stroke-width', 3);
      // Étiquettes au bout des courbes, écartées d'au moins 15 px pour ne pas se chevaucher.
      const etqs = Object.keys(F).map((k) => ({ k, y: G.py(F[k].f(37)) })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < etqs.length; i++) if (etqs[i].y - etqs[i - 1].y < 15) etqs[i].y = etqs[i - 1].y + 15;
      etqs.forEach((e) => G.dessus.append(A.s('text', { x: G.x1 - 4, y: e.y - 5, 'text-anchor': 'end', class: e.k === etat.vif ? 'etq' : 'etq2', text: F[e.k].nom })));
      G.point(etat.r0, v.f(etat.r0), 'c1', 5); G.point(etat.r1, v.f(etat.r1), 'c1', 5);
      const r0 = etat.r0, r1 = etat.r1, d = r1 - r0, pc = 100 * d / r0;
      const approx = { nn: null, ll: MOD.ll.b[1] * pc, ln: 100 * MOD.ln.b[1] * d, nl: null };
      g.apres.textContent = '';
      g.apres.append(table(['Modèle', 'Prix prédit au départ', 'Variation en €', 'Approximation usuelle', 'Variation exacte'], Object.keys(F).map((k) => { const p0 = F[k].f(r0), p1 = F[k].f(r1); return [(k === etat.vif ? '**' + F[k].nom + '**' : F[k].nom), A.eur(p0 * 1000), A.signe((p1 - p0) * 1000, 0) + ' €', approx[k] == null ? '—' : A.signe(approx[k], 2) + ' %', A.signe(100 * (p1 / p0 - 1), 2) + ' %']; })));
      const ecartLL = Math.abs(approx.ll - 100 * (F.ll.f(r1) / F.ll.f(r0) - 1)), ecartLN = Math.abs(approx.ln - 100 * (F.ln.f(r1) / F.ln.f(r0) - 1));
      g.lecture.innerHTML = '<p>Le revenu passe de ' + A.eur(r0 * 1000) + ' à ' + A.eur(r1 * 1000) + ' : ' + A.signe(d * 1000, 0) + ' €, soit ' + A.signe(pc, 2) + ' %.</p><p>Écart entre approximation et valeur exacte : <b>' + fmt(ecartLL, 2) + ' point' + (ecartLL >= 2 ? 's' : '') + '</b> pour le log-log, <b>' + fmt(ecartLN, 2) + ' point' + (ecartLN >= 2 ? 's' : '') + '</b> pour le log-niveau. ' + (Math.abs(pc) > 20 ? 'La variation est grande : l’approximation n’est plus fiable, il faut la formule exacte.' : 'La variation est petite : l’approximation suffit.') + '</p>';
    }
    A.adapter(g.zone, dessiner);
  };

  // --------------------------------------- 1.9 à 1.11 catégorie de référence
  A.widgets.reference = function (el) {
    const g = A.gabarit(el, 'Changer de région de référence sans réestimer', 'Le modèle 1.9 trace trois droites parallèles. Choisis la région de référence : les droites ne bougent pas, seuls changent la constante et le sens des indicatrices.');
    let ref = 'F';
    g.commandes.append(A.choix('Région de référence', [['F', 'Flandre'], ['W', 'Wallonie'], ['B', 'Bruxelles']], ref, (v) => { ref = v; dessiner(); }));
    g.legende.append(A.legende(['F', 'W', 'B'].map((r) => ({ c: REG[r].c, nom: REG[r].nom, type: 'ligne' }))));
    const m = MOD.m9, b = m.b, cst = { F: b[0], W: b[0] + b[2], B: b[0] + b[3] }, vec = { F: [1, 0, 0, 0], W: [1, 0, 1, 0], B: [1, 0, 0, 1] };
    const nomCoef = { F: '$β₀$', W: '$β₀ + δ_{W}$', B: '$β₀ + δ_{B}$' };
    function dessiner() {
      const G = A.graphe(g.zone, { nom: 'Trois droites parallèles du modèle avec indicatrices de région', ratio: 0.5, x: { dom: [12, 38], log: true, titre: 'Revenu par habitant (milliers d’euros, échelle log)', grad: [13, 15, 20, 25, 30, 35] }, y: { dom: [85, 900], log: true, titre: 'Prix médian (milliers d’euros, échelle log)', grad: [100, 150, 200, 300, 500, 800] } }).axes();
      C.forEach((c) => { const pt = G.point(K(c.rev), K(c.prix), REG[c.region].p, 2); pt.setAttribute('class', REG[c.region].p); pt.setAttribute('opacity', 0.3); });
      ['F', 'W', 'B'].forEach((r) => { const e = G.fonction((v) => Math.exp(cst[r] + b[1] * Math.log(1000 * v)) / 1000, REG[r].t); if (r === ref) e.setAttribute('stroke-width', 4); });
      const autres = ['F', 'W', 'B'].filter((r) => r !== ref);
      const lignes = [['Constante', nomCoef[ref] + ' = ' + fmt(cst[ref], 3), fmt(cst[ref], 3), fmt(S.seCombinaison(m.V, vec[ref]), 3), '—'], ['ln(rev_hab)', '$β₁$ (pente commune, inchangée)', fmt(b[1], 3), fmt(m.seHC1[1], 3), '—']];
      autres.forEach((r) => { const d = cst[r] - cst[ref], c = vec[r].map((v, i) => v - vec[ref][i]); lignes.push(['Indicatrice ' + REG[r].nom, '(' + nomCoef[r] + ') − (' + nomCoef[ref] + ') = ' + fmt(cst[r], 3) + ' − (' + fmt(cst[ref], 3) + ')', A.signe(d, 3), fmt(S.seCombinaison(m.V, c), 3), pctExp(d)]); });
      g.apres.textContent = '';
      g.apres.append(table(['Coefficient', 'Calcul à partir du modèle 1.9', 'Valeur', 'Erreur-type HC1', 'Écart exact en %'], lignes));
      g.lecture.innerHTML = '<p>Référence : <b>' + REG[ref].nom + '</b> (trait épais). La constante est la hauteur de <em>sa</em> droite ; chaque indicatrice mesure l’écart vertical entre la droite d’une autre région et celle-ci. Les valeurs ajustées, les résidus, le R² (' + fmt(m.r2, 3) + ') et l’élasticité (' + fmt(b[1], 3) + ') sont identiques dans les trois écritures.</p>';
    }
    A.adapter(g.zone, dessiner);
  };

  // ---------------------------------------- 1.12 biais de variable omise
  A.widgets.bvo = function (el) {
    const g = A.gabarit(el, 'De 1,608 à 1,444 : la formule du biais de variable omise', 'Le modèle « court » (sans régions) a une élasticité différente du modèle « long » (avec régions). La différence se décompose exactement : pour chaque région omise, **son effet sur le prix × son lien avec le revenu**.');
    let ech = 'tout';
    g.commandes.append(A.choix('Communes utilisées', [['tout', 'Les 551 communes'], ['sansB', 'Sans Bruxelles'], ['sansW', 'Sans la Wallonie']], ech, (v) => { ech = v; dessiner(); }));
    function dessiner() {
      const pts = C.filter((c) => (ech === 'sansB' ? c.region !== 'B' : ech === 'sansW' ? c.region !== 'W' : true)), y = pts.map((c) => c.lprix);
      const regs = ['W', 'B'].filter((r) => pts.some((c) => c.region === r));
      const long = S.mco(lig(pts, (c) => [1, c.lrev].concat(regs.map((r) => c[r]))), y), court = S.mco(lig(pts, (c) => [1, c.lrev]), y);
      const termes = regs.map((r, i) => { const aux = S.mco(lig(pts, (c) => [1, c.lrev]), pts.map((c) => c[r])); return { r, delta: long.b[2 + i], pi: aux.b[1], contrib: long.b[2 + i] * aux.b[1] }; });
      const etapes = [long.b[1]]; termes.forEach((t) => etapes.push(etapes[etapes.length - 1] + t.contrib));
      const lo = Math.min.apply(null, etapes.concat([court.b[1]])) - 0.12, hi = Math.max.apply(null, etapes) + 0.12, nl = etapes.length;
      const G = A.graphe(g.zone, { nom: 'Décomposition de l’écart entre l’élasticité avec et sans régions', h: 70 + 54 * nl, x: { dom: [lo, hi], titre: 'Élasticité du prix au revenu', grille: true }, y: { dom: [0, nl], masque: true, sansGrille: true }, marges: { g: 14 } }).axes();
      const yy = (i) => nl - 0.5 - i;
      G.point(etapes[0], yy(0), 'cink', 5.5); G.texte(etapes[0], yy(0), 'Avec régions (1.9) : ' + fmt(etapes[0], 3), { dx: 10, dy: 4 });
      termes.forEach((t, i) => {
        const a = etapes[i], b2 = etapes[i + 1], cl = REG[t.r].t, yl = yy(i + 1);
        G.segment(a, yy(i) - 0.18, a, yl, 't0').setAttribute('stroke-width', 1);
        G.segment(a, yl, b2, yl, cl).setAttribute('stroke-width', 3);
        const xp = G.px(b2), yp = G.py(yl), s = b2 > a ? 1 : -1;
        G.marques.append(A.s('polygon', { points: [xp, yp, xp - s * 9, yp - 5.5, xp - s * 9, yp + 5.5].join(' '), class: REG[t.r].p }));
        G.texte(Math.max(a, b2), yl, REG[t.r].nom + ' : ' + A.signe(t.contrib, 3), { dx: 10, dy: 4 });
      });
      const fin = etapes[nl - 1];
      G.verticale(court.b[1], 'tink tirets'); G.texte(court.b[1], 0, 'Sans régions (1.6) : ' + fmt(court.b[1], 3), { dy: -6, dx: court.b[1] < (lo + hi) / 2 ? 6 : -6, ancre: court.b[1] < (lo + hi) / 2 ? 'start' : 'end' });
      g.apres.textContent = '';
      g.apres.append(table(['Région omise', 'Effet sur ln(prix) à revenu égal (δ)', 'Pente de l’indicatrice sur ln(rev_hab) (π)', 'Contribution δ × π'], termes.map((t) => [REG[t.r].nom, A.signe(t.delta, 4), A.signe(t.pi, 4), '**' + A.signe(t.contrib, 4) + '**'])));
      g.lecture.innerHTML = '<p><b>' + fmt(long.b[1], 4) + termes.map((t) => (t.contrib < 0 ? ' − ' : ' + ') + fmt(Math.abs(t.contrib), 4)).join('') + ' = ' + fmt(fin, 4) + '</b>, exactement l’élasticité du modèle sans régions (' + fmt(court.b[1], 4) + ') : ce n’est pas une approximation, c’est une identité des MCO (' + pts.length + ' communes).</p>' +
        (ech === 'tout' ? '<p>La Wallonie (plus pauvre <em>et</em> moins chère à revenu égal) gonfle la pente ; Bruxelles (plus pauvre <em>mais</em> beaucoup plus chère) l’écrase davantage. Essaie « Sans Bruxelles » : l’écart change de signe.</p>' : ech === 'sansB' ? '<p>Sans Bruxelles, il ne reste que l’effet wallon : omettre la région <em>surestime</em> alors l’élasticité.</p>' : '<p>Sans la Wallonie, il ne reste que l’effet bruxellois : omettre la région <em>sous-estime</em> fortement l’élasticité.</p>');
    }
    A.adapter(g.zone, dessiner);
  };

  // ------------------------------------------------- 1.13 (d)(e) centrage
  A.widgets.centrage = function (el) {
    const g = A.gabarit(el, 'Où mesure-t-on l’écart entre régions ? Le rôle du centrage', 'Avec des pentes différentes, l’écart entre deux régions dépend du revenu auquel on le mesure. Le coefficient de l’indicatrice donne cet écart là où le régresseur vaut **zéro**. Déplace ce point zéro.');
    const b = MOD.m13.b, etat = { u: 0, zoom: false };
    const cst = { F: [b[0], b[1]], W: [b[0] + b[2], b[1] + b[4]], B: [b[0] + b[3], b[1] + b[5]] };
    const cur = A.curseur('Revenu où le régresseur vaut zéro', 0, 10.6, 0.01, etat.u, (v) => A.eur(Math.exp(v)), (v) => { etat.u = v; dessiner(); });
    const aller = (c, t) => h('button', { class: 'btn petit', type: 'button', onclick: () => { etat.u = Math.log(c); cur.regler(etat.u); dessiner(); } }, t);
    g.commandes.append(cur, h('div', { class: 'commande' }, h('span', { text: 'Raccourcis' }), h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, aller(1, '1 € (aucun centrage)'), aller(25000, '25 000 € (question e)'))), A.choix('Vue', [['tout', 'Depuis 1 €'], ['zoom', 'Zoom sur les données']], 'tout', (v) => { etat.zoom = v === 'zoom'; dessiner(); }));
    g.legende.append(A.legende(['F', 'W', 'B'].map((r) => ({ c: REG[r].c, nom: REG[r].nom, type: 'ligne' }))));
    function dessiner() {
      const z = etat.zoom, G = A.graphe(g.zone, { nom: 'Droites régionales prolongées jusqu’à un revenu de un euro', ratio: 0.52, x: { dom: z ? [9.4, 10.6] : [0, 11], titre: 'ln(revenu par habitant)' }, y: { dom: z ? [11.3, 13.8] : [-7, 15], titre: 'ln(prix médian)' } }).axes();
      C.forEach((c) => { const pt = G.point(c.lrev, c.lprix, REG[c.region].p, z ? 2.4 : 1.3); pt.setAttribute('class', REG[c.region].p); pt.setAttribute('opacity', z ? 0.4 : 0.6); });
      ['F', 'W', 'B'].forEach((r) => G.fonction((x) => cst[r][0] + cst[r][1] * x, REG[r].t));
      const u = etat.u, val = (r) => cst[r][0] + cst[r][1] * u, dom = z ? [9.4, 10.6] : [0, 11];
      if (u >= dom[0] && u <= dom[1]) { G.verticale(u, 'tink'); ['W', 'B'].forEach((r) => { const s2 = G.segment(u, val('F'), u, val(r), REG[r].t); s2.setAttribute('stroke-width', 5); s2.setAttribute('opacity', 0.55); }); }
      if (!z) { G.texte(9.95, 14.6, 'les 551 communes sont ici', { ancre: 'end', dx: -22, dy: 4, cls: 'etq2' }); }
      const dW = b[2] + b[4] * u, dB = b[3] + b[5] * u, pres = u > 9.3;
      g.apres.textContent = '';
      g.apres.append(table(['Coefficient du modèle centré', 'Formule', 'Valeur', 'Lecture'], [
        ['Constante', '$β₀ + β₁ × ln(c)$', fmt(val('F'), 3), pres ? 'prix flamand prédit : ' + A.eur(Math.exp(val('F'))) : 'extrapolation'],
        ['lrev_c (élasticité flamande)', '$β₁$, inchangé', fmt(b[1], 3), '—'],
        ['Indicatrice Wallonie', '$δ_{W} + θ_{W} × ln(c)$', A.signe(dW, 3), pres ? 'Wallonie ' + pctExp(dW) + ' par rapport à la Flandre' : 'non interprétable'],
        ['Indicatrice Bruxelles', '$δ_{B} + θ_{B} × ln(c)$', A.signe(dB, 3), pres ? 'Bruxelles ' + pctExp(dB) + ' par rapport à la Flandre' : 'non interprétable'],
        ['Interactions', '$θ_{W}$ et $θ_{B}$, inchangées', A.signe(b[4], 3) + ' et ' + A.signe(b[5], 3), '—']]));
      g.lecture.innerHTML = '<p>Point zéro : un revenu de <b>' + A.eur(Math.exp(u)) + '</b> par habitant. ' + (pres ? 'On est dans la zone des données : l’écart Wallonie-Flandre de ' + A.signe(dW, 3) + ' se lit « ' + pctExp(dW) + ' », un nombre qui a un sens.' : 'On est très loin des données (le revenu le plus faible observé est de 12 987 €) : l’écart de ' + A.signe(dW, 2) + ' mesure la distance entre deux droites <em>prolongées</em> jusque-là. C’est un artefact d’extrapolation, pas un écart de prix réel.') + ' Les pentes, elles, ne changent jamais : déplacer l’origine d’un axe ne fait pas tourner une droite.</p>';
    }
    A.adapter(g.zone, dessiner);
  };

  // ------------------------------------------- 1.14 hétéroscédasticité
  A.widgets.hetero = function (el) {
    const g = A.gabarit(el, 'Les résidus des modèles 1.6 et 1.9', 'Un résidu = ln(prix) observé − ln(prix) prédit. Si la variance des erreurs était constante, le nuage formerait une bande horizontale d’épaisseur régulière, centrée sur zéro, quelle que soit la région.');
    const etat = { mod: 'll', axe: 'ajuste' };
    g.commandes.append(A.choix('Modèle', [['ll', '1.6 : log-log'], ['m9', '1.9 : + régions']], etat.mod, (v) => { etat.mod = v; dessiner(); }), A.choix('En abscisse', [['ajuste', 'Valeurs ajustées'], ['ventes', 'ln(nombre de ventes)']], etat.axe, (v) => { etat.axe = v; dessiner(); }));
    g.legende.append(A.legende(['F', 'W', 'B'].map((r) => ({ c: REG[r].c, nom: REG[r].nom }))));
    const lv = C.map((c) => Math.log(c.ventes));
    function dessiner() {
      const m = MOD[etat.mod], xs = etat.axe === 'ajuste' ? m.ajuste : lv, a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), marge = (b - a) * 0.04;
      const G = A.graphe(g.zone, { nom: 'Résidus du modèle selon ' + (etat.axe === 'ajuste' ? 'les valeurs ajustées' : 'le nombre de ventes'), ratio: 0.5, x: { dom: [a - marge, b + marge], titre: etat.axe === 'ajuste' ? 'Valeur ajustée de ln(prix)' : 'ln(nombre de ventes de maisons)' }, y: { dom: [-1, 1.4], titre: 'Résidu' } }).axes();
      G.horizontale(0, 'tink');
      const P = C.map((c, i) => ({ x: xs[i], y: m.resid[i], c }));
      P.forEach((q) => { const pt = G.point(q.x, q.y, REG[q.c.region].p, 3); pt.setAttribute('opacity', 0.7); });
      G.survolProche(P, (q) => [q.c.nom, [['Région', REG[q.c.region].nom], ['Résidu', A.signe(q.y, 3) + ' (prix ' + pctExp(q.y) + ' par rapport à la prédiction)'], ['Ventes de maisons', fmt(q.c.ventes)]]]);
      const Zreg = etat.mod === 'll' ? lig(C, (c) => [1, c.lrev]) : lig(C, (c) => [1, c.lrev, c.W, c.B]);
      const bp1 = S.breuschPagan(m.resid, Zreg), bp2 = S.breuschPagan(m.resid, lv.map((v) => [1, v]));
      const p1 = 1 - S.khi2CDF(bp1.stat, bp1.ddl), p2 = 1 - S.khi2CDF(bp2.stat, bp2.ddl), pf = (p) => p < 0.0001 ? '< 0,0001' : fmt(p, 3);
      g.apres.textContent = '';
      g.apres.append(h('div', { class: 'chiffres' }, A.chiffre('Élasticité', fmt(m.b[1], 3)), A.chiffre('Erreur-type classique', fmt(m.se[1], 3)), A.chiffre('Erreur-type robuste HC1', fmt(m.seHC1[1], 3), 'rapport ' + fmt(m.seHC1[1] / m.se[1], 2)),
        A.chiffre('Breusch-Pagan, régresseurs', fmt(bp1.stat, 2), 'khi²(' + bp1.ddl + '), p ' + pf(p1)), A.chiffre('Breusch-Pagan, ln(ventes)', fmt(bp2.stat, 2), 'khi²(1), p ' + pf(p2))));
      const moy = (r) => S.moyenne(C.map((c, i) => (c.region === r ? m.resid[i] : null)).filter((v) => v != null));
      g.lecture.innerHTML = etat.mod === 'll' ? '<p>Modèle 1.6 : les résidus ne sont pas centrés par région. Résidu moyen : Flandre ' + A.signe(moy('F'), 2) + ', Wallonie ' + A.signe(moy('W'), 2) + ', <b>Bruxelles ' + A.signe(moy('B'), 2) + '</b>. Ce modèle se trompe systématiquement selon la région : la « variance non constante » vient surtout de variables oubliées.</p>' : '<p>Modèle 1.9 : une fois les régions prises en compte, les résidus de chaque région sont centrés sur zéro et le nuage est bien plus régulier. Il reste un peu plus de dispersion parmi les communes qui comptent peu de ventes.</p>';
    }
    A.adapter(g.zone, dessiner);
  };

  // ------------------------------------------------ graphique « en forêt »
  A.widgets.foret = function (el, p) {
    const jeu = p.jeu || 'p1';
    let lignes, titre, aide, axe, repere, legende = null, dom;
    if (jeu === 'p1') {
      const e = (m, nom) => ({ nom, b: m.b[1], se: m.seHC1[1], cls: 1 });
      lignes = [e(MOD.ll, '1.6 : sans contrôle'), e(MOD.m9, '1.9 : + régions'), e(MOD.m13, '1.13 : interaction (Flandre)'), e(MOD.m15, '1.15 : + ln(pop) + part_app')];
      titre = 'L’élasticité dans les quatre spécifications'; aide = 'Chaque ligne : l’estimation (point) et son intervalle de confiance à 95 % (± 1,96 erreur-type HC1). Le trait vertical marque une élasticité de 1 (prix proportionnel au revenu).';
      axe = 'Élasticité du prix médian au revenu par habitant'; repere = 1; dom = [0.9, 1.9];
    } else {
      const E = A.D.fert.est, garde = jeu === 'p2instr' ? ['vi210b', 'vi210g', 'tsls28'] : E.map((x) => x.id);
      lignes = E.filter((x) => garde.includes(x.id)).map((x) => ({ nom: x.q + ' · ' + x.nom, b: x.b, se: x.se, cls: x.type === 'mco' ? 2 : 1 }));
      if (jeu === 'p2instr') lignes.sort((a, b) => a.b - b.b);
      titre = jeu === 'p2instr' ? 'Un instrument à la fois, puis les deux ensemble' : 'L’effet d’un troisième enfant selon la méthode'; aide = 'Effet estimé de `morekids` sur les semaines travaillées, avec intervalle de confiance à 95 %. Les MCO sont très précis (intervalle minuscule) ; les variables instrumentales le sont beaucoup moins.';
      axe = 'Effet sur les semaines travaillées en 1979'; repere = 0; dom = [-13.5, 2];
      legende = [{ c: 's2', nom: 'MCO' }, { c: 's1', nom: 'Variables instrumentales (VI / 2SLS)' }];
    }
    const g = A.gabarit(el, titre, aide);
    if (legende && jeu !== 'p2instr') g.legende.append(A.legende(legende));
    g.apres.append(A.vueTable('Voir les valeurs', ['Spécification', 'Estimation', 'Erreur-type', 'IC à 95 %'], lignes.map((l) => [l.nom, fmt(l.b, 3), fmt(l.se, 3), '[' + fmt(l.b - 1.96 * l.se, 2) + ' ; ' + fmt(l.b + 1.96 * l.se, 2) + ']'])));
    g.lecture.remove();
    function dessiner() {
      const n = lignes.length, G0 = Math.floor(g.zone.clientWidth || 680), etroit = G0 < 560;
      const G = A.graphe(g.zone, { nom: titre, h: 64 + n * (etroit ? 50 : 38), x: { dom, titre: axe, grille: true }, y: { dom: [0, n], masque: true, sansGrille: true }, marges: { g: etroit ? 12 : 250 } }).axes();
      G.verticale(repere, 'tink');
      const P = [];
      lignes.forEach((l, i) => {
        const y = n - 0.5 - i - (etroit ? 0.15 : 0), cls = l.cls === 1 ? 't1' : 't2';
        G.intervalle(Math.max(dom[0], l.b - 1.96 * l.se), Math.min(dom[1], l.b + 1.96 * l.se), y, cls); G.point(l.b, y, l.cls === 1 ? 'c1' : 'c2', 5);
        const t = A.s('text', { x: etroit ? G.x0 : 8, y: G.py(y) + (etroit ? -12 : 4), class: 'etq2', text: l.nom + (etroit ? ' : ' + fmt(l.b, 2) : '') }); G.dessus.append(t);
        if (!etroit) G.texte(Math.min(dom[1], l.b + 1.96 * l.se), y, fmt(l.b, 2), { dx: 8, dy: 4 });
        P.push({ x: l.b, y, l });
      });
      G.survolProche(P, (q) => [q.l.nom, [['Estimation', fmt(q.l.b, 3)], ['Erreur-type', fmt(q.l.se, 3)], ['IC à 95 %', '[' + fmt(q.l.b - 1.96 * q.l.se, 2) + ' ; ' + fmt(q.l.b + 1.96 * q.l.se, 2) + ']']]]);
    }
    A.adapter(g.zone, dessiner);
  };
})();
