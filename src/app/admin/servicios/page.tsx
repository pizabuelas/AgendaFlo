import type { Metadata } from "next";

import { GestorServicios } from "@/components/admin/GestorServicios";
import { listarServiciosAdmin, listarTodasCategorias } from "@/lib/services/servicios";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Alta, edición y baja de servicios del catálogo de AgendaFlow.",
};

/**
 * Gestión del catálogo (RF-02).
 * La página carga todos los servicios, incluidos los dados de baja, para que
 * el administrador pueda reactivarlos o eliminarlos.
 */
export default async function PaginaAdminServicios() {
  const [servicios, categorias] = await Promise.all([
    listarServiciosAdmin(),
    listarTodasCategorias(),
  ]);

  return (
    <GestorServicios
      servicios={servicios.map((servicio) => ({
        id: servicio.id,
        nombre: servicio.nombre,
        slug: servicio.slug,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
        duracionMin: servicio.duracionMin,
        icono: servicio.icono,
        color: servicio.color,
        destacado: servicio.destacado,
        activo: servicio.activo,
        categoriaId: servicio.categoriaId,
        categoria: {
          id: servicio.categoria.id,
          nombre: servicio.categoria.nombre,
        },
        horarios: servicio.horarios.map((horario) => ({
          id: horario.id,
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
        })),
      }))}
      categorias={categorias.map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        activa: categoria.activa,
      }))}
    />
  );
}
