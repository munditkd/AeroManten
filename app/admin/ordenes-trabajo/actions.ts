"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { crearOrdenTrabajoConCodigo, usuarioActualParaOT } from "@/lib/ordenes-trabajo";
import { obtenerEstadoPorStatus } from "@/lib/estados";
import { PrioridadOT } from "@prisma/client";

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

// Un valor vacío significa "sin relación" (null), no "no tocar el campo".
function optionalRelationId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function ordenTrabajoData(formData: FormData) {
  return {
    tipo: str(formData, "tipo") ?? null,
    clase: str(formData, "clase") ?? null,
    categoria: str(formData, "categoria") ?? null,
    departamento: str(formData, "departamento") ?? null,
    aeronaveId: optionalRelationId(formData, "aeronaveId"),
    activoId: optionalRelationId(formData, "activoId"),
    mantenimientoPreventivoId: optionalRelationId(formData, "mantenimientoPreventivoId"),
    fechaInicio: date(formData, "fechaInicio") ?? null,
    fechaFinPlanificado: date(formData, "fechaFinPlanificado") ?? null,
    duracionEstimada: num(formData, "duracionEstimada") ?? null,
    duracionReal: num(formData, "duracionReal") ?? null,
    responsableId: optionalRelationId(formData, "responsableId"),
    falla: str(formData, "falla") ?? null,
    fechaCerrado: date(formData, "fechaCerrado") ?? null,
    costo: num(formData, "costo") ?? null,
    hsTotales: num(formData, "hsTotales") ?? null,
    comentarios: str(formData, "comentarios") ?? null,
  };
}

export async function createOrdenTrabajo(formData: FormData) {
  await verificarPermiso("insertar");

  const descripcion = str(formData, "descripcion");
  const fecha = date(formData, "fecha");
  const prioridad = str(formData, "prioridad") as PrioridadOT | undefined;
  if (!descripcion || !fecha) {
    throw new Error("Descripción y fecha son obligatorias");
  }

  let estadoId = str(formData, "estadoId");
  if (!estadoId) {
    const pendiente = await obtenerEstadoPorStatus("OrdenTrabajo", "Pendiente");
    if (!pendiente) throw new Error("No hay estados cargados para Órdenes de Trabajo");
    estadoId = pendiente.id;
  }

  await crearOrdenTrabajoConCodigo({
    descripcion,
    fecha,
    estadoId,
    prioridad:
      prioridad && Object.values(PrioridadOT).includes(prioridad) ? prioridad : undefined,
    ...ordenTrabajoData(formData),
  });

  revalidatePath("/admin/ordenes-trabajo");
}

export async function updateOrdenTrabajo(id: string, formData: FormData) {
  await verificarPermiso("modificar");

  const descripcion = str(formData, "descripcion");
  const fecha = date(formData, "fecha");
  const estadoId = str(formData, "estadoId");
  const prioridad = str(formData, "prioridad") as PrioridadOT | undefined;
  if (!descripcion || !fecha || !estadoId) {
    throw new Error("Descripción, fecha y estado son obligatorios");
  }

  const usuario = await usuarioActualParaOT();

  await prisma.ordenTrabajo.update({
    where: { id },
    data: {
      descripcion,
      fecha,
      estadoId,
      prioridad:
        prioridad && Object.values(PrioridadOT).includes(prioridad) ? prioridad : undefined,
      actualizadoPor: usuario?.name || usuario?.email || null,
      ...ordenTrabajoData(formData),
    },
  });

  revalidatePath(`/admin/ordenes-trabajo/${id}`);
  revalidatePath("/admin/ordenes-trabajo");
}

export async function deleteOrdenTrabajo(id: string) {
  await verificarPermiso("borrar");

  const manoDeObra = await prisma.ordenTrabajoManoDeObra.count({
    where: { ordenTrabajoId: id },
  });
  verificarSinReferencias([{ nombre: "Mano de obra cargada", cantidad: manoDeObra }]);

  await prisma.ordenTrabajo.delete({ where: { id } });
  revalidatePath("/admin/ordenes-trabajo");
  redirect("/admin/ordenes-trabajo");
}

export async function createManoDeObra(ordenTrabajoId: string, formData: FormData) {
  await verificarPermiso("insertar");

  const personalId = optionalRelationId(formData, "personalId");
  const horasTrabajadas = num(formData, "horasTrabajadas");
  const tareas = str(formData, "tareas");
  if (!personalId && !tareas) {
    throw new Error("Ingresá al menos el operario o la tarea realizada");
  }

  await prisma.ordenTrabajoManoDeObra.create({
    data: {
      ordenTrabajoId,
      personalId,
      fecha: date(formData, "fecha") ?? null,
      horasTrabajadas: horasTrabajadas ?? null,
      tareas: tareas ?? null,
      costo: num(formData, "costo") ?? null,
      comentarios: str(formData, "comentarios") ?? null,
    },
  });

  revalidatePath(`/admin/ordenes-trabajo/${ordenTrabajoId}`);
}

export async function deleteManoDeObra(ordenTrabajoId: string, id: string) {
  await verificarPermiso("borrar");

  await prisma.ordenTrabajoManoDeObra.delete({ where: { id } });
  revalidatePath(`/admin/ordenes-trabajo/${ordenTrabajoId}`);
}
