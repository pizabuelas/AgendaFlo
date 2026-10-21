import {
  Activity,
  Award,
  Brain,
  CalendarDays,
  Dumbbell,
  Flower2,
  HeartPulse,
  Mic,
  Presentation,
  Sparkles,
  Stethoscope,
  Table2,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Traducción entre los datos guardados en la base de datos (nombre de color y
 * de icono) y los componentes visuales de Tailwind y Lucide.
 * Las clases deben escribirse de forma literal para que Tailwind las detecte.
 */

export interface EstiloColor {
  /** Clases del degradado de la tarjeta. */
  degradado: string;
  /** Fondo y color del icono. */
  icono: string;
  /** Fondo y color de las insignias. */
  insignia: string;
  /** Anillo de foco/acento. */
  acento: string;
}

export const MAPA_COLOR: Record<string, EstiloColor> = {
  indigo: {
    degradado: "from-indigo-500 to-indigo-600",
    icono: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    insignia: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    acento: "focus-visible:outline-indigo-500",
  },
  violet: {
    degradado: "from-violet-500 to-violet-600",
    icono: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    insignia: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    acento: "focus-visible:outline-violet-500",
  },
  sky: {
    degradado: "from-sky-500 to-sky-600",
    icono: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    insignia: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    acento: "focus-visible:outline-sky-500",
  },
  emerald: {
    degradado: "from-emerald-500 to-emerald-600",
    icono: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    insignia: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    acento: "focus-visible:outline-emerald-500",
  },
  amber: {
    degradado: "from-amber-500 to-amber-600",
    icono: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    insignia: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    acento: "focus-visible:outline-amber-500",
  },
  rose: {
    degradado: "from-rose-500 to-rose-600",
    icono: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    insignia: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    acento: "focus-visible:outline-rose-500",
  },
  teal: {
    degradado: "from-teal-500 to-teal-600",
    icono: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
    insignia: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    acento: "focus-visible:outline-teal-500",
  },
  orange: {
    degradado: "from-orange-500 to-orange-600",
    icono: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
    insignia: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    acento: "focus-visible:outline-orange-500",
  },
};

export const COLOR_POR_DEFECTO = MAPA_COLOR.indigo;

/** Devuelve el estilo asociado a un color, con un valor por defecto seguro. */
export function estiloColor(color?: string | null): EstiloColor {
  return (color && MAPA_COLOR[color]) || COLOR_POR_DEFECTO;
}

export const MAPA_ICONO: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  brain: Brain,
  "heart-pulse": HeartPulse,
  activity: Activity,
  target: Target,
  "trending-up": TrendingUp,
  presentation: Presentation,
  table: Table2,
  mic: Mic,
  award: Award,
  users: Users,
  spa: Flower2,
  zap: Zap,
  dumbbell: Dumbbell,
  calendar: CalendarDays,
};

/** Devuelve el icono asociado al nombre guardado en la base de datos. */
export function iconoServicio(nombre?: string | null): LucideIcon {
  return (nombre && MAPA_ICONO[nombre]) || CalendarDays;
}
