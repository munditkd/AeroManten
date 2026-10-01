import { ActionForm } from "@/app/_components/action-form";
import { importarActivos } from "./actions";

export default async function ImportacionPage({
  searchParams,
}: {
  searchParams: Promise<{ importados?: string }>;
}) {
  const { importados } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Importación de Activos</h1>
      <p className="mt-1 text-sm text-gris-500">
        Carga masiva de componentes desde un archivo Excel. Se revisa todo el archivo antes de
        importar: si hay algún error, no se carga nada hasta corregirlo.
      </p>

      {importados && (
        <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Se importaron {importados} activo(s) correctamente.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">1. Descargar la plantilla</h2>
          <p className="mt-2 text-sm text-gris-600">
            Usá siempre esta plantilla como base: tiene las columnas con el nombre exacto que
            el sistema espera. La fila 2 es un ejemplo (en gris, cursiva) — borrala o
            reemplazala antes de cargar tus datos reales.
          </p>
          <a
            href="/admin/importacion/plantilla"
            className="mt-4 inline-block rounded-md bg-celeste-700 px-4 py-2 text-sm font-medium text-white hover:bg-celeste-800"
          >
            Descargar plantilla (.xlsx)
          </a>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-gris-500">
            Columnas
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-gris-500">
            <li>
              <strong className="text-gris-700">Tipo</strong> — obligatorio.
            </li>
            <li>Fabricante, Numero de Parte, Numero de Serie — opcionales.</li>
            <li>Fecha de Fabricacion — opcional, formato DD/MM/AAAA.</li>
            <li>Horas TSN / Horas TSO — opcionales, números (pueden tener decimales).</li>
            <li>Ciclos TSN / Ciclos TSO / Meses TSN / Meses TSO — opcionales, números enteros.</li>
            <li>
              <strong className="text-gris-700">Aeronave (Matricula)</strong> — opcional; tiene
              que coincidir con una matrícula ya cargada. Vacío = en depósito.
            </li>
            <li>
              <strong className="text-gris-700">Estado</strong> — opcional; tiene que coincidir
              con un estado ya cargado para Activos. Vacío = sin clasificar.
            </li>
          </ul>
          <p className="mt-4 text-xs text-gris-400">
            Un activo se considera duplicado (y no se importa) si ya existe otro con la misma
            combinación de Fabricante + Numero de Parte + Numero de Serie.
          </p>
        </div>

        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">2. Subir el archivo completo</h2>
          <ActionForm action={importarActivos} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Archivo Excel (.xlsx) *
              </label>
              <input
                name="archivo"
                type="file"
                accept=".xlsx"
                required
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Verificar e importar
            </button>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
