"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Diálogo modal accesible: bloquea el scroll, atrapa el foco, cierra con Escape
 * y devuelve el foco al elemento que lo abrió.
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  tamano = "md",
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  tamano?: "sm" | "md" | "lg";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;

    focoPrevio.current = document.activeElement as HTMLElement | null;

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        onCerrar();
        return;
      }

      if (evento.key !== "Tab" || !panel.current) return;

      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alPulsar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const foco = window.setTimeout(() => {
      const objetivo = panel.current?.querySelector<HTMLElement>(
        "[data-foco-inicial], input, textarea, select, button",
      );
      objetivo?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = overflow;
      window.clearTimeout(foco);
      focoPrevio.current?.focus?.();
    };
  }, [abierto, onCerrar]);

  if (!abierto || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade-in"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          "relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-lift animate-scale-in sm:rounded-2xl",
          tamano === "sm" && "sm:max-w-md",
          tamano === "md" && "sm:max-w-xl",
          tamano === "lg" && "sm:max-w-3xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{titulo}</h2>
            {descripcion ? (
              <p className="mt-1 text-sm text-ink-muted">{descripcion}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="-m-1.5 rounded-lg p-1.5 text-ink-subtle transition hover:bg-surface-muted hover:text-ink"
            aria-label="Cerrar diálogo"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {pie ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-muted/60 px-6 py-4">
            {pie}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
