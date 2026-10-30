// Gera uma imagem de teste no temp dir para o teste de recorte no navegador.
const sharp = require('sharp');
const path = require('path');

(async () => {
  const out = path.join(process.env.TEMP || 'C:/Users/User/AppData/Local/Temp/opencode', 'crop-test-photo.png');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
    <rect width="900" height="600" fill="#2b1e5c"/>
    <circle cx="450" cy="300" r="200" fill="#ff6ec7"/>
    <rect x="80" y="80" width="240" height="160" rx="20" fill="#00e0ff"/>
    <text x="450" y="320" font-size="60" text-anchor="middle" fill="#fff" font-family="Arial">CSR</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(out);
})();
