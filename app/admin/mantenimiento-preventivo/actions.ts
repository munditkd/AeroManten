"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function num(formData: FormData, key: string): number | undefined {
  const value = str(formData, key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function mantenimientoData(formData: FormData) {
  return {
    horas: num(formData, "horas"),
    ciclos: num(formData, "ciclos"),
    meses: num(formData, "meses"),
    personas: num(formData, "personas"),
    horasHombre: num(formData, "horasHombre"),
  };
}

export async function createMantenimientoPreventivo(formData: FormData) {
  const codigo = str(formData, "codigo");
  const descripcion = str(formData, "descripcion");
  const tarea = str(formData, "tarea");
  if (!codigo || !descripcion || !tarea) {
    throw new Error("Código, descripción y tarea son obligatorios");
  }

  try {
    await prisma.mantenimientoPreventivo.create({
      data: {
        codigo: codigo.toUpperCase(),
        descripcion,
        tarea,
        ...mantenimientoData(formData),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(`Ya existe un mantenimiento con el código ${codigo.toUpperCase()}`);
    }
    throw error;
  }

  revalidatePath("/admin/mantenimiento-preventivo");
}

export async function updateMantenimientoPreventivo(id: string, formData: FormData) {
  const codigo = str(formData, "codigo");
  const descripcion = str(formData, "descripcion");
  const tarea = str(formData, "tarea");
  if (!codigo || !descripcion || !tarea) {
    throw new Error("Código, descripción y tarea son obligatorios");
  }

  try {
    await prisma.mantenimientoPreventivo.update({
      where: { id },
      data: {
        codigo: codigo.toUpperCase(),
        descripcion,
        tarea,
        ...mantenimientoData(formData),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(`Ya existe un mantenimiento con el código ${codigo.toUpperCase()}`);
    }
    throw error;
  }

  revalidatePath(`/admin/mantenimiento-preventivo/${id}`);
  revalidatePath("/admin/mantenimiento-preventivo");
}

export async function deleteMantenimientoPreventivo(id: string) {
  await prisma.mantenimientoPreventivo.delete({ where: { id } });
  revalidatePath("/admin/mantenimiento-preventivo");
  redirect("/admin/mantenimiento-preventivo");
}
