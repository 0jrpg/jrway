// Notificação do admin quando alguém cria uma conta.
//
// Configure UMA das opções em variáveis de ambiente (Vercel → Settings → Env Vars):
//   • DISCORD_WEBHOOK_URL  → webhook do canal do Discord (formato discord.com/api/webhooks/…)
//   • TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID → bot do Telegram
// Sem nada configurado, a função não faz nada (cadastro segue normal).
//
// Opcional: NOTIFY_WEBHOOK_URL recebe JSON genérico { event, username, message }.
//
// A chamada é sempre aguardada pela rota de cadastro (em serverless, processos
// podem morrer logo após a resposta) e qualquer falha é engolida — aviso nunca
// pode impedir o cadastro.

const CUT = 300; // corta a mensagem longa no webhook

export async function notifySignup({ username, message }) {
  try {
    const nome = `@${username}`;

    if (process.env.DISCORD_WEBHOOK_URL) {
      // Mensagem opcional do usuário vira um campo separado
      const msg = (message || '').trim();
      await postJson(process.env.DISCORD_WEBHOOK_URL, {
        username: 'JRWay',
        embeds: [{
          title: '🌱 Nova conta aguardando aprovação',
          description: `**${nome}** acabei de se cadastrar.\nAprovar ou recusar no painel: \`/acess/auth/adm\``,
          color: 0x7c5cff,
          ...(msg ? { fields: [{ name: 'Mensagem do usuário', value: msg.slice(0, CUT) }] } : {})
        }]
      });
      return;
    }

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const msg = (message || '').trim();
      const text =
        `🌱 *Nova conta aguardando aprovação*\n\n` +
        `Usuário: *${nome}*\n` +
        `Aprovar em: /acess/auth/adm` +
        (msg ? `\n\n💬 _${msg.slice(0, CUT)}_` : '');
      await postJson(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        { chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }
      );
      return;
    }

    if (process.env.NOTIFY_WEBHOOK_URL) {
      await postJson(process.env.NOTIFY_WEBHOOK_URL, {
        event: 'signup',
        username,
        message: (message || '').trim(),
        at: new Date().toISOString()
      });
    }
  } catch {
    // Notificação é "nice to have": nunca deve bloquear nem falhar o cadastro.
  }
}

async function postJson(url, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000); // não pendura o cadastro
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
  } finally {
    clearTimeout(t);
  }
}
