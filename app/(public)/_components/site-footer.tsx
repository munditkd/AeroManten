export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gris-200 bg-gris-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-celeste-800">AEROMANTEN</p>
          <p className="mt-2 text-sm text-gris-600">
            Mantenimiento aeronáutico para empresas con aeronaves
            propias o alquiladas.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gris-800">Contacto</p>
          <ul className="mt-2 space-y-1 text-sm text-gris-600">
            <li>Teléfono: A completar</li>
            <li>Email: contacto@aeromanten.com.ar</li>
            <li>Dirección: A completar</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-gris-800">Empresa</p>
          <ul className="mt-2 space-y-1 text-sm text-gris-600">
            <li>Servicios</li>
            <li>Nosotros</li>
            <li>Contacto</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gris-200 py-4 text-center text-xs text-gris-500">
        © {year} Aeromanten. Todos los derechos reservados.
      </div>
    </footer>
  );
}
