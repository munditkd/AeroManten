"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RolPersonal } from "@prisma/client";
import { verificarSinReferencias } from "@/lib/eliminar-guard";

function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function date(formData: FormData, key: string): Date | undefined {
  const value = str(formData, key);
  return value ? new Date(value) : undefined;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

// Un valor vacío significa "sin grupo" (null), no "no tocar el campo".
function optionalRelationId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function personalData(formData: FormData) {
  return {
    dni: str(formData, "dni") ?? null,
    telefono: str(formData, "telefono") ?? null,
    email: str(formData, "email") ?? null,
    fechaNacimiento: date(formData, "fechaNacimiento") ?? null,
    legajo: str(formData, "legajo") ?? null,
    habilitado: bool(formData, "habilitado"),
    fechaInicioHabilitacion: date(formData, "fechaInicioHabilitacion") ?? null,
    fechaVencimientoHabilitacion: date(formData, "fechaVencimientoHabilitacion") ?? null,
    grupoId: optionalRelationId(formData, "grupoId"),
  };
}

export async function createPersonal(formData: FormData) {
  const nombre = str(formData, "nombre");
  const apellido = str(formData, "apellido");
  const rol = str(formData, "rol") as RolPersonal | undefined;
  if (!nombre || !apellido) throw new Error("Nombre y apellido son obligatorios");
  if (!rol || !Object.values(RolPersonal).includes(rol)) {
    throw new Error("Seleccioná un rol válido");
  }

  await prisma.personal.create({
    data: {
      nombre,
      apellido,
      rol,
      ...personalData(formData),
    },
  });

  revalidatePath("/admin/personal");
}

export async function updatePersonal(id: string, formData: FormData) {
  const nombre = str(formData, "nombre");
  const apellido = str(formData, "apellido");
  const rol = str(formData, "rol") as RolPersonal | undefined;
  if (!nombre || !apellido) throw new Error("Nombre y apellido son obligatorios");
  if (!rol || !Object.values(RolPersonal).includes(rol)) {
    throw new Error("Seleccioná un rol válido");
  }

  await prisma.personal.update({
    where: { id },
    data: {
      nombre,
      apellido,
      rol,
      ...personalData(formData),
    },
  });

  revalidatePath(`/admin/personal/${id}`);
  revalidatePath("/admin/personal");
}

export async function deletePersonal(id: string) {
  const [originadas, responsable, manoDeObra, usuario, vuelos] = await Promise.all([
    prisma.ordenTrabajo.count({ where: { originadorId: id } }),
    prisma.ordenTrabajo.count({ where: { responsableId: id } }),
    prisma.ordenTrabajoManoDeObra.count({ where: { personalId: id } }),
    prisma.user.count({ where: { personalId: id } }),
    prisma.registroVuelo.count({ where: { pilotoId: id } }),
  ]);
  verificarSinReferencias([
    { nombre: "Órdenes de Trabajo (originador)", cantidad: originadas },
    { nombre: "Órdenes de Trabajo (responsable)", cantidad: responsable },
    { nombre: "Mano de obra cargada", cantidad: manoDeObra },
    { nombre: "Usuarios de login vinculados", cantidad: usuario },
    { nombre: "Vuelos como piloto", cantidad: vuelos },
  ]);

  await prisma.personal.delete({ where: { id } });
  revalidatePath("/admin/personal");
  redirect("/admin/personal");
}
