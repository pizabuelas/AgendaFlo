"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Navegación interna del panel de administración.
 * Se marca como activo el apartado en el que se encuentra el usuario.
 */

const SECCIONES = [
  { href: "/admin", etiqueta: "Resumen", icono: LayoutDashboard, exacto: true },
  { href: "/admin/servicios", etiqueta: "Servicios", icono: Package, exacto: false },
  { href: "/admin/reservas", etiqueta: "Reservas", icono: CalendarCheck2, exacto: false },
  { href: "/admin/usuarios", etiqueta: "Usuarios", icono: Users, exacto: false },
];

export function NavegacionAdmin() {
  const ruta = usePathname();

  return (
    <nav aria-label="Secciones del panel de administración">
      <ul className="flex gap-1 overflow-x-auto pb-1">
        {SECCIONES.map((seccion) => {
          const Icono = seccion.icono;
          const activo = seccion.exacto
            ? ruta === seccion.href
            : ruta === seccion.href || ruta.startsWith(`${seccion.href}/`);

          return (
            <li key={seccion.href}>
              <Link
                href={seccion.href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                  activo
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                )}
              >
                <Icono aria-hidden="true" className="size-4" />
                {seccion.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
