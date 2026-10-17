"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { crearOrdenTrabajoConCodigo, usuarioActualParaOT } from "@/lib/ordenes-trabajo";
import { obtenerEstadoPorStatus } from "@/lib/estados";
import { ejecutarAccion, type EstadoAccion } from "@/lib/accion-segura";
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
    claseId: optionalRelationId(formData, "claseId"),
    categoriaId: optionalRelationId(formData, "categoriaId"),
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

  const datos = ordenTrabajoData(formData);
  // Si se eligió un activo puntual, la OT queda sobre ese activo: no se
  // guarda también la aeronave suelta (ya se sabe cuál es vía el activo).
  if (datos.activoId) {
    datos.aeronaveId = null;
  }

  await crearOrdenTrabajoConCodigo({
    descripcion,
    fecha,
    estadoId,
    prioridad:
      prioridad && Object.values(PrioridadOT).includes(prioridad) ? prioridad : undefined,
    ...datos,
  });

  revalidatePath("/admin/ordenes-trabajo");
}

export async function updateOrdenTrabajo(
  id: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("modificar");

    const descripcion = str(formData, "descripcion");
    const fecha = date(formData, "fecha");
    const estadoId = str(formData, "estadoId");
    const prioridad = str(formData, "prioridad") as PrioridadOT | undefined;
    if (!descripcion || !fecha || !estadoId) {
      throw new Error("Descripción, fecha y estado son obligatorios");
    }

    const nuevoEstado = await prisma.estado.findUnique({ where: { id: estadoId } });
    if (nuevoEstado?.rstatus === "CERRADA") {
      const tareasPendientes = await prisma.ordenTrabajoTarea.count({
        where: { ordenTrabajoId: id, estado: { rstatus: "ABIERTA" } },
      });
      if (tareasPendientes > 0) {
        throw new Error(
          `No se puede cerrar la OT: hay ${tareasPendientes} tarea(s) pendiente(s). Marcalas como Realizada o Cancelada antes de cerrar.`
        );
      }
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
  });
}

export async function deleteOrdenTrabajo(id: string, _prevState: EstadoAccion): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("borrar");

    const tareas = await prisma.ordenTrabajoTarea.count({
      where: { ordenTrabajoId: id },
    });
    verificarSinReferencias([{ nombre: "Tareas cargadas", cantidad: tareas }]);

    await prisma.ordenTrabajo.delete({ where: { id } });
    revalidatePath("/admin/ordenes-trabajo");
    redirect("/admin/ordenes-trabajo");
  });
}

export async function createTarea(
  ordenTrabajoId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("insertar");

    const descripcion = str(formData, "descripcion");
    if (!descripcion) {
      throw new Error("La descripción de la tarea es obligatoria");
    }

    const pendiente = await obtenerEstadoPorStatus("OrdenTrabajoTarea", "Pendiente");
    if (!pendiente) throw new Error("No hay estados cargados para Tareas de OT");

    await prisma.ordenTrabajoTarea.create({
      data: { ordenTrabajoId, descripcion, estadoId: pendiente.id },
    });

    revalidatePath(`/admin/ordenes-trabajo/${ordenTrabajoId}`);
  });
}

export async function updateTarea(
  ordenTrabajoId: string,
  tareaId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("modificar");

    const descripcion = str(formData, "descripcion");
    const estadoId = str(formData, "estadoId");
    if (!descripcion || !estadoId) {
      throw new Error("Descripción y estado son obligatorios");
    }

    await prisma.ordenTrabajoTarea.update({
      where: { id: tareaId },
      data: {
        descripcion,
        estadoId,
        personalId: optionalRelationId(formData, "personalId"),
        fecha: date(formData, "fecha") ?? null,
        horas: num(formData, "horas") ?? null,
        costo: num(formData, "costo") ?? null,
        comentarios: str(formData, "comentarios") ?? null,
      },
    });

    revalidatePath(`/admin/ordenes-trabajo/${ordenTrabajoId}`);
  });
}

export async function deleteTarea(
  ordenTrabajoId: string,
  tareaId: string,
  _prevState: EstadoAccion
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("borrar");

    await prisma.ordenTrabajoTarea.delete({ where: { id: tareaId } });
    revalidatePath(`/admin/ordenes-trabajo/${ordenTrabajoId}`);
  });
}

// Registra el consumo de una Pieza en una Tarea: descuenta "cantidad" del
// stock de la Pieza y la fila queda como historial de uso (ver
// app/admin/piezas/[id]/page.tsx). Todo dentro de una transacción para que
// el descuento de stock y el alta del uso queden siempre consistentes.
export async function addTareaPieza(
  ordenTrabajoId: string,
  tareaId: string,
  _prevState: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("insertar");

    const piezaId = str(formData, "piezaId");
    const cantidad = num(formData, "cantidad");
    if (!piezaId || cantidad === undefined || cantidad <= 0) {
      throw new Error("Elegí una pieza y una cantidad mayor a cero");
    }

    await prisma.$transaction(async (tx) => {
      const pieza = await tx.pieza.findUniqueOrThrow({ where: { id: piezaId } });
      if (pieza.stock < cantidad) {
        throw new Error(
          `Stock insuficiente de "${pieza.nombre}": quedan ${pieza.stock} ${pieza.unidadMedida}.`
        );
      }
      await tx.pieza.update({
        where: { id: piezaId },
        data: { stock: { decrement: cantidad } },
      });
      await tx.ordenTrabajoTareaPieza.create({
        data: { ordenTrabajoTareaId: tareaId, piezaId, cantidad },
      });
    });

    revalidatePath(`/admin/ordenes-trabajo/${ordenTrabajoId}`);
    revalidatePath("/admin/piezas");
  });
}

// Repone el stock descontado al borrar un uso de Pieza registrado en una Tarea.
export async function deleteTareaPieza(
  ordenTrabajoId: string,
  usoId: string
): Promise<EstadoAccion> {
  return ejecutarAccion(async () => {
    await verificarPermiso("borrar");

    await prisma.$transaction(async (tx) => {
      const uso = await tx.ordenTrabajoTareaPieza.findUniqueOrThrow({ where: { id: usoId } });
      await tx.pieza.update({
        where: { id: uso.piezaId },
        data: { stock: { increment: uso.cantidad } },
      });
      await tx.ordenTrabajoTareaPieza.delete({ where: { id: usoId } });
    });

    revalidatePath(`/admin/ordenes-trabajo/${ordenTrabajoId}`);
    revalidatePath("/admin/piezas");
  });
}
