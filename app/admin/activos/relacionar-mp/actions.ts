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
