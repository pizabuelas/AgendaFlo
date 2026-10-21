import type { Metadata } from "next";

import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso de la plataforma AgendaFlow.",
};

/* Documento legal: términos y condiciones de uso. */

const SECCIONES = [
  {
    titulo: "1. Objeto del servicio",
    contenido:
      "AgendaFlow es una plataforma web que permite consultar un catálogo de servicios y reservar citas en una agenda de atención. El acceso al catálogo es público; la reserva requiere una cuenta de usuario registrada y aceptada con estas condiciones.",
  },
  {
    titulo: "2. Cuenta de usuario",
    contenido:
      "El usuario se compromete a facilitar datos veraces, a mantener la confidencialidad de su contraseña y a acceder desde un entorno de confianza. El servicio puede desactivar cuentas que incumplan estas condiciones o que supongan un uso abusivo de la plataforma.",
  },
  {
    titulo: "3. Reservas y disponibilidad",
    contenido:
      "La reserva de un servicio queda confirmada en el momento en que la plataforma asigna un código de cita. Las franjas de atención, la duración y el precio de cada servicio son los que figuran en su ficha en el momento de reservar. Los servicios pueden ser dados de baja por el proveedor, en cuyo caso se cancelarán las citas afectadas y se notificará al usuario.",
  },
  {
    titulo: "4. Cambios y cancelaciones",
    contenido:
      "El usuario puede cancelar sus propias citas desde el área «Mis citas» mientras la cita no haya sido marcada como completada. El administrador puede confirmar, completar o cancelar citas por motivos de organización del servicio, indicando el motivo de la cancelación.",
  },
  {
    titulo: "5. Precios y pagos",
    contenido:
      "Los precios mostrados en el catálogo son orientativos y se congelan en el momento de la reserva. Esta versión de la plataforma no realiza pagos en línea: el pago se efectúa directamente con el proveedor del servicio.",
  },
  {
    titulo: "6. Responsabilidad",
    contenido:
      "AgendaFlow facilita la gestión de citas pero no presta el servicio reservado. El proveedor del servicio es el responsable de su ejecución, de sus horarios y de la calidad de la atención prestada.",
  },
  {
    titulo: "7. Protección de datos",
    contenido:
      "El tratamiento de los datos personales se describe en el aviso de privacidad. Al utilizar la plataforma, el usuario declara haber leído y aceptado dicho documento.",
  },
  {
    titulo: "8. Legislación aplicable",
    contenido:
      "Estas condiciones se rigen por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales que resulten competentes conforme a la normativa vigente.",
  },
];

export default function PaginaTerminos() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <EncabezadoPagina
        eyebrow="Legal"
        titulo="Términos y condiciones"
        descripcion="Última actualización: enero de 2026. Estas condiciones regulan el uso de la plataforma AgendaFlow."
      />

      <div className="mt-10 space-y-6">
        {SECCIONES.map((seccion) => (
          <Tarjeta key={seccion.titulo} className="p-6">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              {seccion.titulo}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {seccion.contenido}
            </p>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}
