import { Esqueleto } from "@/components/ui/Tarjeta";

/** Esqueleto de carga del catálogo (RF-05). */
export default function Cargando() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Esqueleto className="h-4 w-28" />
      <Esqueleto className="mt-3 h-10 w-80 max-w-full" />
      <Esqueleto className="mt-3 h-5 w-full max-w-xl" />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Esqueleto className="h-11 flex-1" />
        <Esqueleto className="h-11 w-44" />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, indice) => (
          <div
            key={indice}
            className="overflow-hidden rounded-2xl border border-line bg-surface"
          >
            <Esqueleto className="h-32 rounded-none" />
            <div className="space-y-3 p-5">
              <Esqueleto className="h-5 w-24" />
              <Esqueleto className="h-5 w-3/4" />
              <Esqueleto className="h-3 w-full" />
              <Esqueleto className="h-3 w-5/6" />
              <div className="flex justify-between pt-3">
                <Esqueleto className="h-8 w-20" />
                <Esqueleto className="h-9 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
