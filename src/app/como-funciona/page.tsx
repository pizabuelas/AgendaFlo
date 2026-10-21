import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CalendarDays, CreditCard, Search } from "lucide-react";

import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { DIAS_MINIMO_ANTICIPACION, DIAS_MAXIMO_ANTICIPACION, MAX_RESERVAS_ACTIVAS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description:
    "Descubre paso a paso cómo reservar una cita en AgendaFlow: explorar, elegir horario, confirmar y gestionar tus reservas.",
};

/* Página informativa del flujo de reserva (RF-02 y RF-04). */

const PASOS = [
  {
    icono: Search,
    titulo: "Explora y filtra",
    descripcion:
      "Navega por el catálogo y combina los filtros de categoría, precio y duración. La búsqueda por palabra clave encuentra el servicio por su nombre o descripción.",
    detalles: [
      "Búsqueda instantánea por nombre, descripción y categoría",
      "Filtros combinables de categoría, precio y duración",
      "Ordenación por precio, duración, nombre o relevancia",
    ],
  },
  {
    icono: CalendarDays,
    titulo: "Elige tu horario",
    descripcion:
      "En la ficha del servicio ves su agenda de atención. El calendario marca en gris los huecos ya ocupados, los que han pasado y los que quedan fuera de la ventana de reserva.",
    detalles: [
      "Disponibilidad calculada en tiempo real",
      "Franjas de atención configurables por servicio",
      `Ventana de reserva de ${DIAS_MINIMO_ANTICIPACION} a ${DIAS_MAXIMO_ANTICIPACION} días`,
    ],
  },
  {
    icono: CalendarCheck2,
    titulo: "Confirma la cita",
    descripcion:
      "Introduce un aviso opcional y confirma. Recibes un código único de reserva y la cita aparece en tu panel de inmediato.",
    detalles: [
      "Código de reserva único y fácil de recordar",
      "Notificación persistida en tu cuenta",
      `Máximo de ${MAX_RESERVAS_ACTIVAS} citas activas simultáneas`,
    ],
  },
  {
    icono: CreditCard,
    titulo: "Gestiona y cancela",
    descripcion:
      "Desde «Mis citas» puedes consultar el histórico, reprogramar o cancelar una reserva cuando lo necesites.",
    detalles: [
      "Historial completo de citas próximas y pasadas",
      "Cancelación en un clic con motivo opcional",
      "Avisos de confirmación y error en pantalla",
    ],
  },
];

export default function PaginaComoFunciona() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <EncabezadoPagina
        eyebrow="Guía rápida"
        titulo="Cómo funciona AgendaFlow"
        descripcion="Reservar una cita es un proceso de cuatro pasos. Esta guía explica en detalle qué ocurre en cada uno y qué reglas se aplican para que el sistema nunca acepte una reserva inválida."
      />

      <ol className="mt-12 space-y-6">
        {PASOS.map((paso, indice) => {
          const Icono = paso.icono;
          return (
            <li key={paso.titulo}>
              <Tarjeta className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                    <Icono aria-hidden="true" className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                      Paso {indice + 1}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                      {paso.titulo}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {paso.descripcion}
                    </p>

                    <ul className="mt-4 space-y-2">
                      {paso.detalles.map((detalle) => (
                        <li key={detalle} className="flex items-start gap-2 text-sm text-ink-muted">
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500"
                          />
                          {detalle}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Tarjeta>
            </li>
          );
        })}
      </ol>

      <div className="mt-12 rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          ¿Listo para reservar?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Explora el catálogo y comprueba por ti mismo la disponibilidad de cada
          servicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/servicios">
            <Boton icono={<ArrowRight aria-hidden="true" className="size-4" />}>
              Ver servicios
            </Boton>
          </Link>
          <Link href="/registro">
            <Boton variante="contorno">Crear cuenta</Boton>
          </Link>
        </div>
      </div>
    </div>
  );
}
