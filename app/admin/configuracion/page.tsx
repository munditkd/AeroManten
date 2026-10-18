import { obtenerConfiguracionEmpresa } from "@/lib/configuracion-empresa";
import { actualizarConfiguracionEmpresa } from "./actions";
import { ActionForm } from "@/app/_components/action-form";

export default async function ConfiguracionPage() {
  const configuracion = await obtenerConfiguracionEmpresa();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gris-900">Configuración</h1>
      <p className="mt-1 text-sm text-gris-500">
        Nombre y logo de la empresa que aparecen en el encabezado de los reportes
        (PDF, Excel, JPG).
      </p>

      <div className="mt-8 max-w-md">
        <div className="rounded-lg border border-gris-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gris-900">Empresa</h2>
          <ActionForm action={actualizarConfiguracionEmpresa} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Nombre de la empresa *
              </label>
              <input
                name="nombre"
                required
                defaultValue={configuracion.nombre}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">Logo</label>
              {configuracion.logoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={configuracion.logoDataUrl}
                  alt="Logo actual"
                  className="mt-2 h-16 w-16 rounded border border-gris-200 object-contain p-1"
                />
              )}
              <input
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="mt-2 w-full text-sm"
              />
              <p className="mt-1 text-xs text-gris-400">
                PNG, JPG o WEBP, hasta 2 MB. Dejalo vacío para mantener el logo actual.
              </p>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
            >
              Guardar
            </button>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
