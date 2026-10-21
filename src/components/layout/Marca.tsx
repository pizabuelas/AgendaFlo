import { cn } from "@/lib/utils";

/**
 * Logotipo de AgendaFlow: un calendario con una marca de verificación.
 * Es un SVG en línea para que se escale sin pérdida y no requiera peticiones
 * de red (RNF-02).
 */
export function Marca({ className, compacta = false }: { className?: string; compacta?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="degradado-marca flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5 text-white"
          aria-hidden="true"
          focusable="false"
        >
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
            opacity="0.9"
          />
          <path
            d="M3 10h18M8 3v4M16 3v4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="m9 15 2 2 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {!compacta ? (
        <span className="text-lg font-semibold tracking-tight text-ink">
          Agenda<span className="text-brand-600">Flow</span>
        </span>
      ) : null}
    </span>
  );
}
