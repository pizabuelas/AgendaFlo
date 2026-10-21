"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

import { Boton } from "@/components/ui/Boton";

/**
 * Página de error global (RNF-01).
 * Captura los errores no controlados del renderizado del servidor y ofrece al
 * usuario una forma clara de recuperarse.
 */
export default function PaginaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En un entorno real este error se enviaría a un servicio de monitorización.
    console.error("[AgendaFlow] Error no controlado:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <TriangleAlert aria-hidden="true" className="size-8" />
      </span>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-danger">
        Error inesperado
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Algo no ha ido como esperábamos
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-muted">
        Se ha producido un error al cargar esta página. Puedes reintentarlo o volver
        al inicio; si el problema persiste, escríbenos y lo revisaremos.
      </p>

      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-ink-subtle">
          Código de error: {error.digest}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Boton onClick={reset} icono={<RefreshCw aria-hidden="true" className="size-4" />}>
          Reintentar
        </Boton>
        <Link href="/">
          <Boton variante="contorno">Ir al inicio</Boton>
        </Link>
      </div>
    </div>
  );
}
