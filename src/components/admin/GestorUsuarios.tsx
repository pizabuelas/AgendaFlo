"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";

import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campos";
import { Avatar, Insignia, Tarjeta } from "@/components/ui/Tarjeta";
import { useToast } from "@/components/providers/ProveedorToast";
import { ROL_LABEL, type Rol } from "@/lib/constants";
import { cn, formatearMarcaTiempo, iniciales } from "@/lib/utils";
import type { UsuarioAdmin } from "./tipos-admin";

/**
 * Gestión de usuarios (RF-01).
 * Permite cambiar el rol (usuario estándar o administrador) y activar o
 * desactivar cuentas. El servidor impide que un administrador se quite a sí
 * mismo el rol o desactive su propia cuenta.
 */

const FILTROS = [
  { clave: "todos", etiqueta: "Todos" },
  { clave: "USUARIO", etiqueta: "Usuarios" },
  { clave: "ADMIN", etiqueta: "Administradores" },
] as const;

export function GestorUsuarios({
  usuarios,
  total,
  rolInicial,
  busquedaInicial,
}: {
  usuarios: UsuarioAdmin[];
  total: number;
  rolInicial: string;
  busquedaInicial: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [rol, setRol] = useState(rolInicial);
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const coincideRol = rol === "todos" || usuario.rol === rol;
      const coincideTexto =
        texto.length === 0 ||
        usuario.nombre.toLowerCase().includes(texto) ||
        usuario.email.toLowerCase().includes(texto);

      return coincideRol && coincideTexto;
    });
  }, [usuarios, rol, busqueda]);

  async function actualizar(usuario: UsuarioAdmin, cambios: Record<string, unknown>) {
    setOcupado(usuario.id);

    try {
      const respuesta = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      const cuerpo = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !cuerpo?.ok) {
        throw new Error(cuerpo?.mensaje ?? "No se pudo actualizar el usuario.");
      }

      toast.exito("Usuario actualizado", cuerpo.mensaje ?? "Los cambios se han guardado.");
      router.refresh();
    } catch (error) {
      toast.error(
        "No se pudo actualizar el usuario",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div
          role="group"
          aria-label="Filtrar usuarios por rol"
          className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1"
        >
          {FILTROS.map((filtro) => (
            <button
              key={filtro.clave}
              type="button"
              aria-pressed={rol === filtro.clave}
              onClick={() => setRol(filtro.clave)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                rol === filtro.clave
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              {filtro.etiqueta}
            </button>
          ))}
        </div>

        <Campo
          id="admin-buscar-usuario"
          etiqueta="Buscar"
          className="min-w-56 flex-1 sm:max-w-xs"
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Nombre o correo"
        />
      </div>

      {filtrados.length === 0 ? (
        <Tarjeta className="p-10 text-center">
          <p className="text-sm font-medium text-ink">No hay usuarios que coincidan</p>
          <p className="mt-1 text-sm text-ink-muted">Cambia el filtro o la búsqueda.</p>
        </Tarjeta>
      ) : (
        <ul className="space-y-3">
          {filtrados.map((usuario) => (
            <li key={usuario.id}>
              <Tarjeta className="flex flex-wrap items-center gap-4 p-4">
                <Avatar iniciales={iniciales(usuario.nombre)} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{usuario.nombre}</p>
                    <Insignia tono={usuario.rol === "ADMIN" ? "marca" : "neutro"}>
                      {ROL_LABEL[usuario.rol as Rol] ?? usuario.rol}
                    </Insignia>
                    {usuario.activo ? null : <Insignia tono="peligro">Desactivada</Insignia>}
                  </div>

                  <p className="mt-0.5 truncate text-sm text-ink-muted">{usuario.email}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {usuario.totalReservas} reserva{usuario.totalReservas === 1 ? "" : "s"} ·{" "}
                    Alta el {formatearMarcaTiempo(new Date(usuario.createdAt))}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    cargando={ocupado === usuario.id}
                    onClick={() =>
                      actualizar(usuario, {
                        rol: usuario.rol === "ADMIN" ? "USUARIO" : "ADMIN",
                      })
                    }
                    icono={
                      usuario.rol === "ADMIN" ? (
                        <ShieldOff aria-hidden="true" className="size-3.5" />
                      ) : (
                        <ShieldCheck aria-hidden="true" className="size-3.5" />
                      )
                    }
                  >
                    {usuario.rol === "ADMIN" ? "Quitar administrador" : "Hacer administrador"}
                  </Boton>

                  <Boton
                    variante={usuario.activo ? "fantasma" : "secundario"}
                    tamano="sm"
                    cargando={ocupado === usuario.id}
                    onClick={() => actualizar(usuario, { activo: !usuario.activo })}
                    icono={
                      usuario.activo ? (
                        <UserX aria-hidden="true" className="size-3.5" />
                      ) : (
                        <UserCheck aria-hidden="true" className="size-3.5" />
                      )
                    }
                    className={usuario.activo ? "text-danger hover:bg-danger-soft" : undefined}
                  >
                    {usuario.activo ? "Desactivar" : "Reactivar"}
                  </Boton>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-ink-subtle">
        Mostrando {filtrados.length} de {total} usuarios.
      </p>
    </div>
  );
}
