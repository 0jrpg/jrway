# 🛤️ JRWay — plataforma de páginas bio (estilo Linktree) + hospedagem de fotos

Plataforma completa onde **cada usuário cria a sua própria página de links e fotos**, com
personalização de tema, cores, fonte, efeitos e botões — tudo com prévia ao vivo.

- 👥 **Multiusuário com moderação**: qualquer pessoa pode pedir conta, mas **o admin precisa aprovar** — a página pública só existe após aprovação
- 🎨 **Personalização**: 6 temas prontos + cores customizadas, 4 estilos de botão, fonte, arredondamento e efeitos de fundo
- 💅 **Tema por botão**: cada link pode ter seu próprio look — temas **Instagram, TikTok e WhatsApp** ou cor/gradiente escolhido um a um
- 🌈 **Aureola da avatar**: anel em volta da foto configurável — **arco animado, anel sólido, degradê ou nenhum**, com as duas cores e a espessura escolhidas
- 🏅 **Selos**: **verificado** (posição escolhida: ao lado do nome, depois do @ ou no canto do avatar) e **selo de Admin/equipe** dourado — ambos atribuíveis pelo painel
- 🖼️ **Hospedagem de fotos**: aceita qualquer formato de imagem (JPG, PNG, GIF, AVIF, TIFF…), converte para **WebP** e guarda em um **repositório de dados no GitHub** (token fine-grained), servido pela CDN jsDelivr
- ✂️ **Editor de recorte**: antes do envio dá para **recortar, girar, dar zoom e espelhar** a imagem (estilo Instagram) — o recorte sai em WebP já enquadradíssimo
- 🛡 **Imagens protegidas**: avatar, capa e galeria **sem arrastar, sem clique-direito e sem toque-longo de salvar** no celular
- 🎬 **Animações em tudo**: abertura cinematográfica do site (entrada com blur→foco, navegação que desce, aurora de luzes e estrelas piscando), marquee infinito de redes, brilho varrendo botões e a tela do celular, selos/logo pulsando e micro-interações nos cards — a página bio também entra animada
- 🖼️ **Fallback de fotos pronto**: uploads do GitHub são servidos via `/api/media/…` (repo privado ou público); URLs antigas de jsDelivr são convertidas automaticamente na leitura
- ✉️ **Links de e-mail (mailto:)** além de web: digitou `eu@email.com`, o botão abre o app de e-mail (com contador de cliques)
- 🔤 **Ícones em SVG**: nada de emoji na interface — catálogo próprio de ícones desenhados em traço (`components/Icon.js`), logo própria em SVG (favicon incluído)
- ✉️ **Mensagem para o admin**: quem se cadastra pode escrever uma mensagem que aparece **direto no painel** antes de aprovar (com notificação por **Discord/Telegram** opcional)
- 🤍 **"Criado no JRWay" opcional**: perfis **verificados** podem ocultar o crédito da página
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
   | `DISCORD_WEBHOOK_URL` | webhook do canal (ou `TELEGRAM_BOT_TOKEN`+`TELEGRAM_CHAT_ID`) | opcional — avisa a cada cadastro |

4. **Deploy**. Pronto — a plataforma já está no ar. 🎉

### Aviso de novos cadastros (opcional)

Configure **uma** das opções e cada conta nova chega no seu chat com o
**@username** e a mensagem que a pessoa escreveu no cadastro:

- **Discord**: canal → *Configurações → Integrations → Webhooks* → copie a URL → `DISCORD_WEBHOOK_URL`;
- **Telegram**: crie um bot (@BotFather → token), pegue o `chat_id` do seu chat → `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`;
- sem nada configurado, a notificação simplesmente não acontece (o cadastro funciona igual).

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

Ao escolher uma imagem no painel (avatar, capa ou foto da galeria) o editor abre **na tela da frente, centralizado**:

- **arrastar** posiciona a imagem • **roda do mouse / pinça** = zoom • giram de 90° em 90° • espelha com um clique
- o **frame é fixo** e mostra exatamente o enquadramento final: avatar 1:1 (512×512), capa 3:1 (1200×400) e, para fotos, chips de proporção (1:1, 4:5, 16:9, 3:2 — até 1440px)
- ao confirmar, o recorte é gerado em **WebP** no navegador e segue pelo pipeline de upload normal

### Aureola da foto + selos (aba Aparência)

- **Aureola**: escolha entre *Arco animado* (padrão, usa as cores do tema), *Anel sólido*, *Degradê* ou *Nenhuma* — com seletor das duas cores e espessura de 2 a 8px. A prévia mostra tudo na hora e salva sozinho.
- **Selo verificado** (só perfis verificados, atribuído pelo admin): escolha a posição — *ao lado do nome*, *depois do @* ou *canto do avatar*.
- **Selo de Admin** (dourado, escudo): também vem do painel admin, aparece ao lado do nome na página pública.
- **Crédito "Criado no JRWay"**: só perfis verificados podem ocultar. **Des-verificar no painel volta a exigir o crédito automaticamente.**
- As permissões são reforçadas no servidor: a API recusa (`403`) mudanças de selo/crédito de quem não é verificado.

### Tema por botão (Instagram/TikTok/WhatsApp/E-mail)

