import { NextResponse } from "next/server";
import { generarPdfOT } from "@/lib/reportes/ot-reporte";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { buffer, codigo } = await generarPdfOT(id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${codigo}.pdf"`,
    },
  });
}
