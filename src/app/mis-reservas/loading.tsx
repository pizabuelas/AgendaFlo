import { Esqueleto } from "@/components/ui/Tarjeta";

/** Esqueleto de carga del área de citas del usuario (RF-05). */
export default function Cargando() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Esqueleto className="h-4 w-28" />
      <Esqueleto className="mt-3 h-9 w-64 max-w-full" />
      <Esqueleto className="mt-3 h-5 w-full max-w-lg" />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, indice) => (
          <Esqueleto key={indice} className="h-24 rounded-2xl" />
        ))}
      </div>

      <div className="mt-10 space-y-4">
        {Array.from({ length: 3 }).map((_, indice) => (
          <Esqueleto key={indice} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
