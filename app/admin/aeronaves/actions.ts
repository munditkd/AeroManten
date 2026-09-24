"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";

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

// A diferencia de `str`, acá un valor vacío significa "sin estado" (null)
// en vez de "no tocar el campo".
function optionalRelationId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
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
    mesesTSN: num(formData, "mesesTSN"),
    mesesTSO: num(formData, "mesesTSO"),
    estadoId: optionalRelationId(formData, "estadoId"),
  };
}

export async function createAeronave(formData: FormData) {
  await verificarPermiso("insertar");

  const propietarioId = str(formData, "propietarioId");
  const matricula = str(formData, "matricula");
  if (!propietarioId || !matricula) {
    throw new Error("Propietario y matrícula son obligatorios");
  }

  try {
    // codigo se completa recién después de crear, con el número (secuencia)
    // que MySQL le asigna solo. Todavía no se usa para nada, es solo para
    // prolijidad; las relaciones siguen por matrícula.
    const creada = await prisma.aeronave.create({
      data: {
        codigo: `TMP-${Date.now()}`,
        matricula: matricula.toUpperCase(),
        propietarioId,
        ...aeronaveData(formData),
      },
    });
    await prisma.aeronave.update({
      where: { id: creada.id },
      data: { codigo: `AN-${String(creada.secuencia).padStart(3, "0")}` },
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
  await verificarPermiso("modificar");

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
  await verificarPermiso("borrar");

  const [activos, mantenimientos, mantenimientosPreventivos, ordenesTrabajo] =
    await Promise.all([
      prisma.activo.count({ where: { aeronaveId: id } }),
      prisma.registroMantenimiento.count({ where: { aeronaveId: id } }),
      prisma.activoMantenimientoPreventivo.count({ where: { aeronaveId: id } }),
      prisma.ordenTrabajo.count({ where: { aeronaveId: id } }),
    ]);
  verificarSinReferencias([
    { nombre: "Activos", cantidad: activos },
    { nombre: "Registros de mantenimiento", cantidad: mantenimientos },
    { nombre: "Mantenimientos preventivos relacionados", cantidad: mantenimientosPreventivos },
    { nombre: "Órdenes de Trabajo", cantidad: ordenesTrabajo },
  ]);

  const aeronave = await prisma.aeronave.delete({ where: { id } });
  revalidatePath(`/admin/propietarios/${aeronave.propietarioId}`);
  revalidatePath("/admin/aeronaves");
  redirect(`/admin/propietarios/${aeronave.propietarioId}`);
}

export async function createMantenimiento(formData: FormData) {
  await verificarPermiso("insertar");

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
  await verificarPermiso("borrar");

  const registro = await prisma.registroMantenimiento.delete({
    where: { id },
  });
  revalidatePath(`/admin/aeronaves/${registro.aeronaveId}`);
  if (registro.activoId) revalidatePath(`/admin/activos/${registro.activoId}`);
}
