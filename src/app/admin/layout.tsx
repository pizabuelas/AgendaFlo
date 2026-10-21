import type { Metadata } from "next";

import { NavegacionAdmin } from "@/components/admin/NavegacionAdmin";
import { requiereAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Panel de administración",
  description: "Gestión de servicios, reservas y usuarios de AgendaFlow.",
  robots: { index: false, follow: false },
};

/**
 * Envoltorio del panel de administración.
 * La comprobación de permisos se hace en el servidor: solo los usuarios con
 * rol ADMIN pueden acceder a esta sección (RF-01).
 */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const usuario = await requiereAdmin("/login?redirect=/admin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Panel de administración
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Gestión de AgendaFlow
          </h1>
        </div>
        <p className="text-sm text-ink-muted">
          Sesión de <span className="font-medium text-ink">{usuario.nombre}</span> ·{" "}
          <span className="text-ink-subtle">{usuario.email}</span>
        </p>
      </div>

      <div className="mt-6 border-b border-line pb-4">
        <NavegacionAdmin />
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
