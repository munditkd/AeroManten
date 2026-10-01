import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Definición única de las columnas: de acá sale tanto la plantilla
// descargable como la lectura/validación del archivo subido. El orden de
// las columnas en el Excel no importa, se buscan por el texto del
// encabezado (sin mayúsculas/espacios de más).
const COLUMNAS = [
  { header: "Tipo", campo: "tipo", requerido: true, tipo: "texto" as const },
  { header: "Fabricante", campo: "marca", requerido: false, tipo: "texto" as const },
  { header: "Numero de Parte", campo: "modelo", requerido: false, tipo: "texto" as const },
  { header: "Numero de Serie", campo: "numeroSerie", requerido: false, tipo: "texto" as const },
  {
    header: "Fecha de Fabricacion",
    campo: "fechaFabricacion",
    requerido: false,
    tipo: "fecha" as const,
  },
  { header: "Horas TSN", campo: "horasTSN", requerido: false, tipo: "decimal" as const },
  { header: "Horas TSO", campo: "horasTSO", requerido: false, tipo: "decimal" as const },
  { header: "Ciclos TSN", campo: "ciclosTSN", requerido: false, tipo: "entero" as const },
  { header: "Ciclos TSO", campo: "ciclosTSO", requerido: false, tipo: "entero" as const },
  { header: "Meses TSN", campo: "mesesTSN", requerido: false, tipo: "entero" as const },
  { header: "Meses TSO", campo: "mesesTSO", requerido: false, tipo: "entero" as const },
  {
    header: "Aeronave (Matricula)",
    campo: "aeronaveMatricula",
    requerido: false,
    tipo: "texto" as const,
  },
  { header: "Estado", campo: "estadoTexto", requerido: false, tipo: "texto" as const },
];

const LONGITUD_MAXIMA_TEXTO = 191; // varchar(191), como están definidas estas columnas en la base

function normalizar(texto: string) {
  return texto.trim().toLowerCase();
}

