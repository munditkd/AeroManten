// Envío de mail vía la API HTTP de Brevo (https://api.brevo.com), en vez de
// SMTP directo: el droplet de producción tiene los puertos de SMTP (25, 465,
// 587) bloqueados por DigitalOcean, pero el tráfico HTTPS normal (443, el
// mismo que usa el resto de la app) funciona sin problema. Reemplaza tanto
// el canal de mails del sistema (ver lib/mail.ts) como el de Requerimientos
// a Proveedores (ver lib/mail-comercial.ts) — una sola API key para los dos.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type Remitente = { name: string; email: string };
type Destinatario = { email: string; name?: string };

export async function enviarMailBrevo(datos: {
  sender: Remitente;
  to: Destinatario[];
  subject: string;
  html: string;
  replyTo?: Remitente;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar BREVO_API_KEY en el servidor");
  }

  const respuesta = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: datos.sender,
      to: datos.to,
      subject: datos.subject,
      htmlContent: datos.html,
      ...(datos.replyTo ? { replyTo: datos.replyTo } : {}),
    }),
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => "");
    let mensaje = `Brevo respondió ${respuesta.status}`;
    try {
      const json = JSON.parse(cuerpo);
      if (json.message) mensaje = json.message;
    } catch {
      if (cuerpo) mensaje = cuerpo;
    }
    throw new Error(mensaje);
  }
}

// Separa 'name <email>' en sus dos partes (formato típico de EMAIL_FROM en
// .env). Si no matchea ese formato, se asume que el valor completo es la
// dirección y no hay nombre.
export function parsearRemitente(valor: string): Remitente {
  const match = valor.match(/^"?([^"<]*)"?\s*<(.+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: valor, email: valor };
}
