"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarX2, CheckCircle2, Clock, Loader2 } from "lucide-react";

import { useToast } from "@/components/providers/ProveedorToast";
import { Boton } from "@/components/ui/Boton";
import { AreaTexto } from "@/components/ui/Campos";
import { Aviso } from "@/components/ui/Tarjeta";
import { cn, formatearDuracion } from "@/lib/utils";

/**
 * RF-04 — Formulario de reserva.
 *
 * El usuario elige una fecha, el sistema consulta la disponibilidad real en
 * el servidor y muestra los huecos libres; al confirmar se crea la cita.
 */

interface HorarioServicio {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface Hueco {
  hora: string;
  disponible: boolean;
  motivo?: "ocupado" | "pasado";
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Construye la lista de fechas seleccionables a partir de los horarios. */
function construirFechas(horarios: HorarioServicio[], cantidad = 21) {
  const diasConHorario = new Set(horarios.map((h) => h.diaSemana));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechas: Array<{ iso: string; dia: string; diaSemana: number; mes: string; disponible: boolean }> = [];

  for (let indice = 0; indice < cantidad; indice += 1) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + indice);
    const iso = fecha.toISOString().slice(0, 10);
    const diaSemana = fecha.getDay();

    fechas.push({
      iso,
      dia: String(fecha.getDate()).padStart(2, "0"),
      diaSemana,
      mes: MESES[fecha.getMonth()],
      disponible: diasConHorario.has(diaSemana),
    });
  }

  return fechas;
}

