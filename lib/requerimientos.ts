import { TipoRequerimiento, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const TIPO_REQUERIMIENTO_LABEL: Record<TipoRequerimiento, string> = {
  PRODUCTO: "Producto",
  SERVICIO: "Servicio",
};

export const TIPOS_REQUERIMIENTO = Object.values(TipoRequerimiento);

// Usuario logueado que crea el Requerimiento, para completar "creadoPor".
export async function usuarioActualParaRequerimiento(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const usuario = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  return usuario?.name || usuario?.email || null;
}

// Crea un Requerimiento completando "codigo" solo (REQ-00001, REQ-00002...)
// a partir del contador interno "secuencia" que MySQL asigna al crear, igual
// que crearOrdenTrabajoConCodigo (ver lib/ordenes-trabajo.ts).
export async function crearRequerimientoConCodigo(
  data: Omit<Prisma.RequerimientoUncheckedCreateInput, "codigo" | "secuencia" | "creadoPor">
) {
  const creadoPor = await usuarioActualParaRequerimiento();

  const creado = await prisma.requerimiento.create({
    data: { ...data, codigo: `TMP-${Date.now()}`, creadoPor },
  });

  return prisma.requerimiento.update({
    where: { id: creado.id },
    data: { codigo: `REQ-${String(creado.secuencia).padStart(5, "0")}` },
  });
}

type ItemParaMail = {
  cantidad: number;
  pieza: { nombre: string; unidadMedida: string } | null;
  servicio: { nombre: string; unidadMedida: string } | null;
};

// Lo pedido siempre sale de la Pieza o el Servicio referenciado, nunca de
// texto libre (ver RequerimientoItem en schema.prisma). Se usa tanto acá
// como en la UI del detalle del Requerimiento.
export function nombreItem(item: { pieza: { nombre: string } | null; servicio: { nombre: string } | null }): string {
  return item.pieza?.nombre ?? item.servicio?.nombre ?? "—";
}

export function unidadItem(item: { pieza: { unidadMedida: string } | null; servicio: { unidadMedida: string } | null }): string {
  return item.pieza?.unidadMedida ?? item.servicio?.unidadMedida ?? "";
}

function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// HTML del mail que recibe cada Proveedor con el pedido de cotización.
export function construirHtmlRequerimientoMail(requerimiento: {
  codigo: string;
  titulo: string;
  tipo: TipoRequerimiento;
  descripcion: string | null;
  items: ItemParaMail[];
}, nombreEmpresa: string): string {
  const filas = requerimiento.items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 10px;border:1px solid #ddd;">${escapeHtml(nombreItem(item))}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${item.cantidad}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;">${escapeHtml(unidadItem(item))}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:640px;">
      <h2 style="margin:0 0 4px;">${escapeHtml(requerimiento.titulo)}</h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">
        Pedido de cotización ${escapeHtml(requerimiento.codigo)} —
        ${TIPO_REQUERIMIENTO_LABEL[requerimiento.tipo]}
      </p>
      ${requerimiento.descripcion ? `<p>${escapeHtml(requerimiento.descripcion)}</p>` : ""}
      <table style="border-collapse:collapse;width:100%;margin-top:12px;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">Descripción</th>
            <th style="padding:6px 10px;border:1px solid #ddd;text-align:right;">Cantidad</th>
            <th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">Unidad</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <p style="margin-top:20px;font-size:14px;">
        Por favor responder este mail con su cotización para cada ítem.
      </p>
      <p style="margin-top:24px;font-size:13px;color:#6b7280;">${escapeHtml(nombreEmpresa)}</p>
    </div>
  `;
}
