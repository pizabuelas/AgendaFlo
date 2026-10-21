/**
 * Semilla de datos de AgendaFlow.
 *
 * Crea el catálogo de servicios, las categorías, los horarios de atención,
 * usuarios de ejemplo (uno administrador) y reservas repartidas por estado
 * para poder demostrar el panel de administración desde el primer arranque.
 *
 * Es idempotente: se puede ejecutar tantas veces como sea necesario.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------- */
/* Catálogo                                                                    */
/* -------------------------------------------------------------------------- */

const CATEGORIAS = [
  {
    nombre: "Salud y Bienestar",
    slug: "salud-y-bienestar",
    descripcion: "Atención médica, dental y rutinas de bienestar.",
    color: "rose",
  },
  {
    nombre: "Terapias",
    slug: "terapias",
    descripcion: "Procesos terapéuticos individuales y de pareja.",
    color: "violet",
  },
  {
    nombre: "Consultoría",
    slug: "consultoria",
    descripcion: "Acompañamiento a negocios y proyectos.",
    color: "indigo",
  },
  {
    nombre: "Formación",
    slug: "formacion",
    descripcion: "Talleres, cursos y certificaciones profesionales.",
    color: "sky",
  },
  {
    nombre: "Corporativo",
    slug: "corporativo",
    descripcion: "Programas para equipos y organizaciones.",
    color: "emerald",
  },
];

type ServicioSemilla = {
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  duracionMin: number;
  icono: string;
  color: string;
  destacado?: boolean;
  categoria: string;
  /** Franjas de atención por día de la semana (0 = domingo). */
  horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>;
};

const HORARIO_MANANA = { horaInicio: "09:00", horaFin: "13:00" };
const HORARIO_TARDE = { horaInicio: "15:00", horaFin: "18:00" };

/** Lunes a viernes (1–5). */
const SEMANA = [1, 2, 3, 4, 5];
/** De lunes a sábado (1–6). */
const SEMANA_EXTENSA = [1, 2, 3, 4, 5, 6];

const franja = (dias: number[], h: typeof HORARIO_MANANA) =>
  dias.map((diaSemana) => ({ diaSemana, ...h }));

