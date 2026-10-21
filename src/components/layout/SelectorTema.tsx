"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

type Tema = "claro" | "oscuro" | "sistema";

const CLAVE = "agendaflow-tema";

const OPCIONES: Array<{ valor: Tema; etiqueta: string; icono: typeof Sun }> = [
  { valor: "claro", etiqueta: "Claro", icono: Sun },
  { valor: "oscuro", etiqueta: "Oscuro", icono: Moon },
  { valor: "sistema", etiqueta: "Sistema", icono: Monitor },
];

/** Selector de tema claro / oscuro / sistema con persistencia local. */
export function SelectorTema() {
  const [tema, setTema] = useState<Tema>("sistema");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem(CLAVE) as Tema | null;
    if (guardado && ["claro", "oscuro", "sistema"].includes(guardado)) {
      setTema(guardado);
    }
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!montado) return;

    const sistemaOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const oscuro = tema === "oscuro" || (tema === "sistema" && sistemaOscuro);
    document.documentElement.classList.toggle("dark", oscuro);
    localStorage.setItem(CLAVE, tema);
  }, [tema, montado]);

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la interfaz"
      className="inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-muted p-0.5"
    >
      {OPCIONES.map((opcion) => {
        const Icono = opcion.icono;
        const activo = tema === opcion.valor;

        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={`Tema ${opcion.etiqueta.toLowerCase()}`}
            title={`Tema ${opcion.etiqueta.toLowerCase()}`}
            onClick={() => setTema(opcion.valor)}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition",
              activo
                ? "bg-surface text-brand-600 shadow-sm"
                : "text-ink-subtle hover:text-ink",
            )}
          >
            <Icono aria-hidden="true" className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
