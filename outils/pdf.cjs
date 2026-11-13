// Fabrique le document PDF « Résolution commentée » à partir du contenu de l'atelier.
//   node outils/pdf.cjs <dossier des figures du script R> <fichier.pdf>
// Le contenu (réponses, explications, résultats, code) est celui de src/content ; il est mis en page
// par Chromium. Les graphiques demandés par l'énoncé sont ceux que produit rendu/travail_ecgeb352.R.
// Deux passes : la seconde inscrit dans le sommaire les numéros de page relevés dans la première.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const [, , dossierFigures, sortie] = process.argv;
if (!dossierFigures || !sortie) { console.error('usage : node outils/pdf.cjs <figures> <sortie.pdf>'); process.exit(2); }

// Où placer chaque figure du script : question, sous-question ('' = sous-question unique, '*' = avant
// les sous-questions), fichiers et légende.
const FIGURES = [
  ['1.4', 'b', ['fig_1_4_prix', 'fig_1_4_rev', 'fig_1_4_lprix', 'fig_1_4_lrev'], 'Histogrammes du prix médian et du revenu par habitant, en niveaux puis en logarithmes (551 communes, 2023). Source : Statbel.'],
  ['1.5', '*', ['fig_1_5_niveaux', 'fig_1_5_logs'], 'Prix médian des maisons et revenu par habitant, en niveaux puis en échelles logarithmiques (551 communes, 2023). Source : Statbel.'],
  ['1.13', 'f', ['fig_1_13f'], 'Relation log-log estimée dans chaque région, avec intervalles de confiance à 95 % (erreurs-types HC1).'],
  ['1.14', 'a', ['fig_1_14_ajuste', 'fig_1_14_ventes'], 'Résidus des modèles 1.6 et 1.9 en fonction des valeurs ajustées, puis du nombre de ventes.'],
  ['1.17', '', ['fig_1_17'], 'Élasticité estimée et intervalle de confiance à 95 % dans les quatre spécifications.'],
  ['2.1', '', ['fig_2_1'], 'Semaines travaillées en 1979 par les 254 654 mères. Source : recensement américain de 1980 (Angrist et Evans, 1998).'],
  ['2.5', 'a', ['fig_2_5'], 'Part des mères ayant un troisième enfant selon le sexe des deux premiers, avec intervalles de confiance à 95 %.'],
  ['3.6', 'b', ['fig_3_6'], 'Part des localités dont la lumière est détectée par satellite, par groupe, 2003-2014. Source : Schmidt et Moradi (2026).']
];

// Polices statiques (outils/polices, licence OFL) : Chromium les incorpore une seule fois, en
// sous-ensembles, alors que les polices variables servies en ligne alourdissent beaucoup le PDF.
const PLAGES = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  greek: 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF'
};
const FAMILLES = { 'ibm-plex-sans': 'PDF Texte', 'ibm-plex-mono': 'PDF Code', 'space-grotesk': 'PDF Titre', 'stix-two-text': 'PDF Math' };
function policesCSS() {
  const dir = path.join(__dirname, 'polices');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.woff2')).map((f) => {
    const m = /^(.*)-(latin-ext|latin|greek)-(\d+)-(normal|italic)\.woff2$/.exec(f);
    if (!m) throw new Error('police inattendue : ' + f);
    return '@font-face{font-family:"' + FAMILLES[m[1]] + '";font-weight:' + m[3] + ';font-style:' + m[4] + ';unicode-range:' + PLAGES[m[2]] +
      ';src:url(data:font/woff2;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64') + ') format("woff2")}';
  }).join('\n');
}

