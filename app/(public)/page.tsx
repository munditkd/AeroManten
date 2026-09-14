import Link from "next/link";

const servicios = [
  {
    title: "Mantenimiento preventivo",
    description:
      "Inspecciones periódicas y tareas programadas para mantener tu aeronave en condiciones óptimas de operación.",
  },
  {
    title: "Mantenimiento correctivo",
    description:
      "Diagnóstico y reparación de fallas con repuestos homologados y personal técnico certificado.",
  },
  {
    title: "Inspecciones y certificaciones",
    description:
      "Gestión de inspecciones obligatorias y trámites de aeronavegabilidad ante la autoridad correspondiente.",
  },
  {
    title: "Gestión de flota",
    description:
      "Seguimiento del historial de mantenimiento de cada aeronave, con registro ordenado y disponible para el propietario.",
  },
];

const razones = [
  "Personal técnico con experiencia en mantenimiento aeronáutico",
  "Cumplimiento de normativa y plazos de aeronavegabilidad",
  "Atención personalizada para empresas con flotas chicas o medianas",
  "Registro claro y trazable del historial de cada aeronave",
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-celeste-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-celeste-300">
            Mantenimiento Aeronáutico
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Mantenimiento aeronáutico confiable para tu flota
          </h1>
          <p className="mt-6 max-w-xl text-lg text-celeste-100">
            Trabajamos con empresas que operan aeronaves propias o
            alquiladas, asegurando que cada mantenimiento se realice a tiempo
            y conforme a la normativa vigente.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contacto"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-celeste-900 transition-colors hover:bg-celeste-100"
            >
              Contactanos
            </Link>
            <Link
              href="/servicios"
              className="rounded-md border border-celeste-400 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-celeste-800"
            >
              Ver servicios
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold text-gris-900">
          Nuestros servicios
        </h2>
        <p className="mt-2 max-w-2xl text-gris-600">
          Un servicio integral de mantenimiento pensado para empresas que
          necesitan mantener sus aeronaves operativas de forma segura y
          ordenada.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {servicios.map((servicio) => (
            <div
              key={servicio.title}
              className="rounded-lg border border-gris-200 bg-white p-6"
            >
              <div className="h-1 w-10 rounded-full bg-marron-500" />
              <h3 className="mt-4 text-base font-semibold text-gris-900">
                {servicio.title}
              </h3>
              <p className="mt-2 text-sm text-gris-600">
                {servicio.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gris-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-gris-900">
            Por qué elegir Aeromanten
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {razones.map((razon) => (
              <li key={razon} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-celeste-600" />
                <span className="text-gris-700">{razon}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-semibold text-gris-900">
          ¿Necesitás mantenimiento para tu aeronave?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-gris-600">
          Contactanos para coordinar una evaluación y armar un plan de
          mantenimiento a medida de tu operación.
        </p>
        <Link
          href="/contacto"
          className="mt-6 inline-block rounded-md bg-celeste-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-celeste-800"
        >
          Hablemos
        </Link>
      </section>
    </div>
  );
}
