// Test de la sauvegarde « compte » : quand la page est ouverte comme artifact claude.ai, les notes
// vont aussi dans l'espace privé du lecteur (capacités db + user). On remplace ici window.claude par
// un faux qui respecte le même contrat, et on vérifie ce que l'application lui demande.
//   node tests/compte.cjs
const path = require('path');
const { chromium } = require('playwright');

// Faux window.claude : un magasin de fiches en mémoire, avec de quoi simuler une panne ou un refus.
const FAUX = `
  window.__faux = { fiches: __FICHES__, ecritures: [], panne: 0, refus: false, chemins: [] };
  // Comme le vrai magasin, le faux livre des fiches figées en profondeur.
  const geler = function (o) { if (o && typeof o === 'object') { Object.keys(o).forEach(function (k) { geler(o[k]); }); Object.freeze(o); } return o; };
  window.claude = { use: function (nom) {
    const F = window.__faux;
    if (nom === 'user') return Promise.resolve({ id: function () { return Promise.resolve('u_test'); } });
    if (nom === 'downloads') return Promise.resolve({ save: function (r) { F.telecharge = r; return Promise.resolve({ status: 'saved' }); } });
    if (nom === 'db') return Promise.resolve({ collection: function (chemin) {
      F.chemins.push(chemin);
      return {
        get: function () { return Promise.resolve({ docs: Object.keys(F.fiches).map(function (id) { return { id: id, exists: true, data: function () { return geler(JSON.parse(JSON.stringify(F.fiches[id]))); } }; }) }); },
        doc: function (id) { return { set: function (corps) {
          if (F.refus) return Promise.reject({ code: 'invalid_argument', message: 'refus' });
          if (F.panne > 0) { F.panne--; return Promise.reject({ code: 'unavailable', message: 'panne' }); }
          F.fiches[id] = corps; F.ecritures.push(id); return Promise.resolve();
        } }; }
      };
    } });
    return Promise.resolve(null);
  } };
`;

(async () => {
  const url = 'file://' + path.join(__dirname, '..', 'index.html');
  const navigateur = await chromium.launch();
  const echecs = [];
  const verifier = (ok, quoi) => { console.log((ok ? 'ok   ' : 'ÉCHEC') + ' ' + quoi); if (!ok) echecs.push(quoi); };
  const pret = (page) => page.waitForFunction(() => window.A && window.A.modele && document.querySelector('#vue').children.length > 0);
  const ouvrir = async (fiches) => {
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => echecs.push('erreur JavaScript : ' + e.message));
    await page.addInitScript(FAUX.replace('__FICHES__', JSON.stringify(fiches)));
    await page.goto(url); await pret(page);
    await page.waitForFunction(() => window.A.store.mode() === 'compte', null, { timeout: 5000 }).catch(() => {});
    return { ctx, page };
  };
  const maitriser = async (page, route) => { await page.evaluate((r) => { location.hash = '#' + r; }, route); await page.waitForTimeout(300); await page.locator('.pied-q input[type=checkbox]').check(); };

  // 1. Premier passage : rien dans le compte. Une question maîtrisée y est écrite, une seule fois.
  let { ctx, page } = await ouvrir({});
  verifier(await page.evaluate(() => window.A.store.mode()) === 'compte', 'mode « compte » quand db et user répondent');
  verifier((await page.evaluate(() => window.__faux.chemins[0])) === 'data/users/u_test', 'les fiches sont rangées sous data/users/<identifiant du lecteur>');
  verifier((await page.locator('#sauvegarde').innerText()).length > 10, 'le pied du menu indique où sont enregistrées les notes');
  await maitriser(page, 'q-1-1');
  await page.waitForTimeout(1800);
  let f = await page.evaluate(() => window.__faux);
  verifier(f.ecritures.join(',') === 'q-1-1' && f.fiches['q-1-1'].fait === true, 'une question maîtrisée : une écriture, dans la fiche q-1-1');
  await ctx.close();

  // 2. Retour sur un autre appareil : le compte contient déjà une fiche, le navigateur est vide.
  ({ ctx, page } = await ouvrir({ 'q-2-8': { t: Date.now(), fait: true, s: { a: { opt: '', txt: 'mon texte', ok: true } }, quiz: {} }, sonde: { n: 1 }, 'q-2-9': { t: 5 } }));
  verifier((await page.evaluate(() => Object.keys(window.A.store.etat.q).sort().join(','))) === '2.8,2.9', 'une fiche inattendue est ignorée, une fiche incomplète est remise en forme');
  verifier((await page.locator('#progression').innerText()).includes('1 / 41'), 'la progression vient du compte (1 / 41)');
  await page.evaluate(() => { location.hash = '#q-2-8'; }); await page.waitForTimeout(350);
  verifier((await page.locator('.maversion textarea').first().inputValue()) === 'mon texte', 'le texte rédigé ailleurs est rechargé');
  verifier((await page.evaluate(() => window.__faux.ecritures.length)) === 0, 'aucune écriture tant que rien ne change');
  await page.locator('.maversion textarea').first().fill('mon texte, complété');
  await page.waitForTimeout(1900);
  f = await page.evaluate(() => window.__faux);
  verifier(f.ecritures.includes('q-2-8') && f.fiches['q-2-8'].s.a.txt === 'mon texte, complété', 'une fiche venue du compte reste modifiable, et la modification y retourne');

  // 3. Panne passagère : un nouvel essai, un seul, et la fiche finit par arriver.
  await page.evaluate(() => { window.__faux.panne = 1; });
  await maitriser(page, 'q-1-2');
  await page.waitForTimeout(5200);
  f = await page.evaluate(() => window.__faux);
  verifier(f.ecritures.includes('q-1-2') && f.panne === 0, 'après une panne passagère, la fiche est réécrite');
  verifier(await page.evaluate(() => window.A.store.mode()) === 'compte', 'la panne passagère ne fait pas quitter le mode « compte »');

  // 4. Écriture refusée (lecteur en lecture seule) : repli silencieux sur le navigateur, rien n'est perdu.
  await page.evaluate(() => { window.__faux.refus = true; });
  await maitriser(page, 'q-1-3');
  await page.waitForTimeout(1800);
  verifier(await page.evaluate(() => window.A.store.mode()) === 'local', 'écriture refusée : repli sur le navigateur');
  verifier((await page.locator('#progression').innerText()).includes('3 / 41'), 'la progression reste juste après le repli (3 / 41)');

  // 5. Téléchargement de l'export par la capacité « downloads ».
  await page.evaluate(() => { location.hash = '#choix'; }); await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Télécharger (.md)' }).click();
  await page.waitForTimeout(200);
  const t = await page.evaluate(() => window.__faux.telecharge);
  verifier(t && t.filename === 'mon-rapport-ecgeb352.md' && typeof t.data === 'string' && t.data.includes('mon texte'), 'export : le fichier .md est proposé avec le texte rédigé');
  await ctx.close();

  await navigateur.close();
  console.log(echecs.length ? echecs.length + ' échec(s) : ' + echecs.join(' ; ') : 'OK : sauvegarde « compte »');
  process.exit(echecs.length ? 1 : 0);
})();
