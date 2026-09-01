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

function date(formData: FormData, key: string): Date | undefined {
  const value = str(formData, key);
  return value ? new Date(value) : undefined;
}

function aeronaveData(formData: FormData) {
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

export async function createAeronave(formData: FormData) {
  const propietarioId = str(formData, "propietarioId");
  const matricula = str(formData, "matricula");
  if (!propietarioId || !matricula) {
    throw new Error("Propietario y matrícula son obligatorios");
  }

  try {
    await prisma.aeronave.create({
      data: {
        matricula: matricula.toUpperCase(),
        propietarioId,
        ...aeronaveData(formData),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(`Ya existe una aeronave con la matrícula ${matricula.toUpperCase()}`);
    }
    throw error;
  }

  revalidatePath(`/admin/propietarios/${propietarioId}`);
  revalidatePath("/admin/aeronaves");
}

export async function updateAeronave(id: string, formData: FormData) {
  const matricula = str(formData, "matricula");
  if (!matricula) throw new Error("La matrícula es obligatoria");

  let aeronave;
  try {
    aeronave = await prisma.aeronave.update({
      where: { id },
      data: {
        matricula: matricula.toUpperCase(),
        ...aeronaveData(formData),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(`Ya existe una aeronave con la matrícula ${matricula.toUpperCase()}`);
    }
    throw error;
  }

  revalidatePath(`/admin/aeronaves/${id}`);
  revalidatePath("/admin/aeronaves");
  revalidatePath(`/admin/propietarios/${aeronave.propietarioId}`);
}

export async function deleteAeronave(id: string) {
  const aeronave = await prisma.aeronave.delete({ where: { id } });
  revalidatePath(`/admin/propietarios/${aeronave.propietarioId}`);
  revalidatePath("/admin/aeronaves");
  redirect(`/admin/propietarios/${aeronave.propietarioId}`);
}

export async function createMantenimiento(formData: FormData) {
  const aeronaveId = str(formData, "aeronaveId");
  const activoId = str(formData, "activoId");
  const descripcion = str(formData, "descripcion");
  const fecha = str(formData, "fecha");
  if (!aeronaveId || !descripcion || !fecha) {
    throw new Error("Descripción y fecha son obligatorias");
  }

  await prisma.registroMantenimiento.create({
    data: {
      aeronaveId,
      activoId,
      descripcion,
      fecha: new Date(fecha),
    },
  });

  revalidatePath(`/admin/aeronaves/${aeronaveId}`);
  if (activoId) revalidatePath(`/admin/activos/${activoId}`);
}

export async function deleteMantenimiento(id: string) {
  const registro = await prisma.registroMantenimiento.delete({
    where: { id },
  });
  revalidatePath(`/admin/aeronaves/${registro.aeronaveId}`);
  if (registro.activoId) revalidatePath(`/admin/activos/${registro.activoId}`);
}
