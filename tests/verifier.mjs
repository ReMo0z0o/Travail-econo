// Vérifie que les calculs JavaScript de l'atelier redonnent les résultats de R
// (src/data/ref.json et les valeurs de référence enregistrées avec les données).
//   node tests/verifier.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = (n) => JSON.parse(fs.readFileSync(path.join(racine, 'src/data', n + '.json'), 'utf8'));
const ctx = { window: { __DONNEES: {}, __CONTENU: {} }, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);
for (const f of ['core.js', 'stats.js']) vm.runInContext(fs.readFileSync(path.join(racine, 'src/js', f), 'utf8').replace(/window\.A/g, 'window.A'), ctx, { filename: f });
const S = ctx.window.A.stats;

let echecs = 0, total = 0;
function proche(nom, obtenu, attendu, tol = 1e-6) {
  total++;
  const ok = Math.abs(obtenu - attendu) <= tol * Math.max(1, Math.abs(attendu));
  if (!ok) { echecs++; console.log(`ÉCHEC  ${nom} : obtenu ${obtenu}, attendu ${attendu}`); }
}

// ------------------------------------------------------------------ partie 1
const C = json('communes'), ref = json('ref').p1;
const col = (n) => C.lignes.map((l) => l[C.colonnes.indexOf(n)]);
const prix = col('prix'), rev = col('rev_hab'), region = col('region'), ventes = col('n_ventes'), napp = col('n_app'), pop = col('pop');
const n = prix.length;
proche('n communes', n, 551, 0);
const lprix = prix.map(Math.log), lrev = rev.map(Math.log);
const W = region.map((r) => +(r === 'W')), B = region.map((r) => +(r === 'B'));
const lig = (...cols) => Array.from({ length: n }, (_, i) => cols.map((c) => (typeof c === 'number' ? c : c[i])));

const nn = S.mco(lig(1, rev.map((r) => r / 1000)), prix.map((p) => p / 1000));
proche('niveau-niveau pente', nn.b[1], ref.nn.rev_k.b); proche('niveau-niveau se HC1', nn.seHC1[1], ref.nn.rev_k.se); proche('niveau-niveau R2', nn.r2, ref.nn.r2);
const ll = S.mco(lig(1, lrev), lprix);
proche('log-log pente', ll.b[1], ref.ll.lrev.b); proche('log-log se HC1', ll.seHC1[1], ref.ll.lrev.se); proche('log-log const', ll.b[0], ref.ll['(Intercept)'].b);
proche('log-log se classique', ll.se[1], ref.se_classique.ll); proche('log-log R2', ll.r2, ref.ll.r2);
const ln = S.mco(lig(1, rev.map((r) => r / 1000)), lprix);
proche('log-niveau pente', ln.b[1], ref.ln.rev_k.b); proche('log-niveau se', ln.seHC1[1], ref.ln.rev_k.se);
const nl = S.mco(lig(1, lrev), prix.map((p) => p / 1000));
proche('niveau-log pente', nl.b[1], ref.nl.lrev.b); proche('niveau-log se', nl.seHC1[1], ref.nl.lrev.se);

const m9 = S.mco(lig(1, lrev, W, B), lprix);
proche('1.9 élasticité', m9.b[1], ref.m9.lrev.b); proche('1.9 se', m9.seHC1[1], ref.m9.lrev.se);
proche('1.9 Wallonie', m9.b[2], ref.m9.regionWallonie.b); proche('1.9 se Wallonie', m9.seHC1[2], ref.m9.regionWallonie.se);
proche('1.9 Bruxelles', m9.b[3], ref.m9.regionBruxelles.b); proche('1.9 R2', m9.r2, ref.m9.r2);
proche('1.9 se classique', m9.se[1], ref.se_classique.m9);

const m13 = S.mco(lig(1, lrev, W, B, lrev.map((x, i) => x * W[i]), lrev.map((x, i) => x * B[i])), lprix);
proche('1.13 pente Flandre', m13.b[1], ref.m13.lrev.b); proche('1.13 interaction W', m13.b[4], ref.m13['lrev:regionWallonie'].b);
proche('1.13 se interaction W', m13.seHC1[4], ref.m13['lrev:regionWallonie'].se);
proche('1.13 se élasticité wallonne', S.seCombinaison(m13.V, [0, 1, 0, 0, 1, 0]), 0.108892568806631);
proche('1.13 se élasticité bruxelloise', S.seCombinaison(m13.V, [0, 1, 0, 0, 0, 1]), 0.137978237755146);

