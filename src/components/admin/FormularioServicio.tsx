"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Campo, Selector } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { COLORES, DIAS_SEMANA } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CategoriaAdmin, HorarioAdmin, ServicioAdmin } from "./tipos-admin";

/**
 * Formulario de alta y edición de servicios (RF-02).
 * Valida en el cliente los campos básicos y deja que la API sea la fuente de
 * verdad de la validación definitiva.
 */

const ICONOS = [
  { valor: "calendar", etiqueta: "Calendario" },
  { valor: "stethoscope", etiqueta: "Estetoscopio" },
  { valor: "sparkles", etiqueta: "Estética" },
  { valor: "brain", etiqueta: "Bienestar mental" },
  { valor: "heart-pulse", etiqueta: "Salud" },
  { valor: "activity", etiqueta: "Actividad física" },
  { valor: "target", etiqueta: "Objetivos" },
  { valor: "trending-up", etiqueta: "Progreso" },
  { valor: "presentation", etiqueta: "Formación" },
  { valor: "table", etiqueta: "Consulta" },
  { valor: "mic", etiqueta: "Habla" },
  { valor: "award", etiqueta: "Certificación" },
  { valor: "users", etiqueta: "Grupos" },
  { valor: "spa", etiqueta: "Bienestar" },
  { valor: "zap", etiqueta: "Energía" },
  { valor: "dumbbell", etiqueta: "Fitness" },
];

const DURACIONES = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360];

interface EstadoFormulario {
  nombre: string;
  descripcion: string;
  categoriaId: string;
  precio: string;
  duracionMin: string;
  icono: string;
  color: string;
  destacado: boolean;
  activo: boolean;
  horarios: HorarioAdmin[];
}

function estadoInicial(servicio: ServicioAdmin | null, categorias: CategoriaAdmin[]): EstadoFormulario {
  const primeraCategoria = categorias.find((categoria) => categoria.activa)?.id ?? "";

  return {
    nombre: servicio?.nombre ?? "",
    descripcion: servicio?.descripcion ?? "",
    categoriaId: servicio?.categoriaId ?? primeraCategoria,
    precio: servicio ? String(servicio.precio) : "",
    duracionMin: servicio ? String(servicio.duracionMin) : "60",
    icono: servicio?.icono ?? "calendar",
    color: servicio?.color ?? "indigo",
    destacado: servicio?.destacado ?? false,
    activo: servicio?.activo ?? true,
    horarios: servicio?.horarios.length
      ? servicio.horarios.map((horario) => ({ ...horario }))
      : [],
  };
}

