import type { Metadata } from "next";

import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { Tarjeta } from "@/components/ui/Tarjeta";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description: "Qué datos recopila AgendaFlow, con qué fines y cómo se protegen.",
};

/* Documento legal: aviso de privacidad. */

const SECCIONES = [
  {
    titulo: "1. Responsable del tratamiento",
    contenido:
      "El responsable del tratamiento es el equipo de AgendaFlow, proyecto académico de gestión de citas. Puedes ponerte en contacto con nosotros a través del formulario de la página de contacto.",
  },
  {
    titulo: "2. Datos que recopilamos",
    contenido:
      "Recopilamos el nombre, el correo electrónico, el teléfono (opcional) y la contraseña cifrada de los usuarios registrados. En las reservas almacenamos la fecha, la hora, el servicio elegido, el precio congelado y las notas que el usuario desea añadir. Además guardamos la IP y el agente de navegador de cada sesión.",
  },
  {
    titulo: "3. Finalidad y base jurídica",
    contenido:
      "Los datos se utilizan para gestionar la cuenta, crear y modificar reservas, contactar con el usuario sobre sus citas y mantener la seguridad de la plataforma. La base jurídica es la ejecución del contrato de servicio y el interés legítimo en garantizar la seguridad del sistema.",
  },
  {
    titulo: "4. Contraseñas y sesiones",
    contenido:
      "Las contraseñas nunca se almacenan en texto plano: se guardan como una huella calculada con bcrypt y un factor de coste de 12 rondas. La sesión de inicio de sesión se firma con un token JWT que viaja en una cookie httpOnly, y cada sesión queda registrada para poder revocarla de inmediato.",
  },
  {
    titulo: "5. Conservación",
    contenido:
      "Conservamos los datos de la cuenta mientras el usuario mantenga su cuenta activa. Las reservas se conservan como histórico del servicio. Los mensajes enviados desde el formulario de contacto se eliminan una vez atendidos.",
  },
  {
    titulo: "6. Destinatarios",
    contenido:
      "No cedemos datos personales a terceros con fines comerciales. Los datos se alojan en el proveedor de infraestructura de la aplicación y se encuentran sujetos a las medidas técnicas y organizativas de sus contratos.",
  },
  {
    titulo: "7. Derechos del usuario",
    contenido:
      "El usuario puede solicitar el acceso, la rectificación, la supresión, la limitación y la portabilidad de sus datos, así como retirar el consentimiento en cualquier momento. Basta con escribirnos desde la página de contacto y atenderemos la solicitud en el plazo máximo de un mes.",
  },
  {
    titulo: "8. Seguridad",
    contenido:
      "Aplicamos medidas técnicas y organizativas para proteger los datos frente al acceso no autorizado: consultas parametrizadas, validación y saneado de todas las entradas, cifrado de contraseñas, cabeceras de seguridad HTTP y limitación de intentos de acceso.",
  },
];

export default function PaginaPrivacidad() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <EncabezadoPagina
        eyebrow="Legal"
        titulo="Aviso de privacidad"
        descripcion="Última actualización: enero de 2026. Este documento explica qué datos recopila AgendaFlow y cómo los trata."
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
