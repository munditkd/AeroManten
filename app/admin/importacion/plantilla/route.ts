import { NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/permisos";
import { generarPlantillaActivos } from "@/lib/importacion-activos";

export async function GET() {
  await verificarAdmin();

  const buffer = await generarPlantillaActivos();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-activos.xlsx"',
    },
  });
}
