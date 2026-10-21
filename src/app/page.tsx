import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { TarjetaServicio } from "@/components/servicios/TarjetaServicio";
import { Boton } from "@/components/ui/Boton";
import { Insignia, Tarjeta } from "@/components/ui/Tarjeta";
import { listarCategorias, listarServicios } from "@/lib/services/servicios";

export const metadata: Metadata = {
  title: "Reserva tus citas sin llamadas",
  description:
    "AgendaFlow es la plataforma de gestión de citas: explora servicios, comprueba la disponibilidad en tiempo real y confirma tu reserva en menos de un minuto.",
};

/* --------------------------------------------------------------------------
   Página de inicio: presenta el producto, el flujo de reserva, los servicios
   destacados y las categorías disponibles.
   -------------------------------------------------------------------------- */

const PASOS = [
  {
    icono: Search,
    titulo: "Explora el catálogo",
    descripcion:
      "Filtra por categoría, precio o duración y encuentra el servicio que necesitas en segundos.",
  },
  {
    icono: CalendarDays,
    titulo: "Elige día y hora",
    descripcion:
      "Consulta los huecos reales de la agenda y selecciona el que mejor te encaje.",
  },
  {
    icono: CalendarCheck2,
    titulo: "Confirma tu cita",
    descripcion:
      "Recibe un código de reserva al instante y gestiona tus citas desde tu panel.",
  },
];

const VENTAJAS = [
  {
    icono: Clock3,
    titulo: "Disponibilidad en tiempo real",
    descripcion: "Los huecos ocupados desaparecen del calendario al momento.",
  },
  {
    icono: ShieldCheck,
    titulo: "Acceso seguro",
    descripcion: "Contraseñas cifradas con bcrypt y sesiones revocables.",
  },
  {
    icono: Layers,
    titulo: "Dos perfiles de uso",
    descripcion: "Área de usuario para reservar y panel de administración para gestionarlo todo.",
  },
];

