# 🛤️ JRWay — plataforma de páginas bio (estilo Linktree) + hospedagem de fotos

Plataforma completa onde **cada usuário cria a sua própria página de links e fotos**, com
personalização de tema, cores, fonte, efeitos e botões — tudo com prévia ao vivo.

- 👥 **Multiusuário com moderação**: qualquer pessoa pode pedir conta, mas **o admin precisa aprovar** — a página pública só existe após aprovação
- 🎨 **Personalização**: 6 temas prontos + cores customizadas, 4 estilos de botão, fonte, arredondamento e efeitos de fundo
- 💅 **Tema por botão**: cada link pode ter seu próprio look — temas **Instagram, TikTok e WhatsApp** ou cor/gradiente escolhido um a um (botão 🎨 no painel)
- 🖼️ **Hospedagem de fotos**: aceita qualquer formato de imagem (JPG, PNG, GIF, AVIF, TIFF…), converte para **WebP** e guarda em um **repositório de dados no GitHub** (token fine-grained), servido pela CDN jsDelivr
- ✂️ **Editor de recorte**: antes do envio dá para **recortar, girar ⟲, dar zoom e espelhar** a imagem (estilo Instagram) — o recorte sai em WebP já enquadradíssimo
- 🔗 **https:// automático**: colou `instagram.com/seuperfil`? O https:// entra sozinho (no navegador e no servidor)
- 📊 **Estatísticas**: visitas na página e cliques por link
- 🔒 **Admin secreto** em `/acess/auth/adm` — **omitido de propósito** do `robots.txt` e do `sitemap.xml`, com `noindex` ativo
- 🚀 **Deploy grátis**: GitHub + Vercel + Neon (Postgres serverless)

---

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. **Sem configurar nada**, o site roda em *modo
demo*: dados em `.data/db.json` e uploads em `public/uploads/` (apenas na sua máquina).

## Deploy no GitHub + Vercel

1. **Suba para o GitHub**
   ```bash
   git init
   git add .
   git commit -m "feat: plataforma JRWay"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/jrway.git
   git push -u origin main
   ```
   *(crie o repositório no GitHub antes)*

