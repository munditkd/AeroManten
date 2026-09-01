"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function date(formData: FormData, key: string): Date | undefined {
  const value = str(formData, key);
  return value ? new Date(value) : undefined;
}

function activoData(formData: FormData) {
  return {
    marca: str(formData, "marca"),
    modelo: str(formData, "modelo"),
    numeroSerie: str(formData, "numeroSerie"),
    fechaFabricacion: date(formData, "fechaFabricacion"),
    horasTSN: num(formData, "horasTSN"),
    horasTSO: num(formData, "horasTSO"),
    ciclosTSN: num(formData, "ciclosTSN"),
    ciclosTSO: num(formData, "ciclosTSO"),
  };
}

export async function createActivo(formData: FormData) {
  const aeronaveId = str(formData, "aeronaveId");
  const tipo = str(formData, "tipo");
  if (!aeronaveId || !tipo) {
    throw new Error("Aeronave y tipo son obligatorios");
  }

  await prisma.activo.create({
    data: {
      tipo,
      aeronaveId,
      ...activoData(formData),
    },
  });

  revalidatePath(`/admin/aeronaves/${aeronaveId}`);
  revalidatePath("/admin/activos");
}

export async function updateActivo(id: string, formData: FormData) {
  const tipo = str(formData, "tipo");
  if (!tipo) throw new Error("El tipo es obligatorio");

  const activo = await prisma.activo.update({
    where: { id },
    data: {
      tipo,
      ...activoData(formData),
    },
  });

  revalidatePath(`/admin/activos/${id}`);
  revalidatePath("/admin/activos");
  revalidatePath(`/admin/aeronaves/${activo.aeronaveId}`);
}

export async function deleteActivo(id: string) {
  const activo = await prisma.activo.delete({ where: { id } });
  revalidatePath(`/admin/aeronaves/${activo.aeronaveId}`);
  revalidatePath("/admin/activos");
  redirect(`/admin/aeronaves/${activo.aeronaveId}`);
}
