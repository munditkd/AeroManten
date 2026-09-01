import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | Aeromanten",
};

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-celeste-700">
        Nosotros
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-gris-900">
        Quiénes somos
      </h1>

      <div className="mt-8 max-w-3xl space-y-4 text-gris-700">
        <p>
          Aeromanten es una empresa de mantenimiento aeronáutico orientada a
          pequeñas empresas que operan aeronaves propias o alquiladas.
          Trabajamos para que cada aeronave se mantenga en condiciones seguras
          de operación, con el respaldo técnico y la documentación al día.
        </p>
        <p>
          Entendemos que para una empresa con una flota chica, cada aeronave
          fuera de servicio tiene un impacto directo en la operación. Por eso
          combinamos seguimiento técnico riguroso con atención cercana y
          personalizada a cada cliente.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-gris-200 p-6">
          <div className="h-1 w-10 rounded-full bg-celeste-600" />
          <p className="mt-4 font-semibold text-gris-900">Seguridad</p>
          <p className="mt-2 text-sm text-gris-600">
            El cumplimiento normativo y la aeronavegabilidad son la base de
            cada trabajo que realizamos.
          </p>
        </div>
        <div className="rounded-lg border border-gris-200 p-6">
          <div className="h-1 w-10 rounded-full bg-celeste-600" />
          <p className="mt-4 font-semibold text-gris-900">Cercanía</p>
          <p className="mt-2 text-sm text-gris-600">
            Trato directo y personalizado con cada empresa, sin
            intermediarios.
          </p>
        </div>
        <div className="rounded-lg border border-gris-200 p-6">
          <div className="h-1 w-10 rounded-full bg-celeste-600" />
          <p className="mt-4 font-semibold text-gris-900">Orden</p>
          <p className="mt-2 text-sm text-gris-600">
            Historial de mantenimiento claro y disponible para cada
            propietario.
          </p>
        </div>
      </div>
    </div>
  );
}
