import { prisma } from "@/lib/prisma";

// Tablas que hoy usan la tabla genérica Estado. Agregar una nueva acá
// implica también sumar el campo estadoId a su modelo y cablear las
// pantallas correspondientes.
export const TABLAS_ESTADO = ["OrdenTrabajo", "Activo", "Aeronave"] as const;

// RSTATUS conocidos por el código (definen colores y, a futuro, lógica de
// negocio). Al cargar un Estado nuevo se elige uno de estos según la tabla.
export const RSTATUS_OPCIONES = [
  "ABIERTA",
  "CERRADA",
  "OPERATIVO",
  "NO_OPERATIVO",
  "BAJA",
] as const;

// Estados disponibles para un campo de una entidad (ej. tabla="OrdenTrabajo",
// propiedad="estado"), sin los marcados "No usar".
export function obtenerEstados(tabla: string, propiedad = "estado") {
  return prisma.estado.findMany({
    where: { tabla, propiedad, noUsar: false },
    orderBy: { createdAt: "asc" },
  });
}

// Busca un estado puntual por su etiqueta (ej. para asignar "Pendiente" al
// crear una OT nueva, sin que el usuario tenga que elegirlo).
export function obtenerEstadoPorStatus(tabla: string, status: string, propiedad = "estado") {
  return prisma.estado.findFirst({ where: { tabla, propiedad, status } });
}

// Color del badge según la categoría fija (RSTATUS), no según la etiqueta
// editable (STATUS) — así el color no se rompe si alguien renombra un estado.
const RSTATUS_BADGE_CLASS: Record<string, string> = {
  ABIERTA: "bg-yellow-100 text-yellow-700",
  CERRADA: "bg-green-100 text-green-700",
  OPERATIVO: "bg-green-100 text-green-700",
  NO_OPERATIVO: "bg-red-100 text-red-700",
  BAJA: "bg-gris-200 text-gris-600",
};

export function claseBadgeEstado(rstatus: string): string {
  return RSTATUS_BADGE_CLASS[rstatus] ?? "bg-gris-100 text-gris-700";
}