Na aba **Links**, abra o seletor de tema (ícone de paleta) de qualquer link:

- **Marcar uma marca** aplica o visual oficial (Instagram com o gradiente clássico, TikTok preto, WhatsApp verde, e-mail vermelho) e troca o ícone do link automaticamente;
- **"Nenhum" + Fundo/Texto/Gradiente** cria um botão com cor própria;
- o **ícone do link** também é SVG agora: clique no quadrado do ícone para abrir o catálogo (16 ícones).
- sem tema individual, o botão segue o estilo global da página (aba Aparência).

### Link de e-mail (mailto:)

Botão de e-mail é cidadão de primeira classe — não precisa de https:

- digitou **`eu@email.com`** no campo de endereço? O link fica **`mailto:eu@email.com`** no toque do visitante (abre o app de e-mail dele);
- aceita também `mailto:…` explícito, incluindo `?subject=Oi`;
- web comum continua igual: `instagram.com/eu` → `https://instagram.com/eu`;
- e-mail NÃO passa pelo redirecionador de cliques (o navegador ignore `mailto:` em redirects) — na página o botão abre o app direto e conta o clique em paralelo, então **o contador continua valendo**.

### Detalhes

- O nome do arquivo já vai pronto: `images/{usuario}/{tipo}-{usuario}-{timestamp}.webp`
- **As imagens são servidas pelo próprio site** (`/api/media/…`) — funciona com repo de dados PÚBLICO ou PRIVADO, sem depender de CDN externa. `MEDIA_PROXY=0` volta para a jsDelivr/raw se você preferir.
- Se preferir outra CDN/base de leitura nessa volta (`MEDIA_PROXY=0`), defina `GITHUB_CDN_BASE` (ex.: `https://raw.githubusercontent.com/SEU-USUARIO/jrway-dados/main`).
- O token é fine-grained: ele **só** pode escrever nesse repositório específico — se vazar, o dano é isolado. E como ele é usado **só no servidor** (proxy `/api/media`), nada vai para o navegador.
- Não esqueça de **nunca** commitar o token: use variáveis de ambiente.

## Painel admin secreto

- URL: **`/acess/auth/adm`** (senha = variável `ADMIN_PASSWORD`)
- Recursos: estatísticas gerais (incluindo fila de pendentes), buscar e filtrar
  usuários, **aprovar contas** (só depois disso a página fica pública),
  **verificar** perfil (selo), **dar o selo de Admin** (escudo dourado — aparece
  na página pública do usuário), **suspender**/reativar páginas e **excluir**
  usuários permanentemente.
- Contas **pendentes com mensagem** ganham um botão "mensagem" na própria
  tabela, que abre o texto que a pessoa escreveu ao se cadastrar.

### Fluxo de aprovação

1. Alguém cria a conta → ela nasce com status **pendente** (e pode deixar mensagem)
2. Ela pode entrar no dashboard e deixar a página pronta (nada é público ainda)
3. Você aprova no painel → a página `/usuario` passa a existir e entra no sitemap
4. Contas indesejadas: exclui, ou suspende a qualquer momento

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
  entrar/               → login + cadastro (com mensagem opcional pro admin)
  dashboard/            → painel do usuário (perfil, links, aparência, fotos, prévia)
  [username]/           → página bio pública de cada usuário
  acess/auth/adm/       → painel admin SECRETO (não indexado)
  api/upload/           → recebe imagem → converte WebP → envia ao GitHub
  api/…                 → rotas de auth, links, cliques e admin
  icon.svg/icon.png     → favicon no desenho da logo (Next serve sozinho)
  robots.js, sitemap.js → SEO (admin omitido de propósito)
components/
  Icon.js               → catálogo de ícones SVG (traço, sem deps)
  Logo.js               → logo do JRWay (SVG reutilizável)
  SafeImg.js            → <img> protegida (sem arrastar/salvar/clique-direito)
  ProfileView.js        → render da página bio (aureola, selos, watermark)
  ImageCropper.js       → editor de recorte
lib/
  db.js                 → Neon Postgres + modo demo em arquivo
  auth.js               → senhas (scrypt) e sessões assinadas (HMAC)
  theme.js              → temas prontos + sanitização (tema, aureola, selo, custom)
  notify.js             → aviso de cadastro para Discord/Telegram (opcional)
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
- As páginas públicas **nunca serializam** hash de senha nem a mensagem privada (higienização antes do render)
- Recursos de verificado (selo posicionável, ocultar crédito) são **reforçados na API**, não só na interface

## Dicas finais

- Troque `SESSION_SECRET` e `ADMIN_PASSWORD` **antes** de publicar de verdade.
- Domínio próprio: configure em *Vercel → Settings → Domains* e ajuste `NEXT_PUBLIC_BASE_URL`.
- **Erro de hidratação em dev?** Prioridades que mencionam `bis_skin_checked`,
  `bis_register` ou `__processed_…` são da **extensão Bitdefender** (Element Protection)
  mexendo no HTML antes do React hidratar — não é bug do site. O `layout` já usa
  `suppressHydrationWarning` no `<html>`/`<body>` para silenciá-los, e em produção nada disso acontece.
- Para um domínio tipo `jrway.app`: adicione o domínio na Vercel e atualize a variável.
