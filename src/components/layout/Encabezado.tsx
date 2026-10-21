"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarCheck, LayoutDashboard, LogOut, Menu, X } from "lucide-react";

import { cn, iniciales } from "@/lib/utils";
import { Marca } from "./Marca";
import { SelectorTema } from "./SelectorTema";

/**
 * Encabezado principal.
 * Es un componente de cliente porque necesita conocer la ruta activa para
 * resaltar la sección en la que se encuentra el usuario.
 */

export interface UsuarioEncabezado {
  nombre: string;
  email: string;
  rol: "USUARIO" | "ADMIN";
}

const ENLACES = [
  { href: "/servicios", etiqueta: "Servicios" },
  { href: "/como-funciona", etiqueta: "Cómo funciona" },
  { href: "/contacto", etiqueta: "Contacto" },
];

export function Encabezado({ usuario }: { usuario: UsuarioEncabezado | null }) {
  const ruta = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const perfilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuAbierto(false);
    setPerfilAbierto(false);
  }, [ruta]);

  useEffect(() => {
    if (!perfilAbierto) return;

    const alPulsar = (evento: MouseEvent) => {
      if (perfilRef.current && !perfilRef.current.contains(evento.target as Node)) {
        setPerfilAbierto(false);
      }
    };
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setPerfilAbierto(false);
    };

    document.addEventListener("mousedown", alPulsar);
    document.addEventListener("keydown", alPulsarTecla);
    return () => {
      document.removeEventListener("mousedown", alPulsar);
      document.removeEventListener("keydown", alPulsarTecla);
    };
  }, [perfilAbierto]);

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const enlaces = [
    ...ENLACES,
    ...(usuario ? [{ href: "/mis-reservas", etiqueta: "Mis citas" }] : []),
    ...(usuario?.rol === "ADMIN" ? [{ href: "/admin", etiqueta: "Panel" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="AgendaFlow — ir al inicio"
          className="rounded-xl transition hover:opacity-80"
        >
          <Marca />
        </Link>

        {/* Navegación de escritorio */}
        <nav aria-label="Navegación principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {enlaces.map((enlace) => {
              const activo = ruta === enlace.href || ruta.startsWith(`${enlace.href}/`);
              return (
                <li key={enlace.href}>
                  <Link
                    href={enlace.href}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition",
                      activo
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                        : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                    )}
                  >
                    {enlace.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <SelectorTema />
          </div>

          {usuario ? (
            <div className="relative" ref={perfilRef}>
              <button
                type="button"
                onClick={() => setPerfilAbierto((abierto) => !abierto)}
                aria-expanded={perfilAbierto}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-2.5 transition hover:bg-surface-muted"
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/60 dark:text-brand-200"
                >
                  {iniciales(usuario.nombre)}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium text-ink sm:block">
                  {usuario.nombre.split(" ")[0]}
                </span>
              </button>

              {perfilAbierto ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-lift animate-scale-in"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">{usuario.nombre}</p>
                    <p className="truncate text-xs text-ink-subtle">{usuario.email}</p>
                    {usuario.rol === "ADMIN" ? (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                        <LayoutDashboard aria-hidden="true" className="size-3" />
                        Administrador
                      </span>
                    ) : null}
                  </div>

                  <div className="p-1.5">
                    <Link
                      href="/mis-reservas"
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-muted hover:text-ink"
                    >
                      <CalendarCheck aria-hidden="true" className="size-4" />
                      Mis citas
                    </Link>

                    {usuario.rol === "ADMIN" ? (
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-muted hover:text-ink"
                      >
                        <LayoutDashboard aria-hidden="true" className="size-4" />
                        Panel de administración
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={cerrarSesion}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger transition hover:bg-danger-soft"
                    >
                      <LogOut aria-hidden="true" className="size-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface-muted hover:text-ink"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* Botón de menú móvil */}
          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-surface-muted md:hidden"
          >
            {menuAbierto ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {menuAbierto ? (
        <div
          id="menu-movil"
          className="border-t border-line bg-surface animate-fade-in md:hidden"
        >
          <nav aria-label="Navegación móvil" className="mx-auto max-w-7xl px-4 py-4">
            <ul className="space-y-1">
              {enlaces.map((enlace) => {
                const activo = ruta === enlace.href || ruta.startsWith(`${enlace.href}/`);
                return (
                  <li key={enlace.href}>
                    <Link
                      href={enlace.href}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "block rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        activo
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                          : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                      )}
                    >
                      {enlace.etiqueta}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {!usuario ? (
              <div className="mt-4 grid gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-line px-4 py-2.5 text-center text-sm font-medium text-ink transition hover:bg-surface-muted"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Crear cuenta
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={cerrarSesion}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-medium text-danger transition"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Cerrar sesión
              </button>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm text-ink-subtle">Tema</span>
              <SelectorTema />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
