import { EstadoOT, PrioridadOT, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const ESTADO_OT_LABEL: Record<EstadoOT, string> = {
  PENDIENTE: "Pendiente",
  EN_EJECUCION: "En ejecución",
  DETENIDA: "Detenida",
  EN_ESPERA: "En espera",
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
  TERMINADA_E_S: "Terminada E/S",
  TERMINADA_F_S: "Terminada F/S",
  CANCELADA: "Cancelada",
};

export const ESTADOS_OT = Object.values(EstadoOT);

export const ESTADO_OT_BADGE_CLASS: Record<EstadoOT, string> = {
  PENDIENTE: "bg-gris-100 text-gris-700",
  EN_EJECUCION: "bg-yellow-100 text-yellow-700",
  DETENIDA: "bg-red-100 text-red-700",
  EN_ESPERA: "bg-orange-100 text-orange-700",
  EN_REVISION: "bg-blue-100 text-blue-700",
  APROBADA: "bg-purple-100 text-purple-700",
  TERMINADA_E_S: "bg-green-100 text-green-700",
  TERMINADA_F_S: "bg-amber-100 text-amber-800",
  CANCELADA: "bg-gris-200 text-gris-600",
};

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
