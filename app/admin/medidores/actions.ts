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

function num(formData: FormData, key: string): number | undefined {
  const value = str(formData, key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function cargarMedidor(formData: FormData) {
  const aeronaveId = str(formData, "aeronaveId");
  const horas = num(formData, "horas") ?? 0;
  const ciclos = num(formData, "ciclos") ?? 0;

  if (!aeronaveId) throw new Error("Seleccioná una aeronave");
  if (horas <= 0 && ciclos <= 0) {
    throw new Error("Ingresá horas de vuelo o ciclos realizados");
  }

  const aeronave = await prisma.aeronave.findUnique({
    where: { id: aeronaveId },
    select: { horasTSN: true, horasTSO: true, ciclosTSN: true, ciclosTSO: true },
  });
  if (!aeronave) throw new Error("Aeronave no encontrada");

  const activos = await prisma.activo.findMany({
    where: { aeronaveId },
    select: { id: true, horasTSN: true, horasTSO: true, ciclosTSN: true, ciclosTSO: true },
  });

  // No se usa Prisma `increment`: en MySQL, NULL + numero da NULL, así que un
  // activo/aeronave sin horas cargadas previamente se quedaría en NULL en vez
  // de arrancar a acumular. Por eso se calcula el nuevo valor a mano.
  await prisma.$transaction([
    prisma.aeronave.update({
      where: { id: aeronaveId },
      data: {
        horasTSN: (aeronave.horasTSN ?? 0) + horas,
        horasTSO: (aeronave.horasTSO ?? 0) + horas,
        ciclosTSN: (aeronave.ciclosTSN ?? 0) + ciclos,
        ciclosTSO: (aeronave.ciclosTSO ?? 0) + ciclos,
      },
    }),
    ...activos.map((activo) =>
      prisma.activo.update({
        where: { id: activo.id },
        data: {
          horasTSN: (activo.horasTSN ?? 0) + horas,
          horasTSO: (activo.horasTSO ?? 0) + horas,
          ciclosTSN: (activo.ciclosTSN ?? 0) + ciclos,
          ciclosTSO: (activo.ciclosTSO ?? 0) + ciclos,
        },
      })
    ),
  ]);

  revalidatePath("/admin/medidores");
  revalidatePath(`/admin/aeronaves/${aeronaveId}`);
  revalidatePath("/admin/aeronaves");
  revalidatePath("/admin/activos");
  for (const activo of activos) {
    revalidatePath(`/admin/activos/${activo.id}`);
  }

  redirect(`/admin/medidores?aeronaveId=${aeronaveId}`);
}
