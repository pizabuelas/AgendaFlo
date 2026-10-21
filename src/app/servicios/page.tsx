import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { FiltrosServicios } from "@/components/servicios/FiltrosServicios";
import { TarjetaServicio } from "@/components/servicios/TarjetaServicio";
import { Boton } from "@/components/ui/Boton";
import { EstadoVacio } from "@/components/ui/Tarjeta";
import { listarCategorias, listarServicios } from "@/lib/services/servicios";
import { esquemaParametrosServicios } from "@/lib/validators";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Explora el catálogo completo de servicios: filtra por categoría, precio y duración, y reserva el horario que mejor te encaje.",
};

/** Convierte los query params de la URL en el objeto de filtros validado. */
async function leerParametros(buscar: Promise<Record<string, string | string[] | undefined>>) {
  const crudos = await buscar;

  const obtener = (clave: string) => {
    const valor = crudos[clave];
    return Array.isArray(valor) ? valor[0] : valor;
  };

  const resultado = esquemaParametrosServicios.safeParse({
    q: obtener("q") ?? "",
    categoria: obtener("categoria") ?? "",
    precio: obtener("precio") ?? undefined,
    duracion: obtener("duracion") ?? undefined,
    estado: obtener("estado") ?? "activo",
    orden: obtener("orden") ?? "relevancia",
    pagina: obtener("pagina") ?? 1,
    porPagina: obtener("porPagina") ?? 9,
  });

  const base = resultado.success
    ? resultado.data
    : esquemaParametrosServicios.parse({});

  /* Rango de precio seleccionado ("0-50", "50-100"…) */
  const rangos: Record<string, { min: number; max?: number }> = {
    "0-50": { min: 0, max: 50 },
    "50-100": { min: 50, max: 100 },
    "100-200": { min: 100, max: 200 },
    "200-0": { min: 200 },
  };

  const rango = rangos[obtener("precio") ?? ""];

  return {
    ...base,
    ...(rango
      ? {
          precioMin: rango.min,
          precioMax: rango.max,
        }
      : {}),
    ...(obtener("duracion") ? { duracionMax: Number(obtener("duracion")) } : {}),
  };
}

export default async function PaginaServicios({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await leerParametros(searchParams);

  const [resultado, categorias] = await Promise.all([
    listarServicios(parametros),
    listarCategorias(true),
  ]);

  const filtrosActivos =
    (parametros.q ? 1 : 0) +
    (parametros.categoria ? 1 : 0) +
    (parametros.precioMin !== undefined ? 1 : 0) +
    (parametros.duracionMax !== undefined ? 1 : 0);

  const construirEnlace = (pagina: number) => {
    const nuevos = new URLSearchParams();
    if (parametros.q) nuevos.set("q", parametros.q);
    if (parametros.categoria) nuevos.set("categoria", parametros.categoria);
    if (parametros.precioMin !== undefined) {
      const rango = parametros.precioMax
        ? `${parametros.precioMin}-${parametros.precioMax}`
        : `${parametros.precioMin}-0`;
      nuevos.set("precio", rango);
    }
    if (parametros.duracionMax !== undefined) {
      nuevos.set("duracion", String(parametros.duracionMax));
    }
    if (parametros.orden !== "relevancia") nuevos.set("orden", parametros.orden);
    if (pagina > 1) nuevos.set("pagina", String(pagina));
    return `/servicios${nuevos.toString() ? `?${nuevos}` : ""}`;
  };

  const paginas = Array.from({ length: resultado.totalPaginas }, (_, indice) => indice + 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
          Catálogo
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Encuentra el servicio que necesitas
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Filtra por categoría, precio o duración y comprueba la disponibilidad real
          antes de reservar. Sin llamadas, sin esperas.
        </p>
      </header>

      <div className="mt-8">
        <FiltrosServicios
          categorias={categorias.map((categoria) => ({
            nombre: categoria.nombre,
            slug: categoria.slug,
            total: categoria._count?.servicios ?? 0,
          }))}
          total={resultado.total}
          filtrosActivos={filtrosActivos}
        />
      </div>

      {/* Resultados */}
      {resultado.servicios.length === 0 ? (
        <EstadoVacio
          className="mt-10"
          icono={<SearchX aria-hidden="true" className="size-6" />}
          titulo="No hay servicios que coincidan"
          descripcion="Prueba a cambiar los filtros o a buscar con otras palabras clave."
          accion={
            <Link href="/servicios">
              <Boton variante="contorno">Ver todos los servicios</Boton>
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resultado.servicios.map((servicio) => (
            <TarjetaServicio
              key={servicio.id}
              servicio={{
                id: servicio.id,
                nombre: servicio.nombre,
                slug: servicio.slug,
                descripcion: servicio.descripcion,
                precio: servicio.precio,
                duracionMin: servicio.duracionMin,
                icono: servicio.icono,
                color: servicio.color,
                destacado: servicio.destacado,
                categoria: {
                  nombre: servicio.categoria.nombre,
                  slug: servicio.categoria.slug,
                },
              }}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {resultado.totalPaginas > 1 ? (
        <nav aria-label="Paginación" className="mt-10 flex justify-center">
          <ul className="flex items-center gap-1">
            {paginas.map((pagina) => {
              const activa = pagina === resultado.pagina;
              return (
                <li key={pagina}>
                  <Link
                    href={construirEnlace(pagina)}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl text-sm font-medium transition",
                      activa
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                    )}
                  >
                    {pagina}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
