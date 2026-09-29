"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function cambiarPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const actual = str(formData, "actual");
  const nueva = str(formData, "nueva");
  if (!actual || !nueva) throw new Error("Completá ambos campos");
  if (nueva.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("Usuario no encontrado");

  const coincide = await bcrypt.compare(actual, user.passwordHash);
  if (!coincide) throw new Error("La contraseña actual no es correcta");

  const passwordHash = await bcrypt.hash(nueva, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}
