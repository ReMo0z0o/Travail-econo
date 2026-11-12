// Test de parcours : fait dans Chromium ce que fera une personne qui utilise l'atelier,
// et vérifie que chaque geste produit l'effet attendu (choix, rédaction, progression,
// export, recherche, glossaire, quiz, sauvegarde après rechargement, menu sur téléphone).
//   node tests/parcours.cjs
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const url = 'file://' + path.join(__dirname, '..', 'index.html');
  const navigateur = await chromium.launch();
  const echecs = [];
  const verifier = (ok, quoi) => { console.log((ok ? 'ok   ' : 'ÉCHEC') + ' ' + quoi); if (!ok) echecs.push(quoi); };

  const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  const aller = async (route) => { await page.evaluate((r) => { location.hash = '#' + r; }, route); await page.waitForTimeout(350); };

  await page.goto(url);
  await page.waitForFunction(() => window.A && window.A.modele && document.querySelector('#vue').children.length > 0);
  verifier((await page.locator('#progression').innerText()).includes('0 / 41'), 'progression de départ : 0 / 41');

  // 1. Choisir un raisonnement, partir de son texte, cocher « je sais l'expliquer ».
  await aller('q-3-9-c');
  const version = page.locator('.maversion').last();
  await version.locator('input[type=radio]').nth(2).check();
  await version.getByRole('button', { name: 'Partir du texte coché' }).click();
  const texte = await version.locator('textarea').inputValue();
  verifier(texte.startsWith('Sous l’hypothèse de tendances parallèles') || texte.startsWith("Sous l'hypothèse de tendances parallèles"), 'le texte du raisonnement choisi est recopié dans la zone de rédaction');
  await version.locator('textarea').fill(texte + ' (ma version)');
  await version.getByLabel('Je sais l’expliquer sans notes').check();

  // 2. Marquer la question comme maîtrisée : la progression avance.
  await page.locator('.pied-q input[type=checkbox]').check();
  await page.waitForTimeout(200);
  verifier((await page.locator('#progression').innerText()).includes('1 / 41'), 'progression après une question maîtrisée : 1 / 41');

  // 3. Répondre à un quiz : la bonne réponse est reconnue et expliquée.
  const quiz = page.locator('.quiz-q').first();
  await quiz.locator('.quiz-choix button').filter({ hasText: 'Parce que le réseau produit de la lumière par lui-même' }).click();
  await page.waitForTimeout(150);
  verifier((await quiz.innerText()).includes('éclairage public suffit'), 'quiz : explication affichée après la réponse');

  // 4. Le choix apparaît sur la page de comparaison et dans « Mon rapport ».
  await aller('comparatif');
  verifier((await page.locator('#vue').innerText()).includes('Ton choix actuel'), 'comparatif : « Ton choix actuel » affiché');
  await aller('choix');
  const exportMd = await page.locator('#export-md').inputValue();
  verifier(exportMd.includes('3.9 (c)') && exportMd.includes('(ma version)'), 'Mon rapport : l’export contient la sous-question et le texte rédigé');
  verifier(exportMd.includes('raisonnement retenu : Version intermédiaire'), 'Mon rapport : l’export nomme le raisonnement retenu');

  // 5. Valeurs de contrôle de l'atelier R.
  await aller('atelier');
  await page.locator('#vue table input[type=checkbox]').first().check();
  verifier((await page.locator('#vue p.note-pied').last().innerText()).startsWith('1 valeur retrouvée sur 25'), 'atelier R : une valeur de contrôle cochée');

  // 6. Carte d'oral notée.
  await aller('oral');
  const carte = page.locator('details.oral').first();
  await carte.locator('summary').click();
  await carte.getByRole('button', { name: 'Je savais' }).click();
  verifier((await carte.getAttribute('class')).includes('su'), 'oral : carte notée « je savais »');

  // 7. Tout est encore là après rechargement.
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForFunction(() => window.A && window.A.modele && document.querySelector('#vue').children.length > 0);
  verifier((await page.locator('#progression').innerText()).includes('1 / 41'), 'après rechargement : progression conservée');
  await aller('q-3-9-c');
  verifier((await page.locator('.maversion').last().locator('textarea').inputValue()).includes('(ma version)'), 'après rechargement : texte rédigé conservé');
  await aller('atelier');
  verifier(await page.locator('#vue table input[type=checkbox]').first().isChecked(), 'après rechargement : valeur de contrôle conservée');

  // 8. Recherche.
  await page.locator('#champ-recherche').fill('placebo');
  await page.waitForTimeout(300);
  const resultats = page.locator('#recherche-resultats a');
  verifier(await resultats.count() > 0, 'recherche « placebo » : des résultats');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
  verifier(/^#(q-3-6|glossaire|b-did)/.test(await page.evaluate(() => location.hash)), 'recherche : Entrée ouvre le premier résultat');

  // 9. Glossaire : un mot souligné ouvre sa définition.
  await aller('q-3-6');
  const terme = page.locator('#vue button.terme').first();
  await terme.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);   // la définition se referme quand la page défile : on attend la fin du défilement
  await terme.click();
  await page.waitForTimeout(150);
  verifier(await page.locator('#glose').isVisible() && (await page.locator('#glose').innerText()).length > 30, 'glossaire : la définition s’ouvre au clic');
  await page.keyboard.press('Escape');

  // 10. Un outil interactif réagit : changer le groupe de comparaison change le résultat.
  await aller('p3');
  const outil = page.locator('.widget[data-w="did"]').first();
  const avant = await outil.innerText();
  await outil.locator('label').filter({ hasText: 'Électrifiées en 2010-2014' }).click();
  await page.waitForTimeout(300);
  const apres = await outil.innerText();
  verifier(avant !== apres && apres.includes('20,7'), 'outil double différence : +20,7 points avec le mauvais groupe de comparaison');

  verifier(erreurs.length === 0, 'aucune erreur JavaScript' + (erreurs.length ? ' : ' + erreurs.join(' | ') : ''));
  await ctx.close();

  // 11. Sur téléphone : le menu s'ouvre et se referme, et un lien du menu change de page.
  const tel = await navigateur.newContext({ viewport: { width: 390, height: 800 }, colorScheme: 'dark' });
  const p2 = await tel.newPage();
  await p2.goto(url);
  await p2.waitForFunction(() => window.A && window.A.modele && document.querySelector('#vue').children.length > 0);
  await p2.locator('#bouton-menu').click();
  await p2.waitForTimeout(250);
  verifier(await p2.locator('#nav').evaluate((n) => n.classList.contains('ouvert')), 'téléphone : le menu s’ouvre');
  await p2.locator('#nav a', { hasText: 'Atelier R' }).click();
  await p2.waitForTimeout(350);
  verifier((await p2.evaluate(() => location.hash)) === '#atelier' && !(await p2.locator('#nav').evaluate((n) => n.classList.contains('ouvert'))), 'téléphone : le lien ouvre la page et referme le menu');
  await tel.close();

  await navigateur.close();
  console.log(echecs.length ? echecs.length + ' échec(s)' : 'OK : parcours complet');
  process.exit(echecs.length ? 1 : 0);
})();
