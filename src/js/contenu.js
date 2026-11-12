// Lit les fichiers de contenu (src/content/*.md) et construit le modèle de l'atelier.
//
//   #PART 1 | Titre | sous-titre        une partie du travail
//   #SEC A | Titre                      une section de l'énoncé
//   #Q 1.6 | Titre court                une question
//   ##a | Titre                         une sous-question (a), (b)…  ("## | Titre" si la question n'en a pas)
//   :champ [arguments]                  un champ ; son texte court jusqu'au prochain marqueur
//
// Champs d'une question  : enonce, intro, concepts, quiz, oral, retenir
// Champs d'une sous-question : enonce, court, zero, res, code, accord, gpt, claude, verdict,
//                              opt <origine> | <titre>, piege, plus
(function () {
  'use strict';
  const A = window.A;
  const M = A.modele = { parties: [], questions: {}, ordre: [], lecons: [], glossaire: {}, alias: {}, pages: {} };
  const DE_QUESTION = { quiz: 1, oral: 1, retenir: 1, concepts: 1, intro: 1 };

  function lirePartie(src) {
    let partie = null, section = null, q = null, sous = null, champ = null, cible = null;
    const fermer = () => { if (champ && cible) { cible[champ.nom] = champ.multi ? (cible[champ.nom] || []).concat([Object.assign({ texte: champ.lignes.join('\n').trim() }, champ.args)]) : champ.lignes.join('\n').trim(); } champ = null; };
    String(src).replace(/\r\n?/g, '\n').split('\n').forEach((l) => {
      let m;
      if ((m = /^#PART (\d+) \| (.*?)(?: \| (.*))?$/.exec(l))) {
        fermer();
        partie = { num: +m[1], id: 'p' + m[1], titre: m[2].trim(), sousTitre: (m[3] || '').trim(), sections: [], questions: [] };
        M.parties.push(partie); q = sous = null; cible = partie; return;
      }
      if ((m = /^#SEC (\w+) \| (.*)$/.exec(l))) { fermer(); section = { id: m[1], titre: m[2].trim(), questions: [] }; partie.sections.push(section); return; }
      if ((m = /^#Q ([\d.]+) \| (.*)$/.exec(l))) {
        fermer();
        q = { id: m[1], route: 'q-' + m[1].replace('.', '-'), titre: m[2].trim(), partie: partie.num, section: section ? section.id : '', sous: [] };
        M.questions[q.id] = q; M.ordre.push(q.id); partie.questions.push(q.id); if (section) section.questions.push(q.id);
        sous = null; cible = q; return;
      }
      if ((m = /^##(\w*) ?\|? ?(.*)$/.exec(l)) && q && !/^###/.test(l)) {
        fermer();
        sous = { id: m[1] || '', titre: (m[2] || '').trim() };
        q.sous.push(sous); cible = sous; return;
      }
      if ((m = /^:(\w+)(?: (.*))?$/.exec(l))) {
        fermer();
        const nom = m[1];
        cible = (q && DE_QUESTION[nom]) ? q : (sous || q || partie);
        if (nom === 'enonce' && sous) cible = sous;
        if (nom === 'opt') {
          const p = (m[2] || '').split('|').map((x) => x.trim());
          champ = { nom: 'opts', multi: true, args: { origine: p[0] || 'mix', titre: p[1] || '' }, lignes: [] };
        } else if (nom === 'resultat') {
          const p = (m[2] || '').split('|').map((x) => x.trim());
          cible.resultat = { valeur: p[0], texte: p[1] || '' };
        } else champ = { nom, lignes: m[2] ? [m[2]] : [] };
        return;
      }
      if (champ) champ.lignes.push(l);
    });
    fermer();
  }

  function lireQuiz(src) {
    const out = []; let cur = null;
    String(src || '').split('\n').forEach((l) => {
      if (/^\? /.test(l)) { cur = { q: l.slice(2).trim(), choix: [], juste: -1, pourquoi: '' }; out.push(cur); }
      else if (cur && /^[-+] /.test(l)) { if (l[0] === '+') cur.juste = cur.choix.length; cur.choix.push(l.slice(2).trim()); }
      else if (cur && /^> ?/.test(l)) cur.pourquoi += (cur.pourquoi ? '\n' : '') + l.replace(/^> ?/, '');
      else if (cur && l.trim() && cur.pourquoi) cur.pourquoi += '\n' + l;
    });
    return out;
  }
  function lireOral(src) {
    const out = []; let cur = null;
    String(src || '').split('\n').forEach((l) => {
      if (/^\? /.test(l)) { cur = { q: l.slice(2).trim(), r: '' }; out.push(cur); }
      else if (cur) cur.r += (cur.r ? '\n' : '') + l.replace(/^> ?/, '');
    });
    return out;
  }

  ['p1', 'p2', 'p3'].forEach((n) => { if (A.C[n]) lirePartie(A.C[n]); });
  M.ordre.forEach((id) => {
    const q = M.questions[id];
    q.quiz = lireQuiz(q.quiz); q.oral = lireOral(q.oral);
    q.concepts = (q.concepts || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (!q.sous.length) q.sous.push({ id: '', titre: '' });
  });

  // Leçons des bases : "#L id | Titre | durée" puis le texte.
  (function () {
    let cur = null;
    String(A.C.bases || '').replace(/\r\n?/g, '\n').split('\n').forEach((l) => {
      const m = /^#L ([\w-]+) \| (.*?)(?: \| (.*))?$/.exec(l);
      if (m) { cur = { id: m[1], route: 'b-' + m[1], titre: m[2].trim(), duree: (m[3] || '').trim(), lignes: [] }; M.lecons.push(cur); }
      else if (cur) cur.lignes.push(l);
      else (M.pages.basesIntro = M.pages.basesIntro || []).push(l);
    });
    M.lecons.forEach((x, i) => { x.texte = x.lignes.join('\n'); x.n = i + 1; delete x.lignes; });
    M.pages.basesIntro = (M.pages.basesIntro || []).join('\n');
  })();

  // Glossaire : "#T terme | alias, alias" puis la définition ; "@voir route" facultatif.
  (function () {
    let cur = null;
    const norm = A.norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
    String(A.C.glossaire || '').replace(/\r\n?/g, '\n').split('\n').forEach((l) => {
      const m = /^#T (.*?)(?: \| (.*))?$/.exec(l);
      if (m) {
        cur = { terme: m[1].trim(), lignes: [], voir: '' };
        M.glossaire[norm(cur.terme)] = cur;
        (m[2] || '').split(',').map((x) => x.trim()).filter(Boolean).forEach((a) => { M.alias[norm(a)] = norm(cur.terme); });
      } else if (cur) { const v = /^@voir (\S+)/.exec(l); if (v) cur.voir = v[1]; else cur.lignes.push(l); }
    });
    Object.keys(M.glossaire).forEach((k) => { const g = M.glossaire[k]; g.def = g.lignes.join('\n').trim(); delete g.lignes; });
    A.definition = (terme) => { const k = norm(terme); return M.glossaire[k] || M.glossaire[M.alias[k]] || null; };
  })();

  A.voisins = function (id) { const i = M.ordre.indexOf(id); return { avant: M.ordre[i - 1] || null, apres: M.ordre[i + 1] || null }; };
  A.cleSous = (q, s) => q.id + (s.id ? s.id : '');
})();