const SERVICIOS: ServicioSemilla[] = [
  {
    nombre: "Consulta médica general",
    slug: "consulta-medica-general",
    descripcion:
      "Valoración clínica completa con revisión del historial, exploración física y orientación del tratamiento. Incluye el informe de la consulta.",
    precio: 60,
    duracionMin: 45,
    icono: "stethoscope",
    color: "rose",
    destacado: true,
    categoria: "salud-y-bienestar",
    horarios: franja(SEMANA, HORARIO_MANANA),
  },
  {
    nombre: "Limpieza dental",
    slug: "limpieza-dental",
    descripcion:
      "Profilaxis dental con ultrasonidos, pulido y fluoración. Recomendada cada seis meses para mantener la salud de encías y dentina.",
    precio: 80,
    duracionMin: 60,
    icono: "sparkles",
    color: "teal",
    categoria: "salud-y-bienestar",
    horarios: franja(SEMANA, HORARIO_MANANA),
  },
  {
    nombre: "Meditación guiada en grupo",
    slug: "meditacion-guiada-grupo",
    descripcion:
      "Sesión colectiva de respiración y mindfulness en grupos reducidos. Ideal para reducir el estrés y mejorar la concentración.",
    precio: 25,
    duracionMin: 45,
    icono: "spa",
    color: "emerald",
    categoria: "salud-y-bienestar",
    horarios: franja(SEMANA, HORARIO_TARDE),
  },
  {
    nombre: "Terapia individual",
    slug: "terapia-individual",
    descripcion:
      "Sesión uno a uno con un enfoque focalizado en tus objetivos, seguimiento de avances y herramientas prácticas para el día a día.",
    precio: 70,
    duracionMin: 50,
    icono: "brain",
    color: "violet",
    destacado: true,
    categoria: "terapias",
    horarios: franja(SEMANA, HORARIO_MANANA),
  },
  {
    nombre: "Terapia de pareja",
    slug: "terapia-de-pareja",
    descripcion:
      "Proceso terapéutico para parejas que buscan mejorar la comunicación y reconstruir la confianza en un ambiente neutral y confidencial.",
    precio: 110,
    duracionMin: 80,
    icono: "heart-pulse",
    color: "rose",
    categoria: "terapias",
    horarios: franja([2, 4], HORARIO_TARDE),
  },
  {
    nombre: "Sesión de fisioterapia",
    slug: "sesion-fisioterapia",
    descripcion:
      "Evaluación osteomuscular y plan de tratamiento con terapia manual y ejercicios prescritos para casa.",
    precio: 55,
    duracionMin: 45,
    icono: "activity",
    color: "orange",
    categoria: "terapias",
    horarios: franja(SEMANA_EXTENSA, HORARIO_MANANA),
  },
  {
    nombre: "Asesoría estratégica",
    slug: "asesoria-estrategica",
    descripcion:
      "Sesión de trabajo para definir hoja de ruta, analizar el mercado y priorizar iniciativas de alto impacto para el negocio.",
    precio: 95,
    duracionMin: 60,
    icono: "target",
    color: "indigo",
    destacado: true,
    categoria: "consultoria",
    horarios: franja(SEMANA, HORARIO_MANANA),
  },
  {
    nombre: "Revisión de modelo de negocio",
    slug: "revision-modelo-negocio",
    descripcion:
      "Auditoría completa del modelo de negocio: propuesta de valor, canales, costes y plan de experimentos validados.",
    precio: 140,
    duracionMin: 90,
    icono: "trending-up",
    color: "sky",
    categoria: "consultoria",
    horarios: franja([1, 3], HORARIO_TARDE),
  },
  {
    nombre: "Taller de ventas consultivas",
    slug: "taller-ventas-consultivas",
    descripcion:
      "Taller práctico para equipos comerciales: escucha activa, diagnóstico de necesidades y cierre de propuestas de valor.",
    precio: 130,
    duracionMin: 120,
    icono: "presentation",
    color: "amber",
    categoria: "consultoria",
    horarios: franja([4], HORARIO_TARDE),
  },
  {
    nombre: "Curso de Excel avanzado",
    slug: "curso-excel-avanzado",
    descripcion:
      "Curso intensivo de hojas de cálculo: tablas dinámicas, Power Query, automatización de informes y macros básicas.",
    precio: 180,
    duracionMin: 180,
    icono: "table",
    color: "emerald",
    categoria: "formacion",
    horarios: franja([6], { horaInicio: "09:00", horaFin: "13:00" }),
  },
  {
    nombre: "Taller de oratoria",
    slug: "taller-oratoria",
    descripcion:
      "Práctica Intensiva de comunicación en público: respiración, estructura del discurso, storytellling y manejo del nerviosismo.",
    precio: 120,
    duracionMin: 120,
    icono: "mic",
    color: "rose",
    categoria: "formacion",
    horarios: franja([5], HORARIO_TARDE),
  },
  {
    nombre: "Certificación Scrum Master",
    slug: "certificacion-scrum-master",
    descripcion:
      "Programa de certificación con preparación al examen, simulacros de preguntas y sesión de cierre con mentoría grupal.",
    precio: 320,
    duracionMin: 480,
    icono: "award",
    color: "indigo",
    destacado: true,
    categoria: "formacion",
    horarios: franja([6], { horaInicio: "09:00", horaFin: "18:00" }),
  },
  {
    nombre: "Sesión de bienestar corporativo",
    slug: "sesion-bienestar-corporativo",
    descripcion:
      "Programa de respuesta al estrés para equipos: pausas activas, ergonomía, hábitos de trabajo y comunicación asertiva.",
    precio: 45,
    duracionMin: 60,
    icono: "users",
    color: "teal",
    categoria: "corporativo",
    horarios: franja(SEMANA, HORARIO_TARDE),
  },
  {
    nombre: "Team building corporativo",
    slug: "team-building-corporativo",
    descripcion:
      "Dinámicas de cohesión y confianza de equipo en formato de retreat, con diagnóstico previo y plan de seguimiento.",
    precio: 420,
    duracionMin: 240,
    icono: "zap",
    color: "orange",
    categoria: "corporativo",
    horarios: franja([6], { horaInicio: "09:00", horaFin: "17:00" }),
  },
];

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                  */
/* -------------------------------------------------------------------------- */

function fechaISO(diasDesplazamiento: number): string {
  const fecha = new Date();
  fecha.setUTCHours(0, 0, 0, 0);
  fecha.setUTCDate(fecha.getUTCDate() + diasDesplazamiento);
  return fecha.toISOString().slice(0, 10);
}

