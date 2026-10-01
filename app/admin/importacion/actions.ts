"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/permisos";
import { validarArchivoActivos } from "@/lib/importacion-activos";

export async function importarActivos(formData: FormData) {
  await verificarAdmin();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    throw new Error("Seleccioná un archivo Excel (.xlsx) para importar.");
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const { datos, errores } = await validarArchivoActivos(buffer);

  if (errores.length > 0) {
    throw new Error(errores.join("\n"));
  }

  await prisma.$transaction(datos.map((data) => prisma.activo.create({ data })));

  revalidatePath("/admin/activos");
  redirect(`/admin/importacion?importados=${datos.length}`);
}
