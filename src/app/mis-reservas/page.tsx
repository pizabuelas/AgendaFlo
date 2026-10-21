import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, CalendarPlus, Bell, CheckCheck } from "lucide-react";

import { TarjetaReserva } from "@/components/reservas/TarjetaReserva";
import { Boton } from "@/components/ui/Boton";
import { EncabezadoTarjeta, EstadoVacio, Insignia, Tarjeta } from "@/components/ui/Tarjeta";
import { listarReservas } from "@/lib/services/reservas";
import { listarNotificaciones } from "@/lib/services/notificaciones";
import { requiereUsuario } from "@/lib/session";
import { isoDesdeFecha } from "@/lib/utils";
import { formatearMarcaTiempo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mis citas",
  description: "Consulta, reprograma o cancela tus citas reservadas en AgendaFlow.",
};

/** Reservas agrupadas en próximas, pasadas y canceladas. */
function agrupar<T extends { fecha: Date; estado: string }>(reservas: T[]) {
  const hoy = isoDesdeFecha(new Date());
  const proximas: T[] = [];
  const pasadas: T[] = [];
  const canceladas: T[] = [];

  for (const reserva of reservas) {
    const fecha = isoDesdeFecha(reserva.fecha);
    if (reserva.estado === "CANCELADA") canceladas.push(reserva);
    else if (fecha >= hoy) proximas.push(reserva);
    else pasadas.push(reserva);
  }

  return { proximas, pasadas, canceladas };
}

export default async function PaginaMisReservas() {
  const usuario = await requiereUsuario("/login?redirect=/mis-reservas");

  const [resultado, notificaciones] = await Promise.all([
    listarReservas({ usuarioId: usuario.id, porPagina: 100 }),
    listarNotificaciones(usuario.id, 8),
  ]);

  const { proximas, pasadas, canceladas } = agrupar(resultado.reservas);
  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Mi agenda
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Hola, {usuario.nombre.split(" ")[0]}
          </h1>
          <p className="mt-2 text-ink-muted">
            Aquí tienes todas tus citas, con su estado y su código de reserva.
          </p>
        </div>

        <Link href="/servicios">
          <Boton variante="primario" icono={<CalendarPlus aria-hidden="true" className="size-4" />}>
            Reservar nueva cita
          </Boton>
        </Link>
      </header>

      {/* Resumen */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { etiqueta: "Citas activas", valor: proximas.length, icono: CalendarCheck2 },
          { etiqueta: "Citas completadas", valor: pasadas.length, icono: CheckCheck },
          { etiqueta: "Citas canceladas", valor: canceladas.length, icono: CalendarPlus },
        ].map((dato) => {
          const Icono = dato.icono;
          return (
            <div
              key={dato.etiqueta}
              className="rounded-2xl border border-line bg-surface p-5 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-muted">{dato.etiqueta}</p>
                <Icono aria-hidden="true" className="size-4 text-ink-subtle" />
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
                {dato.valor}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="space-y-10">
          <section aria-labelledby="proximas">
            <EncabezadoTarjeta
              titulo="Próximas citas"
              descripcion="Reservas confirmadas o pendientes."
              className="mb-4"
            />
            <h2 id="proximas" className="sr-only">
              Próximas citas
            </h2>

            {proximas.length === 0 ? (
              <EstadoVacio
                icono={<CalendarCheck2 aria-hidden="true" className="size-6" />}
                titulo="No tienes citas próximas"
                descripcion="Explora el catálogo y reserva el servicio que necesites."
                accion={
                  <Link href="/servicios">
                    <Boton variante="primario">Ver servicios</Boton>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {proximas.map((reserva) => (
                  <TarjetaReserva
                    key={reserva.id}
                    reserva={{
                      id: reserva.id,
                      codigo: reserva.codigo,
                      fecha: reserva.fecha,
                      hora: reserva.hora,
                      duracionMin: reserva.duracionMin,
                      precio: reserva.precio,
                      estado: reserva.estado as never,
                      notas: reserva.notas,
                      servicio: reserva.servicio,
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {pasadas.length > 0 ? (
            <section aria-labelledby="pasadas">
              <EncabezadoTarjeta
                titulo="Citas pasadas"
                descripcion="Historial de citas ya realizadas."
                className="mb-4"
              />
              <h2 id="pasadas" className="sr-only">
                Citas pasadas
              </h2>
              <div className="space-y-4">
                {pasadas.map((reserva) => (
                  <TarjetaReserva
                    key={reserva.id}
                    reserva={{
                      id: reserva.id,
                      codigo: reserva.codigo,
                      fecha: reserva.fecha,
                      hora: reserva.hora,
                      duracionMin: reserva.duracionMin,
                      precio: reserva.precio,
                      estado: reserva.estado as never,
                      notas: reserva.notas,
                      servicio: reserva.servicio,
                    }}
                    permitirCancelar={false}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {canceladas.length > 0 ? (
            <section aria-labelledby="canceladas">
              <EncabezadoTarjeta
                titulo="Citas canceladas"
                descripcion="Reservas que no llegaron a completarse."
                className="mb-4"
              />
              <h2 id="canceladas" className="sr-only">
                Citas canceladas
              </h2>
              <div className="space-y-4">
                {canceladas.map((reserva) => (
                  <TarjetaReserva
                    key={reserva.id}
                    reserva={{
                      id: reserva.id,
                      codigo: reserva.codigo,
                      fecha: reserva.fecha,
                      hora: reserva.hora,
                      duracionMin: reserva.duracionMin,
                      precio: reserva.precio,
                      estado: reserva.estado as never,
                      notas: reserva.notas,
                      servicio: reserva.servicio,
                    }}
                    permitirCancelar={false}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Panel lateral de notificaciones */}
        <aside className="lg:sticky lg:top-24">
          <Tarjeta className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Bell aria-hidden="true" className="size-4 text-ink-subtle" />
                Notificaciones
              </h2>
              {noLeidas > 0 ? (
                <Insignia tono="marca">{noLeidas} sin leer</Insignia>
              ) : null}
            </div>

            {notificaciones.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                No hay notificaciones por ahora.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notificaciones.map((notificacion) => (
                  <li
                    key={notificacion.id}
                    className={
                      notificacion.leida
                        ? "rounded-xl border border-line bg-surface-muted/40 p-3"
                        : "rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-800 dark:bg-brand-950/40"
                    }
                  >
                    <p className="text-sm font-medium text-ink">{notificacion.titulo}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {notificacion.mensaje}
                    </p>
                    <p className="mt-1.5 text-[11px] text-ink-subtle">
                      {formatearMarcaTiempo(notificacion.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </aside>
      </div>
    </div>
  );
}
