"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock,
  Hash,
  StickyNote,
  Trash2,
  User,
} from "lucide-react";

import { useToast } from "@/components/providers/ProveedorToast";
import { Boton } from "@/components/ui/Boton";
import { Modal } from "@/components/ui/Modal";
import { Insignia } from "@/components/ui/Tarjeta";
import { AreaTexto } from "@/components/ui/Campos";
import { ESTADO_LABEL, ESTADO_TONE, type EstadoReserva } from "@/lib/constants";
import { estiloColor, iconoServicio } from "@/lib/tema";
import { formatearDuracion, formatearFecha, formatearPrecio } from "@/lib/utils";

/**
 * Tarjeta de una cita reservada (RF-04).
 * Permite cancelar la reserva, con confirmación y motivo opcional.
 */

export interface ReservaResumen {
  id: string;
  codigo: string;
  fecha: Date | string;
  hora: string;
  duracionMin: number;
  precio: number;
  estado: EstadoReserva;
  notas: string | null;
  servicio: { nombre: string; color: string; icono: string };
  usuario?: { nombre: string; email: string };
}

/** Tonos de la insignia según el estado de la cita. */
const tonoEstado = (estado: EstadoReserva) => ESTADO_TONE[estado] ?? "neutro";

export function TarjetaReserva({
  reserva,
  permitirCancelar = true,
  mostrarUsuario = false,
}: {
  reserva: ReservaResumen;
  permitirCancelar?: boolean;
  mostrarUsuario?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [cancelando, setCancelando] = useState(false);

  const estilo = estiloColor(reserva.servicio.color);
  const Icono = iconoServicio(reserva.servicio.icono);

  const cancelable =
    permitirCancelar && (reserva.estado === "PENDIENTE" || reserva.estado === "CONFIRMADA");

  async function confirmarCancelacion() {
    setCancelando(true);

    try {
      const respuesta = await fetch(`/api/reservas/${reserva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CANCELADA", motivoCancelacion: motivo }),
      });

      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        toast.error("No se pudo cancelar", cuerpo.mensaje);
        return;
      }

      toast.exito("Cita cancelada", cuerpo.mensaje ?? "La cita se ha cancelado correctamente.");
      setModalAbierto(false);
      router.refresh();
    } catch {
      toast.error("No se pudo cancelar", "No se pudo conectar con el servidor.");
    } finally {
      setCancelando(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        {/* Icono */}
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${estilo.icono}`}
        >
          <Icono aria-hidden="true" className="size-6" />
        </span>

        {/* Datos */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold tracking-tight text-ink">
              {reserva.servicio.nombre}
            </h3>
            <Insignia tono={tonoEstado(reserva.estado)}>
              {ESTADO_LABEL[reserva.estado]}
            </Insignia>
          </div>

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
            <div className="flex items-center gap-1.5">
              <CalendarClock aria-hidden="true" className="size-4 text-ink-subtle" />
              <dt className="sr-only">Fecha</dt>
              <dd>{formatearFecha(new Date(reserva.fecha), { weekday: "long" })}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-4 text-ink-subtle" />
              <dt className="sr-only">Hora</dt>
              <dd>
                {reserva.hora} · {formatearDuracion(reserva.duracionMin)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Hash aria-hidden="true" className="size-4 text-ink-subtle" />
              <dt className="sr-only">Código</dt>
              <dd className="font-mono text-xs">{reserva.codigo}</dd>
            </div>
            {mostrarUsuario && reserva.usuario ? (
              <div className="flex items-center gap-1.5">
                <User aria-hidden="true" className="size-4 text-ink-subtle" />
                <dt className="sr-only">Usuario</dt>
                <dd>{reserva.usuario.nombre}</dd>
              </div>
            ) : null}
          </dl>

          {reserva.notas ? (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-muted">
              <StickyNote aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
              <span>{reserva.notas}</span>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold tracking-tight text-ink">
              {formatearPrecio(reserva.precio)}
            </p>

            {cancelable ? (
              <Boton
                variante="contorno"
                tamano="sm"
                onClick={() => setModalAbierto(true)}
                icono={<Trash2 aria-hidden="true" className="size-3.5" />}
              >
                Cancelar cita
              </Boton>
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Cancelar la cita"
        descripcion={`Vas a cancelar «${reserva.servicio.nombre}» del ${formatearFecha(
          new Date(reserva.fecha),
        )} a las ${reserva.hora}.`}
        tamano="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalAbierto(false)}>
              Mantener cita
            </Boton>
            <Boton
              variante="peligro"
              onClick={confirmarCancelacion}
              cargando={cancelando}
            >
              Sí, cancelar
            </Boton>
          </>
        }
      >
        <AreaTexto
          id="motivo"
          etiqueta="Motivo (opcional)"
          placeholder="Cuéntanos por qué cancelas, nos ayuda a mejorar…"
          rows={3}
          maxLength={300}
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
        />
      </Modal>
    </article>
  );
}