const CSS = `
:root { --f-texte: "PDF Texte", "Liberation Sans", sans-serif; --f-titre: "PDF Titre", "PDF Texte", sans-serif; --f-code: "PDF Code", "Liberation Mono", monospace; --f-math: "PDF Math", "Liberation Serif", serif; }
@page { size: A4; margin: 16mm 15mm 17mm; }
html, body { background: #fff !important; }
body::before { display: none !important; }
body { font-size: 16.5px; }
.doc { max-width: none; margin: 0; padding: 0; color: var(--ink); }
.doc p, .doc li { max-width: none; }
.doc h1, .doc h2, .doc h3, .doc h4, .doc .rubrique, .doc .etiquette { break-after: avoid; }
.doc .encadre, .doc .enonce, .doc .reponse, .doc figure, .doc .widget, .doc tr, .doc .qa, .doc .option-pdf { break-inside: avoid; }
.doc pre.code { white-space: pre-wrap; overflow-wrap: anywhere; overflow: visible; font-size: 12.5px; line-height: 1.5; break-inside: avoid; }
.doc .table-boite { overflow: visible; }
.doc table { font-size: 13.5px; }
.doc a { color: inherit; text-decoration: none; }
.doc .terme-pdf { border: 0; }

.couverture { height: 248mm; display: flex; flex-direction: column; justify-content: center; break-after: page; }
.couverture .cours { font: 600 13px/1.2 var(--f-texte); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 26px; }
.couverture h1 { font: 700 46px/1.08 var(--f-titre); margin: 0 0 18px; letter-spacing: -.01em; }
.couverture .sous { font-size: 20px; line-height: 1.5; color: var(--ink-2); max-width: 30em; margin: 0 0 40px; }
.couverture .trois { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 44px; }
.couverture .trois div { border-top: 3px solid var(--ink); padding-top: 12px; }
.couverture .trois b { display: block; font: 600 15px/1.3 var(--f-titre); margin-bottom: 4px; }
.couverture .trois span { font-size: 13.5px; color: var(--ink-2); line-height: 1.45; display: block; }
.couverture .date { font-size: 14px; color: var(--muted); }

.page { break-before: page; }
.doc h1.titre-page { font: 700 30px/1.15 var(--f-titre); margin: 0 0 16px; }
.sommaire h2 { font: 600 16px/1.3 var(--f-titre); margin: 20px 0 6px; border: 0; padding: 0; }
.sommaire .ligne { display: flex; align-items: baseline; gap: 8px; font-size: 13.5px; line-height: 1.75; }
.sommaire .ligne .n { flex: none; width: 34px; font-family: var(--f-code); font-size: 12px; color: var(--muted); }
.sommaire .ligne .points { flex: 1; border-bottom: 1px dotted var(--line-2); transform: translateY(-3px); }
.sommaire .ligne .pg { flex: none; font-variant-numeric: tabular-nums; color: var(--ink-2); min-width: 22px; text-align: right; }

.partie-titre { break-before: page; margin: 0 0 22px; padding: 26px 0 20px; border-top: 4px solid var(--ink); border-bottom: 1px solid var(--line-2); }
.partie-titre .num { font: 600 13px/1 var(--f-texte); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
.partie-titre h1 { font: 700 34px/1.1 var(--f-titre); margin: 0 0 6px; }
.partie-titre .sous { font-size: 18px; color: var(--ink-2); }
.doc h2.section-titre { font: 600 13px/1.2 var(--f-texte); letter-spacing: .1em; text-transform: uppercase; color: var(--accent-ink); margin: 34px 0 0; padding: 0; border: 0; }

.q { margin-top: 30px; padding-top: 16px; border-top: 2px solid var(--ink); }
.q-entete { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; break-after: avoid; }
.q-entete .n { flex: none; font: 600 13px/1 var(--f-code); background: var(--ink); color: #fff; padding: 5px 8px; border-radius: 4px; }
.q-entete h2 { font: 700 23px/1.2 var(--f-titre); margin: 0; padding: 0; border: 0; }
.doc h3.sous-titre { font: 600 18px/1.3 var(--f-titre); margin: 26px 0 10px; padding-top: 12px; border-top: 1px solid var(--line-2); }
.doc h3.sous-titre .l { color: var(--accent-ink); margin-right: 6px; }
.reponse { margin: 0 0 16px; padding: 12px 15px 2px; border-left: 4px solid var(--accent); background: var(--accent-soft); border-radius: 0 var(--r) var(--r) 0; }
.reponse > .etiquette { font: 600 11.5px/1 var(--f-texte); letter-spacing: .07em; text-transform: uppercase; color: var(--accent-ink); margin-bottom: 8px; }
.reponse .table-boite { background: #fff; }
.option-pdf { margin: 0 0 12px; padding: 11px 14px 1px; border: 1px solid var(--line-2); border-radius: var(--r); background: var(--surface-2); }
.option-pdf > b { display: block; font: 600 13.5px/1.3 var(--f-texte); margin-bottom: 6px; color: var(--ink-2); }
.option-pdf p { font-size: 14.5px; }
.qa { margin: 0 0 10px; }
.qa > b { display: block; font-size: 14.5px; }
.qa p { font-size: 14.5px; color: var(--ink-2); margin: 2px 0 0; }
.doc figure { margin: 4px 0 20px; }
.doc figure .images { display: grid; gap: 8px; }
.doc figure .images.deux { grid-template-columns: 1fr 1fr; }
.doc figure img { width: 100%; border: 1px solid var(--line); border-radius: 4px; display: block; }
.doc figcaption { font-size: 12.5px; color: var(--muted); margin-top: 6px; line-height: 1.45; }
.doc .widget .commandes, .doc .widget button, .doc .widget details, .doc .widget input, .doc .widget select, .doc .widget .commande { display: none !important; }
.doc .widget { padding: 12px 14px; }
/* Un point semi-transparent devient un objet à part dans le PDF : 551 points par nuage, plusieurs Mo au total. */
.doc svg circle { opacity: 1 !important; fill-opacity: 1 !important; }
.doc .widget::after { content: "Figure tirée de l'outil interactif de l'atelier, dans son état initial."; display: block; font-size: 11.5px; color: var(--muted); margin-top: 8px; }
.annexe-controles td.c, .annexe-controles th.c, .annexe-controles .note-pied { display: none; }
.glossaire-pdf { columns: 2; column-gap: 26px; }
.glossaire-pdf .t { break-inside: avoid; margin: 0 0 10px; }
.glossaire-pdf .t b { display: block; font: 600 13.5px/1.3 var(--f-texte); }
.glossaire-pdf .t p { font-size: 12.5px; line-height: 1.45; color: var(--ink-2); margin: 1px 0 0; }
`;

