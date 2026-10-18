import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionEmpresa } from "@/lib/configuracion-empresa";
import { renderizarHtml } from "./navegador";
import { PRIORIDAD_OT_LABEL } from "@/lib/ordenes-trabajo";

async function obtenerDatosReporteOT(id: string) {
  const ot = await prisma.ordenTrabajo.findUnique({
    where: { id },
    include: {
      estado: true,
      clase: true,
      categoria: true,
      aeronave: true,
      activo: { include: { clase: true, aeronave: true } },
      mantenimientoPreventivo: true,
      originador: true,
      responsable: true,
      tareas: {
        orderBy: { createdAt: "asc" },
        include: {
          estado: true,
          personal: true,
          piezas: { include: { pieza: true } },
        },
      },
    },
  });
  if (!ot) throw new Error("La orden de trabajo no existe");

  const configuracion = await obtenerConfiguracionEmpresa();
  return { ot, configuracion };
}

function fmtFecha(valor: Date | null | undefined) {
  return valor ? valor.toLocaleDateString("es-AR") : "—";
}

function fmtNum(valor: number | null | undefined, sufijo = "") {
  return valor !== null && valor !== undefined ? `${valor}${sufijo}` : "—";
}

function fmtPersona(persona: { nombre: string; apellido: string } | null | undefined) {
  return persona ? `${persona.apellido}, ${persona.nombre}` : "—";
}

function escapeHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type DatosReporte = Awaited<ReturnType<typeof obtenerDatosReporteOT>>;

