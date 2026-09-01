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

export async function createAeronave(formData: FormData) {
  const propietarioId = str(formData, "propietarioId");
  const matricula = str(formData, "matricula");
  if (!propietarioId || !matricula) {
    throw new Error("Propietario y matrícula son obligatorios");
  }

  await prisma.aeronave.create({
    data: {
      matricula: matricula.toUpperCase(),
      marca: str(formData, "marca"),
      modelo: str(formData, "modelo"),
      numeroSerie: str(formData, "numeroSerie"),
      propietarioId,
    },
  });

  revalidatePath(`/admin/propietarios/${propietarioId}`);
}

export async function updateAeronave(id: string, formData: FormData) {
  const matricula = str(formData, "matricula");
  if (!matricula) throw new Error("La matrícula es obligatoria");

  const aeronave = await prisma.aeronave.update({
    where: { id },
    data: {
      matricula: matricula.toUpperCase(),
      marca: str(formData, "marca"),
      modelo: str(formData, "modelo"),
      numeroSerie: str(formData, "numeroSerie"),
    },
  });

  revalidatePath(`/admin/aeronaves/${id}`);
  revalidatePath(`/admin/propietarios/${aeronave.propietarioId}`);
}

export async function deleteAeronave(id: string) {
  const aeronave = await prisma.aeronave.delete({ where: { id } });
  revalidatePath(`/admin/propietarios/${aeronave.propietarioId}`);
  redirect(`/admin/propietarios/${aeronave.propietarioId}`);
}

export async function createMantenimiento(formData: FormData) {
  const aeronaveId = str(formData, "aeronaveId");
  const descripcion = str(formData, "descripcion");
  const fecha = str(formData, "fecha");
  if (!aeronaveId || !descripcion || !fecha) {
    throw new Error("Descripción y fecha son obligatorias");
  }

  await prisma.registroMantenimiento.create({
    data: {
      aeronaveId,
      descripcion,
      fecha: new Date(fecha),
    },
  });

  revalidatePath(`/admin/aeronaves/${aeronaveId}`);
}

export async function deleteMantenimiento(id: string) {
  const registro = await prisma.registroMantenimiento.delete({
    where: { id },
  });
  revalidatePath(`/admin/aeronaves/${registro.aeronaveId}`);
}
