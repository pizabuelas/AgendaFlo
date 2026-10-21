import type { Metadata } from "next";
import { Eye, Keyboard, MonitorSmartphone, Volume2 } from "lucide-react";

import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = {
  title: "Accesibilidad",
  description:
    "Medidas de accesibilidad implementadas en AgendaFlow: contraste, navegación por teclado, textos alternativos y compatibilidad con lectores de pantalla.",
};

/* Declaración de accesibilidad (RNF-01). */

const MEDIDAS = [
  {
    icono: Eye,
    titulo: "Contraste y color",
    descripcion:
      "Todos los textos y controles cumplen una relación de contraste mínima de 4.5:1 sobre su fondo. El color nunca es el único indicador: los estados se acompañan de etiquetas de texto.",
  },
  {
    icono: Keyboard,
    titulo: "Navegación por teclado",
    descripcion:
      "Puedes recorrer toda la aplicación con la tecla Tab y activarla con Enter o Espacio. Existe un enlace «Saltar al contenido principal» y los diálogos atrapan el foco mientras están abiertos.",
  },
  {
    icono: Volume2,
    titulo: "Lectores de pantalla",
    descripcion:
      "Los avisos de confirmación y error se anuncian con regiones aria-live, los errores de campo se asocian con su control y cada icono decorativo está oculto a la tecnología asistiva.",
  },
  {
    icono: MonitorSmartphone,
    titulo: "Diseño responsivo",
    descripcion:
      "La interfaz se adapta desde 320 píxeles de ancho hasta pantallas grandes, respeta el zoom del navegador y ofrece un modo oscuro que reduce el contraste en entornos con poca luz.",
  },
];

export default function PaginaAccesibilidad() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <EncabezadoPagina
        eyebrow="Accesibilidad"
        titulo="Una web para todas las personas"
        descripcion="AgendaFlow se ha construido siguiendo las pautas de accesibilidad para el contenido web (WCAG 2.1, nivel AA). Este documento resume los compromisos que mantenemos y cómo comprobar que se cumplen."
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Compromisos del producto
        </h2>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {MEDIDAS.map((medida) => {
            const Icono = medida.icono;
            return (
              <li key={medida.titulo}>
                <Tarjeta className="h-full p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                    <Icono aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{medida.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {medida.descripcion}
                  </p>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Cómo navegar con el teclado
        </h2>
        <dl className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {[
            { tecla: "Tab", accion: "Avanzar al siguiente control interactivo." },
            { tecla: "Mayús + Tab", accion: "Retroceder al control anterior." },
            { tecla: "Enter o Espacio", accion: "Activar el control que tenga el foco." },
            { tecla: "Escape", accion: "Cerrar el menú o el diálogo abierto." },
          ].map((atajo) => (
            <div
              key={atajo.tecla}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-4"
            >
              <dt className="w-40 shrink-0">
                <kbd className="rounded-lg border border-line bg-surface-muted px-2 py-1 text-xs font-medium text-ink">
                  {atajo.tecla}
                </kbd>
              </dt>
              <dd className="text-sm text-ink-muted">{atajo.accion}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          ¿Has encontrado una barrera?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Si alguna parte de la web te resulta inaccesible, escríbenos indicando la
          página y el problema. Lo revisamos y te respondemos con una solución.
        </p>
        <a
          href="/contacto"
          className="mt-4 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Escribir al equipo
        </a>
      </section>
    </div>
  );
}
