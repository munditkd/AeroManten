import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Accion = "insertar" | "modificar" | "borrar";

const ACCION_LABEL: Record<Accion, string> = {
  insertar: "insertar",
  modificar: "modificar",
  borrar: "borrar",
};

// ADMIN tiene acceso total siempre. El resto de los usuarios depende de los
// checks (insertar/modificar/borrar) del grupo asignado en su cuenta.
async function tienePermiso(accion: Accion): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { grupo: true },
  });
  if (!user?.grupo || user.grupo.noUsar) return false;

  return user.grupo[accion];
}

export async function verificarPermiso(accion: Accion) {
  if (!(await tienePermiso(accion))) {
    throw new Error(
      `No tenés permiso para ${ACCION_LABEL[accion]} datos. Pedile a un administrador que lo habilite en tu grupo.`
    );
  }
}
