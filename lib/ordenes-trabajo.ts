import { PrioridadOT, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const PRIORIDAD_OT_LABEL: Record<PrioridadOT, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const PRIORIDADES_OT = Object.values(PrioridadOT);

export const PRIORIDAD_OT_BADGE_CLASS: Record<PrioridadOT, string> = {
  BAJA: "bg-gris-100 text-gris-700",
  MEDIA: "bg-celeste-100 text-celeste-700",
  ALTA: "bg-yellow-100 text-yellow-700",
  URGENTE: "bg-red-100 text-red-700",
};

// Usuario logueado que crea/modifica la OT. Se usa para completar solo
// "originadorId" (vía la Personal vinculada a la cuenta) y "actualizadoPor".
export async function usuarioActualParaOT() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, personalId: true },
  });
}

// Crea una OT completando "codigo" solo (OT-00001, OT-00002...) a partir del
// contador interno "secuencia" que MySQL asigna al crear, y "originadorId" /
// "actualizadoPor" a partir del usuario logueado. Lo usan tanto el alta
// manual de OT como "Generar OT" desde un MP vencido.
export async function crearOrdenTrabajoConCodigo(
  data: Omit<Prisma.OrdenTrabajoUncheckedCreateInput, "codigo" | "secuencia" | "originadorId" | "actualizadoPor">
) {
  const usuario = await usuarioActualParaOT();

  const creada = await prisma.ordenTrabajo.create({
    data: {
      ...data,
      codigo: `TMP-${Date.now()}`,
      originadorId: usuario?.personalId ?? null,
      actualizadoPor: usuario?.name || usuario?.email || null,
    },
  });

  return prisma.ordenTrabajo.update({
    where: { id: creada.id },
    data: { codigo: `OT-${String(creada.secuencia).padStart(5, "0")}` },
  });
}
