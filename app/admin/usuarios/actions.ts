"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export async function createUsuario(formData: FormData) {
  const username = str(formData, "username");
  const email = str(formData, "email");
  const password = str(formData, "password");
  const role = str(formData, "role") as Role | undefined;

  if (!username || !email || !password) {
    throw new Error("Usuario, email y contraseña son obligatorios");
  }
  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }
  if (!role || !Object.values(Role).includes(role)) {
    throw new Error("Seleccioná un rol válido");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: {
        name: str(formData, "name") ?? null,
        username,
        email,
        passwordHash,
        role,
        // Creada por un admin: se da por verificada, sin pasar por el mail.
        emailVerified: new Date(),
        grupoId: optionalRelationId(formData, "grupoId"),
        personalId: optionalRelationId(formData, "personalId"),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ya existe una cuenta con ese usuario o email");
    }
    throw error;
  }

  revalidatePath("/admin/usuarios");
}

export async function updateUsuario(id: string, formData: FormData) {
  const username = str(formData, "username");
  const email = str(formData, "email");
  const role = str(formData, "role") as Role | undefined;
  const nuevaPassword = str(formData, "password");

  if (!username || !email) {
    throw new Error("Usuario y email son obligatorios");
  }
  if (!role || !Object.values(Role).includes(role)) {
    throw new Error("Seleccioná un rol válido");
  }
  if (nuevaPassword && nuevaPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres");
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: str(formData, "name") ?? null,
        username,
        email,
        role,
        grupoId: optionalRelationId(formData, "grupoId"),
        personalId: optionalRelationId(formData, "personalId"),
        ...(nuevaPassword ? { passwordHash: await bcrypt.hash(nuevaPassword, 12) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ya existe otra cuenta con ese usuario o email");
    }
    throw error;
  }

  revalidatePath(`/admin/usuarios/${id}`);
  revalidatePath("/admin/usuarios");
}
