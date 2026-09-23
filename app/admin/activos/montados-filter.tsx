"use client";

import { useRouter } from "next/navigation";

export function MontadosFilter({
  aeronaves,
  selectedAeronaveId,
  active,
}: {
  aeronaves: { id: string; matricula: string }[];
  selectedAeronaveId?: string;
  active: boolean;
}) {
  const router = useRouter();

  return (
    <label
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium ${
        active
          ? "border-celeste-700 bg-celeste-700 text-white"
          : "border-gris-300 text-gris-700 hover:bg-gris-50"
      }`}
    >
      Activos montados
      <select
        value={selectedAeronaveId ?? ""}
        onChange={(e) => {
          const aeronaveId = e.target.value;
          router.push(
            aeronaveId
              ? `/admin/activos?vista=montados&aeronaveId=${aeronaveId}`
              : "/admin/activos?vista=montados"
          );
        }}
        className={`rounded border px-1 py-0.5 text-xs ${
          active
            ? "border-white bg-celeste-700 text-white"
            : "border-gris-300 bg-white text-gris-700"
        }`}
      >
        <option value="">Todas las matrículas</option>
        {aeronaves.map((aeronave) => (
          <option key={aeronave.id} value={aeronave.id}>
            {aeronave.matricula}
          </option>
        ))}
      </select>
    </label>
  );
}
