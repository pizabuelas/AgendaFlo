import type { Metadata } from "next";

import { GestorUsuarios } from "@/components/admin/GestorUsuarios";
import { listarUsuarios } from "@/lib/services/usuarios";

export const metadata: Metadata = {
  title: "Usuarios",
  description: "Gestión de roles y estado de las cuentas de AgendaFlow.",
};

/** Gestión de usuarios y roles (RF-01). */
export default async function PaginaAdminUsuarios({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const crudos = await searchParams;
  const valor = (clave: string) => {
    const dato = crudos[clave];
    return Array.isArray(dato) ? dato[0] : dato;
  };

  const rol = valor("rol") ?? "todos";
  const busqueda = valor("q") ?? "";

  const resultado = await listarUsuarios({
    rol: (rol === "ADMIN" || rol === "USUARIO" ? rol : "todos") as never,
    q: busqueda,
    pagina: 1,
    porPagina: 48,
  });

  return (
    <GestorUsuarios
      usuarios={resultado.usuarios.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
        activo: usuario.activo,
        createdAt: usuario.createdAt.toISOString(),
        totalReservas: usuario._count.reservas,
      }))}
      total={resultado.total}
      rolInicial={rol}
      busquedaInicial={busqueda}
    />
  );
}