export async function generarPlantillaActivos(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet("Activos");

  hoja.columns = COLUMNAS.map((columna) => ({ header: columna.header, width: 22 }));
  hoja.getRow(1).font = { bold: true };

  const filaEjemplo = hoja.addRow([
    "Motor",
    "Lycoming",
    "O-320",
    "EJEMPLO-001",
    new Date(2020, 0, 15),
    450.5,
    120,
    1200,
    300,
    96,
    24,
    "LV-ABC",
    "Operativo",
  ]);
  filaEjemplo.font = { italic: true, color: { argb: "FF888888" } };
  filaEjemplo.getCell(5).numFmt = "dd/mm/yyyy";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

type ActivoParaCrear = Prisma.ActivoUncheckedCreateInput;

export async function validarArchivoActivos(
  buffer: Buffer
): Promise<{ datos: ActivoParaCrear[]; errores: string[] }> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    return { datos: [], errores: ["El archivo no es un Excel válido (.xlsx)."] };
  }

  const hoja = workbook.worksheets[0];
  if (!hoja) {
    return { datos: [], errores: ["El archivo no tiene ninguna hoja con datos."] };
  }

  // Mapea el texto de cada encabezado (fila 1) a su número de columna, sin
  // importar en qué orden estén.
  const filaEncabezados = hoja.getRow(1);
  const indicePorHeader = new Map<string, number>();
  filaEncabezados.eachCell((celda, colNumber) => {
    const texto = String(celda.value ?? "").trim();
    if (texto) indicePorHeader.set(normalizar(texto), colNumber);
  });

  const columnasFaltantes = COLUMNAS.filter(
    (columna) => !indicePorHeader.has(normalizar(columna.header))
  );
  if (columnasFaltantes.length > 0) {
    return {
      datos: [],
      errores: [
        `Al archivo le faltan estas columnas (usá la plantilla): ${columnasFaltantes
          .map((c) => c.header)
          .join(", ")}`,
      ],
    };
  }

  // Pre-cargo aeronaves y estados existentes para resolver matrícula/estado
  // por texto, y las combinaciones marca+modelo+numeroSerie ya usadas, para
  // detectar duplicados contra lo que ya está en la base.
  const [aeronaves, estados, activosExistentes] = await Promise.all([
    prisma.aeronave.findMany({ select: { id: true, matricula: true } }),
    prisma.estado.findMany({
      where: { tabla: "Activo", propiedad: "estado" },
      select: { id: true, status: true },
    }),
    prisma.activo.findMany({
      where: { marca: { not: null }, modelo: { not: null }, numeroSerie: { not: null } },
      select: { marca: true, modelo: true, numeroSerie: true },
    }),
  ]);

  const aeronavePorMatricula = new Map(
    aeronaves.map((a) => [normalizar(a.matricula), a.id])
  );
  const estadoPorTexto = new Map(estados.map((e) => [normalizar(e.status), e.id]));
  const combinacionesExistentes = new Set(
    activosExistentes.map((a) => `${normalizar(a.marca!)}|${normalizar(a.modelo!)}|${normalizar(a.numeroSerie!)}`)
  );
  const combinacionesEnArchivo = new Set<string>();

  const errores: string[] = [];
  const datos: ActivoParaCrear[] = [];

  for (let numeroFila = 2; numeroFila <= hoja.rowCount; numeroFila++) {
    const fila = hoja.getRow(numeroFila);
    const valores = Object.fromEntries(
      COLUMNAS.map((columna) => [
        columna.campo,
        fila.getCell(indicePorHeader.get(normalizar(columna.header))!).value,
      ])
    );

    const filaVacia = Object.values(valores).every(
      (v) => v === null || v === undefined || String(v).trim() === ""
    );
    if (filaVacia) continue;

    const errroresFila: string[] = [];

    const tipo = String(valores.tipo ?? "").trim();
    if (!tipo) {
      errroresFila.push("Tipo es obligatorio");
    } else if (tipo.length > LONGITUD_MAXIMA_TEXTO) {
      errroresFila.push(`Tipo supera los ${LONGITUD_MAXIMA_TEXTO} caracteres permitidos`);
    }

    function textoOpcional(valor: unknown, etiqueta: string): string | null {
      if (valor === null || valor === undefined || String(valor).trim() === "") return null;
      const texto = String(valor).trim();
      if (texto.length > LONGITUD_MAXIMA_TEXTO) {
        errroresFila.push(`${etiqueta} supera los ${LONGITUD_MAXIMA_TEXTO} caracteres permitidos`);
      }
      return texto;
    }

    const marca = textoOpcional(valores.marca, "Fabricante");
    const modelo = textoOpcional(valores.modelo, "Numero de Parte");
    const numeroSerie = textoOpcional(valores.numeroSerie, "Numero de Serie");

    function decimalOpcional(valor: unknown, etiqueta: string): number | null {
      if (valor === null || valor === undefined || String(valor).trim() === "") return null;
      const numero = typeof valor === "number" ? valor : Number(String(valor).replace(",", "."));
      if (!Number.isFinite(numero) || numero < 0) {
        errroresFila.push(`${etiqueta} debe ser un número válido (≥ 0)`);
        return null;
      }
      return numero;
    }

    function enteroOpcional(valor: unknown, etiqueta: string): number | null {
      if (valor === null || valor === undefined || String(valor).trim() === "") return null;
      const numero = typeof valor === "number" ? valor : Number(String(valor));
      if (!Number.isInteger(numero) || numero < 0) {
        errroresFila.push(`${etiqueta} debe ser un número entero válido (≥ 0), sin decimales`);
        return null;
      }
      return numero;
    }

    const horasTSN = decimalOpcional(valores.horasTSN, "Horas TSN");
    const horasTSO = decimalOpcional(valores.horasTSO, "Horas TSO");
    const ciclosTSN = enteroOpcional(valores.ciclosTSN, "Ciclos TSN");
    const ciclosTSO = enteroOpcional(valores.ciclosTSO, "Ciclos TSO");
    const mesesTSN = enteroOpcional(valores.mesesTSN, "Meses TSN");
    const mesesTSO = enteroOpcional(valores.mesesTSO, "Meses TSO");

    let fechaFabricacion: Date | null = null;
    const valorFecha = valores.fechaFabricacion;
    if (valorFecha !== null && valorFecha !== undefined && String(valorFecha).trim() !== "") {
      if (valorFecha instanceof Date) {
        fechaFabricacion = valorFecha;
      } else {
        const texto = String(valorFecha).trim();
        const match = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        const parsed = match
          ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
          : new Date(texto);
        if (Number.isNaN(parsed.getTime())) {
          errroresFila.push(`Fecha de Fabricacion no es una fecha válida (usá DD/MM/AAAA)`);
        } else {
          fechaFabricacion = parsed;
        }
      }
    }

    let aeronaveId: string | null = null;
    const textoAeronave = String(valores.aeronaveMatricula ?? "").trim();
    if (textoAeronave) {
      const id = aeronavePorMatricula.get(normalizar(textoAeronave));
      if (!id) {
        errroresFila.push(`La aeronave "${textoAeronave}" no existe`);
      } else {
        aeronaveId = id;
      }
    }

    let estadoId: string | null = null;
    const textoEstado = String(valores.estadoTexto ?? "").trim();
    if (textoEstado) {
      const id = estadoPorTexto.get(normalizar(textoEstado));
      if (!id) {
        errroresFila.push(`El estado "${textoEstado}" no existe para Activos`);
      } else {
        estadoId = id;
      }
    }

    if (marca && modelo && numeroSerie) {
      const clave = `${normalizar(marca)}|${normalizar(modelo)}|${normalizar(numeroSerie)}`;
      if (combinacionesExistentes.has(clave)) {
        errroresFila.push(
          `Ya existe un activo con ese Fabricante + Numero de Parte + Numero de Serie`
        );
      } else if (combinacionesEnArchivo.has(clave)) {
        errroresFila.push(
          `Fabricante + Numero de Parte + Numero de Serie repetido dentro del mismo archivo`
        );
      } else {
        combinacionesEnArchivo.add(clave);
      }
    }

    if (errroresFila.length > 0) {
      errores.push(`Fila ${numeroFila}: ${errroresFila.join("; ")}`);
      continue;
    }

    datos.push({
      tipo,
      marca,
      modelo,
      numeroSerie,
      fechaFabricacion,
      horasTSN,
      horasTSO,
      ciclosTSN,
      ciclosTSO,
      mesesTSN,
      mesesTSO,
      aeronaveId,
      estadoId,
    });
  }

  if (errores.length > 0) return { datos: [], errores };
  if (datos.length === 0) {
    return { datos: [], errores: ["El archivo no tiene filas con datos para importar."] };
  }
  return { datos, errores: [] };
}
