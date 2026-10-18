import { NextResponse } from "next/server";
import { generarJpgOT } from "@/lib/reportes/ot-reporte";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { buffer, codigo } = await generarJpgOT(id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="${codigo}.jpg"`,
    },
  });
}
