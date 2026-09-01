import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | Aeromanten",
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-celeste-700">
        Contacto
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-gris-900">
        Hablemos de tu aeronave
      </h1>
      <p className="mt-4 max-w-2xl text-gris-600">
        Escribinos o llamanos para coordinar una evaluación de mantenimiento
        a medida de tu operación.
      </p>

      <div className="mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-gris-200 p-6">
          <p className="text-sm font-semibold text-gris-500">Teléfono</p>
          <p className="mt-1 text-gris-900">A completar</p>
        </div>
        <div className="rounded-lg border border-gris-200 p-6">
          <p className="text-sm font-semibold text-gris-500">Email</p>
          <p className="mt-1 text-gris-900">contacto@aeromanten.com.ar</p>
        </div>
        <div className="rounded-lg border border-gris-200 p-6">
          <p className="text-sm font-semibold text-gris-500">Dirección</p>
          <p className="mt-1 text-gris-900">A completar</p>
        </div>
        <div className="rounded-lg border border-gris-200 p-6">
          <p className="text-sm font-semibold text-gris-500">Horario</p>
          <p className="mt-1 text-gris-900">A completar</p>
        </div>
      </div>
    </div>
  );
}
