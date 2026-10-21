import Link from "next/link";
import { Compass } from "lucide-react";

import { Boton } from "@/components/ui/Boton";

/**
 * Página 404 (RNF-01).
 * Se muestra cuando la ruta solicitada no existe en la aplicación.
 */
export default function PaginaNoEncontrada() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
        <Compass aria-hidden="true" className="size-8" />
      </span>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand-600">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-muted">
        El enlace que has followed no existe o ha cambiado de ubicación. Puedes volver
        al inicio o explorar el catálogo de servicios.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Boton>Ir al inicio</Boton>
        </Link>
        <Link href="/servicios">
          <Boton variante="contorno">Ver servicios</Boton>
        </Link>
      </div>
    </div>
  );
}
