"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ORDENES_SERVICIOS, ORDEN_LABEL } from "@/lib/constants";

/**
 * Panel de búsqueda, filtros y ordenación del catálogo (RF-03).
 *
 * Los filtros se reflejan en la URL (query params) para que el estado sea
 * compartible, se pueda marcar como favorito y el filtrado ocurra en el
 * servidor sin recargar la página completa.
 */

export interface CategoriaFiltro {
  nombre: string;
  slug: string;
  total?: number;
}

const PRECIOS = [
  { id: "0-50", etiqueta: "Hasta 50", min: 0, max: 50 },
  { id: "50-100", etiqueta: "50 – 100", min: 50, max: 100 },
  { id: "100-200", etiqueta: "100 – 200", min: 100, max: 200 },
  { id: "200-0", etiqueta: "Más de 200", min: 200, max: undefined },
];

const DURACIONES = [
  { id: "45", etiqueta: "Hasta 45 min", max: 45 },
  { id: "60", etiqueta: "60 min", max: 60 },
  { id: "120", etiqueta: "Hasta 2 h", max: 120 },
  { id: "240", etiqueta: "Media jornada", max: 240 },
];

export function FiltrosServicios({
  categorias,
  total,
  filtrosActivos = 0,
}: {
  categorias: CategoriaFiltro[];
  total: number;
  filtrosActivos?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();

  const [texto, setTexto] = useState(parametros.get("q") ?? "");
  const [categoria, setCategoria] = useState(parametros.get("categoria") ?? "");
  const [precio, setPrecio] = useState(parametros.get("precio") ?? "");
  const [duracion, setDuracion] = useState(parametros.get("duracion") ?? "");
  const [orden, setOrden] = useState(parametros.get("orden") ?? "relevancia");
  const [panelAbierto, setPanelAbierto] = useState(false);

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primeraCarga = useRef(true);

  /** Aplica los filtros a la URL. */
  const aplicar = useCallback(
    (cambios: Record<string, string>) => {
      const nuevos = new URLSearchParams(parametros.toString());

      Object.entries(cambios).forEach(([clave, valor]) => {
        if (valor) nuevos.set(clave, valor);
        else nuevos.delete(clave);
      });

      if (!("pagina" in cambios)) nuevos.delete("pagina");

      router.replace(`${pathname}${nuevos.toString() ? `?${nuevos}` : ""}`, {
        scroll: false,
      });
    },
    [parametros, pathname, router],
  );

  /* Búsqueda con retardo (debounce) para no saturar el servidor. */
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }

    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      aplicar({ q: texto.trim() });
    }, 350);

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [texto, aplicar]);

  const rangoPrecio = useMemo(
    () => PRECIOS.find((rango) => rango.id === precio),
    [precio],
  );

  const rangoDuracion = useMemo(
    () => DURACIONES.find((rango) => rango.id === duracion),
    [duracion],
  );

  function limpiar() {
    setTexto("");
    setCategoria("");
    setPrecio("");
    setDuracion("");
    setOrden("relevancia");
    router.replace(pathname, { scroll: false });
  }

  const hayFiltros = Boolean(texto.trim() || categoria || precio || duracion);

  return (
    <div className="space-y-4">
      {/* Búsqueda + orden */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
          />
          <label htmlFor="busqueda" className="sr-only">
            Buscar servicios por nombre o descripción
          </label>
          <input
            id="busqueda"
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Buscar por nombre, descripción o categoría…"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3.5 text-sm text-ink transition placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanelAbierto((abierto) => !abierto)}
            aria-expanded={panelAbierto}
            aria-controls="panel-filtros"
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition lg:hidden",
              filtrosActivos > 0
                ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                : "border-line bg-surface text-ink-muted hover:bg-surface-muted",
            )}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Filtros
            {filtrosActivos > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                {filtrosActivos}
              </span>
            ) : null}
          </button>

          <label htmlFor="orden" className="sr-only">
            Ordenar resultados
          </label>
          <select
            id="orden"
            value={orden}
            onChange={(evento) => {
              setOrden(evento.target.value);
              aplicar({ orden: evento.target.value === "relevancia" ? "" : evento.target.value });
            }}
            className="h-11 cursor-pointer rounded-xl border border-line bg-surface px-3.5 text-sm text-ink transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          >
            {ORDENES_SERVICIOS.map((opcion) => (
              <option key={opcion} value={opcion}>
                {ORDEN_LABEL[opcion]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Panel de filtros */}
      <div
        id="panel-filtros"
        className={cn(
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
          panelAbierto ? "grid" : "hidden lg:grid",
        )}
      >
        <div className="space-y-1.5">
          <label htmlFor="filtro-categoria" className="block text-xs font-medium text-ink-muted">
            Categoría
          </label>
          <select
            id="filtro-categoria"
            value={categoria}
            onChange={(evento) => {
              setCategoria(evento.target.value);
              aplicar({ categoria: evento.target.value });
            }}
            className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface px-3.5 text-sm text-ink transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.nombre}
                {typeof cat.total === "number" ? ` (${cat.total})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="filtro-precio" className="block text-xs font-medium text-ink-muted">
            Rango de precio
          </label>
          <select
            id="filtro-precio"
            value={precio}
            onChange={(evento) => {
              setPrecio(evento.target.value);
              aplicar({ precio: evento.target.value });
            }}
            className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface px-3.5 text-sm text-ink transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="">Cualquier precio</option>
            {PRECIOS.map((rango) => (
              <option key={rango.id} value={rango.id}>
                {rango.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="filtro-duracion" className="block text-xs font-medium text-ink-muted">
            Duración
          </label>
          <select
            id="filtro-duracion"
            value={duracion}
            onChange={(evento) => {
              setDuracion(evento.target.value);
              aplicar({ duracion: evento.target.value });
            }}
            className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface px-3.5 text-sm text-ink transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="">Cualquier duración</option>
            {DURACIONES.map((rango) => (
              <option key={rango.id} value={rango.id}>
                {rango.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen y limpieza */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <p aria-live="polite" className="text-ink-muted">
          <span className="font-semibold text-ink">{total}</span>{" "}
          {total === 1 ? "servicio encontrado" : "servicios encontrados"}
        </p>

        {hayFiltros ? (
          <button
            type="button"
            onClick={limpiar}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:hover:bg-brand-950/50"
          >
            <X aria-hidden="true" className="size-3.5" />
            Limpiar filtros
          </button>
        ) : null}

        {rangoPrecio ? (
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-muted">
            Precio: {rangoPrecio.etiqueta}
          </span>
        ) : null}

        {rangoDuracion ? (
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-muted">
            Duración: {rangoDuracion.etiqueta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
