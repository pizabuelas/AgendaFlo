import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CalendarCheck2,
  CalendarClock,
  CircleSlash,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";

import { Boton } from "@/components/ui/Boton";
import { Insignia, Tarjeta } from "@/components/ui/Tarjeta";
import { ESTADO_LABEL, ESTADO_TONE, type EstadoReserva } from "@/lib/constants";
import { obtenerMetricas } from "@/lib/services/reservas";
import { formatearFecha, formatearHora, formatearPrecio } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resumen",
  description: "Indicadores de reservas, servicios y usuarios de AgendaFlow.",
};

/* --------------------------------------------------------------------------
   Panel de resumen con los indicadores clave y el gráfico de reservas de la
   última semana (realizado con CSS, sin librerías de gráficos).
   -------------------------------------------------------------------------- */

const ESTADOS: Array<{ clave: EstadoReserva; icono: typeof CalendarCheck2 }> = [
  { clave: "PENDIENTE", icono: CalendarClock },
  { clave: "CONFIRMADA", icono: CalendarCheck2 },
  { clave: "COMPLETADA", icono: TrendingUp },
  { clave: "CANCELADA", icono: CircleSlash },
];

export default async function PaginaAdmin() {
  const metricas = await obtenerMetricas();
  const maximoSerie = Math.max(1, ...metricas.serie.map((dia) => dia.total));

  const tarjetas = [
    {
      etiqueta: "Reservas totales",
      valor: String(metricas.totalReservas),
      detalle: `${metricas.reservasHoy} para hoy`,
      icono: CalendarCheck2,
      tono: "marca" as const,
    },
    {
      etiqueta: "Citas pendientes",
      valor: String(metricas.pendientes),
      detalle: "Requieren confirmación",
      icono: CalendarClock,
      tono: "aviso" as const,
    },
    {
      etiqueta: "Ingresos confirmados",
      valor: formatearPrecio(metricas.ingresos),
      detalle: "Citas confirmadas y completadas",
      icono: Banknote,
      tono: "exito" as const,
    },
    {
      etiqueta: "Usuarios activos",
      valor: String(metricas.totalUsuarios),
      detalle: "Con acceso a la plataforma",
      icono: Users,
      tono: "info" as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Indicadores */}
      <section aria-labelledby="indicadores">
        <h2 id="indicadores" className="sr-only">
          Indicadores principales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tarjetas.map((tarjeta) => {
            const Icono = tarjeta.icono;
            return (
              <Tarjeta key={tarjeta.etiqueta} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink-muted">{tarjeta.etiqueta}</p>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-surface-muted text-ink-subtle">
                    <Icono aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
                  {tarjeta.valor}
                </p>
                <p className="mt-1 text-xs text-ink-subtle">{tarjeta.detalle}</p>
              </Tarjeta>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Gráfico de barras */}
        <section aria-labelledby="grafico">
          <Tarjeta className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="grafico" className="text-lg font-semibold tracking-tight text-ink">
                  Reservas de los últimos 7 días
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Citas creadas por día, sin contar las canceladas.
                </p>
              </div>
              <Insignia tono="marca">
                <TrendingUp aria-hidden="true" className="size-3" />
                {metricas.serie.reduce((total, dia) => total + dia.total, 0)} en la semana
              </Insignia>
            </div>

            <div
              role="img"
              aria-label={`Gráfico de reservas por día: ${metricas.serie
                .map((dia) => `${dia.dia} ${dia.total}`)
                .join(", ")}`}
              className="mt-6 flex h-48 items-end gap-2 sm:gap-3"
            >
              {metricas.serie.map((dia) => {
                const altura = Math.round((dia.total / maximoSerie) * 100);
                return (
                  <div key={dia.fecha} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-medium text-ink-muted">{dia.total}</span>
                    <div
                      className="w-full rounded-t-lg bg-brand-500/85 transition-all hover:bg-brand-600"
                      style={{ height: `${Math.max(altura, dia.total > 0 ? 8 : 2)}%` }}
                      title={`${dia.fecha}: ${dia.total} reserva(s)`}
                    />
                    <span className="text-[11px] capitalize text-ink-subtle">{dia.dia}</span>
                  </div>
                );
              })}
            </div>
          </Tarjeta>
        </section>

        {/* Estado de las citas */}
        <section aria-labelledby="estados">
          <Tarjeta className="p-6">
            <h2 id="estados" className="text-lg font-semibold tracking-tight text-ink">
              Citas por estado
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Distribución del histórico.</p>

            <ul className="mt-6 space-y-4">
              {ESTADOS.map((estado) => {
                const Icono = estado.icono;
                const valor =
                  estado.clave === "PENDIENTE"
                    ? metricas.pendientes
                    : estado.clave === "CONFIRMADA"
                      ? metricas.confirmadas
                      : estado.clave === "COMPLETADA"
                        ? metricas.completadas
                        : metricas.canceladas;
                const porcentaje = metricas.totalReservas
                  ? Math.round((valor / metricas.totalReservas) * 100)
                  : 0;

                return (
                  <li key={estado.clave}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-ink">
                        <Icono aria-hidden="true" className="size-4 text-ink-subtle" />
                        {ESTADO_LABEL[estado.clave]}
                      </span>
                      <span className="text-ink-muted">
                        {valor} · {porcentaje}%
                      </span>
                    </div>
                    <div
                      role="presentation"
                      className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted"
                    >
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-surface-muted/50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <Package aria-hidden="true" className="size-4" />
                Servicios activos
              </span>
              <span className="text-sm font-semibold text-ink">
                {metricas.serviciosActivos} / {metricas.totalServicios}
              </span>
            </div>
          </Tarjeta>
        </section>
      </div>

      {/* Próximas reservas */}
      <section aria-labelledby="proximas">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="proximas" className="text-lg font-semibold tracking-tight text-ink">
              Próximas citas
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Las seis reservas activas más próximas.
            </p>
          </div>
          <Link href="/admin/reservas">
            <Boton variante="contorno" tamano="sm" icono={<ArrowUpRight aria-hidden="true" className="size-4" />}>
              Gestionar reservas
            </Boton>
          </Link>
        </div>

        {metricas.proximas.length === 0 ? (
          <Tarjeta className="mt-4 p-8 text-center text-sm text-ink-muted">
            No hay citas activas pendientes. Las nuevas reservas aparecerán aquí.
          </Tarjeta>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {metricas.proximas.map((reserva) => (
              <li key={reserva.id}>
                <Tarjeta className="h-full p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{reserva.servicio.nombre}</p>
                    <Insignia tono={ESTADO_TONE[reserva.estado as EstadoReserva]}>
                      {ESTADO_LABEL[reserva.estado as EstadoReserva]}
                    </Insignia>
                  </div>
                  <p className="mt-1 text-xs text-ink-subtle">{reserva.usuario.nombre}</p>
                  <p className="mt-3 text-sm text-ink-muted">
                    {formatearFecha(reserva.fecha, { weekday: "long" })} ·{" "}
                    {formatearHora(reserva.hora)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-subtle">{reserva.codigo}</p>
                </Tarjeta>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
