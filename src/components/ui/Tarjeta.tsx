import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Tarjeta                                                                     */
/* -------------------------------------------------------------------------- */

export function Tarjeta({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-soft transition-shadow",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function EncabezadoTarjeta({
  titulo,
  descripcion,
  accion,
  className,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{titulo}</h2>
        {descripcion ? <p className="mt-1 text-sm text-ink-muted">{descripcion}</p> : null}
      </div>
      {accion}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Insignia                                                                    */
/* -------------------------------------------------------------------------- */

export type TonoInsignia = "neutro" | "exito" | "aviso" | "peligro" | "info" | "marca";

const TONOS: Record<TonoInsignia, string> = {
  neutro: "bg-surface-muted text-ink-muted border-line",
  exito: "bg-success-soft text-success border-success/25",
  aviso: "bg-warning-soft text-warning border-warning/25",
  peligro: "bg-danger-soft text-danger border-danger/25",
  info: "bg-info-soft text-info border-info/25",
  marca: "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800",
};

export function Insignia({
  children,
  tono = "neutro",
  className,
}: {
  children: ReactNode;
  tono?: TonoInsignia;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                      */
/* -------------------------------------------------------------------------- */

const TONOS_AVATAR = [
  "bg-brand-100 text-brand-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

export function Avatar({
  iniciales,
  tamano = "md",
  className,
}: {
  iniciales: string;
  tamano?: "sm" | "md" | "lg";
  className?: string;
}) {
  const indice = iniciales.charCodeAt(0) % TONOS_AVATAR.length;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        TONOS_AVATAR[indice],
        tamano === "sm" && "size-8 text-xs",
        tamano === "md" && "size-10 text-sm",
        tamano === "lg" && "size-14 text-lg",
        className,
      )}
    >
      {iniciales}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Aviso                                                                       */
/* -------------------------------------------------------------------------- */

export function Aviso({
  tono = "info",
  titulo,
  children,
  className,
}: {
  tono?: "info" | "exito" | "aviso" | "peligro";
  titulo?: string;
  children?: ReactNode;
  className?: string;
}) {
  const estilos = {
    info: "border-info/25 bg-info-soft text-info",
    exito: "border-success/25 bg-success-soft text-success",
    aviso: "border-warning/25 bg-warning-soft text-warning",
    peligro: "border-danger/25 bg-danger-soft text-danger",
  }[tono];

  return (
    <div
      role={tono === "peligro" ? "alert" : "status"}
      className={cn("rounded-xl border px-4 py-3 text-sm", estilos, className)}
    >
      {titulo ? <p className="font-semibold">{titulo}</p> : null}
      {children ? <div className={cn(titulo && "mt-1", "text-ink-muted")}>{children}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Estado vacío                                                                */
/* -------------------------------------------------------------------------- */

export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
  className,
}: {
  icono?: ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      {icono ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-subtle">
          {icono}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-ink">{titulo}</h3>
      {descripcion ? (
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{descripcion}</p>
      ) : null}
      {accion ? <div className="mt-5">{accion}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Esqueleto de carga                                                          */
/* -------------------------------------------------------------------------- */

export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("esqueleto rounded-lg", className)} />;
}
