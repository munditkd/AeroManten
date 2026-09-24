"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
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

export async function createEstado(formData: FormData) {
  const tabla = str(formData, "tabla");
  const propiedad = str(formData, "propiedad") ?? "estado";
  const status = str(formData, "status");
  const rstatus = str(formData, "rstatus");
  if (!tabla || !status || !rstatus) {
    throw new Error("Tabla, status y RSTATUS son obligatorios");
  }

  try {
    await prisma.estado.create({
      data: { tabla, propiedad, status, rstatus, noUsar: bool(formData, "noUsar") },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(`Ya existe un estado "${status}" para ${tabla}/${propiedad}`);
    }
    throw error;
  }

  revalidatePath("/admin/estados");
}

export async function updateEstado(id: string, formData: FormData) {
  const tabla = str(formData, "tabla");
  const propiedad = str(formData, "propiedad") ?? "estado";
  const status = str(formData, "status");
  const rstatus = str(formData, "rstatus");
  if (!tabla || !status || !rstatus) {
    throw new Error("Tabla, status y RSTATUS son obligatorios");
  }

  try {
    await prisma.estado.update({
      where: { id },
      data: { tabla, propiedad, status, rstatus, noUsar: bool(formData, "noUsar") },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(`Ya existe otro estado "${status}" para ${tabla}/${propiedad}`);
    }
    throw error;
  }

  revalidatePath(`/admin/estados/${id}`);
  revalidatePath("/admin/estados");
}

export async function deleteEstado(id: string) {
  const [ordenesTrabajo, activos, aeronaves] = await Promise.all([
    prisma.ordenTrabajo.count({ where: { estadoId: id } }),
    prisma.activo.count({ where: { estadoId: id } }),
    prisma.aeronave.count({ where: { estadoId: id } }),
  ]);
  verificarSinReferencias([
    { nombre: "Órdenes de Trabajo", cantidad: ordenesTrabajo },
    { nombre: "Activos", cantidad: activos },
    { nombre: "Aeronaves", cantidad: aeronaves },
  ]);

  await prisma.estado.delete({ where: { id } });
  revalidatePath("/admin/estados");
  redirect("/admin/estados");
}
