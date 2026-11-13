import { Resend } from "resend";

let client: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");
  if (!client) client = new Resend(apiKey);
  return client;
}

/**
 * Envia o e-mail de redefinição de senha com identidade visual AflyAI.
 * Só deve ser chamado do lado do servidor (route handlers / server actions).
 */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL ?? "AflyAI <onboarding@resend.dev>";
  const firstName = (opts.name ?? "").split(" ")[0] || "there";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0b0d;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141417;border:1px solid #26262b;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 8px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="width:40px;height:40px;background:#e11d2e;border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;font-weight:bold;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">A</td>
                <td style="padding-left:10px;font-size:22px;font-weight:bold;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">AflyAI</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <h1 style="margin:0 0 16px 0;font-size:20px;color:#ffffff;">Olá, ${escapeHtml(firstName)}!</h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#b9b9c0;">
                Recebemos uma solicitação para redefinir a senha da sua conta AflyAI.
                Se foi você, clique no botão abaixo para escolher uma nova senha.
              </p>
              <p style="margin:0 0 28px 0;">
                <a href="${opts.resetUrl}"
                   style="display:inline-block;background:#e11d2e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:14px 28px;border-radius:10px;">
                  Redefinir minha senha
                </a>
              </p>
              <p style="margin:0 0 8px 0;font-size:13px;line-height:20px;color:#8a8a92;">
                Este link é válido por <strong style="color:#e11d2e;">15 minutos</strong>. Após esse prazo, será necessário solicitar um novo.
              </p>
              <p style="margin:0 0 24px 0;font-size:13px;line-height:20px;color:#8a8a92;">
                Se você não solicitou a redefinição, ignore este e-mail — sua senha permanecerá a mesma.
              </p>
              <p style="margin:0 0 32px 0;font-size:12px;line-height:18px;color:#5f5f66;">
                Se o botão não funcionar, copie e cole este link no navegador:<br />
                <a href="${opts.resetUrl}" style="color:#e11d2e;word-break:break-all;">${opts.resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px;background:#101013;border-top:1px solid #26262b;" align="center">
              <span style="font-size:11px;color:#5f5f66;">© ${new Date().getFullYear()} AflyAI — Gestão inteligente em preto e vermelho.</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `Redefinição de senha — AflyAI\n\nOlá, ${firstName}!\n\nRecebemos uma solicitação para redefinir a senha da sua conta AflyAI.\nAbra o link abaixo para escolher uma nova senha (válido por 15 minutos):\n\n${opts.resetUrl}\n\nSe você não solicitou, ignore este e-mail.\n`;

  const { data, error } = await getResend().emails.send({
    from,
    to: opts.to,
    subject: "Redefinição de senha — AflyAI",
    html,
    text,
  });

  if (error) {
    console.error("resend send error", error);
    throw new Error("Falha ao enviar o e-mail de recuperação.");
  }
  return data;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
