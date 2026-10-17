import { prisma } from "@/lib/prisma";

export function obtenerDepositos() {
  return prisma.deposito.findMany({ orderBy: { nombre: "asc" } });
}

export function obtenerUbicaciones() {
  return prisma.ubicacion.findMany({ orderBy: { codigo: "asc" } });
}

// Pasillo/Estante/Columna/Fila se combinan en un solo campo, separados por
// guion (ej. "A-3-2-5"), en vez de guardarse en columnas separadas.
export function construirCodigoUbicacion(
  pasillo: string,
  estante: string,
  columna: string,
  fila: string
) {
  return [pasillo, estante, columna, fila].map((v) => v.trim()).join("-");
}
