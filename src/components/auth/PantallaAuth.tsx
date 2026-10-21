import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarCheck, Clock3, ShieldCheck } from "lucide-react";

import { Marca } from "@/components/layout/Marca";

/**
 * Marco visual compartido por las pantallas de acceso:
 * panel de marca a la izquierda y formulario a la derecha.
 */
export function PantallaAuth({
  titulo,
  descripcion,
  children,
  pie,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  const ventajas = [
    {
      icono: CalendarCheck,
      titulo: "Disponibilidad real",
      texto: "Los horarios que ves son los que quedan libres, al momento.",
    },
    {
      icono: Clock3,
      titulo: "Reserva en segundos",
      texto: "Sin llamadas ni esperas: eliges, confirmas y listo.",
    },
    {
      icono: ShieldCheck,
      titulo: "Datos protegidos",
      texto: "Contraseñas cifradas con bcrypt y sesiones seguras.",
    },
  ];

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
      {/* Panel de marca */}
      <section className="relative hidden overflow-hidden rounded-3xl degradado-marca p-10 text-white lg:block">
        <div aria-hidden="true" className="reticula absolute inset-0" />
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-16 size-80 rounded-full bg-fuchsia-400/20 blur-3xl"
        />

        <div className="relative">
          <Link href="/" className="inline-flex rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
            <Marca />
          </Link>

          <h2 className="mt-12 max-w-md text-3xl font-bold leading-tight tracking-tight">
            Tu agenda, organizada en un solo lugar.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Gestiona citas de salud, terapia, consultoría o formación con la misma
            simplicity, sin importar el servicio.
          </p>

          <ul className="mt-10 space-y-5">
            {ventajas.map((ventaja) => {
              const Icono = ventaja.icono;
              return (
                <li key={ventaja.titulo} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                    <Icono aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{ventaja.titulo}</p>
                    <p className="text-sm text-white/75">{ventaja.texto}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Formulario */}
      <section className="mx-auto w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <Link href="/" aria-label="Volver al inicio">
            <Marca />
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-ink">{titulo}</h1>
        <p className="mt-2 text-ink-muted">{descripcion}</p>

        <div className="mt-8">{children}</div>

        {pie ? <div className="mt-8 text-center text-sm text-ink-subtle">{pie}</div> : null}
      </section>
    </div>
  );
}