const AVANT = `
## Comment lire ce document

Les 41 questions de l'énoncé sont traitées dans l'ordre. Chaque sous-question suit le même plan.

| Bloc | Ce qu'il contient |
|---|---|
| **Énoncé** | La question, telle qu'elle est posée. |
| **Réponse** | Ce qu'il faut pouvoir dire en deux ou trois phrases, chiffres compris. |
| **Explication** | Le raisonnement pas à pas, sans prérequis : d'où vient l'idée, pourquoi cette méthode, comment lire le résultat. |
| **Résultats** et **Code R** | Les tableaux produits par R, puis les lignes du script qui les donnent, commentées. |
| **Rédaction possible** | Une ou plusieurs formulations pour le rapport, quand la question laisse un choix. À réécrire avec tes mots. |
| **À retenir**, **oral** | En fin de question : l'essentiel, et les questions probables à l'oral avec leur réponse. |

## D'où viennent les chiffres

Tous les résultats sortent du script \`travail_ecgeb352.R\`, fourni avec ce document. Il a été exécuté du début à la fin sur les quatre fichiers du travail (R 4.3.3, 66 secondes, aucune erreur) et enregistre 91 fichiers dans le dossier \`resultats\`. Les **graphiques demandés par l'énoncé** sont ceux du script. Les **schémas explicatifs** viennent des outils de l'atelier interactif, figés dans leur état initial : quand le texte invite à manipuler un outil, c'est à l'atelier qu'il renvoie. « Les deux corrigés » désigne les versions de ChatGPT et de Claude que tu m'as transmises.

## Ce que tu dois vérifier toi-même

:::verif Quatre points que je n'ai pas pu contrôler
- **La colonne « DiD : TWFE » du tableau 4 de Schmidt et Moradi** (question 3.4 c) : l'article est en accès payant. Lis le coefficient, l'erreur-type et le nombre d'observations dans ta copie.
- **Les autres résultats de cet article** (question 3.9 b) : la liste donnée concorde avec l'énoncé, mais ne remplace pas la lecture des sections 1 à 4.
- **Le chiffre de −11,3 points du tableau 7 d'Angrist et Evans** (question 2.13) : il ne figure pas dans l'énoncé.
- **La raison pour laquelle Anvers a gardé son code INS** (question 1.1 d) : plausible, non confirmée à la source.
:::

## Trois points à connaître avant de commencer

- **La session R doit être en UTF-8.** Sinon R ne lit qu'une ligne de chaque fichier Statbel, avec un simple avertissement, et le script échoue plus loin. Le contrôle : \`dim(immo_raw)\` doit afficher 286 120 lignes. Sous Windows, utilise R 4.2 ou plus récent.
- **La fusion de Bastogne et Bertogne a pris effet le 2 décembre 2024**, et non le 1er.
- **L'effet sur les écoles électrifiées est fragile** (questions 3.5 et 3.8) : il vient d'une baisse dans le groupe de comparaison, et il n'est plus significatif avec des erreurs-types groupées.

L'énoncé précise que l'usage d'outils d'intelligence artificielle n'est pas autorisé pour le travail remis et qu'un examen oral suit la remise : ce document sert à comprendre et à vérifier, et ce que tu remets reste ta décision.
`;

