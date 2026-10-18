// "empresa" es opcional: solo se pasa desde el layout del admin (no desde
// las pantallas públicas de login/registro), y solo tiene contenido cuando
// el Propietario cargó su Empresa/Logo (ver lib/configuracion-empresa.ts).
export function BrandStrip({
  empresa,
}: {
  empresa?: { empresa: string; logoDataUrl: string | null } | null;
}) {
  return (
    <div className="bg-celeste-900 px-4 py-2 sm:px-6">
      <div className="relative mx-auto max-w-6xl text-center">
        {empresa && (
          <div className="absolute left-0 top-1/2 hidden -translate-y-1/2 items-center gap-2 sm:flex">
            {empresa.logoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={empresa.logoDataUrl} alt="" className="h-6 w-6 object-contain" />
            )}
            <p className="text-xs font-medium text-celeste-100">{empresa.empresa}</p>
          </div>
        )}
        <p className="text-sm font-semibold tracking-widest text-white">
          AEROMANTEN
        </p>
        <p className="text-xs text-celeste-200">Mantenimiento Aeronáutico</p>
      </div>
    </div>
  );
}
