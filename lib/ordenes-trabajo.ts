import { EstadoOT, PrioridadOT } from "@prisma/client";

export const ESTADO_OT_LABEL: Record<EstadoOT, string> = {
  ABIERTA: "Abierta",
  EN_PROCESO: "En proceso",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};

export const ESTADOS_OT = Object.values(EstadoOT);

export const ESTADO_OT_BADGE_CLASS: Record<EstadoOT, string> = {
  ABIERTA: "bg-gris-100 text-gris-700",
  EN_PROCESO: "bg-yellow-100 text-yellow-700",
  CERRADA: "bg-green-100 text-green-700",
  CANCELADA: "bg-red-100 text-red-700",
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