function figuresEnBase64() {
  const out = {};
  FIGURES.forEach(([, , fichiers]) => fichiers.forEach((f) => {
    const p = path.join(dossierFigures, f + '.png');
    if (!fs.existsSync(p)) throw new Error('figure absente : ' + p);
    // Réduction à 1400 px de large : net à l'impression, et un PDF trois fois plus léger.
    const reduit = execFileSync('python3', ['-c', 'import sys,io\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("RGB")\nw=1400\nim=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)\nb=io.BytesIO(); im.save(b,"PNG",optimize=True); sys.stdout.buffer.write(b.getvalue())', p], { maxBuffer: 64 * 1024 * 1024 });
    out[f] = 'data:image/png;base64,' + reduit.toString('base64');
  }));
  return out;
}

async function composer(page, images, pages) {
  await page.evaluate(({ FIGURES, CSS, POLICES, AVANT, images, pages }) => {
    const A = window.A, M = A.modele, h = A.h, md = A.md;
    const html = (source) => { const d = document.createElement('div'); d.innerHTML = md(source); return d; };
    const bloc = (classe, etiquette, source) => { const d = h('div', { class: classe }); if (etiquette) d.append(h('div', { class: 'etiquette', text: etiquette })); d.append(html(source)); return d; };
    const rubrique = (t) => h('div', { class: 'rubrique', text: t });
    const figure = (fichiers, legende) => {
      const f = h('figure'), im = h('div', { class: 'images' + (fichiers.length > 1 ? ' deux' : '') });
      fichiers.forEach((x) => im.append(h('img', { src: images[x], alt: legende })));
      f.append(im, h('figcaption', { text: legende + ' Fichier' + (fichiers.length > 1 ? 's' : '') + ' : ' + fichiers.map((x) => x + '.png').join(', ') + '.' }));
      return f;
    };
    const figuresDe = (qid, sid) => FIGURES.filter((f) => f[0] === qid && f[1] === sid).map((f) => figure(f[2], f[3]));

    document.head.append(h('style', { text: POLICES + CSS }));
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.textContent = '';
    const doc = h('main', { class: 'doc' });
    document.body.append(doc);

    // --- Couverture
    doc.append(h('section', { class: 'couverture' },
      h('div', { class: 'cours', text: 'ECGEB352 Économétrie · Travail de groupe 2026-2027' }),
      h('h1', { text: 'Résolution commentée du travail' }),
      h('p', { class: 'sous', text: 'Les 41 questions de l’énoncé : la réponse, le raisonnement expliqué depuis zéro, les résultats, le code R et une rédaction possible.' }),
      h('div', { class: 'trois' },
        h('div', null, h('b', { text: '1. Communes belges' }), h('span', { text: 'Revenus et prix des maisons. Régression, logarithmes, indicatrices, interactions.' })),
        h('div', null, h('b', { text: '2. Mères américaines' }), h('span', { text: 'Enfants et travail. Variables instrumentales, 2SLS, tests de validité.' })),
        h('div', null, h('b', { text: '3. Localités burkinabè' }), h('span', { text: 'Électrification. Double différence, effets fixes, erreurs-types groupées.' }))),
      h('div', { class: 'date', text: 'Novembre 2026 · accompagne le script travail_ecgeb352.R' })));

    // --- Avant de commencer
    const avant = h('section', { class: 'page' }, h('h1', { class: 'titre-page', text: 'Avant de commencer' }));
    avant.append(html(AVANT)); doc.append(avant);

    // --- Sommaire
    const som = h('section', { class: 'page sommaire' }, h('h1', { class: 'titre-page', text: 'Sommaire' }));
    const ligne = (n, titre, cible) => h('a', { class: 'ligne', href: '#' + cible }, h('span', { class: 'n', text: n }), h('span', { text: titre }), h('span', { class: 'points' }), h('span', { class: 'pg', text: pages && pages[cible] ? String(pages[cible]) : '' }));
    M.parties.forEach((p) => {
      som.append(h('h2', null, h('a', { href: '#' + p.id, text: 'Partie ' + p.num + ' — ' + p.titre })));
      p.questions.forEach((id) => som.append(ligne(id, M.questions[id].titre, M.questions[id].route)));
    });
    som.append(h('h2', { text: 'Annexes' }), ligne('A', 'Valeurs de contrôle', 'annexe-a'), ligne('B', 'Glossaire', 'annexe-b'));
    doc.append(som);

    // --- Les trois parties
    M.parties.forEach((p) => {
      doc.append(h('header', { class: 'partie-titre', id: p.id }, h('div', { class: 'num', text: 'Partie ' + p.num }), h('h1', { text: p.titre }), h('div', { class: 'sous', text: p.sousTitre })));
      if (p.intro) doc.append(html(p.intro));
      let sectionCourante = '';
      p.questions.forEach((id) => {
        const q = M.questions[id], sec = p.sections.find((x) => x.id === q.section);
        if (sec && sec.id !== sectionCourante) { sectionCourante = sec.id; doc.append(h('h2', { class: 'section-titre', text: sec.id + '. ' + sec.titre })); }
        const bq = h('section', { class: 'q', id: q.route });
        bq.append(h('div', { class: 'q-entete' }, h('span', { class: 'n', text: q.id }), h('h2', { text: q.titre })));
        if (q.enonce) bq.append(bloc('enonce', 'Énoncé', q.enonce));
        if (q.intro) bq.append(html(q.intro));
        figuresDe(q.id, '*').forEach((f) => bq.append(f));
        q.sous.forEach((s) => {
          const plusieurs = q.sous.length > 1 || s.id;
          if (plusieurs) bq.append(h('h3', { class: 'sous-titre', id: q.route + (s.id ? '-' + s.id : '') }, s.id ? h('span', { class: 'l', text: '(' + s.id + ')' }) : null, s.titre));
          if (s.enonce) bq.append(bloc('enonce', 'Énoncé' + (s.id ? ' (' + s.id + ')' : ''), s.enonce));
          if (s.court) bq.append(bloc('reponse', 'Réponse', s.court));
          if (s.zero) { bq.append(rubrique('Explication')); bq.append(html(s.zero)); }
          figuresDe(q.id, s.id || '').forEach((f) => bq.append(f));
          if (s.res) { bq.append(rubrique('Résultats')); bq.append(html(s.res)); }
          if (s.piege) bq.append(html(':::piege Le piège\n' + s.piege + '\n:::'));
          if (s.plus) { bq.append(rubrique('Pour aller plus loin')); bq.append(html(s.plus)); }
          if (s.code) { bq.append(rubrique('Code R')); bq.append(html(s.code)); }
          if (s.opts && s.opts.length) {
            bq.append(rubrique(s.opts.length > 1 ? 'Rédactions possibles pour le rapport (au choix)' : 'Rédaction possible pour le rapport'));
            s.opts.forEach((o) => { const d = h('div', { class: 'option-pdf' }, h('b', { text: o.titre || 'Formulation' })); d.append(html(o.texte)); bq.append(d); });
          }
        });
        if (q.retenir) bq.append(html(':::cle À retenir\n' + q.retenir + '\n:::'));
        if (q.oral && q.oral.length) {
          bq.append(rubrique('Questions probables à l’oral'));
          q.oral.forEach((o) => { const d = h('div', { class: 'qa' }, h('b', { html: A.inline(o.q) })); d.append(html(o.r)); bq.append(d); });
        }
        doc.append(bq);
      });
    });

    // --- Annexes
    const a1 = h('section', { class: 'page annexe-controles', id: 'annexe-a' }, h('h1', { class: 'titre-page', text: 'Annexe A — Valeurs de contrôle' }),
      h('p', { text: 'Si ton propre code retrouve ces nombres, il est juste. Un écart à la quatrième décimale n’a pas d’importance ; un écart à la première signale une erreur d’échantillon : commence par vérifier nobs(m).' }));
    const w = h('div', { class: 'widget', 'data-w': 'controles', 'data-p': '{}' }); a1.append(w); doc.append(a1);
    const a2 = h('section', { class: 'page', id: 'annexe-b' }, h('h1', { class: 'titre-page', text: 'Annexe B — Glossaire' }));
    const g = h('div', { class: 'glossaire-pdf' });
    Object.keys(M.glossaire).map((k) => M.glossaire[k]).sort((x, y) => x.terme.localeCompare(y.terme, 'fr')).forEach((t) => { const d = h('div', { class: 't' }, h('b', { text: t.terme })); d.append(html(t.def)); g.append(d); });
    a2.append(g); doc.append(a2);

    // --- Outils : montage dans leur état initial
    doc.querySelectorAll('.widget[data-w]').forEach((el) => {
      const f = A.widgets[el.dataset.w]; let prm = {};
      try { prm = JSON.parse(el.dataset.p || '{}'); } catch (e) { prm = {}; }
      if (!f || ['cartes-parties', 'reprise', 'divergences'].includes(el.dataset.w)) { el.remove(); return; }
      try { f(el, prm); } catch (e) { el.remove(); }
    });

    // --- Liens et mots du glossaire : rien d'interactif dans un PDF
    doc.querySelectorAll('button.terme').forEach((b) => { const s = h('span', { class: 'terme-pdf', text: b.textContent }); b.replaceWith(s); });
    doc.querySelectorAll('a[href^="#"]').forEach((a) => { const cible = a.getAttribute('href').slice(1); if (!document.getElementById(cible)) a.replaceWith(document.createTextNode(a.textContent)); });
  }, { FIGURES, CSS, POLICES: policesCSS(), AVANT, images, pages });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);   // le temps que les outils dessinent (simulations comprises)
}

