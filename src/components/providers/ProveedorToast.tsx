"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Sistema de avisos en pantalla (RF-05).
 * Los toasts se anuncian con `aria-live` para que las personas que usan
 * lector de pantalla reciban el mismo feedback que las demás.
 */

export type TipoToast = "exito" | "error" | "info";

export interface Toast {
  id: number;
  tipo: TipoToast;
  titulo: string;
  descripcion?: string;
}

interface ContextoToast {
  toasts: Toast[];
  mostrar: (toast: Omit<Toast, "id">) => void;
  exito: (titulo: string, descripcion?: string) => void;
  error: (titulo: string, descripcion?: string) => void;
  info: (titulo: string, descripcion?: string) => void;
  cerrar: (id: number) => void;
}

const Contexto = createContext<ContextoToast | null>(null);

const DURACION = 5000;

const ESTILOS: Record<
  TipoToast,
  { icono: typeof CheckCircle2; clases: string; iconoClases: string }
> = {
  exito: {
    icono: CheckCircle2,
    clases:
      "border-success/30 bg-success-soft text-success",
    iconoClases: "text-success",
  },
  error: {
    icono: TriangleAlert,
    clases: "border-danger/30 bg-danger-soft text-danger",
    iconoClases: "text-danger",
  },
  info: {
    icono: Info,
    clases: "border-info/30 bg-info-soft text-info",
    iconoClases: "text-info",
  },
};

export function ProveedorToast({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const contador = useRef(0);
  const temporizadores = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const cerrar = useCallback((id: number) => {
    setToasts((previos) => previos.filter((t) => t.id !== id));
    const temporizador = temporizadores.current.get(id);
    if (temporizador) {
      clearTimeout(temporizador);
      temporizadores.current.delete(id);
    }
  }, []);

  const mostrar = useCallback(
    (toast: Omit<Toast, "id">) => {
      contador.current += 1;
      const id = contador.current;

      setToasts((previos) => [...previos.slice(-3), { ...toast, id }]);

      const temporizador = setTimeout(() => cerrar(id), DURACION);
      temporizadores.current.set(id, temporizador);
    },
    [cerrar],
  );

  useEffect(() => {
    const mapa = temporizadores.current;
    return () => {
      mapa.forEach((temporizador) => clearTimeout(temporizador));
      mapa.clear();
    };
  }, []);

  const valor = useMemo<ContextoToast>(
    () => ({
      toasts,
      mostrar,
      cerrar,
      exito: (titulo, descripcion) => mostrar({ tipo: "exito", titulo, descripcion }),
      error: (titulo, descripcion) => mostrar({ tipo: "error", titulo, descripcion }),
      info: (titulo, descripcion) => mostrar({ tipo: "info", titulo, descripcion }),
    }),
    [toasts, mostrar, cerrar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end sm:p-6"
      >
        {toasts.map((toast) => {
          const estilo = ESTILOS[toast.tipo];
          const Icono = estilo.icono;
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-4 shadow-lift animate-scale-in",
                estilo.clases,
              )}
            >
              <Icono aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", estilo.iconoClases)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{toast.titulo}</p>
                {toast.descripcion ? (
                  <p className="mt-0.5 text-sm text-ink-muted">{toast.descripcion}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => cerrar(toast.id)}
                className="-m-1 rounded-lg p-1 text-ink-subtle transition hover:bg-surface-muted hover:text-ink"
                aria-label="Cerrar aviso"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Contexto.Provider>
  );
}

/** Hook de acceso al sistema de avisos. */
export function useToast(): ContextoToast {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useToast debe usarse dentro de <ProveedorToast>.");
  }
  return contexto;
}
