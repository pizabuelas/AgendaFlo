import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Sparkles,
  Tag,
} from "lucide-react";

import { FormularioReserva } from "@/components/reservas/FormularioReserva";
import { Insignia, Tarjeta } from "@/components/ui/Tarjeta";
import { obtenerServicioPorSlug } from "@/lib/services/servicios";
import { estiloColor, iconoServicio } from "@/lib/tema";
import { DIAS_SEMANA, HORARIO_ATENCION } from "@/lib/constants";
import { formatearDuracion, formatearPrecio } from "@/lib/utils";
import { obtenerUsuarioActual } from "@/lib/session";

/** Genera los metadatos de la ficha a partir del slug. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const servicio = await obtenerServicioPorSlug(slug);

  if (!servicio) return { title: "Servicio no encontrado" };

  return {
    title: servicio.nombre,
    description: servicio.descripcion.slice(0, 160),
  };
}

export default async function PaginaServicio({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [servicio, usuario] = await Promise.all([
    obtenerServicioPorSlug(slug),
    obtenerUsuarioActual(),
  ]);

  if (!servicio || !servicio.activo) notFound();

  const estilo = estiloColor(servicio.color);
  const Icono = iconoServicio(servicio.icono);

  /* Agrupa las franjas de atención por día de la semana. */
  const porDia = new Map<number, Array<{ horaInicio: string; horaFin: string }>>();
  for (const horario of servicio.horarios) {
    const lista = porDia.get(horario.diaSemana) ?? [];
    lista.push({ horaInicio: horario.horaInicio, horaFin: horario.horaFin });
    porDia.set(horario.diaSemana, lista);
  }

  const diasAtencion = Array.from(porDia.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Link
        href="/servicios"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand-600"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al catálogo
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        {/* Detalle */}
        <div>
          <div
            className={`relative flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br sm:h-56 ${estilo.degradado}`}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,.55) 0, transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.35) 0, transparent 45%)",
              }}
            />
            <Icono aria-hidden="true" className="size-16 text-white/95 drop-shadow-sm" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Insignia tono="marca" className={estilo.insignia}>
              <Tag aria-hidden="true" className="size-3" />
              {servicio.categoria.nombre}
            </Insignia>
            {servicio.destacado ? (
              <Insignia tono="aviso">
                <Sparkles aria-hidden="true" className="size-3" />
                Destacado
              </Insignia>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {servicio.nombre}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span className="flex items-center gap-2">
              <Clock aria-hidden="true" className="size-4 text-ink-subtle" />
              Duración: {formatearDuracion(servicio.duracionMin)}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4 text-ink-subtle" />
              {diasAtencion.length} {diasAtencion.length === 1 ? "día" : "días"} de atención
            </span>
          </div>

          <div className="mt-6 prose-none max-w-none text-base leading-relaxed text-ink-muted">
            {servicio.descripcion}
          </div>

          {/* Horarios de atención */}
          <section aria-labelledby="horarios" className="mt-10">
            <h2 id="horarios" className="text-lg font-semibold tracking-tight text-ink">
              Horarios de atención
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Franjas en las que este servicio está disponible. La reserva se
              confirma por orden de llegada.
            </p>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {diasAtencion.map(([dia, franjas]) => (
                <li
                  key={dia}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <span className="text-sm font-medium text-ink">
                    {DIAS_SEMANA[dia]}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {franjas
                      .map((franja) => `${franja.horaInicio} – ${franja.horaFin}`)
                      .join("  ·  ")}
                  </span>
                </li>
              ))}
            </ul>

            {diasAtencion.length === 0 ? (
              <p className="mt-4 rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm text-ink-muted">
                Este servicio no tiene franjas de atención configuradas. La
                disponibilidad por defecto es de {HORARIO_ATENCION.inicio} a{" "}
                {HORARIO_ATENCION.fin}.
              </p>
            ) : null}
          </section>
        </div>

        {/* Panel de reserva */}
        <aside className="lg:sticky lg:top-24">
          <Tarjeta className="overflow-hidden">
            <div className="border-b border-line bg-surface-muted/60 px-6 py-5">
              <p className="text-sm text-ink-muted">Precio de la sesión</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-ink">
                {formatearPrecio(servicio.precio)}
              </p>
              <p className="mt-1 text-xs text-ink-subtle">
                {formatearDuracion(servicio.duracionMin)} · pago en el centro
              </p>
            </div>

            <div className="px-6 py-6">
              {usuario ? (
                <FormularioReserva
                  servicioId={servicio.id}
                  horarios={servicio.horarios}
                  duracionMin={servicio.duracionMin}
                  nombreServicio={servicio.nombre}
                />
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                    <CalendarDays aria-hidden="true" className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Inicia sesión para reservar</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Necesitas una cuenta para gestionar tus citas y recibir
                      confirmaciones.
                    </p>
                  </div>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/servicios/${servicio.slug}`)}`}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-600 text-sm font-medium text-white transition hover:bg-brand-700"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/registro"
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line text-sm font-medium text-ink transition hover:bg-surface-muted"
                  >
                    Crear cuenta gratis
                  </Link>
                </div>
              )}
            </div>
          </Tarjeta>
        </aside>
      </div>
    </div>
  );
}
