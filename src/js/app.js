// Application : sommaire, navigation par ancre (#q-1-6…), pages, bloc « Ma version », quiz, oral, export.
(function () {
  'use strict';
  const A = window.A, h = A.h, M = A.modele, md = A.md;
  const $ = (id) => document.getElementById(id);
  const ORIGINES = { gpt: 'ChatGPT', claude: 'Claude', mix: 'Synthèse', perso: 'Variante' };
  const routeQ = (id) => '#q-' + id.replace('.', '-');
  const lettre = (s) => (s.id ? '(' + s.id + ')' : '');

  // ------------------------------------------------------------ montage des outils
  function monter(racine) {
    racine.querySelectorAll('.widget[data-w]').forEach((el) => {
      if (el.dataset.monte) return;
      el.dataset.monte = '1';
      const nom = el.dataset.w; let p = {};
      try { p = JSON.parse(el.dataset.p || '{}'); } catch (e) { p = {}; }
      const f = A.widgets[nom];
      if (!f) { el.append(h('p', { class: 'widget-aide', text: 'Outil « ' + nom + ' » indisponible.' })); return; }
      try { f(el, p); } catch (e) { el.textContent = ''; el.append(h('p', { class: 'widget-aide', text: 'Cet outil n’a pas pu démarrer (' + e.message + ').' })); if (window.console) console.error(e); }
    });
  }
  const bloc = (classe, etiquette, source) => source ? h('div', { class: classe }, etiquette ? h('div', { class: 'etiquette', text: etiquette }) : null, h('div', { html: md(source) })) : null;
  const rubrique = (t) => h('div', { class: 'rubrique', text: t });

  // ------------------------------------------------------------------- sommaire
  function dessinerNav() {
    const nav = $('nav-liste'); nav.textContent = '';
    const lien = (route, pico, texte) => h('a', { class: 'nav-lien', href: '#' + route, 'data-route': route }, h('span', { class: 'pico', text: pico }), texte);
    nav.append(lien('accueil', '⌂', 'Accueil'), lien('bases', 'α', 'Les bases, depuis zéro'));
    nav.append(h('div', { class: 'nav-titre', text: 'Le travail, question par question' }));
    M.parties.forEach((p) => {
      const b = A.store.bilanPartie(p.num);
      const d = h('details', { class: 'nav-partie', 'data-partie': p.id });
      d.append(h('summary', null, h('span', { class: 'chevron' }), h('span', { class: 'num', text: String(p.num) }), h('span', { text: p.titre.split(' : ')[0] }), h('span', { class: 'compte', text: b.fait + '/' + b.total })));
      const liste = h('div', { class: 'nav-questions' });
      liste.append(h('a', { class: 'nav-q', href: '#' + p.id, 'data-route': p.id }, h('span', { class: 'n', text: '·' }), 'Présentation de la partie'));
      p.sections.forEach((sec) => {
        liste.append(h('div', { class: 'nav-sec', text: sec.id + '. ' + sec.titre }));
        sec.questions.forEach((id) => { const q = M.questions[id], e = A.store.etat.q[id];
          liste.append(h('a', { class: 'nav-q' + (e && e.fait ? ' fait' : ''), href: routeQ(id), 'data-route': q.route }, h('span', { class: 'n', text: id }), q.titre)); });
      });
      if (!p.sections.length) p.questions.forEach((id) => { const q = M.questions[id], e = A.store.etat.q[id];
        liste.append(h('a', { class: 'nav-q' + (e && e.fait ? ' fait' : ''), href: routeQ(id), 'data-route': q.route }, h('span', { class: 'n', text: id }), q.titre)); });
      d.append(liste); nav.append(d);
    });
    nav.append(h('div', { class: 'nav-titre', text: 'Pour finir le travail' }));
    nav.append(lien('comparatif', '≠', 'ChatGPT vs Claude'), lien('choix', '✎', 'Mon rapport, mes choix'), lien('atelier', 'R', 'Atelier R'), lien('oral', '?', 'Préparer l’oral'), lien('glossaire', 'Aa', 'Glossaire'));
    marquerActif();
  }
  let routeActive = 'accueil';
  function marquerActif() {
    const base = routeActive.replace(/^(q-\d+-\d+).*$/, '$1');
    document.querySelectorAll('#nav-liste [data-route]').forEach((a) => a.classList.toggle('actif', a.dataset.route === base || (a.dataset.route === 'bases' && /^b-/.test(base))));
    const q = /^q-(\d+)-/.exec(base), partie = q ? 'p' + q[1] : /^p\d$/.test(base) ? base : null;
    document.querySelectorAll('.nav-partie').forEach((d) => { if (d.dataset.partie === partie) d.open = true; });
    const actif = document.querySelector('#nav-liste .actif');
    if (actif && actif.scrollIntoView && window.innerWidth > 960) actif.scrollIntoView({ block: 'nearest' });
  }
  function majProgression() {
    const b = A.store.bilan(), p = $('progression');
    p.textContent = '';
    p.append(h('span', { class: 'jauge' }, h('i', { style: 'width:' + (b.total ? 100 * b.fait / b.total : 0) + '%' })), h('span', { text: b.fait + ' / ' + b.total + ' maîtrisées' }));
    const sv = $('sauvegarde'), mode = A.store.mode();
    sv.innerHTML = mode === 'compte' ? 'Notes et choix <b>enregistrés dans ton compte Claude</b> (privés) et dans ce navigateur.' : mode === 'local' ? 'Notes et choix <b>enregistrés dans ce navigateur</b>. Exporte-les depuis « Mon rapport » pour les garder.' : 'Stockage indisponible ici : <b>exporte tes notes</b> avant de fermer la page.';
  }
  function fil(parts) {
    const f = $('fil'); f.textContent = '';
    parts.forEach((p, i) => { if (i) f.append(h('span', { class: 'sep', text: '›' })); f.append(p[1] ? h('a', { href: p[1], text: p[0] }) : h('span', { text: p[0] })); });
  }

  // -------------------------------------------------------------------- accueil
  A.widgets['cartes-parties'] = function (el) {
    el.className = 'grille'; el.removeAttribute('data-w');
    M.parties.forEach((p) => {
      const b = A.store.bilanPartie(p.num);
      el.append(h('a', { class: 'carte', href: '#' + p.id },
        h('span', { class: 'num', text: 'PARTIE ' + p.num + ' · ' + p.questions.length + ' QUESTIONS' }), h('h3', { text: p.titre }), h('p', { text: p.sousTitre }),
        p.resultat ? h('div', { class: 'resultat' }, h('b', { text: p.resultat.valeur }), h('span', { text: p.resultat.texte })) : null,
        h('div', { class: 'avance', title: b.fait + ' questions maîtrisées sur ' + b.total }, h('i', { style: 'width:' + 100 * b.fait / b.total + '%' }))));
    });
  };
  A.widgets.reprise = function (el) {
    el.className = ''; el.removeAttribute('data-w');
    const suivante = M.ordre.find((id) => !(A.store.etat.q[id] && A.store.etat.q[id].fait));
    const b = A.store.bilan();
    if (!suivante) { el.append(h('p', null, h('strong', { text: 'Toutes les questions sont marquées comme maîtrisées. ' }), h('a', { href: '#oral', text: 'Entraîne-toi pour l’oral' }), '.')); return; }
    const q = M.questions[suivante];
    el.append(h('p', null, h('a', { class: 'btn plein', href: routeQ(suivante) }, (b.fait ? 'Reprendre à la question ' : 'Commencer par la question ') + suivante + ' : ' + q.titre)));
  };
  function vueAccueil() {
    fil([['Accueil']]);
    return h('div', { html: md(A.C.accueil) });
  }

  // ---------------------------------------------------------------------- bases
  function vueBases() {
    fil([['Accueil', '#accueil'], ['Les bases']]);
    const v = h('div', null, h('div', { html: md(M.pages.basesIntro) }));
    const liste = h('div', { class: 'liste-q' });
    M.lecons.forEach((l) => liste.append(h('a', { href: '#' + l.route }, h('span', { class: 'n', text: String(l.n).padStart(2, '0') }), h('span', { text: l.titre }), h('span', { class: 'e', text: l.duree }))));
    v.append(liste);
    return v;
  }
  function vueLecon(route) {
    const i = M.lecons.findIndex((l) => l.route === route), l = M.lecons[i];
    if (!l) return vueIntrouvable();
    fil([['Accueil', '#accueil'], ['Les bases', '#bases'], [l.titre]]);
    const v = h('div', null, h('p', { class: 'surtitre', text: 'Les bases · leçon ' + l.n + ' sur ' + M.lecons.length + (l.duree ? ' · ' + l.duree : '') }), h('h1', { text: l.titre }), h('div', { html: md(l.texte) }));
    const avant = M.lecons[i - 1], apres = M.lecons[i + 1];
    v.append(h('div', { class: 'pied-q' }, h('div', { class: 'voisins' }, avant ? h('a', { class: 'btn', href: '#' + avant.route, text: '← ' + avant.titre }) : null, apres ? h('a', { class: 'btn plein', href: '#' + apres.route, text: apres.titre + ' →' }) : h('a', { class: 'btn plein', href: '#p1', text: 'Passer à la partie 1 →' }))));
    return v;
  }

  // --------------------------------------------------------------------- partie
  function vuePartie(id) {
    const p = M.parties.find((x) => x.id === id);
    if (!p) return vueIntrouvable();
    fil([['Accueil', '#accueil'], ['Partie ' + p.num]]);
    const v = h('div', null, h('p', { class: 'surtitre', text: 'Partie ' + p.num + ' · ' + p.sousTitre }), h('h1', { text: p.titre }), h('div', { html: md(p.intro) }));
    v.append(h('h2', { text: 'Les questions de la partie' }));
    const lignes = (ids) => { const l = h('div', { class: 'liste-q' }); ids.forEach((qid) => { const q = M.questions[qid], e = A.store.etat.q[qid], fait = e && e.fait;
      l.append(h('a', { href: routeQ(qid), class: fait ? 'fait' : '' }, h('span', { class: 'n', text: qid }), h('span', { text: q.titre }), h('span', { class: 'e', text: fait ? '✓ maîtrisée' : q.sous.length > 1 ? q.sous.length + ' sous-questions' : '' }))); }); return l; };
    if (p.sections.length) p.sections.forEach((sec) => { v.append(h('h3', { text: sec.id + '. ' + sec.titre }), lignes(sec.questions)); }); else v.append(lignes(p.questions));
    return v;
  }

  // ------------------------------------------------------------------- question
  function blocDuel(q, s) {
    if (s.accord && !s.gpt && !s.claude) return h('div', { class: 'accord' }, h('span', { html: A.ICONES.ok }), h('div', { html: md('**ChatGPT et Claude donnent la même réponse.** ' + s.accord) }));
    if (!s.gpt && !s.claude && !s.verdict) return null;
    const d = h('div', { class: 'duel' });
    const cols = h('div', { class: 'duel-cols' });
    if (s.gpt) cols.append(h('div', { class: 'duel-col' }, h('div', { class: 'source gpt' }, h('i'), 'Ce qu’a fait ChatGPT'), h('div', { html: md(s.gpt) })));
    if (s.claude) cols.append(h('div', { class: 'duel-col' }, h('div', { class: 'source claude' }, h('i'), 'Ce qu’a fait Claude'), h('div', { html: md(s.claude) })));
    d.append(cols);
    if (s.verdict) d.append(h('div', { class: 'duel-verdict' }, h('div', { class: 'etiquette', text: 'Comparaison et conseil' }), h('div', { html: md(s.verdict) })));
    return d;
  }
  function blocVersion(q, s) {
    const e = A.store.sous(q.id, s.id), cle = q.route + (s.id ? '-' + s.id : '');
    const b = h('div', { class: 'maversion' }, h('div', { class: 'etiquette', text: 'Ma version pour le rapport' }));
    const etat = h('span', { class: 'enregistre', text: e.txt || e.opt || e.ok ? 'Enregistré' : '' });
    const sauver = () => { A.store.toucher(q.id); etat.textContent = 'Enregistré'; };
    const zone = h('textarea', { id: 'txt-' + cle, placeholder: 'Ta formulation, avec tes mots : la réponse, le chiffre clé, puis le pourquoi en deux phrases.', 'aria-label': 'Ma formulation pour ' + q.id + ' ' + lettre(s) });
    zone.value = e.txt || '';
    zone.addEventListener('input', A.debounce(() => { e.txt = zone.value; sauver(); }, 500));
    if (s.opts && s.opts.length) {
      b.append(h('p', { class: 'aide', text: 'Plusieurs raisonnements se défendent ici. Coche celui qui te convainc le plus, puis réécris-le avec tes mots.' }));
      const opts = h('div', { class: 'options', role: 'radiogroup', 'aria-label': 'Raisonnement retenu' });
      s.opts.forEach((o, i) => {
        const input = h('input', { type: 'radio', name: 'opt-' + cle, value: 'o' + i, id: 'opt-' + cle + '-' + i });
        if (e.opt === 'o' + i) input.checked = true;
        input.addEventListener('change', () => { e.opt = 'o' + i; sauver(); });
        opts.append(h('label', { class: 'option', for: input.id }, input, h('b', null, o.titre || 'Option ' + (i + 1), h('span', { class: 'origine ' + o.origine, text: ORIGINES[o.origine] || o.origine })), h('div', { class: 'texte', html: md(o.texte) })));
      });
      b.append(opts);
    } else b.append(h('p', { class: 'aide', text: 'Réécris la réponse avec tes mots : c’est le meilleur test de compréhension, et c’est ce texte que tu défendras à l’oral.' }));
    b.append(zone);
    const coche = h('input', { type: 'checkbox', id: 'ok-' + cle }); coche.checked = !!e.ok;
    coche.addEventListener('change', () => { e.ok = coche.checked; sauver(); });
    const ligne = h('div', { class: 'ligne' }, h('label', { class: 'coche', for: coche.id }, coche, 'Je sais l’expliquer sans notes'));
    if (s.opts && s.opts.length) ligne.append(h('button', { class: 'btn petit', type: 'button', onclick: () => {
      const i = e.opt ? +e.opt.slice(1) : 0, t = A.brut(s.opts[i].texte);
      zone.value = zone.value.trim() ? zone.value.trim() + '\n\n' + t : t; e.txt = zone.value; if (!e.opt) e.opt = 'o' + i; sauver(); zone.focus();
    } }, 'Partir du texte coché'));
    ligne.append(etat); b.append(ligne);
    return b;
  }
  function blocQuiz(q) {
    const e = A.store.q(q.id), boite = h('div');
    q.quiz.forEach((item, n) => {
      const carte = h('div', { class: 'quiz-q' }, h('p', { html: A.inline(item.q) })), choix = h('div', { class: 'quiz-choix' }), pourquoi = h('div', { class: 'quiz-pourquoi', hidden: true, html: md(item.pourquoi) });
      const montrer = (k) => { choix.querySelectorAll('button').forEach((bt, i) => { bt.disabled = true; if (i === item.juste) bt.classList.add('juste'); else if (i === k) bt.classList.add('faux'); bt.querySelector('.marque-r').textContent = i === item.juste ? '✓' : i === k ? '✕' : ''; }); pourquoi.hidden = false; };
      item.choix.forEach((c, i) => choix.append(h('button', { type: 'button', onclick: () => { e.quiz[n] = i; A.store.toucher(q.id); montrer(i); } }, h('span', { class: 'marque-r' }), h('span', { html: A.inline(c) }))));
      carte.append(choix, pourquoi);
      if (e.quiz[n] != null) montrer(e.quiz[n]);
      boite.append(carte);
    });
    return boite;
  }
  function carteOral(cle, item) {
    const etat = A.store.oral(cle), d = h('details', { class: 'oral' + (etat ? ' ' + etat : '') });
    d.append(h('summary', null, h('span', { html: A.inline(item.q) })), h('div', { class: 'rep', html: md(item.r) }));
    const noter = (v) => { A.store.oral(cle, v); d.className = 'oral' + (v ? ' ' + v : ''); };
    d.append(h('div', { class: 'oral-outils' }, h('button', { class: 'btn petit', type: 'button', onclick: () => noter('su') }, 'Je savais'), h('button', { class: 'btn petit', type: 'button', onclick: () => noter('revoir') }, 'À revoir')));
    return d;
  }
  function vueQuestion(route) {
    const m = /^q-(\d+)-(\d+)(?:-(\w+))?$/.exec(route), q = m && M.questions[m[1] + '.' + m[2]];
    if (!q) return vueIntrouvable();
    const p = M.parties.find((x) => x.num === q.partie), sec = p.sections.find((x) => x.id === q.section);
    fil([['Accueil', '#accueil'], ['Partie ' + p.num, '#' + p.id], ['Question ' + q.id]]);
    const v = h('div');
    const tete = h('div', { class: 'q-tete' }, h('div', { class: 'q-num' }, h('b', { text: q.id }), 'Partie ' + p.num + (sec ? ' · ' + sec.id + '. ' + sec.titre : '')), h('h1', { text: q.titre }));
    if (q.enonce) tete.append(bloc('enonce', 'Énoncé', q.enonce));
    if (q.intro) tete.append(h('div', { html: md(q.intro) }));
    if (q.concepts.length) { const puces = h('div', { class: 'puces' }, h('span', { class: 'puce', text: 'À revoir avant :' })); q.concepts.forEach((c) => { const l = M.lecons.find((x) => x.id === c); if (l) puces.append(h('a', { class: 'puce', href: '#' + l.route, text: l.titre })); }); tete.append(puces); }
    v.append(tete);
    q.sous.forEach((s) => {
      const sect = h('section', { class: 'sous', id: 's-' + (s.id || 'r') });
      if (s.id || s.titre) sect.append(h('div', { class: 'sous-tete' }, s.id ? h('span', { class: 'sous-lettre', text: lettre(s) }) : null, h('h2', { class: 'sous-titre', text: s.titre || 'Réponse' })));
      if (s.enonce) sect.append(bloc('enonce', 'Énoncé ' + lettre(s), s.enonce));
      if (s.court) sect.append(bloc('bref', 'La réponse en bref', s.court));
      if (s.zero) sect.append(rubrique('Comprendre pas à pas'), h('div', { html: md(s.zero) }));
      if (s.res) sect.append(rubrique('Les chiffres'), h('div', { html: md(s.res) }));
      if (s.code) sect.append(h('details', { class: 'plus' }, h('summary', { text: 'Le code R, expliqué ligne par ligne' }), h('div', { class: 'interieur', html: md(s.code) })));
      const duel = blocDuel(q, s);
      if (duel) sect.append(rubrique('ChatGPT et Claude'), duel);
      if (s.piege) sect.append(h('div', { html: md(':::piege\n' + s.piege + '\n:::') }));
      if (s.plus) sect.append(h('div', { html: md('+++ Pour aller plus loin\n' + s.plus + '\n+++') }));
      sect.append(blocVersion(q, s));
      v.append(sect);
    });
    if (q.retenir) v.append(h('h2', { text: 'À retenir' }), h('div', { html: md(':::cle L’essentiel de la question ' + q.id + '\n' + q.retenir + '\n:::') }));
    if (q.quiz.length) v.append(h('h2', { text: 'Vérifie que tu as compris' }), blocQuiz(q));
    if (q.oral.length) { v.append(h('h2', { text: 'Questions possibles à l’oral' }), h('p', { class: 'widget-aide', text: 'Réponds à voix haute avant de déplier la réponse.' })); q.oral.forEach((o, i) => v.append(carteOral(q.id + '#' + i, o))); }
    const vo = A.voisins(q.id), e = A.store.q(q.id);
    const fait = h('input', { type: 'checkbox', id: 'fait-' + q.route }); fait.checked = !!e.fait;
    fait.addEventListener('change', () => { e.fait = fait.checked; A.store.toucher(q.id); });
    v.append(h('div', { class: 'pied-q' }, h('label', { class: 'coche', for: fait.id }, fait, h('strong', { text: 'Question ' + q.id + ' maîtrisée' })),
      h('div', { class: 'voisins' }, vo.avant ? h('a', { class: 'btn', href: routeQ(vo.avant), text: '← ' + vo.avant }) : null, vo.apres ? h('a', { class: 'btn plein', href: routeQ(vo.apres), text: vo.apres + ' : ' + M.questions[vo.apres].titre + ' →' }) : h('a', { class: 'btn plein', href: '#choix', text: 'Voir mon rapport →' }))));
    return v;
  }

  // ----------------------------------------------------------------- comparatif
  A.widgets.divergences = function (el) {
    el.className = ''; el.removeAttribute('data-w');
    let n = 0, accords = 0;
    M.parties.forEach((p) => {
      const lignes = [];
      p.questions.forEach((id) => M.questions[id].sous.forEach((s) => {
        if (s.accord && !s.gpt && !s.claude) { accords++; return; }
        if (!s.verdict && !s.gpt && !s.claude) return;
        n++; lignes.push([M.questions[id], s]);
      }));
      if (!lignes.length) return;
      el.append(h('h3', { text: 'Partie ' + p.num + ' — ' + lignes.length + ' point' + (lignes.length > 1 ? 's' : '') + ' de divergence' }));
      lignes.forEach(([q, s]) => {
        const e = A.store.etat.q[q.id], es = e && e.s[s.id || '_'], opt = es && es.opt && s.opts ? s.opts[+es.opt.slice(1)] : null;
        el.append(h('div', { class: 'resume-q' }, h('h4', null, h('a', { href: routeQ(q.id) + (s.id ? '-' + s.id : ''), text: q.id + ' ' + lettre(s) + ' — ' + (s.diff || s.titre || q.titre) })),
          h('div', { html: md(s.verdict || '') }), opt ? h('p', { class: 'note-pied' }, 'Ton choix actuel : ', h('strong', { text: opt.titre })) : null));
      });
    });
    el.prepend(h('p', null, h('strong', { text: n + ' points où les deux versions diffèrent' }), ' (méthode, profondeur ou conclusion) et ' + accords + ' sous-questions où elles donnent la même réponse.'));
  };

  // -------------------------------------------- atelier R : valeurs de contrôle
  // [identifiant stable, question, ce qu'on calcule, valeur attendue]. Les cases cochées sont
  // rangées avec les cartes d'oral (clés « ctl:… »), donc sauvegardées de la même façon.
  const CONTROLES = [
    ['lecture', '1.1', 'Lignes et colonnes lues : `dim(immo_raw)` puis `dim(fisc_raw)`', '286 120 × 13 puis 11 039 × 49'],
    ['communes', '1.1', 'Communes dans le fichier des ventes / dans le fichier fiscal', '565 / 581'],
    ['orphelines', '1.1', 'Communes sans correspondance : ventes seulement / fiscal seulement', '13 / 29'],
    ['base', '1.1', 'Base d’analyse', '551 communes (281 en Flandre, 251 en Wallonie, 19 à Bruxelles)'],
    ['mediane', '1.3', 'Erreur-type de la médiane : Rouvroy / Charleroi', '38 796 € / 1 944 €'],
    ['asymetrie', '1.4', 'Asymétrie du prix / de `ln(prix)`', '1,338 / −0,007'],
    ['loglog', '1.6', 'Élasticité du modèle log-log (erreur-type HC1)', '1,4443 (0,1494)'],
    ['regions', '1.9', 'Élasticité ; indicatrice Wallonie ; indicatrice Bruxelles', '1,6078 ; −0,2049 ; 0,8949'],
    ['pentes', '1.13', 'Élasticités Flandre / Wallonie / Bruxelles', '1,440 / 1,838 / 1,072'],
    ['bp', '1.14', 'Breusch-Pagan sur les régresseurs : modèle 1.6 / modèle 1.9', '82,6 / 9,26'],
    ['partapp', '1.15', 'Coefficient de `part_app` (HC1)', '0,379 (0,076)'],
    ['meres', '2.1', 'Nombre de mères', '254 654'],
    ['mco', '2.2', 'MCO : coefficient de `morekids`', '−5,387 (0,087)'],
    ['etape1', '2.4', 'Première étape : coefficient de `samegender` ; statistique F', '0,0675 ; 1 238'],
    ['vi', '2.6', 'VI avec `samegender`', '−6,314 (1,275)'],
    ['tsls', '2.8', '2SLS avec `twoboys` et `twogirls` ; F de première étape', '−5,463 (1,229) ; 657,9'],
    ['sargan', '2.11', 'Test de suridentification', '3,856 (p = 0,0496)'],
    ['hausman', '2.12', 'Hausman : coefficient du résidu de première étape', '−0,771 (1,232)'],
    ['extensive', '2.13', '2SLS sur la probabilité de travailler', '−0,119 (0,028)'],
    ['panel', '3.1', 'Localités ; lignes de 2003 à 2014', '574 ; 6 888'],
    ['groupes', '3.2', 'Localités traitées / de comparaison', '59 / 238'],
    ['did', '3.4', 'Double différence (HC1) ; observations', '0,3802 (0,0328) ; 2 866'],
    ['placebo', '3.6', 'Double différence placebo (HC1)', '0,0129 (0,0277)'],
    ['twfe', '3.7', 'Effets fixes de localité et d’année (HC1)', '0,3800 (0,0265)'],
    ['groupees', '3.8', 'Erreurs-types groupées : question 3.4 / question 3.7', '0,0442 / 0,0467']
  ];
  A.widgets.controles = function (el) {
    el.className = ''; el.removeAttribute('data-w');
    const compteur = h('p', { class: 'note-pied', 'aria-live': 'polite' });
    const maj = () => { const n = CONTROLES.filter((c) => A.store.oral('ctl:' + c[0])).length; compteur.textContent = n + ' valeur' + (n > 1 ? 's' : '') + ' retrouvée' + (n > 1 ? 's' : '') + ' sur ' + CONTROLES.length + '. Tes coches sont enregistrées.'; };
    const corps = h('tbody');
    CONTROLES.forEach(([id, q, quoi, valeur]) => {
      const c = h('input', { type: 'checkbox', 'aria-label': 'Valeur retrouvée : ' + A.brut(quoi) });
      c.checked = !!A.store.oral('ctl:' + id);
      c.addEventListener('change', () => { A.store.oral('ctl:' + id, c.checked ? 'ok' : ''); maj(); });
      corps.append(h('tr', null, h('td', null, h('a', { href: routeQ(q), text: q })), h('td', { html: A.inline(quoi) }), h('td', { class: 'd', text: valeur }), h('td', { class: 'c' }, c)));
    });
    const t = h('table', null, h('thead', null, h('tr', null, h('th', { text: 'Question' }), h('th', { text: 'Ce que tu calcules' }), h('th', { class: 'd', text: 'Valeur attendue' }), h('th', { class: 'c', text: 'Retrouvée' }))), corps);
    el.append(h('div', { class: 'table-boite' }, t), compteur);
    maj();
  };

  // ------------------------------------------------------- mon rapport / export
  function exportMarkdown() {
    let out = '# Mon rapport — notes et choix (ECGEB352)\n';
    M.parties.forEach((p) => {
      out += '\n## Partie ' + p.num + ' — ' + p.titre + '\n';
      p.questions.forEach((id) => {
        const q = M.questions[id], e = A.store.etat.q[id]; let corps = '';
        q.sous.forEach((s) => { const es = e && e.s[s.id || '_']; if (!es) return; const opt = es.opt && s.opts ? s.opts[+es.opt.slice(1)] : null;
          if (!opt && !(es.txt && es.txt.trim())) return;
          corps += '\n**' + q.id + (s.id ? ' (' + s.id + ')' : '') + '**' + (opt ? ' — raisonnement retenu : ' + opt.titre : '') + '\n' + (es.txt && es.txt.trim() ? '\n' + es.txt.trim() + '\n' : ''); });
        if (corps) out += '\n### Question ' + id + ' — ' + q.titre + '\n' + corps;
      });
    });
    return out;
  }
  function vueChoix() {
    fil([['Accueil', '#accueil'], ['Mon rapport, mes choix']]);
    const b = A.store.bilan();
    const v = h('div', null, h('p', { class: 'surtitre', text: 'Ton travail' }), h('h1', { text: 'Mon rapport, mes choix' }),
      h('p', { class: 'chapo', text: 'Tout ce que tu as coché et rédigé dans les blocs « Ma version », réuni au même endroit. C’est la matière première de ton rapport : relis, corrige, puis exporte.' }));
    v.append(h('div', { class: 'chiffres' }, A.chiffre('Questions maîtrisées', b.fait + ' / ' + b.total), A.chiffre('Sous-questions « je sais l’expliquer »', b.sousOk + ' / ' + b.sousTotal), A.chiffre('Sous-questions rédigées', b.redige + ' / ' + b.sousTotal)));
    v.append(h('h2', { text: 'Exporter' }));
    const zone = h('textarea', { class: 'export', id: 'export-md', readonly: true, 'aria-label': 'Export Markdown de mes notes' }); zone.value = exportMarkdown();
    const info = h('span', { class: 'enregistre' });
    const copier = h('button', { class: 'btn plein', type: 'button', onclick: () => { const ok = () => { info.textContent = 'Copié dans le presse-papiers.'; }; const repli = () => { zone.focus(); zone.select(); info.textContent = 'Texte sélectionné : copie-le avec Ctrl+C.'; };
      try { navigator.clipboard.writeText(zone.value).then(ok, repli); } catch (e) { repli(); } } }, 'Copier le texte');
    const ligne = h('div', { class: 'maversion', style: 'border-color:var(--line-2)' }, zone, h('div', { class: 'ligne' }, copier, info));
    const telecharger = h('button', { class: 'btn', type: 'button', hidden: true }, 'Télécharger (.md)');
    ligne.querySelector('.ligne').insertBefore(telecharger, info);
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('downloads').then((dl) => { if (!dl) return; telecharger.hidden = false; telecharger.onclick = () => dl.save({ filename: 'mon-rapport-ecgeb352.md', data: zone.value }).then(() => { info.textContent = 'Fichier enregistré.'; }, (err) => { info.textContent = err && err.code === 'declined' ? 'Téléchargement annulé.' : 'Téléchargement indisponible ici : utilise « Copier ».'; }); });
    } else {
      telecharger.hidden = false;
      telecharger.onclick = () => { const a = h('a', { href: URL.createObjectURL(new Blob([zone.value], { type: 'text/markdown' })), download: 'mon-rapport-ecgeb352.md' }); document.body.append(a); a.click(); a.remove(); };
    }
    v.append(ligne);
    v.append(h('h2', { text: 'Détail par question' }));
    M.parties.forEach((p) => {
      v.append(h('h3', { text: 'Partie ' + p.num + ' — ' + p.titre }));
      p.questions.forEach((id) => {
        const q = M.questions[id], e = A.store.etat.q[id], carte = h('div', { class: 'resume-q' }, h('h4', null, h('a', { href: routeQ(id), text: id + ' — ' + q.titre }), e && e.fait ? ' ✓' : ''));
        let rien = true;
        q.sous.forEach((s) => { const es = e && e.s[s.id || '_']; if (!es) return; const opt = es.opt && s.opts ? s.opts[+es.opt.slice(1)] : null;
          if (!opt && !(es.txt && es.txt.trim()) && !es.ok) return; rien = false;
          carte.append(h('p', null, h('strong', { text: (s.id ? '(' + s.id + ') ' : '') + (es.ok ? '✓ ' : '') }), opt ? 'Raisonnement retenu : ' + opt.titre + '. ' : '', es.txt && es.txt.trim() ? h('span', { text: es.txt.trim() }) : h('em', { class: 'rien', text: 'pas encore rédigé' }))); });
        if (rien) carte.append(h('p', { class: 'rien', text: 'Rien de coché ni de rédigé pour l’instant.' }));
        v.append(carte);
      });
    });
    return v;
  }

  // ----------------------------------------------------------------------- oral
  function vueOral() {
    fil([['Accueil', '#accueil'], ['Préparer l’oral']]);
    const v = h('div', null, h('p', { class: 'surtitre', text: 'Examen oral par groupe · semaine du 7 décembre 2026' }), h('h1', { text: 'Préparer l’oral' }),
      h('p', { class: 'chapo', text: 'L’oral porte sur le code et sur le raisonnement, et chaque membre du groupe doit pouvoir tout expliquer. Réponds à voix haute, en deux phrases, puis déplie la réponse et note-toi honnêtement.' }));
    let filtre = 'toutes';
    const zone = h('div');
    const dessiner = () => {
      zone.textContent = '';
      M.parties.forEach((p) => {
        const cartes = [];
        p.questions.forEach((id) => M.questions[id].oral.forEach((o, i) => { const cle = id + '#' + i, e = A.store.oral(cle); if (filtre === 'toutes' || (filtre === 'revoir' && e === 'revoir') || (filtre === 'nouvelles' && !e)) cartes.push([cle, o, id]); }));
        if (!cartes.length) return;
        zone.append(h('h3', { text: 'Partie ' + p.num + ' — ' + p.titre + ' (' + cartes.length + ')' }));
        cartes.forEach(([cle, o, id]) => { const c = carteOral(cle, o); c.querySelector('.rep').append(h('p', { class: 'note-pied' }, h('a', { href: routeQ(id), text: 'Revoir la question ' + id })) ); zone.append(c); });
      });
      if (!zone.children.length) zone.append(h('p', { class: 'widget-aide', text: 'Aucune carte dans ce filtre.' }));
    };
    const hasard = h('button', { class: 'btn', type: 'button', onclick: () => { const cs = zone.querySelectorAll('details.oral'); if (!cs.length) return; cs.forEach((c) => { c.open = false; }); const c = cs[Math.floor(Math.random() * cs.length)]; c.scrollIntoView({ block: 'center' }); c.querySelector('summary').focus(); } }, 'Tirer une question au hasard');
    v.append(h('div', { class: 'commandes' }, A.choix('Afficher', [['toutes', 'Toutes'], ['nouvelles', 'Pas encore vues'], ['revoir', 'À revoir']], filtre, (x) => { filtre = x; dessiner(); }), hasard), zone);
    dessiner();
    return v;
  }

  // ------------------------------------------------------------------ glossaire
  function vueGlossaire() {
    fil([['Accueil', '#accueil'], ['Glossaire']]);
    const termes = Object.keys(M.glossaire).map((k) => M.glossaire[k]).sort((a, b) => a.terme.localeCompare(b.terme, 'fr'));
    const v = h('div', null, h('p', { class: 'surtitre', text: termes.length + ' termes' }), h('h1', { text: 'Glossaire' }), h('p', { class: 'chapo', text: 'Chaque mot technique du travail, en une ou deux phrases. Dans les pages, les mots soulignés en pointillés ouvrent la même définition.' }));
    const champ = h('input', { type: 'search', id: 'filtre-glossaire', placeholder: 'Filtrer : biais, instrument, log…', 'aria-label': 'Filtrer le glossaire', style: 'width:100%;max-width:420px;padding:8px 10px;border:1px solid var(--line-2);border-radius:5px;background:var(--surface);margin-bottom:16px' });
    const zone = h('div');
    const dessiner = () => { const f = A.norm(champ.value); zone.textContent = ''; termes.filter((t) => !f || A.norm(t.terme + ' ' + t.def).includes(f)).forEach((t) => zone.append(h('div', { class: 'resume-q', id: 'g-' + A.norm(t.terme).replace(/ /g, '-') }, h('h4', { text: t.terme }), h('div', { html: md(t.def) }), t.voir ? h('p', { class: 'note-pied' }, h('a', { href: '#' + t.voir, text: 'Où ça sert dans le travail →' })) : null))); };
    champ.addEventListener('input', dessiner); dessiner();
    v.append(champ, zone);
    return v;
  }
  const vuePage = (nom, titre) => () => { fil([['Accueil', '#accueil'], [titre]]); return h('div', { html: md(A.C[nom]) }); };
  function vueIntrouvable() { fil([['Accueil', '#accueil'], ['Page introuvable']]); return h('div', null, h('h1', { text: 'Cette page n’existe pas' }), h('p', null, h('a', { href: '#accueil', text: 'Revenir à l’accueil' }))); }

  // -------------------------------------------------------------------- routeur
  const PAGES = { accueil: vueAccueil, bases: vueBases, comparatif: vuePage('comparatif', 'ChatGPT vs Claude'), choix: vueChoix, atelier: vuePage('atelier', 'Atelier R'), oral: vueOral, glossaire: vueGlossaire };
  function router() {
    const route = decodeURIComponent(location.hash.replace(/^#/, '')) || 'accueil';
    const memeQuestion = /^q-/.test(route) && route.replace(/^(q-\d+-\d+).*$/, '$1') === routeActive.replace(/^(q-\d+-\d+).*$/, '$1') && $('vue').firstChild;
    routeActive = route;
    fermerNav(); fermerGlose(); A.bulle.cacher();
    if (!memeQuestion) {
      const vue = PAGES[route] ? PAGES[route]() : /^q-/.test(route) ? vueQuestion(route) : /^b-/.test(route) ? vueLecon(route) : /^p\d$/.test(route) ? vuePartie(route) : vueIntrouvable();
      const hote = $('vue'); hote.textContent = ''; hote.append(vue);
      monter(hote);
    }
    marquerActif();
    const ancre = /^q-\d+-\d+-(\w+)$/.exec(route), cible = ancre && document.getElementById('s-' + ancre[1]);
    if (cible) cible.scrollIntoView(); else window.scrollTo(0, 0);
  }

  // ------------------------------------------------------- glossaire en bulle
  function fermerGlose() { const g = $('glose'); if (g) g.hidden = true; }
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest && ev.target.closest('.terme'), g = $('glose');
    if (!t) { if (!ev.target.closest || !ev.target.closest('#glose')) fermerGlose(); return; }
    const d = A.definition(t.dataset.terme);
    g.textContent = '';
    g.append(h('b', { text: d ? d.terme : t.dataset.terme }), h('div', { html: d ? md(d.def) : '<p>Définition à venir.</p>' }));
    if (d && d.voir) g.append(h('a', { href: '#' + d.voir, text: 'Où ça sert dans le travail →' }));
    g.hidden = false;
    const r = t.getBoundingClientRect(), gr = g.getBoundingClientRect();
    let x = r.left, y = r.bottom + 8;
    if (x + gr.width > window.innerWidth - 16) x = window.innerWidth - 16 - gr.width;
    if (y + gr.height > window.innerHeight - 8) y = Math.max(8, r.top - gr.height - 8);
    g.style.left = Math.max(16, x) + 'px'; g.style.top = y + 'px';
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { fermerGlose(); fermerNav(); $('recherche-resultats').hidden = true; } });
  window.addEventListener('scroll', A.debounce(fermerGlose, 50), { passive: true });

  // ------------------------------------------------------------------ recherche
  let index = null;
  function construireIndex() {
    index = [];
    M.ordre.forEach((id) => { const q = M.questions[id];
      index.push({ t: 'Question ' + id + ' — ' + q.titre, s: 'Partie ' + q.partie, r: routeQ(id), x: A.norm(id + ' ' + q.titre + ' ' + A.brut(q.enonce) + ' ' + q.sous.map((s) => s.titre + ' ' + A.brut(s.enonce) + ' ' + A.brut(s.court)).join(' ')) }); });
    M.lecons.forEach((l) => index.push({ t: l.titre, s: 'Les bases', r: '#' + l.route, x: A.norm(l.titre + ' ' + A.brut(l.texte).slice(0, 1500)) }));
    Object.keys(M.glossaire).forEach((k) => { const g = M.glossaire[k]; index.push({ t: g.terme, s: 'Glossaire', r: '#glossaire', x: A.norm(g.terme + ' ' + A.brut(g.def)) }); });
  }
  function chercher() {
    const champ = $('champ-recherche'), boite = $('recherche-resultats'), f = A.norm(champ.value);
    if (f.length < 2) { boite.hidden = true; return; }
    if (!index) construireIndex();
    const mots = f.split(' '), res = index.filter((e) => mots.every((m) => e.x.includes(m))).sort((a, b) => (A.norm(b.t).includes(f) ? 1 : 0) - (A.norm(a.t).includes(f) ? 1 : 0)).slice(0, 12);
    boite.textContent = '';
    if (!res.length) boite.append(h('div', { class: 'vide', text: 'Rien trouvé pour « ' + champ.value + ' ».' }));
    res.forEach((e) => boite.append(h('a', { href: e.r, onclick: () => { boite.hidden = true; champ.value = ''; } }, e.t, h('small', { text: e.s }))));
    boite.hidden = false;
  }

  // ------------------------------------------------------------- menu mobile
  function fermerNav() { $('nav').classList.remove('ouvert'); $('voile').hidden = true; $('bouton-menu').setAttribute('aria-expanded', 'false'); }
  function ouvrirNav() { $('nav').classList.add('ouvert'); $('voile').hidden = false; $('bouton-menu').setAttribute('aria-expanded', 'true'); }

  function demarrer() {
    A.store.demarrer();
    dessinerNav(); majProgression();
    A.store.abonner((quoi) => {
      majProgression();
      if (quoi === 'q' || quoi === 'charge') { document.querySelectorAll('#nav-liste .nav-q').forEach((a) => { const m = /^q-(\d+)-(\d+)$/.exec(a.dataset.route || ''); if (m) { const e = A.store.etat.q[m[1] + '.' + m[2]]; a.classList.toggle('fait', !!(e && e.fait)); } });
        M.parties.forEach((p) => { const c = document.querySelector('.nav-partie[data-partie="' + p.id + '"] .compte'), b = A.store.bilanPartie(p.num); if (c) c.textContent = b.fait + '/' + b.total; }); }
      if (quoi === 'charge') { const actif = document.activeElement; if (!actif || !/^(TEXTAREA|INPUT)$/.test(actif.tagName)) { routeActive = ''; router(); } }
    });
    $('bouton-menu').addEventListener('click', () => ($('nav').classList.contains('ouvert') ? fermerNav() : ouvrirNav()));
    $('voile').addEventListener('click', fermerNav);
    $('champ-recherche').addEventListener('input', A.debounce(chercher, 120));
    $('champ-recherche').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const a = $('recherche-resultats').querySelector('a'); if (a) { location.hash = a.getAttribute('href'); $('recherche-resultats').hidden = true; ev.target.value = ''; } } });
    document.addEventListener('click', (ev) => { if (!ev.target.closest || !ev.target.closest('.recherche')) $('recherche-resultats').hidden = true; });
    window.addEventListener('hashchange', router);
    router();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
