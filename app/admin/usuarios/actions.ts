"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function optionalRelationId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function updateUsuario(id: string, formData: FormData) {
  const role = str(formData, "role") as Role | undefined;
  if (!role || !Object.values(Role).includes(role)) {
    throw new Error("Seleccioná un rol válido");
  }

  await prisma.user.update({
    where: { id },
    data: {
      role,
      grupoId: optionalRelationId(formData, "grupoId"),
      personalId: optionalRelationId(formData, "personalId"),
    },
  });

  revalidatePath(`/admin/usuarios/${id}`);
  revalidatePath("/admin/usuarios");
}