async function imprimer(page, fichier) {
  await page.pdf({
    path: fichier, preferCSSPageSize: true, printBackground: true, scale: 0.8, outline: true, tagged: false,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7.5pt;color:#6b7687;padding:0 15mm;display:flex;justify-content:space-between"><span>ECGEB352 · Résolution commentée du travail 2026-2027</span><span class="pageNumber"></span></div>'
  });
}

(async () => {
  const images = figuresEnBase64();
  const navigateur = await chromium.launch();
  const ouvrir = async () => {
    // Largeur de mise en page = largeur utile de la page A4 (180 mm) divisée par l'échelle d'impression.
    const ctx = await navigateur.newContext({ viewport: { width: Math.round(180 / 25.4 * 96 / 0.8), height: 1200 }, colorScheme: 'light' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log('erreur JavaScript :', e.message));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());   // polices locales seulement
    await page.emulateMedia({ media: 'print' });
    await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await page.waitForFunction(() => window.A && window.A.modele && window.A.modele.ordre.length > 0);
    return { ctx, page };
  };

  // Passe 1 : sans numéros de page.
  let { ctx, page } = await ouvrir();
  await composer(page, images, null);
  const brouillon = sortie.replace(/\.pdf$/, '.passe1.pdf');
  await imprimer(page, brouillon);
  await ctx.close();
  // Les ancres du sommaire sont des destinations nommées du PDF : on lit la page de chacune.
  const pages = JSON.parse(execFileSync('python3', ['-c', 'import sys,json\nfrom pypdf import PdfReader\nr=PdfReader(sys.argv[1])\nd={}\nfor nom,dest in r.named_destinations.items():\n    try: d[nom.lstrip("/")]=r.get_destination_page_number(dest)+1\n    except Exception: pass\nprint(json.dumps(d))', brouillon]).toString());
  fs.unlinkSync(brouillon);
  if (!pages['q-1-1']) throw new Error('numéros de page introuvables (' + Object.keys(pages).length + ' destinations)');

  // Passe 2 : avec les numéros de page.
  ({ ctx, page } = await ouvrir());
  await composer(page, images, pages);
  await imprimer(page, sortie);
  await ctx.close();
  await navigateur.close();
  console.log('PDF écrit :', sortie, Math.round(fs.statSync(sortie).size / 1024) + ' ko');
})();