const part = napp.map((a, i) => (a || 0) / ((a || 0) + ventes[i]));
const m15 = S.mco(lig(1, lrev, W, B, pop.map(Math.log), part), lprix);
proche('1.15 élasticité', m15.b[1], ref.m15.lrev.b); proche('1.15 part_app', m15.b[5], ref.m15.part_app.b); proche('1.15 se part_app', m15.seHC1[5], ref.m15.part_app.se);

proche('BP 1.6 régresseurs', S.breuschPagan(ll.resid, lig(1, lrev)).stat, ref.bp.ll_reg);
proche('BP 1.6 ventes', S.breuschPagan(ll.resid, lig(1, ventes.map(Math.log))).stat, ref.bp.ll_ventes);
proche('BP 1.9 régresseurs', S.breuschPagan(m9.resid, lig(1, lrev, W, B)).stat, ref.bp.m9_reg);
// tolérance élargie : le revenu est arrondi au centime dans communes.json
proche('BP 1.9 ventes', S.breuschPagan(m9.resid, lig(1, ventes.map(Math.log))).stat, ref.bp.m9_ventes, 1e-4);
proche('asymétrie prix', S.asymetrie(prix), 1.33792312442603); proche('asymétrie ln(rev)', S.asymetrie(lrev), -0.594009963338558);
proche('p khi2(1) de 82,6', 1 - S.khi2CDF(82.6183758718757, 1), 9.95274864896775e-20, 1e-3);
proche('p khi2(3) de 9,26', 1 - S.khi2CDF(9.2605152695433, 3), 0.0260204135329485, 1e-5);
proche('p khi2(1) de Sargan', 1 - S.khi2CDF(3.85576139436372, 1), 0.049575420688355, 1e-5);
proche('p bilatérale t=2,594', S.pBilaterale(2.59405128893538), 0.00949, 2e-2);

// ------------------------------------------------------------------ partie 2
const F = json('fert');
let N = 0, sw = 0;
const parZ = { 0: { n: 0, sw: 0, d: 0 }, 1: { n: 0, sw: 0, d: 0 } }, parD = { 0: { n: 0, sw: 0 }, 1: { n: 0, sw: 0 } };
F.cellules.forEach((c) => { const z = +(c.g1 === c.g2); N += c.n; sw += c.sw; parZ[z].n += c.n; parZ[z].sw += c.sw; parZ[z].d += c.mk * c.n; parD[c.mk].n += c.n; parD[c.mk].sw += c.sw; });
proche('n mères', N, 254654, 0);
proche('MCO 2.2', parD[1].sw / parD[1].n - parD[0].sw / parD[0].n, F.ref.mco22.mk.b);
const pe = parZ[1].d / parZ[1].n - parZ[0].d / parZ[0].n, fr = parZ[1].sw / parZ[1].n - parZ[0].sw / parZ[0].n;
proche('première étape 2.4', pe, F.ref.fs24.samegender.b); proche('forme réduite 2.6', fr, F.ref.rf26.samegender.b);
proche('Wald 2.6', fr / pe, F.est.find((e) => e.id === 'vi26').b);

// ------------------------------------------------------------------ partie 3
const E = json('elec');
const X = [], y = [], g = [];
E.loc.forEach(([an, , nl], id) => {
  const traite = an === 2008 || an === 2009, temoin = an >= 2015 && an <= 2017;
  if (!traite && !temoin) return;
  E.annees.forEach((a, j) => {
    if (a === 2008 || a === 2009 || nl[j] === '-') return;
    const t = +traite, p = +(a > 2009);
    X.push([1, t, p, t * p]); y.push(+nl[j]); g.push(id);
  });
});
const did = S.mco(X, y, { groupes: g });
proche('3.4 n', did.n, 2866, 0); proche('3.4 DiD', did.b[3], E.ref.m34['treated:post'].b); proche('3.4 se HC1', did.seHC1[3], E.ref.m34['treated:post'].se);
proche('3.8 se groupée', did.seCL[3], E.ref.cl34); proche('3.8 nombre de groupes', did.G, 288, 0);

console.log(echecs ? `\n${echecs} échec(s) sur ${total} vérifications` : `OK : ${total} vérifications JavaScript = R`);
process.exit(echecs ? 1 : 0);