function construirHtmlReporteOT({ ot, configuracion }: DatosReporte): string {
  const destino = ot.aeronave
    ? ot.aeronave.matricula
    : ot.activo
      ? `${ot.activo.clase.nombre} (Código ${ot.activo.codigo})${
          ot.activo.aeronave ? ` — ${ot.activo.aeronave.matricula}` : " — en depósito"
        }`
      : "—";

  const totalHorasTareas = ot.tareas.reduce((acc, t) => acc + (t.horas ?? 0), 0);
  const totalCostoTareas = ot.tareas.reduce((acc, t) => acc + (t.costo ?? 0), 0);

  const filaInfo = (label: string, valor: string) => `
    <div class="info-item">
      <div class="info-label">${escapeHtml(label)}</div>
      <div class="info-valor">${escapeHtml(valor)}</div>
    </div>`;

  const filasTareas = ot.tareas
    .map(
      (t) => `
    <tr>
      <td>${escapeHtml(t.descripcion)}</td>
      <td>${escapeHtml(t.estado.status)}</td>
      <td>${escapeHtml(fmtPersona(t.personal))}</td>
      <td>${fmtFecha(t.fecha)}</td>
      <td class="num">${fmtNum(t.horas)}</td>
      <td class="num">${t.costo !== null ? `$${t.costo}` : "—"}</td>
      <td>${
        t.piezas.length > 0
          ? t.piezas
              .map((p) => escapeHtml(`${p.pieza.nombre} (${p.cantidad} ${p.pieza.unidadMedida})`))
              .join("<br/>")
          : "—"
      }</td>
    </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Arial, sans-serif;
    color: #1f2933;
    margin: 0;
    padding: 28px 32px;
    font-size: 12px;
  }
  .encabezado {
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 3px solid #1c384a;
    padding-bottom: 14px;
    margin-bottom: 18px;
  }
  .encabezado img { height: 48px; width: 48px; object-fit: contain; }
  .encabezado-empresa { font-size: 18px; font-weight: 700; color: #1c384a; }
  .encabezado-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .encabezado-derecha { margin-left: auto; text-align: right; }
  .titulo { font-size: 20px; font-weight: 700; color: #1c384a; }
  .badge {
    display: inline-block;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 600;
    margin-top: 4px;
  }
  .badge-abierta { background: #fef9c3; color: #854d0e; }
  .badge-cerrada { background: #dcfce7; color: #166534; }
  h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #374151;
    margin: 20px 0 8px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px;
  }
  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px 20px;
  }
  .info-item { break-inside: avoid; }
  .info-label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
  .info-valor { font-size: 12px; font-weight: 500; }
  .texto-largo { white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td {
    border: 1px solid #e5e7eb;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
    font-size: 11px;
  }
  th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; color: #4b5563; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .totales { margin-top: 8px; text-align: right; font-size: 12px; font-weight: 600; }
  .pie { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: right; }
</style>
</head>
<body>
  <div class="encabezado">
    ${configuracion.logoDataUrl ? `<img src="${configuracion.logoDataUrl}" alt="" />` : ""}
    <div>
      <div class="encabezado-empresa">${escapeHtml(configuracion.nombre)}</div>
      <div class="encabezado-sub">Orden de Trabajo</div>
    </div>
    <div class="encabezado-derecha">
      <div class="titulo">${escapeHtml(ot.codigo)}</div>
      <span class="badge ${ot.estado.rstatus === "CERRADA" ? "badge-cerrada" : "badge-abierta"}">
        ${escapeHtml(ot.estado.status)}
      </span>
    </div>
  </div>

  <h2>Datos generales</h2>
  <div class="info-grid">
    ${filaInfo("Descripción", ot.descripcion)}
    ${filaInfo("Clase", ot.clase?.nombre ?? "—")}
    ${filaInfo("Categoría", ot.categoria?.nombre ?? "—")}
    ${filaInfo("Destino", destino)}
    ${filaInfo("Prioridad", PRIORIDAD_OT_LABEL[ot.prioridad])}
    ${filaInfo("Departamento", ot.departamento ?? "—")}
    ${filaInfo("Fecha", fmtFecha(ot.fecha))}
    ${filaInfo("Fecha inicio", fmtFecha(ot.fechaInicio))}
    ${filaInfo("Fecha fin planificado", fmtFecha(ot.fechaFinPlanificado))}
    ${filaInfo("Fecha cerrado", fmtFecha(ot.fechaCerrado))}
    ${filaInfo("Duración estimada (hs)", fmtNum(ot.duracionEstimada))}
    ${filaInfo("Duración real (hs)", fmtNum(ot.duracionReal))}
    ${filaInfo("Originador", fmtPersona(ot.originador))}
    ${filaInfo("Responsable", fmtPersona(ot.responsable))}
    ${filaInfo("Plan de MP asociado", ot.mantenimientoPreventivo?.codigo ?? "—")}
    ${filaInfo("Costo", ot.costo !== null ? `$${ot.costo}` : "—")}
    ${filaInfo("Horas totales", fmtNum(ot.hsTotales))}
  </div>

  ${
    ot.falla
      ? `<h2>Falla</h2><div class="texto-largo">${escapeHtml(ot.falla)}</div>`
      : ""
  }
  ${
    ot.comentarios
      ? `<h2>Comentarios</h2><div class="texto-largo">${escapeHtml(ot.comentarios)}</div>`
      : ""
  }

  <h2>Tareas (${ot.tareas.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Estado</th>
        <th>Operario</th>
        <th>Fecha</th>
        <th class="num">Horas</th>
        <th class="num">Costo</th>
        <th>Piezas utilizadas</th>
      </tr>
    </thead>
    <tbody>
      ${filasTareas || `<tr><td colspan="7">Sin tareas cargadas.</td></tr>`}
    </tbody>
  </table>
  <div class="totales">
    Total horas tareas: ${totalHorasTareas} &nbsp;&nbsp; Total costo tareas: $${totalCostoTareas}
  </div>

  <div class="pie">
    Generado el ${new Date().toLocaleString("es-AR")}
    ${ot.actualizadoPor ? ` — Última actualización por ${escapeHtml(ot.actualizadoPor)}` : ""}
  </div>
</body>
</html>`;
}

export async function generarPdfOT(id: string): Promise<{ buffer: Buffer; codigo: string }> {
  const datos = await obtenerDatosReporteOT(id);
  const html = construirHtmlReporteOT(datos);
  const pagina = await renderizarHtml(html);
  try {
    const pdf = await pagina.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });
    return { buffer: Buffer.from(pdf), codigo: datos.ot.codigo };
  } finally {
    await pagina.close();
  }
}

export async function generarJpgOT(id: string): Promise<{ buffer: Buffer; codigo: string }> {
  const datos = await obtenerDatosReporteOT(id);
  const html = construirHtmlReporteOT(datos);
  const pagina = await renderizarHtml(html);
  try {
    await pagina.setViewport({ width: 1000, height: 1400 });
    const jpg = await pagina.screenshot({ type: "jpeg", quality: 90, fullPage: true });
    return { buffer: Buffer.from(jpg), codigo: datos.ot.codigo };
  } finally {
    await pagina.close();
  }
}

