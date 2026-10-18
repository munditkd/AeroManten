import { prisma } from "@/lib/prisma";

// Fila única (id fijo "config"). Si no existe todavía (primer deploy antes
// de que un admin la cargue), se crea con un nombre genérico y sin logo —
// los reportes igual funcionan, solo sin imagen en el encabezado.
export async function obtenerConfiguracionEmpresa() {
  return prisma.configuracionEmpresa.upsert({
    where: { id: "config" },
    update: {},
    create: { id: "config", nombre: "Mi empresa" },
  });
}
