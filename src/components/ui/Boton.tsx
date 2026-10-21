import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

/**
 * Botón con variantes, tamaños y estado de carga.
 * Mantiene el ancho durante la carga para evitar saltos de maquetación.
 */

export type VarianteBoton = "primario" | "secundario" | "contorno" | "fantasma" | "peligro";
export type TamanoBoton = "sm" | "md" | "lg";

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 dark:disabled:bg-brand-900",
  secundario:
    "bg-surface-muted text-ink hover:bg-surface-strong border border-line",
  contorno:
    "border border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-brand-950/50",
  fantasma: "text-ink-muted hover:bg-surface-muted hover:text-ink",
  peligro:
    "bg-danger text-white shadow-sm hover:opacity-90 active:opacity-80 disabled:opacity-50",
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
  icono?: ReactNode;
  anchoCompleto?: boolean;
}

export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  icono,
  anchoCompleto = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: BotonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-xl font-medium transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTES[variante],
        TAMANOS[tamano],
        anchoCompleto && "w-full",
        className,
      )}
      {...props}
    >
      {cargando ? <Spinner className="size-4" /> : icono}
      {children}
    </button>
  );
}
