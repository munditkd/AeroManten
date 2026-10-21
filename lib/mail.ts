import { enviarMailBrevo, parsearRemitente } from "./brevo";

function remitenteSistema() {
  return parsearRemitente(process.env.EMAIL_FROM ?? "Aeromanten <no-reply@aeromanten.com.ar>");
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  await enviarMailBrevo({
    sender: remitenteSistema(),
    to: [{ email: to }],
    subject: "Verificá tu email",
    html: `
      <p>Hola,</p>
      <p>Confirmá tu cuenta haciendo clic en el siguiente enlace:</p>
      <p><a href="${url}">${url}</a></p>
      <p>Si no creaste esta cuenta, ignorá este email.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  await enviarMailBrevo({
    sender: remitenteSistema(),
    to: [{ email: to }],
    subject: "Recuperar contraseña",
    html: `
      <p>Hola,</p>
      <p>Recibimos un pedido para restablecer tu contraseña. El enlace vence en 1 hora.</p>
      <p><a href="${url}">${url}</a></p>
      <p>Si no pediste esto, ignorá este email — tu contraseña actual sigue siendo válida.</p>
    `,
  });
}
