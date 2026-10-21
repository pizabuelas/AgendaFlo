import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Encabezado reutilizable de las páginas de contenido (institucional).
 * Mantiene la misma jerarquía visual en toda la web.
 */
export function EncabezadoPagina({
  eyebrow,
  titulo,
  descripcion,
  className,
  children,
}: {
  eyebrow?: string;
  titulo: string;
  descripcion?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={cn("max-w-3xl", className)}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {titulo}
      </h1>
      {descripcion ? (
        <div className="mt-3 text-base leading-relaxed text-ink-muted">{descripcion}</div>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
