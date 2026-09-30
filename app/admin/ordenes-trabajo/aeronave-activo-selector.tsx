"use client";

import { useState } from "react";

type Aeronave = { id: string; matricula: string };
type Activo = { id: string; tipo: string; codigo: number; aeronaveId: string | null };

// Dos <select> en cascada: elegir una aeronave filtra el segundo select a
// los activos montados en ella; dejarlo en "Sin aeronave" filtra a los
// activos en depósito. Si además se elige un activo puntual, la OT queda
// sobre ese activo (el server action limpia "aeronaveId" en ese caso).
export function AeronaveActivoSelector({
  aeronaves,
  activos,
}: {
  aeronaves: Aeronave[];
  activos: Activo[];
}) {
  const [aeronaveId, setAeronaveId] = useState("");

  const activosFiltrados = activos.filter((activo) => (activo.aeronaveId ?? "") === aeronaveId);

  return (
    <div className="space-y-3 border-t border-gris-100 pt-3">
      <div>
        <label className="block text-xs font-medium text-gris-700">Aeronave</label>
        <select
          name="aeronaveId"
          value={aeronaveId}
          onChange={(e) => setAeronaveId(e.target.value)}
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          <option value="">Sin aeronave (activos en depósito)</option>
          {aeronaves.map((aeronave) => (
            <option key={aeronave.id} value={aeronave.id}>
              {aeronave.matricula}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gris-700">Activo</label>
        <select
          key={aeronaveId}
          name="activoId"
          defaultValue=""
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          <option value="">
            {aeronaveId
              ? "Ningún activo (la OT es sobre la aeronave completa)"
              : "Ningún activo específico"}
          </option>
          {activosFiltrados.map((activo) => (
            <option key={activo.id} value={activo.id}>
              {activo.tipo} (Código {activo.codigo})
            </option>
          ))}
        </select>
        {activosFiltrados.length === 0 && (
          <p className="mt-1 text-xs text-gris-400">
            {aeronaveId
              ? "Esta aeronave no tiene activos montados."
              : "No hay activos en depósito."}
          </p>
        )}
      </div>
    </div>
  );
}
