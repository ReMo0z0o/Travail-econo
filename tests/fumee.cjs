// Test de fumée : ouvre index.html dans Chromium, visite toutes les pages et vérifie
// qu'il n'y a ni erreur JavaScript, ni outil en panne, ni défilement horizontal.
//   node tests/fumee.cjs [dossier_captures]
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const captures = process.argv[2] || null;
  const url = 'file://' + path.join(__dirname, '..', 'index.html');
  const navigateur = await chromium.launch();
  let echecs = 0;
  for (const [nom, largeur, hauteur, sombre] of [['bureau', 1280, 900, false], ['telephone', 400, 800, true]]) {
    const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, colorScheme: sombre ? 'dark' : 'light', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) erreurs.push('console: ' + m.text()); });
    await page.goto(url);
    await page.waitForFunction(() => window.A && window.A.modele && document.querySelector('#vue').children.length > 0);
    const routes = await page.evaluate(() => ['accueil', 'bases', 'comparatif', 'choix', 'atelier', 'oral', 'glossaire']
      .concat(window.A.modele.lecons.map((l) => l.route), window.A.modele.parties.map((p) => p.id), window.A.modele.ordre.map((id) => 'q-' + id.replace('.', '-'))));
    for (const r of routes) {
      await page.evaluate((x) => { location.hash = '#' + x; }, r);
      await page.waitForTimeout(r === 'accueil' || /^(b-|q-)/.test(r) ? 140 : 60);
      const etat = await page.evaluate(() => ({
        vide: document.querySelector('#vue').innerText.trim().length < 20,
        panne: Array.from(document.querySelectorAll('.widget')).filter((w) => /indisponible|n’a pas pu démarrer/.test(w.innerText)).map((w) => w.dataset.w + ' : ' + w.innerText.slice(0, 120)),
        nonMontes: Array.from(document.querySelectorAll('.widget[data-w]')).filter((w) => !w.children.length).map((w) => w.dataset.w),
        deborde: document.documentElement.scrollWidth - window.innerWidth,
        brut: (document.querySelector('#vue').innerText.match(/\{\{w:|:::|\[\[|\$\$|\\frac|\\hat/g) || []).slice(0, 3)
      }));
      const pb = [];
      if (etat.vide) pb.push('page vide');
      if (etat.panne.length) pb.push('outil en panne : ' + etat.panne.join(' | '));
      if (etat.nonMontes.length) pb.push('outil non monté : ' + etat.nonMontes.join(', '));
      if (etat.deborde > 1) pb.push('défilement horizontal de ' + etat.deborde + ' px');
      if (etat.brut.length) pb.push('balisage non interprété : ' + etat.brut.join(' '));
      if (pb.length) { echecs++; console.log(`[${nom}] #${r} -> ${pb.join(' ; ')}`); }
      if (captures && process.argv.slice(3).includes(r)) await page.screenshot({ path: path.join(captures, `${nom}-${r}.png`), fullPage: true });
    }
    if (erreurs.length) { echecs += erreurs.length; console.log(`[${nom}] erreurs JavaScript :\n  ` + Array.from(new Set(erreurs)).slice(0, 12).join('\n  ')); }
    console.log(`[${nom}] ${routes.length} pages visitées`);
    await ctx.close();
  }
  await navigateur.close();
  console.log(echecs ? `${echecs} problème(s)` : 'OK : aucune erreur');
  process.exit(echecs ? 1 : 0);
})();