export function FormularioReserva({
  servicioId,
  horarios,
  duracionMin,
  nombreServicio,
}: {
  servicioId: string;
  horarios: HorarioServicio[];
  duracionMin: number;
  nombreServicio: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const fechas = useMemo(() => construirFechas(horarios), [horarios]);

  const primeraDisponible = fechas.find((fecha) => fecha.disponible)?.iso ?? "";
  const [fecha, setFecha] = useState(primeraDisponible);
  const [huecos, setHuecos] = useState<Hueco[]>([]);
  const [cargando, setCargando] = useState(false);
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Carga los huecos disponibles cada vez que cambia la fecha. */
  useEffect(() => {
    if (!fecha) return;

    let cancelado = false;
    setCargando(true);
    setHora("");
    setError(null);

    fetch(`/api/disponibilidad?servicioId=${encodeURIComponent(servicioId)}&fecha=${fecha}`)
      .then(async (respuesta) => {
        const cuerpo = await respuesta.json();
        if (!respuesta.ok) throw new Error(cuerpo.mensaje ?? "No se pudo consultar la disponibilidad.");
        return cuerpo.datos;
      })
      .then((datos: { huecos: Hueco[] }) => {
        if (cancelado) return;
        setHuecos(datos.huecos);
      })
      .catch((error: Error) => {
        if (!cancelado) setError(error.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [fecha, servicioId]);

  const libres = huecos.filter((hueco) => hueco.disponible);
  const ocupados = huecos.filter((hueco) => !hueco.disponible);

  async function reservar() {
    if (!hora) {
      setError("Selecciona una hora disponible para continuar.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicioId, fecha, hora, notas }),
      });

      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setError(cuerpo.mensaje ?? "No se ha podido completar la reserva.");
        toast.error("No se pudo reservar", cuerpo.mensaje);
        return;
      }

      toast.exito("¡Cita reservada!", cuerpo.mensaje ?? "Tu cita ha quedado registrada.");
      router.push("/mis-reservas");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Paso 1 — fecha */}
      <section aria-labelledby="paso-fecha">
        <h3 id="paso-fecha" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="flex size-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            1
          </span>
          Elige el día
        </h3>

        <div className="mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
          {fechas.map((opcion) => {
            const activa = opcion.iso === fecha;

            return (
              <button
                key={opcion.iso}
                type="button"
                disabled={!opcion.disponible}
                onClick={() => setFecha(opcion.iso)}
                aria-pressed={activa}
                aria-label={`Día ${opcion.dia} de ${opcion.mes}${opcion.disponible ? "" : " (sin horario)"}`}
                className={cn(
                  "flex min-w-16 shrink-0 snap-start flex-col items-center rounded-xl border px-3 py-2.5 transition",
                  activa
                    ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : opcion.disponible
                      ? "border-line bg-surface text-ink hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                      : "cursor-not-allowed border-line bg-surface-muted text-ink-subtle opacity-60",
                )}
              >
                <span className="text-[11px] font-medium uppercase opacity-80">
                  {DIAS[opcion.diaSemana]}
                </span>
                <span className="text-lg font-semibold leading-tight">{opcion.dia}</span>
                <span className="text-[11px] capitalize opacity-70">{opcion.mes}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Paso 2 — hora */}
      <section aria-labelledby="paso-hora">
        <h3 id="paso-hora" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="flex size-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            2
          </span>
          Elige la hora
        </h3>

        <div className="mt-3 rounded-xl border border-line bg-surface-muted/50 p-4">
          {cargando ? (
            <div className="flex items-center gap-2 text-sm text-ink-muted" role="status">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Consultando disponibilidad…
            </div>
          ) : huecos.length === 0 ? (
            <div className="flex items-start gap-2.5 text-sm text-ink-muted">
              <CalendarX2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
              <p>
                No hay atención programada para este día. Prueba con otra fecha del
                calendario.
              </p>
            </div>
          ) : (
            <>
              {libres.length > 0 ? (
                <>
                  <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                    <Clock aria-hidden="true" className="size-3.5" />
                    {libres.length} {libres.length === 1 ? "horario disponible" : "horarios disponibles"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {libres.map((hueco) => (
                      <button
                        key={hueco.hora}
                        type="button"
                        onClick={() => setHora(hueco.hora)}
                        aria-pressed={hora === hueco.hora}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                          hora === hueco.hora
                            ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                            : "border-line bg-surface text-ink hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40",
                        )}
                      >
                        {hueco.hora}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <CalendarX2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
                  <p>No quedan huecos libres para esta fecha. Elige otro día.</p>
                </div>
              )}

              {ocupados.length > 0 ? (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-2 text-xs font-medium text-ink-subtle">
                    No disponibles ({ocupados.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ocupados.map((hueco) => (
                      <span
                        key={hueco.hora}
                        className="rounded-lg border border-line bg-surface-muted px-3 py-1.5 text-sm text-ink-subtle line-through"
                      >
                        {hueco.hora}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* Paso 3 — notas y confirmación */}
      <section aria-labelledby="paso-confirmar">
        <h3 id="paso-confirmar" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="flex size-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            3
          </span>
            Confirma la reserva
        </h3>

        <div className="mt-3 space-y-4">
          <AreaTexto
            id="notas"
            etiqueta="Notas para el profesional (opcional)"
            placeholder="Cuéntanos brevemente qué necesitas para preparar la sesión…"
            rows={3}
            maxLength={500}
            value={notas}
            onChange={(evento) => setNotas(evento.target.value)}
            ayuda="Máximo 500 caracteres."
          />

          {hora ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success-soft px-4 py-3 text-sm text-ink-muted">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              <p>
                Vas a reservar <strong className="font-semibold text-ink">{nombreServicio}</strong>{" "}
                el <strong className="font-semibold text-ink">{fecha.split("-").reverse().join("/")}</strong>{" "}
                a las <strong className="font-semibold text-ink">{hora}</strong> ({formatearDuracion(duracionMin)}).
              </p>
            </div>
          ) : null}

          {error ? <Aviso tono="peligro">{error}</Aviso> : null}

          <Boton
            variante="primario"
            tamano="lg"
            anchoCompleto
            onClick={reservar}
            cargando={enviando}
            disabled={!hora || cargando}
            icono={<CalendarDays aria-hidden="true" className="size-4" />}
          >
            Confirmar cita
          </Boton>

          <p className="text-center text-xs text-ink-subtle">
            Podrás cancelar o reprogramar tu cita desde «Mis citas».
          </p>
        </div>
      </section>
    </div>
  );
}
