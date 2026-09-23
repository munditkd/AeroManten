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

export async function createPropietario(formData: FormData) {
  await verificarPermiso("insertar");

  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio");

  await prisma.propietario.create({
    data: {
      nombre,
      documento: str(formData, "documento"),
      telefono: str(formData, "telefono"),
      email: str(formData, "email"),
      direccion: str(formData, "direccion"),
    },
  });

  revalidatePath("/admin/propietarios");
}

export async function updatePropietario(id: string, formData: FormData) {
  await verificarPermiso("modificar");

  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio");

  await prisma.propietario.update({
    where: { id },
    data: {
      nombre,
      documento: str(formData, "documento"),
      telefono: str(formData, "telefono"),
      email: str(formData, "email"),
      direccion: str(formData, "direccion"),
    },
  });

  revalidatePath(`/admin/propietarios/${id}`);
  revalidatePath("/admin/propietarios");
}

export async function deletePropietario(id: string) {
  await verificarPermiso("borrar");

  const aeronaves = await prisma.aeronave.count({ where: { propietarioId: id } });
  verificarSinReferencias([{ nombre: "Aeronaves", cantidad: aeronaves }]);

  await prisma.propietario.delete({ where: { id } });
  revalidatePath("/admin/propietarios");
  redirect("/admin/propietarios");
}