2. **Crie o banco (2 minutos)**
   - Acesse [neon.tech](https://neon.tech) → crie um projeto → copie a **connection string** (`postgresql://…`).

3. **Importe no Vercel**
   - [vercel.com/new](https://vercel.com/new) → importe o repositório.
   - Em **Environment Variables**, cadastre:

   | Variável | Valor | Onde conseguir |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://…` | Neon |
   | `SESSION_SECRET` | frase aleatória longa | invente (gerador de senhas) |
   | `ADMIN_PASSWORD` | senha forte do admin | invente |
   | `NEXT_PUBLIC_BASE_URL` | `https://seu-dominio.vercel.app` | a URL do seu deploy |
   | `GITHUB_TOKEN` | token fine-grained | veja abaixo ⬇️ |
   | `GITHUB_REPO` | `SEU-USUARIO/jrway-dados` | repo criado abaixo ⬇️ |
   | `GITHUB_BRANCH` | `main` | (opcional) |

4. **Deploy**. Pronto — a plataforma já está no ar. 🎉

## 🖼️ Hospedagem de fotos (repositório de dados no GitHub)

Como funciona: o usuário envia uma imagem → o servidor converte para **WebP** (com `sharp`) →
faz upload via **GitHub Contents API** no seu repositório de dados → a imagem é servida
pela CDN **jsDelivr** (`cdn.jsdelivr.net/gh/...`), com cache mundial e de graça.

Usos no site: **avatar** (quadrado 512×512), **capa da página** (1200×400) e **galeria de fotos**
(até 24, redimensionadas para máx. 1440px). No modo demo (sem GitHub configurado), os uploads
caem em `public/uploads/` — funciona no `npm run dev` mas **não** persiste na Vercel.

### Passo a passo (5 minutos)

1. **Crie o repositório de dados** no GitHub (ex.: `jrway-dados`).
   > Ele precisa ser **PÚBLICO** para a jsDelivr servir as imagens anonimamente.
2. **Gere o token fine-grained**:
   - GitHub → *Settings* → *Developer settings* → *Fine-grained personal access tokens* → *Generate new token*
   - **Repository access**: "Only select repositories" → selecione **apenas** `jrway-dados`
   - **Permissions** → *Repository permissions* → **Contents: Read and write**
   - Copie o token (começa com `github_pat_…`)
3. **Configure na Vercel** (ou `.env.local` local):
   ```
   GITHUB_TOKEN=github_pat_…
   GITHUB_REPO=SEU-USUARIO/jrway-dados
   GITHUB_BRANCH=main
   ```
4. Pronto — os uploads do painel vão direto para o repositório (pasta `images/<username>/…webp`).

### Editor de recorte (antes do envio)

Ao escolher uma imagem no painel (avatar, capa ou foto da galeria) o editor abre na hora:

- **arrastar** posiciona a imagem • **roda do mouse / pinça** = zoom • **⟲ ⟳** giram de 90° em 90° • **⇄** espelha
- o **frame é fixo** e mostra exatamente o enquadramento final: avatar 1:1 (512×512), capa 3:1 (1200×400) e, para fotos, chips de proporção (1:1, 4:5, 16:9, 3:2 — até 1440px)
- ao confirmar, o recorte é gerado em **WebP** no navegador e segue pelo pipeline de upload normal

### Tema por botão (Instagram/TikTok/WhatsApp)

Na aba **Links**, abra o 🎨 de qualquer link:

- **Marcar uma marca** aplica o visual oficial (Instagram com o gradiente clássico, TikTok preto, WhatsApp verde) e troca o ícone do link automaticamente;
- **"Nenhum" + Fundo/Texto/Gradiente** cria um botão com cor própria;
- sem tema individual, o botão segue o estilo global da página (aba Aparência).

### Detalhes

- O nome do arquivo já vai pronto: `images/{usuario}/{tipo}-{usuario}-{timestamp}.webp`
- Se preferir outra CDN/base de leitura, defina `GITHUB_CDN_BASE` (ex.: `https://raw.githubusercontent.com/SEU-USUARIO/jrway-dados/main`).
- O token é fine-grained: ele **só** pode escrever nesse repositório específico — se vazar, o dano é isolado.
- Não esqueça de **nunca** commitar o token: use variáveis de ambiente.

## Painel admin secreto

- URL: **`/acess/auth/adm`** (senha = variável `ADMIN_PASSWORD`)
- Recursos: estatísticas gerais (incluindo fila de pendentes), buscar e filtrar
  usuários, **aprovar contas** (✅ — só depois disso a página fica pública),
  **verificar** perfil (selo ✓), **suspender**/reativar páginas e **excluir**
  usuários permanentemente.

### Fluxo de aprovação

1. Alguém cria a conta → ela nasce com status **pendente**
2. Ela pode entrar no dashboard e deixar a página pronta (nada é público ainda)
3. Você aprova no painel admin (✅) → a página `/usuario` passa a existir e entra no sitemap
4. Contas indesejadas: 🗑️ exclui, ou ⏸️ suspende a qualquer momento

O cadastro tem um limitador anti-spam (10 contas/hora por IP) para não encher sua fila.

### Por que ele não aparece no robots.txt / sitemap?

Listar um caminho secreto no `robots.txt` **revelaria** a URL secreta para
qualquer um que abrir o arquivo. A prática correta para páginas privadas é:

- `robots.txt` — só bloqueia `/api/` (rota genérica, não secreta);
- `sitemap.xml` — contém apenas a home e os perfis públicos;
- `/acess/*` — protegida com header `X-Robots-Tag: noindex, nofollow` (em `next.config.mjs`)
  e meta `robots: noindex` na página.

Assim os buscadores não indexam o painel e a URL permanece discreta.

## Estrutura

```
app/
  page.js               → landing (marketing)
  entrar/               → login + cadastro
  dashboard/            → painel do usuário (perfil, links, aparência, fotos, prévia)
  [username]/           → página bio pública de cada usuário
  acess/auth/adm/       → painel admin SECRETO (não indexado)
  api/upload/           → recebe imagem → converte WebP → envia ao GitHub
  api/…                 → rotas de auth, links, cliques e admin
  robots.js, sitemap.js → SEO (admin omitido de propósito)
lib/
  db.js                 → Neon Postgres + modo demo em arquivo
  auth.js               → senhas (scrypt) e sessões assinadas (HMAC)
  theme.js              → temas prontos + sanitização de tema
  imaging.js            → conversão para WebP (sharp)
  github.js             → upload no repo de dados (fine-grained PAT)
```

## Segurança incluída

- Senhas com **scrypt** + salt aleatório (sem depender de pacotes externos)
- Sessões em **cookies httpOnly assinados com HMAC** e prazo de validade
- Verificação de dono em toda operação de link (ninguém edita link alheio)
- Usernames reservados (`/api`, `/dashboard`, `/acess`, etc.) bloqueados no cadastro
- Comparação de senha do admin em **tempo constante**
- Uploads validados (tipo MIME, tamanho, sem SVG) e convertidos — nada cru vai para o repo

## Dicas finais

- Troque `SESSION_SECRET` e `ADMIN_PASSWORD` **antes** de publicar de verdade.
- Domínio próprio: configure em *Vercel → Settings → Domains* e ajuste `NEXT_PUBLIC_BASE_URL`.
- **Erro de hidratação em dev?** Prioridades que mencionam `bis_skin_checked`,
  `bis_register` ou `__processed_…` são da **extensão Bitdefender** (Element Protection)
  mexendo no HTML antes do React hidratar — não é bug do site. O `layout` já usa
  `suppressHydrationWarning` no `<html>`/`<body>` para silenciá-los, e em produção nada disso acontece.
- Para um domínio tipo `jrway.app`: adicione o domínio na Vercel e atualize a variável.
