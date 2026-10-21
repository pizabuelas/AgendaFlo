import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos de forma inteligente. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza un texto para convertirlo en un slug único y legible por URL.
 * "  Consulta de Dental  " -> "consulta-de-dental"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Genera un código de reserva legible y difícil de adivinar (ej. "8F3K2A"). */
export function generarCodigoReserva(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 6; i += 1) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return `CIT-${codigo}`;
}

function moneda() {
  return process.env.NEXT_PUBLIC_CURRENCY ?? "USD";
}

/** Formatea un importe con el símbolo de moneda. */
export function formatearPrecio(valor: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda(),
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
  }).format(valor);
}

/**
 * Formatea una fecha de agenda (almacenada a medianoche UTC) sin desfases
 * por zona horaria: siempre se interpreta en UTC.
 */
export function formatearFecha(fecha: Date, opciones?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...opciones,
  }).format(fecha);
}

/** Formatea una fecha de agenda en formato corto dd/mm. */
export function formatearFechaCorta(fecha: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  }).format(fecha);
}

/** Sello de fecha y hora para registros con marca de tiempo real. */
export function formatearMarcaTiempo(fecha: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

/** "09:30" -> "9:30 h" */
export function formatearHora(hora: string): string {
  const [h, m] = hora.split(":");
  const horaNum = Number(h);
  const sufijo = horaNum < 12 ? "a. m." : "p. m.";
  const h12 = horaNum % 12 === 0 ? 12 : horaNum % 12;
  return m === "00" ? `${h12}:00 ${sufijo}` : `${h12}:${m} ${sufijo}`;
}

/** "60" -> "1 h" · "90" -> "1 h 30 min" */
export function formatearDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** Iniciales de un nombre completo para el avatar (máx. 2 letras). */
export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Convierte "AAAA-MM-DD" en un Date a medianoche UTC (sin desfase). */
export function fechaDesdeISO(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Devuelve "AAAA-MM-DD" a partir de un Date a medianoche UTC. */
export function isoDesdeFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Suma días a una fecha ISO y devuelve el nuevo "AAAA-MM-DD". */
export function sumarDiasISO(iso: string, dias: number): string {
  const fecha = fechaDesdeISO(iso);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return isoDesdeFecha(fecha);
}

/** Día de la semana (0 = domingo) de una fecha ISO. */
export function diaSemanaISO(iso: string): number {
  return fechaDesdeISO(iso).getUTCDay();
}

/** Construye un rango de horas "HH:mm" cada N minutos. */
export function generarHoras(inicio: string, fin: string, pasoMin: number): string[] {
  const [hIni, mIni] = inicio.split(":").map(Number);
  const [hFin, mFin] = fin.split(":").map(Number);
  const inicioMin = hIni * 60 + mIni;
  const finMin = hFin * 60 + mFin;
  const horas: string[] = [];

  for (let m = inicioMin; m + pasoMin <= finMin; m += pasoMin) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    horas.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }

  return horas;
}

/** Indica si un texto contiene al menos una letra o número. */
export function tieneContenidoSignificativo(texto: string): boolean {
  return /[\p{L}\p{N}]/u.test(texto);
}
