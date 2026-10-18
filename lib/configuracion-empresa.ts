import { prisma } from "@/lib/prisma";

// AEROMANTEN es el nombre del software y no cambia. La "empresa" que lo usa
// es la que se carga en el Propietario (campo Empresa + Logo, exclusivo de
// ADMIN — ver app/admin/propietarios). En la práctica debería haber un solo
// Propietario con esto cargado: se toma el primero (por fecha de alta) que
// tenga el campo Empresa completo. Si todavía no hay ninguno, se devuelve
// null y quien lo use muestra un fallback genérico.
export async function obtenerEmpresaPrincipal(): Promise<{
  empresa: string;
  logoDataUrl: string | null;
} | null> {
  const propietario = await prisma.propietario.findFirst({
    where: { empresa: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { empresa: true, logoDataUrl: true },
  });
  if (!propietario?.empresa) return null;
  return { empresa: propietario.empresa, logoDataUrl: propietario.logoDataUrl };
}
