"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSinReferencias } from "@/lib/eliminar-guard";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function grupoData(formData: FormData) {
  return {
    insertar: bool(formData, "insertar"),
    modificar: bool(formData, "modificar"),
    borrar: bool(formData, "borrar"),
    noUsar: bool(formData, "noUsar"),
    observaciones: str(formData, "observaciones") ?? null,
  };
}

export async function createGrupo(formData: FormData) {
  const codigo = str(formData, "codigo");
  const descripcion = str(formData, "descripcion");
  if (!codigo || !descripcion) {
    throw new Error("Código y descripción son obligatorios");
  }

  await prisma.grupo.create({
    data: {
      codigo,
      descripcion,
      ...grupoData(formData),
    },
  });

  revalidatePath("/admin/grupos");
}

export async function updateGrupo(id: string, formData: FormData) {
  const codigo = str(formData, "codigo");
  const descripcion = str(formData, "descripcion");
  if (!codigo || !descripcion) {
    throw new Error("Código y descripción son obligatorios");
  }

  await prisma.grupo.update({
    where: { id },
    data: {
      codigo,
      descripcion,
      ...grupoData(formData),
    },
  });

  revalidatePath(`/admin/grupos/${id}`);
  revalidatePath("/admin/grupos");
}

export async function deleteGrupo(id: string) {
  const [personal, usuarios] = await Promise.all([
    prisma.personal.count({ where: { grupoId: id } }),
    prisma.user.count({ where: { grupoId: id } }),
  ]);
  verificarSinReferencias([
    { nombre: "Personal", cantidad: personal },
    { nombre: "Usuarios", cantidad: usuarios },
  ]);

  await prisma.grupo.delete({ where: { id } });
  revalidatePath("/admin/grupos");
  redirect("/admin/grupos");
}
