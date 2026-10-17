"use client";

import { useState } from "react";

type Clase = { id: string; nombre: string };
type Categoria = { id: string; nombre: string; claseId: string };

// Dos <select> en cascada: elegir una Clase filtra el segundo select a las
// Categorías que le pertenecen. Al cambiar de Clase se vacía la Categoría
// elegida (key={claseId} fuerza el remount del segundo select).
export function ClaseCategoriaSelector({
  clases,
  categorias,
  claseIdInicial = "",
  categoriaIdInicial = "",
}: {
  clases: Clase[];
  categorias: Categoria[];
  claseIdInicial?: string;
  categoriaIdInicial?: string;
}) {
  const [claseId, setClaseId] = useState(claseIdInicial);

  const categoriasFiltradas = categorias.filter((categoria) => categoria.claseId === claseId);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gris-700">Clase</label>
        <select
          name="claseId"
          value={claseId}
          onChange={(e) => setClaseId(e.target.value)}
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          <option value="">Sin clasificar</option>
          {clases.map((clase) => (
            <option key={clase.id} value={clase.id}>
              {clase.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gris-700">Categoría</label>
        <select
          key={claseId}
          name="categoriaId"
          defaultValue={claseId === claseIdInicial ? categoriaIdInicial : ""}
          className="mt-1 w-full rounded-md border border-gris-300 px-3 py-2 text-sm focus:border-celeste-600 focus:outline-none"
        >
          <option value="">Sin categoría</option>
          {categoriasFiltradas.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
        {claseId && categoriasFiltradas.length === 0 && (
          <p className="mt-1 text-xs text-gris-400">Esta clase todavía no tiene categorías.</p>
        )}
      </div>
    </div>
  );
}
