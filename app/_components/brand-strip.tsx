// "empresa" es opcional: solo se pasa desde el layout del admin (no desde
// las pantallas públicas de login/registro), y solo tiene contenido cuando
// el Propietario cargó su Empresa/Logo (ver lib/configuracion-empresa.ts).
export function BrandStrip({
  empresa,
}: {
  empresa?: { empresa: string; logoDataUrl: string | null } | null;
}) {
  return (
    <div className="bg-celeste-900 px-4 py-2 text-center sm:px-6">
      <p className="text-sm font-semibold tracking-widest text-white">
        AEROMANTEN
      </p>
      <p className="text-xs text-celeste-200">Mantenimiento Aeronáutico</p>
      {empresa && (
        <div className="mt-1.5 flex items-center justify-center gap-2 border-t border-celeste-700 pt-1.5">
          {empresa.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={empresa.logoDataUrl} alt="" className="h-5 w-5 object-contain" />
          )}
          <p className="text-xs font-medium text-celeste-100">{empresa.empresa}</p>
        </div>
      )}
    </div>
  );
}