function aMedianocheUTC(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

async function main() {
  console.log("→ Limpiando datos previos de la semilla…");
  await prisma.notificacion.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.horario.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.sesion.deleteMany();
  await prisma.usuario.deleteMany();

  console.log("→ Creando categorías…");
  const mapaCategorias = new Map<string, string>();
  for (const categoria of CATEGORIAS) {
    const creada = await prisma.categoria.create({ data: categoria });
    mapaCategorias.set(categoria.slug, creada.id);
  }

  console.log("→ Creando servicios y horarios…");
  const mapaServicios = new Map<string, string>();
  for (const servicio of SERVICIOS) {
    const { horarios, categoria, ...datos } = servicio;
    const categoriaId = mapaCategorias.get(categoria);
    if (!categoriaId) throw new Error(`Categoría desconocida: ${categoria}`);

    const creado = await prisma.servicio.create({
      data: {
        ...datos,
        categoriaId,
        horarios: { create: horarios },
      },
    });
    mapaServicios.set(servicio.slug, creado.id);
  }

  console.log("→ Creando usuarios de ejemplo…");
  const hashAdmin = await bcrypt.hash("Admin1234", 12);
  const hashUsuario = await bcrypt.hash("Usuario1234", 12);

  const admin = await prisma.usuario.create({
    data: {
      nombre: "Laura Fernández",
      email: "admin@agendaflow.dev",
      passwordHash: hashAdmin,
      rol: "ADMIN",
      telefono: "+34 600 123 456",
    },
  });

  const usuario = await prisma.usuario.create({
    data: {
      nombre: "Carlos Ramírez",
      email: "usuario@agendaflow.dev",
      passwordHash: hashUsuario,
      rol: "USUARIO",
      telefono: "+34 611 987 654",
    },
  });

  const usuario2 = await prisma.usuario.create({
    data: {
      nombre: "Ana Torres",
      email: "ana.torres@agendaflow.dev",
      passwordHash: hashUsuario,
      rol: "USUARIO",
    },
  });

  console.log("→ Creando reservas de ejemplo…");
  const idServicio = (slug: string) => {
    const id = mapaServicios.get(slug);
    if (!id) throw new Error(`Servicio desconocido: ${slug}`);
    return id;
  };

  const reservasSemilla = [
    {
      usuarioId: usuario.id,
      servicio: "terapia-individual",
      dias: 1,
      hora: "09:00",
      estado: "CONFIRMADA",
      notas: "Primera sesión del proceso.",
    },
    {
      usuarioId: usuario.id,
      servicio: "asesoria-estrategica",
      dias: 3,
      hora: "11:00",
      estado: "PENDIENTE",
      notas: "",
    },
    {
      usuarioId: usuario.id,
      servicio: "taller-oratoria",
      dias: 7,
      hora: "16:00",
      estado: "CONFIRMADA",
      notas: "Traer una presentación en borrador.",
    },
    {
      usuarioId: usuario2.id,
      servicio: "consulta-medica-general",
      dias: 2,
      hora: "10:00",
      estado: "COMPLETADA",
      notas: "",
    },
    {
      usuarioId: usuario2.id,
      servicio: "taller-ventas-consultivas",
      dias: -6,
      hora: "16:00",
      estado: "COMPLETADA",
      notas: "",
    },
    {
      usuarioId: usuario2.id,
      servicio: "limpieza-dental",
      dias: -2,
      hora: "09:00",
      estado: "CANCELADA",
      notas: "",
      motivoCancelacion: "El cliente reprogramó la cita.",
    },
  ];

  let indice = 0;
  for (const reserva of reservasSemilla) {
    const servicioId = idServicio(reserva.servicio);
    const servicio = await prisma.servicio.findUniqueOrThrow({
      where: { id: servicioId },
    });
    const fecha = fechaISO(reserva.dias);

    await prisma.reserva.create({
      data: {
        codigo: `CIT-DEMO${String(indice + 1).padStart(2, "0")}`,
        usuarioId: reserva.usuarioId,
        servicioId,
        fecha: aMedianocheUTC(fecha),
        hora: reserva.hora,
        duracionMin: servicio.duracionMin,
        precio: servicio.precio,
        estado: reserva.estado,
        notas: reserva.notas || null,
        motivoCancelacion: reserva.motivoCancelacion ?? null,
      },
    });
    indice += 1;
  }

  console.log("→ Creando notificaciones…");
  await prisma.notificacion.createMany({
    data: [
      {
        usuarioId: usuario.id,
        titulo: "Reserva confirmada",
        mensaje: "Tu cita de Terapia individual está confirmada.",
        tipo: "EXITO",
      },
      {
        usuarioId: usuario.id,
        titulo: "Recordatorio",
        mensaje: "Recuerda revisar los datos de contacto de tu perfil.",
        tipo: "INFO",
        leida: true,
      },
      {
        usuarioId: admin.id,
        titulo: "Nueva reserva pendiente",
        mensaje: "Hay una reserva por confirmar en la agenda.",
        tipo: "INFO",
      },
    ],
  });

  console.log("\n✓ Semilla completada.\n");
  console.log("  Administrador → admin@agendaflow.dev  /  Admin1234");
  console.log("  Usuario       → usuario@agendaflow.dev / Usuario1234\n");
}

main()
  .catch((error) => {
    console.error("✗ Error al ejecutar la semilla:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
