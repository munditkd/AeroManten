"use client";

import { useState } from "react";
import type { TablaAuditable } from "@/lib/auditoria-config";

// Solo los dos <select>: van dentro del <form>/ActionForm que arma la
// página, así que sus valores se mandan igual al hacer submit.
export function CampoSelector({ tablas }: { tablas: TablaAuditable[] }) {
  const [tablaSeleccionada, setTablaSeleccionada] = useState(tablas[0]?.tabla ?? "");
  const tabla = tablas.find((t) => t.tabla === tablaSeleccionada);

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gris-700">Tabla</label>
        <select
          name="tabla"
          value={tablaSeleccionada}
          onChange={(e) => setTablaSeleccionada(e.target.value)}
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          {tablas.map((t) => (
            <option key={t.tabla} value={t.tabla}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gris-700">Campo</label>
        <select
          name="campo"
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          {tabla?.campos.map((c) => (
            <option key={c.nombre} value={c.nombre}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
