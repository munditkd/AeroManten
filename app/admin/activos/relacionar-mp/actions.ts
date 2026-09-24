"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permisos";
import { verificarSinReferencias } from "@/lib/eliminar-guard";
import { crearOrdenTrabajoConCodigo } from "@/lib/ordenes-trabajo";
import { calcularVencimiento, formatFactor } from "@/lib/mantenimiento-preventivo";

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

// El select de destino combina activos y aeronaves en una sola lista,
// codificando el valor como "activo:<id>" o "aeronave:<id>".
function parseDestino(formData: FormData): { activoId?: string; aeronaveId?: string } {
  const destino = str(formData, "destino");
  if (!destino) return {};
  const [tipo, id] = destino.split(":");
  if (tipo === "activo" && id) return { activoId: id };
  if (tipo === "aeronave" && id) return { aeronaveId: id };
  return {};
}

export async function createRelaciones(formData: FormData) {
  await verificarPermiso("insertar");

  const { activoId, aeronaveId } = parseDestino(formData);
  const mpIds = formData
    .getAll("mpIds")
    .filter((value): value is string => typeof value === "string" && value !== "");

  if ((!activoId && !aeronaveId) || mpIds.length === 0) {
    throw new Error("Elegí un activo o aeronave y al menos un mantenimiento preventivo");
  }

  if (activoId) {
    await Promise.all(
      mpIds.map((mantenimientoPreventivoId) =>
        prisma.activoMantenimientoPreventivo.upsert({
          where: {
            activoId_mantenimientoPreventivoId: {
              activoId,
              mantenimientoPreventivoId,
            },
          },
          update: {},
          create: { activoId, mantenimientoPreventivoId },
        })
      )
    );
  } else if (aeronaveId) {
    await Promise.all(
      mpIds.map((mantenimientoPreventivoId) =>
        prisma.activoMantenimientoPreventivo.upsert({
          where: {
            aeronaveId_mantenimientoPreventivoId: {
              aeronaveId,
              mantenimientoPreventivoId,
            },
          },
          update: {},
          create: { aeronaveId, mantenimientoPreventivoId },
        })
      )
    );
  }

  revalidatePath("/admin/activos/relacionar-mp");
  revalidatePath("/admin/activos/vencimientos-mp");
}

export async function deleteRelacion(id: string) {
  await verificarPermiso("borrar");

  const realizaciones = await prisma.mantenimientoPreventivoRealizado.count({
    where: { relacionId: id },
  });
  verificarSinReferencias([{ nombre: "Realizaciones registradas", cantidad: realizaciones }]);

  await prisma.activoMantenimientoPreventivo.delete({ where: { id } });
  revalidatePath("/admin/activos/relacionar-mp");
  revalidatePath("/admin/activos/vencimientos-mp");
  redirect("/admin/activos/relacionar-mp");
}

export async function createRealizacion(relacionId: string, formData: FormData) {
  await verificarPermiso("insertar");

  const fecha = str(formData, "fecha");
  if (!fecha) throw new Error("La fecha es obligatoria");

  await prisma.mantenimientoPreventivoRealizado.create({
    data: {
      relacionId,
      fecha: new Date(fecha),
      horas: num(formData, "horas"),
      ciclos: num(formData, "ciclos"),
      observaciones: str(formData, "observaciones"),
    },
  });

  revalidatePath(`/admin/activos/relacionar-mp/${relacionId}`);
  revalidatePath("/admin/activos/relacionar-mp");
  revalidatePath("/admin/activos/vencimientos-mp");
}

export async function deleteRealizacion(id: string) {
  await verificarPermiso("borrar");

  const realizado = await prisma.mantenimientoPreventivoRealizado.delete({
    where: { id },
  });
  revalidatePath(`/admin/activos/relacionar-mp/${realizado.relacionId}`);
  revalidatePath("/admin/activos/vencimientos-mp");
}

export async function generarOTDesdeMP(relacionId: string) {
  await verificarPermiso("insertar");

  const relacion = await prisma.activoMantenimientoPreventivo.findUnique({
    where: { id: relacionId },
    include: {
      activo: { include: { aeronave: true } },
      aeronave: true,
      mantenimientoPreventivo: true,
      realizaciones: { orderBy: { fecha: "desc" }, take: 1 },
    },
  });
  if (!relacion) throw new Error("La relación no existe");

  const esAeronave = Boolean(relacion.aeronave);
  const horasActuales = esAeronave
    ? relacion.aeronave!.horasTSN
    : (relacion.activo?.horasTSN ?? null);
  const ciclosActuales = esAeronave
    ? relacion.aeronave!.ciclosTSN
    : (relacion.activo?.ciclosTSN ?? null);
  const ultima = relacion.realizaciones[0] ?? null;

  const venc = calcularVencimiento({
    mp: relacion.mantenimientoPreventivo,
    activoHoras: horasActuales,
    activoCiclos: ciclosActuales,
    ultimaRealizacion: ultima
      ? { fecha: ultima.fecha, horas: ultima.horas, ciclos: ultima.ciclos }
      : null,
  });

  const destino = esAeronave
    ? relacion.aeronave!.matricula
    : `${relacion.activo?.tipo} (${relacion.activo?.aeronave?.matricula ?? "en depósito"})`;

  const comentarios =
    venc.factores.length > 0
      ? venc.factores.map((factor) => `${factor.tipo}: ${formatFactor(factor)}`).join(" · ")
      : undefined;

  const ot = await crearOrdenTrabajoConCodigo({
    descripcion: `${relacion.mantenimientoPreventivo.descripcion} — generada desde MP ${relacion.mantenimientoPreventivo.codigo} (${destino})`,
    tipo: "Preventivo",
    fecha: new Date(),
    aeronaveId: esAeronave ? relacion.aeronaveId : (relacion.activo?.aeronaveId ?? null),
    activoId: relacion.activoId,
    mantenimientoPreventivoId: relacion.mantenimientoPreventivoId,
    prioridad: venc.estado === "vencido" ? "ALTA" : "MEDIA",
    comentarios,
  });

  revalidatePath("/admin/ordenes-trabajo");
  redirect(`/admin/ordenes-trabajo/${ot.id}`);
}
