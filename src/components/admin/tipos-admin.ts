/**
 * Tipos compartidos por los componentes del panel de administración.
 * Son estructuras simples y serializables para poder pasar los datos del
 * servidor a los componentes de cliente.
 */

/** Franja de atención de un servicio. */
export interface HorarioAdmin {
  id?: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

/** Servicio con su categoría y sus horarios de atención. */
export interface ServicioAdmin {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  duracionMin: number;
  icono: string;
  color: string;
  destacado: boolean;
  activo: boolean;
  categoriaId: string;
  categoria: { id: string; nombre: string };
  horarios: HorarioAdmin[];
}

/** Categoría disponible en el formulario de servicio. */
export interface CategoriaAdmin {
  id: string;
  nombre: string;
  activa: boolean;
}

/** Reserva con la información necesaria para gestionarla desde el panel. */
export interface ReservaAdmin {
  id: string;
  codigo: string;
  fecha: string;
  hora: string;
  duracionMin: number;
  precio: number;
  estado: string;
  notas: string | null;
  usuario: { id: string; nombre: string; email: string };
  servicio: { nombre: string; color: string };
}

/** Usuario del sistema con su rol y su estado. */
export interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono: string | null;
  activo: boolean;
  createdAt: string;
  totalReservas: number;
}