export function FormularioServicio({
  abierto,
  servicio,
  categorias,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean;
  servicio: ServicioAdmin | null;
  categorias: CategoriaAdmin[];
  onCerrar: () => void;
  onGuardar: (datos: Record<string, unknown>, servicio: ServicioAdmin | null) => Promise<void>;
}) {
  const [estado, setEstado] = useState<EstadoFormulario>(() =>
    estadoInicial(servicio, categorias),
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  /* Al abrir el diálogo para otro servicio se recargan los valores. */
  useEffect(() => {
    if (abierto) {
      setEstado(estadoInicial(servicio, categorias));
      setError(null);
    }
  }, [abierto, servicio, categorias]);

  const actualizar = <K extends keyof EstadoFormulario>(
    clave: K,
    valor: EstadoFormulario[K],
  ) => {
    setEstado((previo) => ({ ...previo, [clave]: valor }));
  };

  function anadirHorario() {
    setEstado((previo) => ({
      ...previo,
      horarios: [
        ...previo.horarios,
        { diaSemana: 1, horaInicio: "09:00", horaFin: "13:00" },
      ],
    }));
  }

  function actualizarHorario(indice: number, cambios: Partial<HorarioAdmin>) {
    setEstado((previo) => ({
      ...previo,
      horarios: previo.horarios.map((horario, posicion) =>
        posicion === indice ? { ...horario, ...cambios } : horario,
      ),
    }));
  }

  function quitarHorario(indice: number) {
    setEstado((previo) => ({
      ...previo,
      horarios: previo.horarios.filter((_, posicion) => posicion !== indice),
    }));
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    if (!estado.nombre.trim()) {
      setError("Escribe el nombre del servicio.");
      return;
    }

    if (!estado.categoriaId) {
      setError("Selecciona la categoría del servicio.");
      return;
    }

    const precio = Number(estado.precio);
    const duracionMin = Number(estado.duracionMin);

    if (!Number.isFinite(precio) || precio <= 0) {
      setError("El precio debe ser un número mayor que cero.");
      return;
    }

    if (!Number.isFinite(duracionMin) || duracionMin < 15) {
      setError("La duración mínima es de 15 minutos.");
      return;
    }

    setEnviando(true);

    try {
      await onGuardar(
        {
          nombre: estado.nombre.trim(),
          descripcion: estado.descripcion.trim(),
          categoriaId: estado.categoriaId,
          precio,
          duracionMin,
          icono: estado.icono,
          color: estado.color,
          destacado: estado.destacado,
          activo: estado.activo,
          horarios: estado.horarios.map(({ diaSemana, horaInicio, horaFin }) => ({
            diaSemana,
            horaInicio,
            horaFin,
          })),
        },
        servicio,
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar el servicio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={servicio ? `Editar «${servicio.nombre}»` : "Nuevo servicio"}
      descripcion="Los datos se guardan en el catálogo y quedan disponibles de inmediato en la web."
      tamano="lg"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton variante="primario" onClick={enviar} cargando={enviando}>
            {servicio ? "Guardar cambios" : "Crear servicio"}
          </Boton>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-5">
        {error ? (
          <p role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Campo
          id="servicio-nombre"
          etiqueta="Nombre"
          requerido
          value={estado.nombre}
          onChange={(evento) => actualizar("nombre", evento.target.value)}
          placeholder="Consulta de seguimiento"
          maxLength={100}
        />

        <AreaTexto
          id="servicio-descripcion"
          etiqueta="Descripción"
          requerido
          rows={4}
          value={estado.descripcion}
          onChange={(evento) => actualizar("descripcion", evento.target.value)}
          placeholder="Explica en qué consiste el servicio, qué incluye y cómo se realiza."
          ayuda="Entre 20 y 1200 caracteres."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Selector
            id="servicio-categoria"
            etiqueta="Categoría"
            requerido
            value={estado.categoriaId}
            onChange={(evento) => actualizar("categoriaId", evento.target.value)}
            opciones={categorias.map((categoria) => ({
              valor: categoria.id,
              etiqueta: categoria.activa
                ? categoria.nombre
                : `${categoria.nombre} (inactiva)`,
            }))}
          />

          <Campo
            id="servicio-precio"
            etiqueta="Precio"
            requerido
            type="number"
            min={0}
            step="0.01"
            value={estado.precio}
            onChange={(evento) => actualizar("precio", evento.target.value)}
            placeholder="45"
          />

          <Selector
            id="servicio-duracion"
            etiqueta="Duración (minutos)"
            requerido
            value={estado.duracionMin}
            onChange={(evento) => actualizar("duracionMin", evento.target.value)}
            opciones={DURACIONES.map((duracion) => ({
              valor: String(duracion),
              etiqueta: String(duracion),
            }))}
          />

          <Selector
            id="servicio-icono"
            etiqueta="Icono"
            value={estado.icono}
            onChange={(evento) => actualizar("icono", evento.target.value)}
            opciones={ICONOS}
          />

          <Selector
            id="servicio-color"
            etiqueta="Color de acento"
            value={estado.color}
            onChange={(evento) => actualizar("color", evento.target.value)}
            opciones={COLORES.map((color) => ({ valor: color, etiqueta: color }))}
          />

          <div className="space-y-2 self-end pb-1">
            <label className="flex items-center gap-2.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={estado.activo}
                onChange={(evento) => actualizar("activo", evento.target.checked)}
                className="size-4.5 rounded border-line-strong accent-brand-600 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
              />
              Servicio activo (visible y reservable)
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={estado.destacado}
                onChange={(evento) => actualizar("destacado", evento.target.checked)}
                className="size-4.5 rounded border-line-strong accent-brand-600 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
              />
              Destacado en la portada
            </label>
          </div>
        </div>

        {/* Horarios de atención */}
        <fieldset className="rounded-xl border border-line p-4">
          <legend className="px-1 text-sm font-medium text-ink">Horarios de atención</legend>
          <p className="text-xs text-ink-subtle">
            Franjas en las que se puede reservar. Si no defines ninguna, el servicio
            no mostrará huecos disponibles.
          </p>

          {estado.horarios.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {estado.horarios.map((horario, indice) => (
                <li
                  key={`${indice}-${horario.diaSemana}`}
                  className="grid items-end gap-2 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <Selector
                    id={`horario-dia-${indice}`}
                    etiqueta={indice === 0 ? "Día" : undefined}
                    value={String(horario.diaSemana)}
                    onChange={(evento) =>
                      actualizarHorario(indice, { diaSemana: Number(evento.target.value) })
                    }
                    opciones={DIAS_SEMANA.map((dia, posicion) => ({
                      valor: String(posicion),
                      etiqueta: dia,
                    }))}
                  />
                  <Campo
                    id={`horario-inicio-${indice}`}
                    etiqueta={indice === 0 ? "Inicio" : undefined}
                    type="time"
                    value={horario.horaInicio}
                    onChange={(evento) =>
                      actualizarHorario(indice, { horaInicio: evento.target.value })
                    }
                  />
                  <Campo
                    id={`horario-fin-${indice}`}
                    etiqueta={indice === 0 ? "Fin" : undefined}
                    type="time"
                    value={horario.horaFin}
                    onChange={(evento) =>
                      actualizarHorario(indice, { horaFin: evento.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => quitarHorario(indice)}
                    aria-label={`Eliminar franja del ${DIAS_SEMANA[horario.diaSemana]}`}
                    className="mb-0.5 flex size-11 items-center justify-center rounded-xl border border-line text-ink-subtle transition hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-subtle">
              Sin franjas definidas.
            </p>
          )}

          <Boton
            variante="contorno"
            tamano="sm"
            className="mt-4"
            onClick={anadirHorario}
            icono={<Plus aria-hidden="true" className="size-4" />}
          >
            Añadir franja
          </Boton>
        </fieldset>

        {/* Botón invisible para permitir el envío con Enter. */}
        <button type="submit" className={cn("hidden")} tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
