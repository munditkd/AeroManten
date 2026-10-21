import { prisma } from "./prisma";
import { enviarMailBrevo } from "./brevo";

// Mismo criterio que obtenerEmpresaPrincipal() (ver lib/configuracion-empresa.ts):
// en la práctica debería haber un solo Propietario con esto cargado, así que
// alcanza con el primero que tenga Mail Comercial configurado.
export function obtenerPropietarioComercial() {
  return prisma.propietario.findFirst({
    where: { mailComercial: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, empresa: true, mailComercial: true },
  });
}

// false = falta el Mail Comercial del Propietario, o la BREVO_API_KEY del
// servidor (ver lib/brevo.ts) — en cualquiera de los dos casos no se puede
// enviar todavía.
export function puedeEnviarComercial(
  propietario: { mailComercial: string | null } | null
): boolean {
  return Boolean(propietario?.mailComercial && process.env.BREVO_API_KEY);
}

// El remitente visible es "{Empresa} <mailComercial>" — el Proveedor que
// responda el mail le contesta directo a esa casilla.
export async function enviarMailComercial(datos: {
  propietario: { empresa: string | null; mailComercial: string | null };
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!datos.propietario.mailComercial) {
    throw new Error("Todavía no configuraste el Mail Comercial del Propietario");
  }

  await enviarMailBrevo({
    sender: { name: datos.propietario.empresa ?? "AeroManten", email: datos.propietario.mailComercial },
    to: [{ email: datos.to }],
    subject: datos.subject,
    html: datos.html,
  });
}
