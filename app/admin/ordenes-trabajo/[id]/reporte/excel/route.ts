import { NextResponse } from "next/server";
import { generarExcelOT } from "@/lib/reportes/ot-reporte";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { buffer, codigo } = await generarExcelOT(id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${codigo}.xlsx"`,
    },
  });
}
