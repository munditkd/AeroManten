"use client";

import { useState } from "react";

type Aeronave = { id: string; matricula: string };
type Deposito = { id: string; nombre: string };
type Ubicacion = { id: string; codigo: string; depositoId: string };

// Un activo montado en una aeronave no está en depósito: elegir una
// aeronave acá oculta (y por lo tanto no envía) los campos Depósito/
// Ubicación, que el server fuerza a null sin importar lo que se mande (ver
// createActivo/updateActivo). Al dejarlo en "Sin aeronave" vuelven a
// aparecer, con Depósito obligatorio.
export function AeronaveDepositoSelector({
  aeronaves,
  depositos,
  ubicaciones,
  aeronaveIdInicial = "",
  depositoIdInicial,
  ubicacionIdInicial = "",
}: {
  aeronaves: Aeronave[];
  depositos: Deposito[];
  ubicaciones: Ubicacion[];
  aeronaveIdInicial?: string;
  depositoIdInicial?: string;
  ubicacionIdInicial?: string;
}) {
  const [aeronaveId, setAeronaveId] = useState(aeronaveIdInicial);
  const montado = aeronaveId !== "";

  const defaultDepositoId = depositoIdInicial ?? (depositos.length === 1 ? depositos[0].id : "");
  const [depositoId, setDepositoId] = useState(defaultDepositoId);
  const ubicacionesFiltradas = ubicaciones.filter((u) => u.depositoId === depositoId);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gris-700">Aeronave</label>
        <select
          name="aeronaveId"
          value={aeronaveId}
          onChange={(e) => setAeronaveId(e.target.value)}
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          <option value="">Sin aeronave (en depósito)</option>
          {aeronaves.map((aeronave) => (
            <option key={aeronave.id} value={aeronave.id}>
              {aeronave.matricula}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gris-400">
          Dejalo vacío si el componente está en depósito como repuesto.
        </p>
      </div>

      {montado ? (
        <p className="rounded-md bg-gris-50 px-3 py-2 text-xs text-gris-500">
          Al estar montado en una aeronave, este componente no tiene depósito ni ubicación.
        </p>
      ) : (
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
                </option>
              ))}
            </select>
            {depositoId && ubicacionesFiltradas.length === 0 && (
              <p className="mt-1 text-xs text-gris-400">
                Este depósito todavía no tiene ubicaciones.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
