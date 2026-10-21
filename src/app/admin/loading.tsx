import { Esqueleto } from "@/components/ui/Tarjeta";

/** Esqueleto de carga del panel de administración (RF-05). */
export default function Cargando() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Esqueleto className="h-4 w-48" />
      <Esqueleto className="mt-3 h-9 w-72 max-w-full" />

      <div className="mt-6 flex gap-2 border-b border-line pb-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Esqueleto key={indice} className="h-9 w-28" />
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Esqueleto key={indice} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Esqueleto className="h-80 rounded-2xl" />
        <Esqueleto className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
