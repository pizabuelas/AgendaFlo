"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  Pencil,
  Plus,
  Trash2,
  UserRoundX,
} from "lucide-react";

import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campos";
import { Insignia, Tarjeta } from "@/components/ui/Tarjeta";
import { useToast } from "@/components/providers/ProveedorToast";
import { MAPA_ICONO, estiloColor } from "@/lib/tema";
import { formatearDuracion, formatearPrecio } from "@/lib/utils";
import { FormularioServicio } from "./FormularioServicio";
import type { CategoriaAdmin, ServicioAdmin } from "./tipos-admin";

/**
 * Panel de gestión del catálogo (RF-02).
 * Permite crear, editar, dar de baja, reactivar y eliminar servicios.
 */

type FiltroEstado = "todos" | "activo" | "inactivo";

export function GestorServicios({
  servicios,
  categorias,
}: {
  servicios: ServicioAdmin[];
  categorias: CategoriaAdmin[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [servicioEnEdicion, setServicioEnEdicion] = useState<ServicioAdmin | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return servicios.filter((servicio) => {
      const coincideEstado =
        filtro === "todos" ||
        (filtro === "activo" ? servicio.activo : !servicio.activo);

      const coincideTexto =
        texto.length === 0 ||
        servicio.nombre.toLowerCase().includes(texto) ||
        servicio.categoria.nombre.toLowerCase().includes(texto);

      return coincideEstado && coincideTexto;
    });
  }, [servicios, busqueda, filtro]);

  function abrirNuevo() {
    setServicioEnEdicion(null);
    setFormularioAbierto(true);
  }

  function abrirEdicion(servicio: ServicioAdmin) {
    setServicioEnEdicion(servicio);
    setFormularioAbierto(true);
  }

  async function guardar(datos: Record<string, unknown>, servicio: ServicioAdmin | null) {
    const respuesta = await fetch(
      servicio ? `/api/servicios/${servicio.id}` : "/api/servicios",
      {
        method: servicio ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      },
    );

    const cuerpo = await respuesta.json().catch(() => null);

    if (!respuesta.ok || !cuerpo?.ok) {
      throw new Error(cuerpo?.mensaje ?? "No se pudo guardar el servicio.");
    }

    toast.exito(
      servicio ? "Servicio actualizado" : "Servicio creado",
      cuerpo.mensaje ?? "Los cambios se han guardado correctamente.",
    );

    setFormularioAbierto(false);
    router.refresh();
  }

  async function cambiarEstado(servicio: ServicioAdmin) {
    setOcupado(servicio.id);

    try {
      const respuesta = await fetch(`/api/servicios/${servicio.id}`, {
        method: servicio.activo ? "DELETE" : "POST",
      });
      const cuerpo = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !cuerpo?.ok) {
        throw new Error(cuerpo?.mensaje ?? "No se pudo cambiar el estado del servicio.");
      }

      toast.exito(
        servicio.activo ? "Servicio dado de baja" : "Servicio reactivado",
        cuerpo.mensaje ?? "El catálogo se ha actualizado.",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        "No se pudo actualizar el servicio",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setOcupado(null);
    }
  }

  async function eliminar(servicio: ServicioAdmin) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente «${servicio.nombre}»? Solo es posible si no tiene reservas asociadas.`,
    );

    if (!confirmado) return;

    setOcupado(servicio.id);

    try {
      const respuesta = await fetch(
        `/api/servicios/${servicio.id}?definitivo=true`,
        { method: "DELETE" },
      );
      const cuerpo = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !cuerpo?.ok) {
        throw new Error(cuerpo?.mensaje ?? "No se pudo eliminar el servicio.");
      }

      toast.exito("Servicio eliminado", cuerpo.mensaje ?? "El servicio ya no está en el catálogo.");
      router.refresh();
    } catch (error) {
      toast.error(
        "No se pudo eliminar el servicio",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <Campo
            id="admin-buscar-servicio"
            etiqueta="Buscar"
            className="min-w-56 flex-1"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombre o categoría"
          />

          <div
            role="group"
            aria-label="Filtrar por estado"
            className="flex rounded-xl border border-line bg-surface p-1"
          >
            {(
              [
                { clave: "todos", etiqueta: "Todos" },
                { clave: "activo", etiqueta: "Activos" },
                { clave: "inactivo", etiqueta: "De baja" },
              ] as const
            ).map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                aria-pressed={filtro === opcion.clave}
                onClick={() => setFiltro(opcion.clave)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filtro === opcion.clave
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-ink-muted hover:bg-surface-muted hover:text-ink"
                }`}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <Boton
          variante="primario"
          onClick={abrirNuevo}
          icono={<Plus aria-hidden="true" className="size-4" />}
        >
          Nuevo servicio
        </Boton>
      </div>

      {/* Listado */}
      {filtrados.length === 0 ? (
        <Tarjeta className="p-10 text-center">
          <p className="text-sm font-medium text-ink">No hay servicios que coincidan</p>
          <p className="mt-1 text-sm text-ink-muted">
            Cambia la búsqueda o crea un servicio nuevo.
          </p>
        </Tarjeta>
      ) : (
        <ul className="grid gap-3">
          {filtrados.map((servicio) => {
            const estilo = estiloColor(servicio.color);
            const Icono = MAPA_ICONO[servicio.icono] ?? MAPA_ICONO.calendar;

            return (
              <li key={servicio.id}>
                <Tarjeta className="flex flex-wrap items-center gap-4 p-4">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${estilo.icono}`}
                  >
                    <Icono aria-hidden="true" className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{servicio.nombre}</p>
                      {servicio.activo ? (
                        <Insignia tono="exito">Activo</Insignia>
                      ) : (
                        <Insignia tono="peligro">De baja</Insignia>
                      )}
                      {servicio.destacado ? (
                        <Insignia tono="marca">Destacado</Insignia>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-ink-muted">
                      {servicio.categoria.nombre} · {formatearPrecio(servicio.precio)} ·{" "}
                      {formatearDuracion(servicio.duracionMin)} · {servicio.horarios.length} franja
                      {servicio.horarios.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-subtle">/{servicio.slug}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      onClick={() => abrirEdicion(servicio)}
                      icono={<Pencil aria-hidden="true" className="size-3.5" />}
                    >
                      Editar
                    </Boton>

                    <Boton
                      variante="secundario"
                      tamano="sm"
                      cargando={ocupado === servicio.id}
                      onClick={() => cambiarEstado(servicio)}
                      icono={
                        servicio.activo ? (
                          <UserRoundX aria-hidden="true" className="size-3.5" />
                        ) : (
                          <ArchiveRestore aria-hidden="true" className="size-3.5" />
                        )
                      }
                    >
                      {servicio.activo ? "Dar de baja" : "Reactivar"}
                    </Boton>

                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      onClick={() => eliminar(servicio)}
                      icono={<Trash2 aria-hidden="true" className="size-3.5" />}
                      aria-label={`Eliminar ${servicio.nombre}`}
                      className="text-danger hover:bg-danger-soft"
                    />
                  </div>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-sm text-ink-subtle">
        Mostrando {filtrados.length} de {servicios.length} servicios.
      </p>

      <FormularioServicio
        abierto={formularioAbierto}
        servicio={servicioEnEdicion}
        categorias={categorias}
        onCerrar={() => setFormularioAbierto(false)}
        onGuardar={guardar}
      />
    </div>
  );
}
