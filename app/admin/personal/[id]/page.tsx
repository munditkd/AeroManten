import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROL_LABEL, ROLES_PERSONAL } from "@/lib/personal";
import { updatePersonal, deletePersonal } from "../actions";

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function PersonalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const persona = await prisma.personal.findUnique({ where: { id } });
  if (!persona) notFound();

  const updatePersonalWithId = updatePersonal.bind(null, persona.id);
  const deletePersonalWithId = deletePersonal.bind(null, persona.id);

  return (
    <div>
      <Link href="/admin/personal" className="text-sm text-gris-500 hover:text-celeste-700">
        ← Personal
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gris-900">
        {persona.apellido}, {persona.nombre}
      </h1>
      <p className="mt-1 text-sm text-gris-500">{ROL_LABEL[persona.rol]}</p>

      <div className="mt-8 max-w-xl rounded-lg border border-gris-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gris-900">Datos de la persona</h2>
        <form action={updatePersonalWithId} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Nombre *
              </label>
              <input
                name="nombre"
                required
                defaultValue={persona.nombre}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Apellido *
              </label>
              <input
                name="apellido"
                required
                defaultValue={persona.apellido}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">
              Rol *
            </label>
            <select
              name="rol"
              required
              defaultValue={persona.rol}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            >
              {ROLES_PERSONAL.map((rol) => (
                <option key={rol} value={rol}>
                  {ROL_LABEL[rol]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                DNI
              </label>
              <input
                name="dni"
                defaultValue={persona.dni ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Legajo
              </label>
              <input
                name="legajo"
                defaultValue={persona.legajo ?? ""}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">
              Teléfono
            </label>
            <input
              name="telefono"
              defaultValue={persona.telefono ?? ""}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={persona.email ?? ""}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gris-700">
              Fecha de nacimiento
            </label>
            <input
              name="fechaNacimiento"
              type="date"
              defaultValue={toDateInput(persona.fechaNacimiento)}
              className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
            />
          </div>

          <div className="border-t border-gris-100 pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gris-700">
              <input
                name="habilitado"
                type="checkbox"
                defaultChecked={persona.habilitado}
                className="rounded border-gris-300"
              />
              Habilitado
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Inicio habilitación
              </label>
              <input
                name="fechaInicioHabilitacion"
                type="date"
                defaultValue={toDateInput(persona.fechaInicioHabilitacion)}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gris-700">
                Vencimiento
              </label>
              <input
                name="fechaVencimientoHabilitacion"
                type="date"
                defaultValue={toDateInput(persona.fechaVencimientoHabilitacion)}
                className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-celeste-700 py-2 text-sm font-medium text-white hover:bg-celeste-800"
          >
            Guardar cambios
          </button>
        </form>

        <form action={deletePersonalWithId} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar persona
          </button>
        </form>
      </div>
    </div>
  );
}
