import Link from "next/link";

import { Marca } from "./Marca";

const COLUMNAS = [
  {
    titulo: "Producto",
    enlaces: [
      { etiqueta: "Servicios", href: "/servicios" },
      { etiqueta: "Mis citas", href: "/mis-reservas" },
      { etiqueta: "Panel de administración", href: "/admin" },
    ],
  },
  {
    titulo: "Compañía",
    enlaces: [
      { etiqueta: "Cómo funciona", href: "/como-funciona" },
      { etiqueta: "Contacto", href: "/contacto" },
      { etiqueta: "Accesibilidad", href: "/accesibilidad" },
    ],
  },
  {
    titulo: "Legal",
    enlaces: [
      { etiqueta: "Términos y condiciones", href: "/legal/terminos" },
      { etiqueta: "Aviso de privacidad", href: "/legal/privacidad" },
    ],
  },
];

export function PieDePagina() {
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Marca />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              AgendaFlow simplifica la gestión de citas: compara profesionales,
              elige el horario disponible y confirma tu reserva en menos de un
              minuto.
            </p>
            <p className="mt-4 text-xs text-ink-subtle">
              Proyecto académico · Requerimientos de proyecto web
            </p>
          </div>

          {COLUMNAS.map((columna) => (
            <nav key={columna.titulo} aria-label={columna.titulo}>
              <h2 className="text-sm font-semibold text-ink">{columna.titulo}</h2>
              <ul className="mt-4 space-y-2.5">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.href}>
                    <Link
                      href={enlace.href}
                      className="text-sm text-ink-muted transition hover:text-brand-600"
                    >
                      {enlace.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-xs text-ink-subtle">
            © {anio} AgendaFlow. Todos los derechos reservados.
          </p>
          <p className="text-xs text-ink-subtle">
            Construido con Next.js, Prisma, PostgreSQL y Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
}
