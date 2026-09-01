import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios | Aeromanten",
};

const servicios = [
  {
    title: "Mantenimiento preventivo",
    description:
      "Planificación y ejecución de las tareas de mantenimiento programado establecidas por el fabricante y la autoridad aeronáutica, para reducir fallas y prolongar la vida útil de la aeronave.",
  },
  {
    title: "Mantenimiento correctivo",
    description:
      "Diagnóstico de fallas y reparación con repuestos homologados, minimizando el tiempo en tierra de la aeronave.",
  },
  {
    title: "Inspecciones y certificaciones",
    description:
      "Gestión de inspecciones periódicas obligatorias y de la documentación necesaria para mantener vigente la aeronavegabilidad.",
  },
  {
    title: "Gestión de flota",
    description:
      "Seguimiento ordenado del historial de mantenimiento de cada aeronave, disponible para el propietario en todo momento.",
  },
  {
    title: "Asesoramiento técnico",
    description:
      "Acompañamiento a empresas con aeronaves propias o alquiladas en la planificación de su mantenimiento y cumplimiento normativo.",
  },
];

export default function ServiciosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-celeste-700">
        Servicios
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-gris-900">
        Mantenimiento aeronáutico integral
      </h1>
      <p className="mt-4 max-w-2xl text-gris-600">
        Acompañamos a empresas con flotas pequeñas en cada etapa del
        mantenimiento de sus aeronaves, propias o alquiladas.
      </p>

      <div className="mt-12 space-y-8">
        {servicios.map((servicio) => (
          <div
            key={servicio.title}
            className="border-l-2 border-marron-400 pl-6"
          >
            <h2 className="text-lg font-semibold text-gris-900">
              {servicio.title}
            </h2>
            <p className="mt-2 max-w-2xl text-gris-600">
              {servicio.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
