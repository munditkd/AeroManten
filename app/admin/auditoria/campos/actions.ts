"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/permisos";
import { obtenerCampoAuditable } from "@/lib/auditoria-config";
import { invalidarCacheAuditoria } from "@/lib/auditoria-motor";

export async function createCampoAuditado(formData: FormData) {
  await verificarAdmin();

  const tabla = String(formData.get("tabla") ?? "");
  const campo = String(formData.get("campo") ?? "");
  if (!obtenerCampoAuditable(tabla, campo)) {
    throw new Error("Tabla o campo inválido");
  }

  await prisma.campoAuditado.upsert({
    where: { tabla_campo: { tabla, campo } },
    update: {},
    create: { tabla, campo },
  });

  invalidarCacheAuditoria();
  revalidatePath("/admin/auditoria/campos");
}

export async function deleteCampoAuditado(id: string) {
  await verificarAdmin();

  await prisma.campoAuditado.delete({ where: { id } });

  invalidarCacheAuditoria();
  revalidatePath("/admin/auditoria/campos");
}