export async function generarExcelOT(id: string): Promise<{ buffer: Buffer; codigo: string }> {
  const { ot, configuracion } = await obtenerDatosReporteOT(id);

  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet("OT", { properties: { defaultColWidth: 18 } });

  if (configuracion.logoDataUrl) {
    const match = configuracion.logoDataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
    if (match) {
      const imageId = workbook.addImage({
        base64: match[2],
        extension: match[1] as "png" | "jpeg",
      });
      hoja.addImage(imageId, "A1:B3");
    }
  }

  hoja.mergeCells("C1:G1");
  hoja.getCell("C1").value = configuracion.nombre;
  hoja.getCell("C1").font = { bold: true, size: 16, color: { argb: "FF1C384A" } };

  hoja.mergeCells("C2:G2");
  hoja.getCell("C2").value = `Orden de Trabajo ${ot.codigo}`;
  hoja.getCell("C2").font = { size: 12, color: { argb: "FF6B7280" } };

  let fila = 5;
  const destino = ot.aeronave
    ? ot.aeronave.matricula
    : ot.activo
      ? `${ot.activo.clase.nombre} (Código ${ot.activo.codigo})`
      : "—";

  const datosGenerales: [string, string][] = [
    ["Estado", ot.estado.status],
    ["Descripción", ot.descripcion],
    ["Clase", ot.clase?.nombre ?? "—"],
    ["Categoría", ot.categoria?.nombre ?? "—"],
    ["Destino", destino],
    ["Prioridad", PRIORIDAD_OT_LABEL[ot.prioridad]],
    ["Departamento", ot.departamento ?? "—"],
    ["Fecha", fmtFecha(ot.fecha)],
    ["Fecha inicio", fmtFecha(ot.fechaInicio)],
    ["Fecha fin planificado", fmtFecha(ot.fechaFinPlanificado)],
    ["Fecha cerrado", fmtFecha(ot.fechaCerrado)],
    ["Duración estimada (hs)", fmtNum(ot.duracionEstimada)],
    ["Duración real (hs)", fmtNum(ot.duracionReal)],
    ["Originador", fmtPersona(ot.originador)],
    ["Responsable", fmtPersona(ot.responsable)],
    ["Costo", ot.costo !== null ? String(ot.costo) : "—"],
    ["Horas totales", fmtNum(ot.hsTotales)],
  ];

  hoja.getCell(`A${fila}`).value = "Datos generales";
  hoja.getCell(`A${fila}`).font = { bold: true };
  fila++;
  for (const [label, valor] of datosGenerales) {
    hoja.getCell(`A${fila}`).value = label;
    hoja.getCell(`A${fila}`).font = { bold: true };
    hoja.getCell(`B${fila}`).value = valor;
    fila++;
  }

  fila += 1;
  hoja.getCell(`A${fila}`).value = `Tareas (${ot.tareas.length})`;
  hoja.getCell(`A${fila}`).font = { bold: true };
  fila++;

  const encabezadoTareas = ["Descripción", "Estado", "Operario", "Fecha", "Horas", "Costo", "Piezas utilizadas"];
  encabezadoTareas.forEach((texto, i) => {
    const celda = hoja.getCell(fila, i + 1);
    celda.value = texto;
    celda.font = { bold: true };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  });
  fila++;

  for (const t of ot.tareas) {
    hoja.getCell(fila, 1).value = t.descripcion;
    hoja.getCell(fila, 2).value = t.estado.status;
    hoja.getCell(fila, 3).value = fmtPersona(t.personal);
    hoja.getCell(fila, 4).value = fmtFecha(t.fecha);
    hoja.getCell(fila, 5).value = t.horas ?? "";
    hoja.getCell(fila, 6).value = t.costo ?? "";
    hoja.getCell(fila, 7).value = t.piezas
      .map((p) => `${p.pieza.nombre} (${p.cantidad} ${p.pieza.unidadMedida})`)
      .join(", ");
    fila++;
  }

  hoja.getColumn(1).width = 32;
  hoja.getColumn(2).width = 20;
  hoja.getColumn(7).width = 32;

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buffer), codigo: ot.codigo };
}
