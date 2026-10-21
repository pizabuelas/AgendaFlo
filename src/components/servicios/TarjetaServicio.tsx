import Link from "next/link";
import { Clock, Star } from "lucide-react";

import { Insignia } from "@/components/ui/Tarjeta";
import { estiloColor, iconoServicio } from "@/lib/tema";
import { cn, formatearDuracion, formatearPrecio } from "@/lib/utils";

/**
 * Tarjeta de un servicio del catálogo (RF-02 en modo lectura).
 * Enlaza con la ficha completa, donde se puede reservar.
 */
export function TarjetaServicio({
  servicio,
}: {
  servicio: {
    id: string;
    nombre: string;
    slug: string;
    descripcion: string;
    precio: number;
    duracionMin: number;
    icono: string;
    color: string;
    destacado: boolean;
    categoria: { nombre: string; slug: string };
  };
}) {
  const estilo = estiloColor(servicio.color);
  const Icono = iconoServicio(servicio.icono);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      {/* Cabecera decorativa */}
      <div
        className={cn(
          "relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br",
          estilo.degradado,
        )}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,.55) 0, transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.35) 0, transparent 45%)",
          }}
        />
        <Icono aria-hidden="true" className="size-11 text-white/95 drop-shadow-sm" />

        {servicio.destacado ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-sm backdrop-blur">
            <Star aria-hidden="true" className="size-3 fill-current" />
            Destacado
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Insignia tono="marca" className={estilo.insignia}>
            {servicio.categoria.nombre}
          </Insignia>
        </div>

        <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight text-ink">
          <Link
            href={`/servicios/${servicio.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {servicio.nombre}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
          {servicio.descripcion}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div>
            <p className="text-lg font-semibold tracking-tight text-ink">
              {formatearPrecio(servicio.precio)}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
              <Clock aria-hidden="true" className="size-3.5" />
              {formatearDuracion(servicio.duracionMin)}
            </p>
          </div>

          <span className="relative z-10 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-medium text-white transition group-hover:bg-brand-700">
            Reservar
          </span>
        </div>
      </div>
    </article>
  );
}
