// Confere as dimensões do WebP gerado pelo recorte (deve ser 512×512).
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'crop-test');
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('avatar-'));
  for (const f of files) {
    const m = await sharp(path.join(dir, f)).metadata();
    console.log(`${f} → ${m.width}x${m.height} (${m.format})`);
  }
})();
