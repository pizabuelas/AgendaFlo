import type { Metadata } from "next";

import { GestorReservas } from "@/components/admin/GestorReservas";
import { listarReservas } from "@/lib/services/reservas";

export const metadata: Metadata = {
  title: "Reservas",
  description: "Gestión del estado de las citas reservadas en AgendaFlow.",
};

/** Panel de gestión de reservas (RF-04). */
export default async function PaginaAdminReservas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const crudos = await searchParams;
  const valor = (clave: string) => {
    const dato = crudos[clave];
    return Array.isArray(dato) ? dato[0] : dato;
  };

  const estado = valor("estado") ?? "todos";
  const busqueda = valor("q") ?? "";

  const resultado = await listarReservas({
    estado: estado === "todos" ? "todos" : (estado as never),
    q: busqueda,
    pagina: 1,
    porPagina: 48,
  });

  return (
    <GestorReservas
      reservas={resultado.reservas.map((reserva) => ({
        id: reserva.id,
        codigo: reserva.codigo,
        fecha: reserva.fecha.toISOString(),
        hora: reserva.hora,
        duracionMin: reserva.duracionMin,
        precio: reserva.precio,
        estado: reserva.estado,
        notas: reserva.notas,
        usuario: {
          id: reserva.usuarioId,
          nombre: reserva.usuario.nombre,
          email: reserva.usuario.email,
        },
        servicio: {
          nombre: reserva.servicio.nombre,
          color: reserva.servicio.color,
        },
      }))}
      total={resultado.total}
      estadoInicial={estado}
      busquedaInicial={busqueda}
    />
  );
}
