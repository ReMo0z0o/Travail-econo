// Voix off de la vidéo : synthétise chaque phrase des sous-titres avec espeak-ng + MBROLA (voix
// française fr4), écrit video/durees.json (durée de chaque phrase) et la piste audio complète.
//   node video/voix.cjs <dossier de travail> <piste.wav>
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

// Ce qu'on lit n'est pas toujours ce qu'on écrit : quelques corrections de prononciation.
function aDire(html) {
  let t = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  const R = [
    [/nl_extensive/g, 'N L extensive'], [/treated × post/g, 'traité fois poste'], [/\btreated\b/g, 'traité'], [/\bpost\b/g, 'poste'],
    [/(\d) (\d{3})\b/g, '$1$2'], [/ = (\d{4}) à /g, ' : de $1 à '], [/^…\s*/, ''],
    [/(\d{4})-(\d{4})/g, '$1 à $2'], [/(\d+) × (\d+)/g, '$1 fois $2'], [/−/g, 'moins '], [/ = /g, ' égale '],
    [/\+(\d)/g, 'plus $1'], [/(\d),(\d)\s*%/g, '$1 virgule $2 pour cent'], [/(\d)\s*%/g, '$1 pour cent'],
    [/\bpts?\b/g, 'points'], [/p-valeur/g, 'p valeur'], [/erreurs-types/g, 'erreurs types'], [/erreur-type/g, 'erreur type'],
    [/…/g, '.'], [/«|»/g, ''], [/’/g, "'"], [/\b1\. /g, 'Un. '], [/\b2\. /g, 'Deux. '], [/\b3\. /g, 'Trois. '], [/\b4\. /g, 'Quatre. '], [/\b5\. /g, 'Cinq. ']
  ];
  R.forEach(([a, b]) => { t = t.replace(a, b); });
  return t;
}

(async () => {
  const [, , dossier, piste] = process.argv;
  fs.mkdirSync(dossier, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage();
  await page.goto('file://' + path.join(__dirname, 'partie3.html'));
  const caps = await page.evaluate(() => window.CAPS);
  const durees = [], fichiers = [];
  caps.forEach((scene, i) => {
    durees.push([]); fichiers.push([]);
    scene.forEach((c, j) => {
      const wav = path.join(dossier, `s${String(i).padStart(2, '0')}_${j}.wav`);
      execFileSync('espeak-ng', ['-v', 'mb-fr4', '-s', '148', '-p', '50', '-w', wav, aDire(c)]);
      const d = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString();
      durees[i].push(+(d + 0.9).toFixed(2)); fichiers[i].push(wav);   // 0,9 s de respiration après chaque phrase
    });
  });
  fs.writeFileSync(path.join(__dirname, 'durees.json'), JSON.stringify(durees));
  // Instants de début de chaque phrase, recalculés par la page avec ces durées.
  await page.addInitScript((d) => { window.DUREES = d; }, durees);
  await page.reload();
  const debuts = await page.evaluate(() => window.DEBUTS), total = await page.evaluate(() => window.DUREE);
  await b.close();
  // Piste audio : chaque phrase posée à son instant, sur un fond de silence.
  const entrees = [], filtres = [];
  fichiers.flat().forEach((f, k) => { entrees.push('-i', f); });
  const plats = debuts.flat();
  plats.forEach((t, k) => filtres.push(`[${k}:a]aresample=48000,adelay=${Math.round(t * 1000)}:all=1[a${k}]`));
  const graphe = filtres.join(';') + ';' + plats.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${plats.length}:normalize=0,apad=whole_dur=${total.toFixed(2)},atrim=0:${total.toFixed(2)},loudnorm=I=-16:TP=-1.5[s]`;
  fs.writeFileSync(path.join(dossier, 'graphe.txt'), graphe);
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...entrees, '-filter_complex_script', path.join(dossier, 'graphe.txt'), '-map', '[s]', '-ac', '1', '-ar', '48000', piste], { maxBuffer: 1 << 26 });
  console.log('phrases', plats.length, 'durée', total.toFixed(1), 's ->', piste);
})();
