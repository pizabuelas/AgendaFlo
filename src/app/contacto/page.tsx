import type { Metadata } from "next";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { FormularioContacto } from "@/components/contacto/FormularioContacto";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escríbenos a AgendaFlow: resuelve dudas sobre el catálogo, las reservas o tu cuenta.",
};

const CANALES = [
  {
    icono: Mail,
    titulo: "Correo electrónico",
    detalle: "hola@agendaflow.dev",
    descripcion: "Respondemos en menos de 24 horas laborables.",
  },
  {
    icono: Phone,
    titulo: "Teléfono",
    detalle: "+34 900 123 456",
    descripcion: "De lunes a viernes, de 9:00 a 18:00.",
  },
  {
    icono: MapPin,
    titulo: "Oficina",
    detalle: "Calle Mayor 12, 28013 Madrid",
    descripcion: "Atención presencial con cita previa.",
  },
  {
    icono: Clock3,
    titulo: "Horario de atención",
    detalle: "Lunes a viernes · 9:00 – 18:00",
    descripcion: "El soporte técnico funciona los sábados por la mañana.",
  },
];

export default function PaginaContacto() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <EncabezadoPagina
        eyebrow="Contacto"
        titulo="¿En qué podemos ayudarte?"
        descripcion="Escríbenos y te responderemos por correo. Si tu consulta se refiere a una reserva concreta, incluye su código (por ejemplo, CIT-8F3K2A) para que podamos localizarla más rápido."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        {/* Canales */}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {CANALES.map((canal) => {
            const Icono = canal.icono;
            return (
              <li key={canal.titulo}>
                <Tarjeta className="flex h-full items-start gap-4 p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                    <Icono aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-ink">{canal.titulo}</h2>
                    <p className="mt-0.5 text-sm text-ink">{canal.detalle}</p>
                    <p className="mt-1 text-xs text-ink-subtle">{canal.descripcion}</p>
                  </div>
                </Tarjeta>
              </li>
            );
          })}
        </ul>

        {/* Formulario */}
        <Tarjeta className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              <MessageCircle aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Envíanos un mensaje
              </h2>
              <p className="text-sm text-ink-muted">
                Los campos marcados con asterisco son obligatorios.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <FormularioContacto />
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}
