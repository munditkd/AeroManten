import { prisma } from "@/lib/prisma";

// Entidades que hoy pueden tener Clase/Categoría. Agregar una acá alcanza
// para que aparezca en el desplegable de /admin/clases; falta además sumarle
// los campos claseId/categoriaId al modelo y cablear las pantallas
// correspondientes (igual que con TABLAS_ESTADO en lib/estados.ts).
export const ENTIDADES_CLASE = [
  { entidad: "Aeronave", label: "Aeronaves" },
  { entidad: "Activo", label: "Activos" },
  { entidad: "Pieza", label: "Piezas" },
  { entidad: "MantenimientoPreventivo", label: "MP" },
  { entidad: "OrdenTrabajo", label: "OT" },
  { entidad: "Proveedor", label: "Proveedores" },
] as const;

export function labelEntidad(entidad: string): string {
  return ENTIDADES_CLASE.find((e) => e.entidad === entidad)?.label ?? entidad;
}

// Clases disponibles para una entidad (ej. "Activo"), sin importar a qué
// Categoría pertenezcan — el filtrado por Clase elegida se hace en el
// cliente (ver ClaseCategoriaSelector).
export function obtenerClases(entidad: string) {
  return prisma.clase.findMany({ where: { entidad }, orderBy: { nombre: "asc" } });
}

// Todas las Categorías de todas las Clases de una entidad, para pasarle al
// selector en cascada junto con las Clases.
export function obtenerCategoriasDeEntidad(entidad: string) {
  return prisma.categoria.findMany({
    where: { clase: { entidad } },
    orderBy: { nombre: "asc" },
  });
}
