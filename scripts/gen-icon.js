// Gera app/icon.png (48×48) e app/apple-icon.png (180×180) a partir de app/icon.svg
// (a arte é a mesma da Logo do site). Rodar: node scripts/gen-icon.js
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const appDir = path.join(process.cwd(), 'app');
const svg = fs.readFileSync(path.join(appDir, 'icon.svg'));

(async () => {
  await sharp(svg).resize(48, 48).png().toFile(path.join(appDir, 'icon.png'));
  await sharp(svg).resize(180, 180).png().toFile(path.join(appDir, 'apple-icon.png'));
  console.log('ok: app/icon.png + app/apple-icon.png gerados');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
