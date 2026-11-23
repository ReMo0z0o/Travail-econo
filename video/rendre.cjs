// Rend video/partie3.html image par image puis assemble la vidéo avec ffmpeg.
//   node video/rendre.cjs <sortie.mp4> [images/s] [secondes à capturer seulement, ex. 12,40,95]
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const { chromium } = require('playwright');
(async () => {
  const [, , sortie, fpsArg, essais] = process.argv;
  const fps = +(fpsArg || 24);
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto('file://' + path.join(__dirname, 'partie3.html'));
  await page.evaluate(() => document.fonts.ready);
  const duree = await page.evaluate(() => window.DUREE);
  console.log('durée', duree.toFixed(1), 's');
  if (essais) { for (const t of essais.split(',')) { await page.evaluate((t) => window.render(t), +t); await page.screenshot({ path: sortie.replace(/\.mp4$/, '') + '-' + t + '.png' }); } await b.close(); return; }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', sortie], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.ceil(duree * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.render(t), i / fps);
    const img = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (fps * 30) === 0) console.log('image', i, '/', n);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await b.close();
  console.log('vidéo :', sortie, Math.round(fs.statSync(sortie).size / 1048576) + ' Mo');
})();
