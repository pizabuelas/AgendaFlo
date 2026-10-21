import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Indicador de carga accesible. */
export function Spinner({ className, etiqueta = "Cargando" }: { className?: string; etiqueta?: string }) {
  return (
    <span role="status" aria-label={etiqueta} className="inline-flex">
      <Loader2 aria-hidden="true" className={cn("size-5 animate-spin", className)} />
      <span className="sr-only">{etiqueta}</span>
    </span>
  );
}
