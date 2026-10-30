// Gera imagens de teste para o upload (não faz parte do site)
const sharp = require('sharp');
const fs = require('fs');

const svg = (w, h, c1, c2, label) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
       <rect width="${w}" height="${h}" fill="${c1}"/>
       <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 4}" fill="${c2}"/>
       <text x="${w / 2}" y="${h / 2 + 8}" font-family="sans-serif" font-size="28" fill="#fff" text-anchor="middle">${label}</text>
     </svg>`
  );

(async () => {
  await sharp(svg(800, 600, '#7c5cff', '#00e0ff', 'TESTE AVATAR')).png().toFile('test-avatar.png');
  await sharp(svg(1200, 800, '#ff6ec7', '#ffb86c', 'TESTE GALERIA')).jpeg({ quality: 90 }).toFile('test-foto.jpg');
  fs.writeFileSync('test-fake.txt', 'isto não é uma imagem');
  console.log('Arquivos de teste criados: test-avatar.png, test-foto.jpg, test-fake.txt');
})();
