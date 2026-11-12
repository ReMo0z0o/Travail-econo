#!/usr/bin/env node
// Assemble src/ en un seul fichier HTML autonome (aucune dépendance, aucun serveur).
//   node build.mjs            -> index.html (à ouvrir d'un double-clic)
//   node build.mjs --artifact -> dist/artifact.html en plus (fragment pour claude.ai)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.dirname(fileURLToPath(import.meta.url));
const lire = (p) => fs.readFileSync(path.join(racine, 'src', p), 'utf8');

const JS = ['core.js', 'md.js', 'contenu.js', 'store.js', 'stats.js', 'charts.js',
  'widgets-bases.js', 'widgets-p1.js', 'widgets-p2.js', 'widgets-p3.js', 'app.js'];
const CONTENU = ['accueil', 'bases', 'p1', 'p2', 'p3', 'comparatif', 'atelier', 'glossaire'];
const DONNEES = ['communes', 'fert', 'elec'];

// Un littéral JSON placé dans <script> ne doit jamais contenir "</script" ni U+2028/2029.
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029), BS = String.fromCharCode(92);
const sur = (s) => s.replace(/<\/(script)/gi, '<' + BS + '/$1').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');

// Une partie peut être répartie sur plusieurs fichiers (p1a.md, p1b.md…), concaténés dans l'ordre.
const contenu = {};
const fichiers = fs.readdirSync(path.join(racine, 'src', 'content')).sort();
for (const n of CONTENU) {
  const morceaux = fichiers.filter((f) => f === `${n}.md` || (/^p\d$/.test(n) && new RegExp(`^${n}[a-z]\\.md$`).test(f)));
  if (!morceaux.length) throw new Error(`Contenu manquant : ${n}`);
  contenu[n] = morceaux.map((f) => lire(`content/${f}`)).join('\n');
}
const donnees = {};
for (const n of DONNEES) donnees[n] = JSON.parse(lire(`data/${n}.json`));

const TITRE = 'Atelier ECGEB352';
const POLICES = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400&family=Space+Grotesk:wght@500;600;700&display=swap">';

const tete = [
  `<title>${TITRE}</title>`,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  POLICES,
  `<style>\n${lire('css/app.css')}\n</style>`,
].join('\n');

const scripts = [
  `<script>\nwindow.__CONTENU = ${sur(JSON.stringify(contenu))};\nwindow.__DONNEES = ${sur(JSON.stringify(donnees))};\n</script>`,
  ...JS.map((f) => `<script>\n// ---- ${f} ----\n${sur(lire(`js/${f}`))}\n</script>`),
].join('\n');

const corps = `${lire('shell.html')}\n${scripts}`;

// 1) Page autonome : document complet.
const RESET = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
const autonome = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>${RESET}</style>
${tete}
</head>
<body>
${corps}
</body>
</html>
`;
fs.writeFileSync(path.join(racine, 'index.html'), autonome);

// 2) Fragment pour un artifact claude.ai (le squelette est ajouté à la publication).
if (process.argv.includes('--artifact')) {
  fs.mkdirSync(path.join(racine, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(racine, 'dist', 'artifact.html'), `${tete}\n${corps}\n`);
}

const ko = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} ko`;
console.log(`index.html : ${ko(autonome)}${process.argv.includes('--artifact') ? ' (+ dist/artifact.html)' : ''}`);
