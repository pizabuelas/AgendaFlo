"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, CheckCheck, Clock, Trash2, XCircle } from "lucide-react";

import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campos";
import { Insignia, Tarjeta } from "@/components/ui/Tarjeta";
import { useToast } from "@/components/providers/ProveedorToast";
import { ESTADO_LABEL, ESTADO_TONE, type EstadoReserva } from "@/lib/constants";
import { cn, formatearDuracion, formatearPrecio } from "@/lib/utils";
import type { ReservaAdmin } from "./tipos-admin";

/**
 * Gestión de reservas (RF-04).
 * Permite filtrar por estado, buscar y cambiar el estado de cada cita.
 */

const FILTROS = [
  { clave: "todos", etiqueta: "Todas" },
  { clave: "PENDIENTE", etiqueta: "Pendientes" },
  { clave: "CONFIRMADA", etiqueta: "Confirmadas" },
  { clave: "COMPLETADA", etiqueta: "Completadas" },
  { clave: "CANCELADA", etiqueta: "Canceladas" },
] as const;

const ACCIONES: Record<
  string,
  Array<{ estado: EstadoReserva; etiqueta: string; icono: typeof Clock; estilo: "primario" | "secundario" | "peligro" }>
> = {
  PENDIENTE: [
    { estado: "CONFIRMADA", etiqueta: "Confirmar", icono: CalendarCheck2, estilo: "primario" },
    { estado: "CANCELADA", etiqueta: "Cancelar", icono: XCircle, estilo: "peligro" },
  ],
  CONFIRMADA: [
    { estado: "COMPLETADA", etiqueta: "Completar", icono: CheckCheck, estilo: "primario" },
    { estado: "CANCELADA", etiqueta: "Cancelar", icono: XCircle, estilo: "peligro" },
  ],
  COMPLETADA: [],
  CANCELADA: [],
};

export function GestorReservas({
  reservas,
  total,
  estadoInicial,
  busquedaInicial,
}: {
  reservas: ReservaAdmin[];
  total: number;
  estadoInicial: string;
  busquedaInicial: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [estado, setEstado] = useState(estadoInicial);
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return reservas.filter((reserva) => {
      const coincideEstado = estado === "todos" || reserva.estado === estado;
      const coincideTexto =
        texto.length === 0 ||
        reserva.codigo.toLowerCase().includes(texto) ||
        reserva.usuario.nombre.toLowerCase().includes(texto) ||
        reserva.usuario.email.toLowerCase().includes(texto) ||
        reserva.servicio.nombre.toLowerCase().includes(texto);

      return coincideEstado && coincideTexto;
    });
  }, [reservas, estado, busqueda]);

  async function cambiarEstado(reserva: ReservaAdmin, nuevo: EstadoReserva) {
    let motivo: string | undefined;

    if (nuevo === "CANCELADA") {
      const respuesta = window.prompt(
        `Motivo de la cancelación de la cita ${reserva.codigo} (opcional):`,
      );
      if (respuesta === null) return;
      motivo = respuesta.trim() || undefined;
    }

    setOcupado(reserva.id);

    try {
      const respuesta = await fetch(`/api/reservas/${reserva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo, motivoCancelacion: motivo ?? "" }),
      });
      const cuerpo = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !cuerpo?.ok) {
        throw new Error(cuerpo?.mensaje ?? "No se pudo cambiar el estado de la cita.");
      }

      toast.exito("Cita actualizada", cuerpo.mensaje ?? "El estado se ha guardado.");
      router.refresh();
    } catch (error) {
      toast.error(
        "No se pudo actualizar la cita",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setOcupado(null);
    }
  }

  async function eliminar(reserva: ReservaAdmin) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente la cita ${reserva.codigo}? Esta acción no se puede deshacer.`,
    );

    if (!confirmado) return;

    setOcupado(reserva.id);

    try {
      const respuesta = await fetch(`/api/reservas/${reserva.id}`, { method: "DELETE" });
      const cuerpo = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !cuerpo?.ok) {
        throw new Error(cuerpo?.mensaje ?? "No se pudo eliminar la cita.");
      }

      toast.exito("Cita eliminada", cuerpo.mensaje ?? "La reserva se ha borrado.");
      router.refresh();
    } catch (error) {
      toast.error(
        "No se pudo eliminar la cita",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div
          role="group"
          aria-label="Filtrar reservas por estado"
          className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1"
        >
          {FILTROS.map((filtro) => (
            <button
              key={filtro.clave}
              type="button"
              aria-pressed={estado === filtro.clave}
              onClick={() => setEstado(filtro.clave)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                estado === filtro.clave
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              {filtro.etiqueta}
            </button>
          ))}
        </div>

        <Campo
          id="admin-buscar-reserva"
          etiqueta="Buscar"
          className="min-w-56 flex-1 sm:max-w-xs"
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Código, usuario o servicio"
        />
      </div>

      {/* Listado */}
      {filtradas.length === 0 ? (
        <Tarjeta className="p-10 text-center">
          <p className="text-sm font-medium text-ink">No hay reservas que coincidan</p>
          <p className="mt-1 text-sm text-ink-muted">
            Prueba con otro estado o con otro texto de búsqueda.
          </p>
        </Tarjeta>
      ) : (
        <ul className="space-y-3">
          {filtradas.map((reserva) => {
            const acciones = ACCIONES[reserva.estado] ?? [];

            return (
              <li key={reserva.id}>
                <Tarjeta className="flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{reserva.servicio.nombre}</p>
                      <Insignia tono={ESTADO_TONE[reserva.estado as EstadoReserva]}>
                        {ESTADO_LABEL[reserva.estado as EstadoReserva]}
                      </Insignia>
                    </div>

                    <p className="mt-1 text-sm text-ink-muted">
                      {reserva.usuario.nombre} ·{" "}
                      <span className="text-ink-subtle">{reserva.usuario.email}</span>
                    </p>

                    <p className="mt-1 text-sm text-ink-muted">
                      <Clock aria-hidden="true" className="mr-1 inline size-3.5" />
                      {new Date(reserva.fecha).toLocaleDateString("es-ES", {
                        timeZone: "UTC",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {reserva.hora} · {formatearDuracion(reserva.duracionMin)} ·{" "}
                      {formatearPrecio(reserva.precio)}
                    </p>

                    <p className="mt-1 font-mono text-xs text-ink-subtle">{reserva.codigo}</p>

                    {reserva.notas ? (
                      <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-muted">
                        {reserva.notas}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {acciones.map((accion) => {
                      const Icono = accion.icono;
                      return (
                        <Boton
                          key={accion.estado}
                          variante={accion.estilo}
                          tamano="sm"
                          cargando={ocupado === reserva.id}
                          onClick={() => cambiarEstado(reserva, accion.estado)}
                          icono={<Icono aria-hidden="true" className="size-3.5" />}
                        >
                          {accion.etiqueta}
                        </Boton>
                      );
                    })}

                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      onClick={() => eliminar(reserva)}
                      icono={<Trash2 aria-hidden="true" className="size-3.5" />}
                      aria-label={`Eliminar la cita ${reserva.codigo}`}
                      className="text-danger hover:bg-danger-soft"
                    />
                  </div>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-sm text-ink-subtle">
        Mostrando {filtradas.length} de {total} reservas.
      </p>
    </div>
  );
}
