"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// A diferencia de `str`, acá un valor vacío significa "sin aeronave" (null)
// en vez de "no tocar el campo".
function optionalRelationId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
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
    mesesTSN: num(formData, "mesesTSN"),
    mesesTSO: num(formData, "mesesTSO"),
    estadoId: optionalRelationId(formData, "estadoId"),
  };
}

export async function createActivo(formData: FormData) {
  await verificarPermiso("insertar");

  const tipo = str(formData, "tipo");
  if (!tipo) {
    throw new Error("El tipo es obligatorio");
  }
  const aeronaveId = optionalRelationId(formData, "aeronaveId");

  await prisma.activo.create({
    data: {
      tipo,
      aeronaveId,
      ...activoData(formData),
    },
  });

  if (aeronaveId) revalidatePath(`/admin/aeronaves/${aeronaveId}`);
  revalidatePath("/admin/activos");
}

export async function updateActivo(id: string, formData: FormData) {
  await verificarPermiso("modificar");

  const tipo = str(formData, "tipo");
  if (!tipo) throw new Error("El tipo es obligatorio");

  const before = await prisma.activo.findUnique({
    where: { id },
    select: { aeronaveId: true },
  });

  const activo = await prisma.activo.update({
    where: { id },
    data: {
      tipo,
      aeronaveId: optionalRelationId(formData, "aeronaveId"),
      ...activoData(formData),
    },
  });

  revalidatePath(`/admin/activos/${id}`);
  revalidatePath("/admin/activos");
  if (before?.aeronaveId) revalidatePath(`/admin/aeronaves/${before.aeronaveId}`);
  if (activo.aeronaveId) revalidatePath(`/admin/aeronaves/${activo.aeronaveId}`);
}

export async function deleteActivo(id: string) {
  await verificarPermiso("borrar");

  const [mantenimientos, mantenimientosPreventivos, ordenesTrabajo] = await Promise.all([
    prisma.registroMantenimiento.count({ where: { activoId: id } }),
    prisma.activoMantenimientoPreventivo.count({ where: { activoId: id } }),
    prisma.ordenTrabajo.count({ where: { activoId: id } }),
  ]);
  verificarSinReferencias([
    { nombre: "Registros de mantenimiento", cantidad: mantenimientos },
    { nombre: "Mantenimientos preventivos relacionados", cantidad: mantenimientosPreventivos },
    { nombre: "Órdenes de Trabajo", cantidad: ordenesTrabajo },
  ]);

  const activo = await prisma.activo.delete({ where: { id } });
  revalidatePath("/admin/activos");
  if (activo.aeronaveId) {
    revalidatePath(`/admin/aeronaves/${activo.aeronaveId}`);
    redirect(`/admin/aeronaves/${activo.aeronaveId}`);
  }
  redirect("/admin/activos");
}
