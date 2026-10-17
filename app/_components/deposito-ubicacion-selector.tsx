"use client";

import { useState } from "react";

type Deposito = { id: string; nombre: string };
type Ubicacion = { id: string; codigo: string; depositoId: string; descripcion?: string | null };

// Depósito (obligatorio) + Ubicación (opcional) en cascada: elegir un
// Depósito filtra el segundo select a sus Ubicaciones. Si hay un solo
// Depósito cargado y no se pasó un valor inicial (alta nueva), se
// preselecciona solo para no obligar a elegir entre una única opción.
export function DepositoUbicacionSelector({
  depositos,
  ubicaciones,
  depositoIdInicial,
  ubicacionIdInicial = "",
}: {
  depositos: Deposito[];
  ubicaciones: Ubicacion[];
  depositoIdInicial?: string;
  ubicacionIdInicial?: string;
}) {
  const defaultDepositoId =
    depositoIdInicial ?? (depositos.length === 1 ? depositos[0].id : "");
  const [depositoId, setDepositoId] = useState(defaultDepositoId);

  const ubicacionesFiltradas = ubicaciones.filter((u) => u.depositoId === depositoId);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gris-700">Depósito *</label>
        <select
          name="depositoId"
          value={depositoId}
          required
          onChange={(e) => setDepositoId(e.target.value)}
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          <option value="" disabled>
            Seleccioná un depósito
          </option>
          {depositos.map((deposito) => (
            <option key={deposito.id} value={deposito.id}>
              {deposito.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gris-700">Ubicación</label>
        <select
          key={depositoId}
          name="ubicacionId"
          defaultValue={depositoId === defaultDepositoId ? ubicacionIdInicial : ""}
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          <option value="">Sin ubicación</option>
          {ubicacionesFiltradas.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>
              {ubicacion.codigo}
              {ubicacion.descripcion ? ` — ${ubicacion.descripcion}` : ""}
            </option>
          ))}
        </select>
        {depositoId && ubicacionesFiltradas.length === 0 && (
          <p className="mt-1 text-xs text-gris-400">Este depósito todavía no tiene ubicaciones.</p>
        )}
      </div>
    </div>
  );
}