export default async function PaginaInicio() {
  const [destacados, categorias] = await Promise.all([
    listarServicios({
      q: "",
      categoria: "",
      estado: "activo",
      orden: "relevancia",
      pagina: 1,
      porPagina: 6,
    }),
    listarCategorias(true),
  ]);

  const servicios = destacados.servicios.filter((servicio) => servicio.destacado).slice(0, 3);
  const mostrar = servicios.length > 0 ? servicios : destacados.servicios.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div aria-hidden="true" className="reticula absolute inset-0 opacity-60" />
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-40 size-[28rem] rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-700/30"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-48 -left-24 size-[24rem] rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-800/25"
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <Insignia tono="marca">
              <Sparkles aria-hidden="true" className="size-3" />
              Agenda de citas online
            </Insignia>

            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Tus citas, en{" "}
              <span className="text-degradado">menos de un minuto</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
              Compara servicios, consulta la disponibilidad real de cada profesional y
              reserva sin llamadas ni esperas. Tu agenda personal siempre a mano.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/servicios">
                <Boton
                  tamano="lg"
                  icono={<ArrowRight aria-hidden="true" className="size-4" />}
                >
                  Explorar servicios
                </Boton>
              </Link>
              <Link href="/registro">
                <Boton variante="contorno" tamano="lg">
                  Crear cuenta gratis
                </Boton>
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              {[
                { etiqueta: "Servicios", valor: String(destacados.total) },
                { etiqueta: "Categorías", valor: String(categorias.length) },
                { etiqueta: "Confirmación", valor: "Instantánea" },
              ].map((dato) => (
                <div key={dato.etiqueta}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
                    {dato.etiqueta}
                  </dt>
                  <dd className="mt-1 text-xl font-bold tracking-tight text-ink">
                    {dato.valor}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual del hero */}
          <div className="relative">
            <Tarjeta className="overflow-hidden p-0 shadow-lift">
              <div className="degradado-marca flex items-center gap-3 px-6 py-5 text-white">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                  <CalendarDays aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Agenda de esta semana</p>
                  <p className="text-xs text-white/80">Horarios actualizados al instante</p>
                </div>
              </div>

              <div className="space-y-3 p-6">
                {[
                  { dia: "Lun", horas: ["09:00", "10:30", "12:00"] },
                  { dia: "Mar", horas: ["09:30", "11:00", "16:30"] },
                  { dia: "Mié", horas: ["10:00", "12:30", "17:00"] },
                ].map((fila) => (
                  <div key={fila.dia} className="flex items-center gap-3">
                    <span className="w-9 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                      {fila.dia}
                    </span>
                    <div className="flex flex-1 gap-2">
                      {fila.horas.map((hora, indice) => (
                        <span
                          key={hora}
                          className={`flex-1 rounded-lg border px-2 py-2 text-center text-xs font-medium ${
                            indice === 1
                              ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300"
                              : "border-line bg-surface-muted text-ink-muted"
                          }`}
                        >
                          {hora}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-surface-muted/60 p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-success-soft text-success">
                    <CalendarCheck2 aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      Cita confirmada · CIT-8F3K2A
                    </p>
                    <p className="text-xs text-ink-subtle">Consulta de seguimiento</p>
                  </div>
                </div>
              </div>
            </Tarjeta>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Cómo funciona
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Tres pasos y tu cita está confirmada
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Sin formularios eternos ni llamadas de confirmación. Todo ocurre en la web,
            con la información que necesitas a la vista.
          </p>
        </div>

        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {PASOS.map((paso, indice) => {
            const Icono = paso.icono;
            return (
              <li key={paso.titulo}>
                <Tarjeta className="h-full p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                      <Icono aria-hidden="true" className="size-5" />
                    </span>
                    <span className="text-3xl font-bold tracking-tight text-line-strong">
                      {String(indice + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-ink">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {paso.descripcion}
                  </p>
                </Tarjeta>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Servicios destacados */}
      {mostrar.length > 0 ? (
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                  Destacados
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  Servicios que suelen reservar nuestros usuarios
                </h2>
              </div>
              <Link href="/servicios">
                <Boton
                  variante="contorno"
                  icono={<ArrowRight aria-hidden="true" className="size-4" />}
                >
                  Ver todo el catálogo
                </Boton>
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mostrar.map((servicio) => (
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
          </div>
        </section>
      ) : null}

      {/* Categorías */}
      {categorias.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              Categorías
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Encuentra por tipo de servicio
            </h2>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <Link
                  href={`/servicios?categoria=${categoria.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-surface-muted text-ink-subtle transition group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/60 dark:group-hover:text-brand-300">
                      <Star aria-hidden="true" className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">
                        {categoria.nombre}
                      </span>
                      <span className="block text-xs text-ink-subtle">
                        {categoria._count.servicios} servicio
                        {categoria._count.servicios === 1 ? "" : "s"}
                      </span>
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Ventajas */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                Por qué AgendaFlow
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Una agenda diseñada para durar
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-muted">
                Construida sobre una base de datos relacional, con reglas de negocio
                comprobadas en el servidor y una interfaz que respeta los estándares de
                accesibilidad.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-3">
              {VENTAJAS.map((ventaja) => {
                const Icono = ventaja.icono;
                return (
                  <li key={ventaja.titulo}>
                    <Tarjeta className="h-full p-5">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-brand-600 dark:text-brand-300">
                        <Icono aria-hidden="true" className="size-5" />
                      </span>
                      <h3 className="mt-4 text-sm font-semibold text-ink">
                        {ventaja.titulo}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                        {ventaja.descripcion}
                      </p>
                    </Tarjeta>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Llamada a la acción */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="degradado-marca relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white shadow-lift sm:px-12">
          <div aria-hidden="true" className="reticula absolute inset-0 opacity-70" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Empieza a reservar hoy mismo
            </h2>
            <p className="mt-3 text-base leading-relaxed text-white/85">
              Crea tu cuenta en menos de un minuto y gestiona todas tus citas desde un
              único panel.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/registro">
                <Boton
                  variante="secundario"
                  tamano="lg"
                  className="bg-white text-brand-700 hover:bg-white/90"
                >
                  Crear cuenta
                </Boton>
              </Link>
              <Link href="/servicios">
                <Boton
                  variante="contorno"
                  tamano="lg"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  Ver servicios
                </Boton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
