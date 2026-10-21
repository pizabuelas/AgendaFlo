# Matriz de trazabilidad — AgendaFlow

Este documento relaciona **cada requisito del "Documento de Requerimientos del Proyecto Web"**
con su implementación concreta en el código, indicando los archivos, las decisiones técnicas y
las evidencias verificables.

- **Documento de origen:** `proyecto web final.docx` — *Documento de Requerimientos del Proyecto Web*
- **Proyecto:** AgendaFlow — sistema web de gestión de citas y reservas
- **Ponderación de la matriz de evaluación:** Funcionalidad 35 % · Arquitectura y código 25 % ·
  Diseño y UI/UX 20 % · Seguridad y rendimiento 10 % · Despliegue y documentación 10 %

---

## Índice

1. [Resumen](#resumen)
2. [RF-01 · Autenticación y gestión de usuarios](#rf-01--autenticación-y-gestión-de-usuarios)
3. [RF-02 · Gestión de contenido / operaciones CRUD](#rf-02--gestión-de-contenido--operaciones-crud)
4. [RF-03 · Búsqueda y filtrado](#rf-03--búsqueda-y-filtrado)
5. [RF-04 · Módulo interactivo / lógica de negocio](#rf-04--módulo-interactivo--lógica-de-negocio)
6. [RF-05 · Notificaciones y retroalimentación](#rf-05--notificaciones-y-retroalimentación)
7. [RNF-01 · Interfaz y experiencia de usuario](#rnf-01--interfaz-y-experiencia-de-usuario)
8. [RNF-02 · Rendimiento y optimización](#rnf-02--rendimiento-y-optimización)
9. [RNF-03 · Seguridad](#rnf-03--seguridad)
10. [RNF-04 · Almacenamiento y persistencia](#rnf-04--almacenamiento-y-persistencia)
11. [Entregables obligatorios](#entregables-obligatorios)
12. [Matriz de evaluación](#matriz-de-evaluación)
13. [Cómo verificar la trazabilidad](#cómo-verificar-la-trazabilidad)

---

## Resumen

| Requisito | Enunciado | Estado | Evidencia principal |
| --- | --- | :---: | --- |
| **RF-01** | Autenticación y gestión de usuarios | ✅ | `src/app/api/auth/*`, `src/middleware.ts` |
| **RF-02** | Gestión de contenido / operaciones CRUD | ✅ | `src/app/api/servicios/*`, `src/app/admin/servicios` |
| **RF-03** | Búsqueda y filtrado | ✅ | `src/components/servicios/FiltrosServicios.tsx` |
| **RF-04** | Módulo interactivo / lógica de negocio | ✅ | `src/components/reservas/FormularioReserva.tsx` |
| **RF-05** | Notificaciones y retroalimentación | ✅ | `src/components/providers/ProveedorToast.tsx` |
| **RNF-01** | Interfaz y experiencia de usuario | ✅ | `src/app/globals.css`, `src/app/accesibilidad` |
| **RNF-02** | Rendimiento y optimización | ✅ | App Router + RSC + `next/font` |
| **RNF-03** | Seguridad | ✅ | `src/lib/validators.ts`, `src/lib/password.ts` |
| **RNF-04** | Almacenamiento y persistencia | ✅ | `prisma/schema.prisma` |

---

## RF-01 · Autenticación y gestión de usuarios

> *Registro de nuevos usuarios con validación de correo electrónico y contraseña segura. Inicio y
> cierre de sesión seguro (manejo de sesiones o tokens JWT). Control de acceso basado en roles
> (mínimo dos roles: Usuario Estándar y Administrador).*

### Subrequisitos

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 1.1 | Registro con validación de correo | Esquema Zod `email`: trim, minúsculas, 5–254 caracteres, formato de correo. El correo se guarda **único** (`@unique`). | `src/lib/validators.ts:11`, `prisma/schema.prisma:34` |
| 1.2 | Contraseña segura | Reglas: ≥ 8 caracteres, ≤ 72, al menos una minúscula, una mayúscula y un número. Confirmación obligatoria y coincidencia verificada en el servidor. | `src/lib/validators.ts:19`, `src/app/api/auth/registro/route.ts` |
| 1.3 | Almacenamiento seguro de la contraseña | **bcrypt** con coste 12 (`bcryptjs`). La contraseña nunca se guarda ni se registra en claro. | `src/lib/password.ts` |
| 1.4 | Inicio de sesión | `POST /api/auth/login`: busca por correo, verifica el hash con `bcrypt.compare`, comprueba `activo` y emite la sesión. | `src/app/api/auth/login/route.ts` |
| 1.5 | Cierre de sesión | `POST /api/auth/logout` marca la sesión como revocada en la tabla `sesiones` y borra la cookie. | `src/app/api/auth/logout/route.ts`, `src/lib/session.ts` |
| 1.6 | Manejo de tokens JWT | **JWT HS256** firmado con `jose` y `AUTH_SECRET`. Claim `jti` = identificador de sesión, `sub` = id de usuario, `rol` = rol. | `src/lib/jwt.ts` |
| 1.7 | Cookie segura | `httpOnly` (inaccesible desde JavaScript → mitiga XSS), `SameSite=Lax`, `Path=/`, `Secure` en producción, expiración de 7 días. | `src/lib/session.ts` |
| 1.8 | Sesiones revocables | La tabla `sesiones` funciona como lista blanca: el middleware comprueba que el `jti` no esté revocado ni expirado. | `src/lib/session.ts`, `src/middleware.ts` |
| 1.9 | Control de acceso por roles | Dos roles: `USUARIO` y `ADMIN`. El **middleware** protege `/admin` y `/mis-reservas` antes de renderizar; cada endpoint vuelve a comprobar el rol. | `src/middleware.ts`, `src/lib/constants.ts` |
| 1.10 | Protección contra fuerza bruta | Limitador de intentos en memoria por correo (`login:<email>`) y por IP (`registro:<ip>`). | `src/lib/rate-limit.ts` |
| 1.11 | Gestión de usuarios por el administrador | Panel para cambiar el rol, activar/desactivar cuentas y editar los datos. Al degradar o desactivar a un usuario **se revocan sus sesiones**. | `src/app/admin/usuarios`, `src/lib/services/usuarios.ts` |
| 1.12 | Área personal | `/mis-reservas` muestra únicamente las citas del usuario en sesión. | `src/app/mis-reservas/page.tsx` |

### Decisiones

- **JWT en cookie `httpOnly` en lugar de `localStorage`:** con `localStorage` cualquier XSS
  podría leer el token; con la cookie `httpOnly` el JavaScript de la página no puede acceder a él.
- **Tabla `sesiones` además del JWT:** un JWT es válido hasta que expira aunque el usuario cierre
  sesión. La tabla permite la revocación inmediata.
- **Mensaje de error único en el login:** "usuario inexistente" y "contraseña incorrecta" devuelven
  el mismo texto, para no enumerar los correos registrados.
- **El middleware no sustituye a la comprobación en la API:** la capa HTTP vuelve a validar el rol
  en cada endpoint (defensa en profundidad).

### Evidencia

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/registro -H "Content-Type: application/json" \
  -d '{"nombre":"Marta Ruiz","email":"marta@ejemplo.com","password":"Segura2026",
       "confirmPassword":"Segura2026","aceptarTerminos":true}'

# Login (devuelve la cookie httpOnly)
curl -i -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@agendaflow.dev","password":"Admin1234"}'

# Ruta protegida sin sesión → 307 hacia /login
curl -i http://localhost:3000/admin
```

---

## RF-02 · Gestión de contenido / operaciones CRUD

> *Creación, lectura, actualización y eliminación de la entidad principal del sistema. Panel de
> administración para visualizar, editar o dar de baja registros globales.*

**Entidad principal elegida:** `Servicio` (un servicio reservable). Se acompaña de `Categoria`,
`Horario` y `Reserva`.

### Subrequisitos

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 2.1 | Crear | `POST /api/servicios` (admin) + formulario del panel. Genera el `slug` único automáticamente y guarda las franjas horarias en la misma transacción. | `src/app/api/servicios/route.ts`, `src/lib/services/servicios.ts:215` |
| 2.2 | Leer | Listado paginado (`GET /api/servicios`) y detalle (`GET /api/servicios/:id` y `/servicios/[slug]`). | `src/app/api/servicios/route.ts`, `src/app/servicios/[slug]/page.tsx` |
| 2.3 | Actualizar | `PATCH /api/servicios/:id` (admin). Actualización parcial; si llegan `horarios`, se reemplazan dentro de una transacción. | `src/lib/services/servicios.ts:243` |
| 2.4 | Eliminar | `DELETE /api/servicios/:id` → **baja lógica** (`activo = false`). Con `?definitivo=true` se borra de verdad, solo si no tiene reservas. | `src/lib/services/servicios.ts:288`, `src/lib/services/servicios.ts:298` |
| 2.5 | Reactivar | `POST /api/servicios/:id` (admin) devuelve el servicio al catálogo. | `src/app/api/servicios/[id]/route.ts:99` |
| 2.6 | Panel de administración | `/admin` con subsecciones **Resumen**, **Servicios**, **Reservas** y **Usuarios**, con navegación propia (`src/app/admin/layout.tsx`). | `src/app/admin/*` |
| 2.7 | Visualizar registros | Tabla con búsqueda, filtros por estado (todos / activos / de baja), contador y acciones por fila. | `src/components/admin/GestorServicios.tsx` |
| 2.8 | Editar desde el panel | Modal de edición con validaciones en cliente y en servidor, editor de franjas horarias por día de la semana. | `src/components/admin/FormularioServicio.tsx` |
| 2.9 | Dar de baja desde el panel | Botón de baja con confirmación y opción de eliminación definitiva cuando no hay reservas. | `src/components/admin/GestorServicios.tsx` |
| 2.10 | Gestión de horarios | Formulario de franjas (`día`, `hora inicio`, `hora fin`) con validación de formato `HH:mm` y máximo de 21 franjas por servicio. | `src/lib/validators.ts:99` |
| 2.11 | Integridad referencial | `categoriaId` con `ON DELETE RESTRICT`; los servicios con citas no se pueden borrar definitivamente. | `prisma/schema.prisma:104` |

### Decisiones

- **Baja lógica en lugar de borrado directo:** el histórico de citas debe sobrevivir a la
  retirada de un servicio del catálogo. `activo = false` lo retira del catálogo público
  conservando la trazabilidad.
- **El slug se genera en el servidor:** se normaliza el nombre, se comprueba la unicidad y se
  añade un sufijo numérico si hace falta (`generarSlugUnico`).
- **Transacciones en las operaciones con hijos:** al actualizar un servicio se borran y recrean
  sus horarios dentro de `prisma.$transaction`, de modo que nunca queda un servicio sin franjas
  a medio guardar.

---

## RF-03 · Búsqueda y filtrado

> *Barra de búsqueda por palabra clave en la entidad principal. Mínimo dos filtros combinables y
> ordenamiento de resultados.*

### Subrequisitos

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 3.1 | Barra de búsqueda por palabra clave | Campo de texto que busca en **nombre**, **descripción** y **nombre de la categoría**, de forma **insensible a mayúsculas**. | `src/components/servicios/FiltrosServicios.tsx`, `src/lib/services/servicios.ts:61` |
| 3.2 | Filtro 1 — Categoría | Selector con las 5 categorías activas y su número de servicios. | `src/components/servicios/FiltrosServicios.tsx`, `src/lib/services/servicios.ts:69` |
| 3.3 | Filtro 2 — Rango de precio | Cuatro rangos: hasta 50, 50–100, 100–200, más de 200. Admite además `precioMin` / `precioMax` sueltos. | `src/lib/services/servicios.ts:16`, `src/app/api/servicios/route.ts` |
| 3.4 | Filtro 3 — Duración máxima | Hasta 45 min, 60 min, hasta 2 h, media jornada. | `src/lib/services/servicios.ts:27` |
| 3.5 | Filtro 4 — Estado | Activos / inactivos / todos (los inactivos solo para administradores). | `src/lib/services/servicios.ts:53` |
| 3.6 | **Combinación** de filtros | Los filtros se acumulan con AND sobre el mismo objeto `where` de Prisma: categoría AND precio AND duración AND texto. | `src/lib/services/servicios.ts:51` |
| 3.7 | Ordenamiento | 8 criterios: relevancia, precio asc/desc, duración asc/desc, nombre asc/desc, más recientes. | `src/lib/services/servicios.ts:84`, `src/lib/constants.ts:114` |
| 3.8 | Paginación | `pagina` y `porPagina` (1–48, 9 por defecto) con `total` y `totalPaginas`. | `src/lib/services/servicios.ts:107` |
| 3.9 | Estado en la URL | Los filtros se serializan en la URL (`?categoria=…&precio=…&orden=…`), de modo que son compartibles y sobreviven a un recarga. | `src/components/servicios/FiltrosServicios.tsx` |
| 3.10 | Validación de parámetros | Todo parámetro se valida con Zod antes de llegar a la base de datos; un `orden` inexistente devuelve `400`. | `src/lib/validators.ts:143` |
| 3.11 | Contador de resultados | Se muestra "N servicios" y el total de páginas. | `src/app/servicios/page.tsx` |

### Decisiones

- **Búsqueda insensible a mayúsculas con `mode: "insensitive"`** solo en PostgreSQL. En SQLite la
  comparación por defecto ya lo es. El helper `src/lib/services/filtros.ts` abstrae la diferencia
  para que el mismo código funcione con ambos clientes generados.
- **Orden por defecto "relevancia":** servicios destacados primero y, a igualdad, orden alfabético.
- **Filtros combinables de verdad:** no hay que elegir uno; la interfaz los mantiene activos a la
  vez y el contador muestra el resultado de la combinación.

---

## RF-04 · Módulo interactivo / lógica de negocio

> *Incorporación de una función interactiva según la temática.*

**Módulo implementado:** **agenda de citas interactiva** con calendario de disponibilidad en
tiempo real, encaje de huecos y gestión del ciclo de vida de la cita.

### Subrequisitos

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 4.1 | Agenda interactiva | Calendario de **14 días** en el que se elige fecha; al elegirla se cargan los huecos del día. | `src/components/reservas/FormularioReserva.tsx` |
| 4.2 | Cálculo de disponibilidad | `GET /api/disponibilidad?servicioId=…&fecha=…` devuelve los huecos generados a partir de las franjas del servicio, marcando los ocupados y los ya pasados. | `src/app/api/disponibilidad/route.ts`, `src/lib/services/reservas.ts:55` |
| 4.3 | Reserva de la cita | `POST /api/reservas` valida servicio, fecha, hora, franja, anticipación y límite de citas; genera un **código único** (`CIT-XXXXXX`) y una notificación. | `src/app/api/reservas/route.ts`, `src/lib/services/reservas.ts:126` |
| 4.4 | Regla: dentro de franja | La hora debe caer en una franja de atención del servicio para ese día de la semana. | `src/lib/services/reservas.ts:156` |
| 4.5 | Regla: anticipación | Ventana de **0 a 60 días** y margen de **60 minutos** respecto a la hora actual. | `src/lib/constants.ts:102`, `src/lib/services/reservas.ts:118` |
| 4.6 | Regla: límite de citas activas | Máximo **5** citas en estado `PENDIENTE` o `CONFIRMADA` por usuario. | `src/lib/constants.ts:99` |
| 4.7 | Regla: no sobre-reservar | Índice único **parcial** `UNIQUE (servicioId, fecha, hora) WHERE estado IN ('PENDIENTE','CONFIRMADA')` en la base de datos: la garantía no depende de la aplicación. | `prisma/schema.prisma:154`, `prisma/migrations/20260103000000_indice_parcial_reservas/migration.sql` |
| 4.8 | Gestión del ciclo de vida | Estados `PENDIENTE → CONFIRMADA → COMPLETADA`, con `CANCELADA` disponible desde los dos primeros. `COMPLETADA` y `CANCELADA` son terminales: cualquier otra transición se rechaza con `422`. | `src/lib/services/reservas.ts:33`, `src/app/api/reservas/[id]/route.ts` |
| 4.9 | Cancelación por el usuario | El usuario puede cancelar sus propias citas indicando el motivo; el administrador puede hacerlo sobre cualquier cita. | `src/app/api/reservas/[id]/route.ts:41` |
| 4.10 | Gestión desde el panel | `/admin/reservas` permite cambiar el estado, filtrar por estado, buscar y eliminar citas. | `src/app/admin/reservas`, `src/components/admin/GestorReservas.tsx` |
| 4.11 | Historial del usuario | `/mis-reservas` muestra las citas agrupadas (próximas, activas, completadas, canceladas) con su código. | `src/app/mis-reservas/page.tsx`, `src/components/reservas/TarjetaReserva.tsx` |
| 4.12 | Avisos automáticos | Cada cambio de estado genera una notificación para el usuario afectado. | `src/app/api/reservas/[id]/route.ts:82` |

### Decisiones

- **La regla anti-sobre-reserva vive en el índice único, no solo en el código.** Una comprobación
  en la aplicación tiene una ventana de carrera; el índice la cierra por completo.
- **El índice único es parcial a propósito.** Solo las citas activas bloquean un hueco: al
  cancelar, el horario vuelve a estar disponible y se puede volver a reservar, sin perder la cita
  cancelada del historial. La agenda y el índice comparten criterio, así que nunca se ofrece un
  hueco que la reserva vaya a rechazar.
- **El precio y la duración se congelan en la reserva.** Si el servicio cambia de precio, las
  citas ya cerradas conservan el importe pactado.
- **Disponibilidad calculada en el servidor.** El cliente nunca decide si un hueco está libre:
  pregunta a `GET /api/disponibilidad` y el servidor responde con la verdad de la base de datos.

---

## RF-05 · Notificaciones y retroalimentación

> *Mensajes de confirmación o error en pantalla tras cada acción. Indicadores visuales durante la
> carga de datos (spinners o esqueletos de carga).*

### Subrequisitos

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 5.1 | Mensaje de éxito | Toast verde con icono de check y descripción textual de la acción realizada. | `src/components/providers/ProveedorToast.tsx` |
| 5.2 | Mensaje de error | Toast rojo con el motivo devuelto por la API (validación, conflicto o regla de negocio). | `src/components/providers/ProveedorToast.tsx` |
| 5.3 | Mensaje informativo | Toast azul para avisos (por ejemplo, "sesión iniciada"). | `src/components/providers/ProveedorToast.tsx` |
| 5.4 | Cobertura de acciones | Registro, login, logout, crear/editar/baja de servicios, cambiar estado de citas, eliminar citas, cambios de usuario, contacto y reserva. | `src/components/**` |
| 5.5 | Spinners | Componente `Spinner` reutilizable, con variantes de tamaño. | `src/components/ui/Spinner.tsx` |
| 5.6 | Esqueletos de carga | Clase `.esqueleto` con animación `shimmer` y páginas `loading.tsx` para el catálogo, el área personal y el panel. | `src/app/globals.css:278`, `src/app/servicios/loading.tsx`, `src/app/mis-reservas/loading.tsx`, `src/app/admin/loading.tsx` |
| 5.7 | Estados vacíos | Mensajes amigables cuando no hay resultados ni citas, con acción sugerida. | `src/app/servicios/page.tsx`, `src/app/mis-reservas/page.tsx` |
| 5.8 | Páginas de error | `not-found.tsx` (404) y `error.tsx` (500) propias de la marca. | `src/app/not-found.tsx`, `src/app/error.tsx` |
| 5.9 | Notificaciones persistidas | Centro de notificaciones en la base de datos (`notificaciones`), con marca de leídas. | `src/app/api/notificaciones/route.ts` |
| 5.10 | Feedback en el formulario | Los errores de campo se muestran bajo el campo correspondiente, con `aria-invalid` y `aria-describedby`. | `src/components/ui/Campos.tsx` |
| 5.11 | Bloqueo de la acción en curso | Los botones se deshabilitan mientras la petición está en vuelo para evitar envíos duplicados. | `src/components/admin/GestorServicios.tsx` |

---

## RNF-01 · Interfaz y experiencia de usuario

> *Diseño adaptativo compatible con dispositivos móviles, tabletas y escritorio. Cumplimiento básico
> de accesibilidad web (contraste adecuado, etiquetas alt en imágenes y navegación por teclado).*

### Subrequisitos

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 1.1 | Responsive móvil | Rejillas que colapsan a una columna, menú móvil desplegable, botones de 44 px, tablas con desplazamiento horizontal. | `src/components/layout/Encabezado.tsx`, `src/components/servicios/TarjetaServicio.tsx` |
| 1.2 | Responsive tableta | Puntos de ruptura `sm`, `md`, `lg` y `xl` en todo el sistema. | Todo `src/` |
| 1.3 | Responsive escritorio | Contenedores `max-w-7xl` centrados y rejillas de 3 columnas en el catálogo. | `src/app/page.tsx`, `src/app/servicios/page.tsx` |
| 1.4 | Contraste adecuado | Paleta de tokens con ratios AA verificados para texto normal (≥ 4.5:1) y texto grande (≥ 3:1). | `src/app/globals.css:15` |
| 1.5 | Modo claro y oscuro | Dos paletas completas con variante `dark` por clase, selector en el encabezado y script anti-parpadeo (anti-FOUC). | `src/app/globals.css:55`, `src/app/layout.tsx:66`, `src/components/layout/SelectorTema.tsx` |
| 1.6 | Etiquetas `alt` | Las imágenes llevan `alt` descriptivo; los iconos decorativos se marcan con `aria-hidden`; los controles solo con icono llevan `aria-label`. | `src/components/**` |
| 1.7 | Navegación por teclado | Todos los controles son elementos nativos enfocables, con `focus-visible` de 2 px y contraste alto. | `src/app/globals.css:192` |
| 1.8 | Enlace de salto | `skip link` "Saltar al contenido principal" como primer elemento enfocable de la página. | `src/app/layout.tsx:82` |
| 1.9 | Semántica HTML | `header`, `nav`, `main`, `footer`, encabezados jerárquicos y `aria-label` en las regiones. | `src/app/layout.tsx`, `src/components/layout/*` |
| 1.10 | Formularios accesibles | `label` asociado a cada campo, `aria-invalid`, mensajes de error con `role="alert"`, `autoComplete` correcto. | `src/components/ui/Campos.tsx` |
| 1.11 | Modales accesibles | `role="dialog"`, `aria-modal`, foco inicial, cierre con `Escape` y foco devuelto al elemento que lo abrió. | `src/components/ui/Modal.tsx` |
| 1.12 | Respeto a `prefers-reduced-motion` | Las animaciones se desactivan cuando el sistema lo pide. | `src/app/globals.css:228` |
| 1.13 | Página de accesibilidad | Documento `/accesibilidad` con las medidas aplicadas y cómo usarla. | `src/app/accesibilidad/page.tsx` |

---

## RNF-02 · Rendimiento y optimización

> *Tiempo de carga inicial inferior a 3 segundos en conexiones estándar. Optimización de imágenes y
> recursos estáticos.*

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 2.1 | Carga < 3 s | Renderizado en servidor (RSC): el HTML llega completo desde el primer byte y el JavaScript del cliente es mínimo (103 kB compartidos). | `next build` → tabla de rutas |
| 2.2 | Optimización de fuentes | `next/font` con `display: "swap"` descarga las fuentes en el build y las auto-hospeda (sin peticiones a Google). | `src/app/layout.tsx:11` |
| 2.3 | Optimización de imágenes | No hay imágenes rasterizadas externas: los gráficos son **SVG inline** y los iconos, SVG de `lucide-react`. El campo `imagen` queda preparado para recursos propios. | `src/components/**` |
| 2.4 | Code splitting | Automático por ruta de Next.js; los bundles compartidos son de 103 kB y las páginas más pesadas (`/admin/servicios`) de 123 kB. | Salida de `next build` |
| 2.5 | Consultas eficientes | Listados con `select` explícito, `include` solo de lo necesario y paginación en base de datos (nunca en memoria). | `src/lib/services/**` |
| 2.6 | Sin peticiones a terceros | Cero CDNs externos: fuentes, iconos y gráficos son locales. | Todo `src/` |
| 2.7 | Caché y revalidación | Las rutas de lectura usan renderizado dinámico con consultas indexadas; el catálogo cachea los datos de la petición. | `src/app/servicios/page.tsx` |
| 2.8 | Carga diferida | Los datos del panel se piden bajo demanda; las animaciones usan `transform` y `opacity` (compuestas por la GPU). | `src/app/globals.css:129` |

**Medición del bundle** (salida de `npm run build`):

```
First Load JS shared by all          103 kB
├ chunks/1255-dc3d3f72a1dc71a7.js      46.6 kB
├ chunks/4bd1b696-f785427dddbba9fb.js  54.2 kB
└ other shared chunks (total)            2 kB

/admin/servicios                       8.69 kB   → 123 kB First Load
/servicios                              3.37 kB   → 118 kB First Load
/mis-reservas                           6.16 kB   → 124 kB First Load
```

---

## RNF-03 · Seguridad

> *Encriptación de contraseñas en la base de datos (mínimo hashing con bcrypt). Sanitización de
> entradas de texto para prevenir XSS e inyección SQL/NoSQL.*

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 3.1 | Hashing de contraseñas | **bcrypt** (coste 12) con sal por usuario. | `src/lib/password.ts` |
| 3.2 | Verificación con temporización constante | `bcrypt.compare` en el login; nunca se compara la contraseña en claro. | `src/lib/password.ts`, `src/app/api/auth/login/route.ts` |
| 3.3 | Validación de toda la entrada | **Zod** en la frontera: tipos, obligatoriedad, longitudes, formatos, enumeraciones y reglas de negocio. | `src/lib/validators.ts` |
| 3.4 | Saneado de texto | `trim`, normalización a minúsculas del correo, eliminación de espacios y recorte de longitudes. | `src/lib/validators.ts` |
| 3.5 | Prevención de XSS | React escapa la salida; no se usa `dangerouslySetInnerHTML` con datos de usuario (solo con un script de constantes); el token viaja en cookie `httpOnly`. | Todo `src/` |
| 3.6 | Prevención de inyección SQL | Prisma **parametriziza** todas las consultas; no hay SQL concatenado en la aplicación. | `src/lib/services/**` |
| 3.7 | Consultas parametrizadas en filtros | Los filtros de búsqueda se construyen con `Prisma.ServicioWhereInput`, no con cadenas SQL. | `src/lib/services/servicios.ts:51` |
| 3.8 | Sesiones firmadas | JWT HS256 con secreto de servidor (`AUTH_SECRET`, mínimo 32 caracteres) y caducidad. | `src/lib/jwt.ts` |
| 3.9 | Control de acceso en servidor | Middleware + comprobación de rol en cada endpoint administrativo. | `src/middleware.ts`, `src/app/api/admin/**` |
| 3.10 | Limitación de intentos | Rate limiting en memoria para login y registro. | `src/lib/rate-limit.ts` |
| 3.11 | Anti-spam | Honeypot en el formulario de contacto: los bots rellenan el campo trampa y el envío se descarta en silencio. | `src/app/api/contacto/route.ts` |
| 3.12 | Restricción de recursos | Límite de 21 franjas por servicio, 500 caracteres en las notas, 2000 en el mensaje de contacto, 48 registros por página. | `src/lib/validators.ts` |
| 3.13 | Cabeceras de seguridad | El servidor añade `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control` y `Strict-Transport-Security` a todas las respuestas. | `next.config.ts:14` |
| 3.14 | Gestión de secretos | `.env` está en `.gitignore`; solo se versiona `.env.example` con valores de ejemplo. | `.gitignore`, `.env.example` |
| 3.15 | Protección del propio admin | Un administrador no puede quitarse a sí mismo el rol ni desactivar su cuenta. | `src/lib/services/usuarios.ts:96` |
| 3.16 | Aviso de enumeración de usuarios | El login devuelve el mismo mensaje para correo inexistente y contraseña incorrecta. | `src/app/api/auth/login/route.ts` |

---

## RNF-04 · Almacenamiento y persistencia

> *Integración con una base de datos relacional (PostgreSQL, MySQL) o no relacional (MongoDB,
> Firebase).*

| # | Subrequisito | Implementación | Ficheros |
| --- | --- | --- | --- |
| 4.1 | Base de datos relacional | **PostgreSQL** en producción con **Prisma ORM**. | `prisma/schema.prisma:23` |
| 4.2 | Fallback local sin instalación | **SQLite** en desarrollo, con el esquema derivado automáticamente del esquema maestro. | `scripts/generate-sqlite-schema.mjs`, `scripts/prisma-generate.mjs` |
| 4.3 | Esquema normalizado | 8 tablas con claves primarias `cuid`, claves foráneas e índices. | `prisma/schema.prisma` |
| 4.4 | Migraciones versionadas | `prisma/migrations/` con SQL de PostgreSQL, listo para `prisma migrate deploy`. | `prisma/migrations/` |
| 4.5 | Seeds de demostración | Datos realistas e idempotentes: 3 usuarios, 5 categorías, 14 servicios, 45 horarios, 6 reservas, 3 notificaciones. | `prisma/seed.ts` |
| 4.6 | Integridad referencial | `ON DELETE CASCADE` y `ON DELETE RESTRICT` según el caso. | `prisma/schema.prisma` |
| 4.7 | Restricciones de unicidad | `email`, `slug`, `codigo`, `jti` y `(servicioId, fecha, hora)`. | `prisma/schema.prisma` |
| 4.8 | Persistencia de las acciones | Todas las acciones de la interfaz (reservas, servicios, usuarios, notificaciones, contacto) terminan en la base de datos. | `src/lib/services/**` |
| 4.9 | Conexión única y reutilizable | Instancia de Prisma en modo singleton para el desarrollo en caliente. | `src/lib/prisma.ts` |
| 4.10 | Documentación del modelo | Diagrama ER en Mermaid y descripción tabla por tabla. | `docs/BASE-DE-DATOS.md` |

---

## Entregables obligatorios

| Entregable | Estado | Evidencia |
| --- | :---: | --- |
| **Control de versiones (Git & GitHub/GitLab)** | ✅ | Repositorio con historial de commits por funcionalidad. Ver `git log`. |
| **README.md con descripción y capturas** | ✅ | Descripción, 17 capturas embebidas, instrucciones, stack y variables de entorno. |
| **Instrucciones de instalación y ejecución local** | ✅ | Secciones *Instalación* (3 opciones) y *Scripts disponibles*. |
| **Lista de tecnologías y librerías** | ✅ | Tabla de stack con versiones. |
| **Variables de entorno y `.env.example`** | ✅ | Archivo `.env.example` comentado y tabla de variables en el README. |
| **Despliegue en un servicio en la nube** | ✅ | Instrucciones paso a paso para Vercel + PostgreSQL (Neon/Railway/Supabase). |
| **Documentación de API** | ✅ | [`docs/API.md`](API.md): 22 endpoints con parámetros, cuerpos, respuestas y códigos. |
| **Diagrama entidad-relación / esquema de BD** | ✅ | [`docs/BASE-DE-DATOS.md`](BASE-DE-DATOS.md): diagrama Mermaid + descripción de las 8 tablas. |

---

## Matriz de evaluación

| Criterio | Ponderación | Cumplimiento | Evidencia |
| --- | :---: | :---: | --- |
| **Funcionalidad y CRUD** | 35 % | 5/5 RF completos | RF-01…RF-05 implementados y verificados por HTTP (`npm run verificar` y `npm run prueba`: 46 reglas de negocio y seguridad). |
| **Arquitectura y código** | 25 % | Separación por capas: `app/` (rutas) → `lib/services/` (negocio) → Prisma (datos); componentes por dominio; TypeScript estricto; ESLint sin errores; Git con historial. | `src/`, `eslint.config.mjs`, `git log` |
| **Diseño y UI/UX** | 20 % | Sistema de tokens, modo claro/oscuro, responsive completo, accesibilidad verificada, microcopy en español. | `src/app/globals.css`, `docs/capturas/` |
| **Seguridad y rendimiento** | 10 % | bcrypt, JWT `httpOnly` + revocable, Zod en toda entrada, rate limiting, RSC y bundle de 103 kB. | `src/lib/`, salida de `next build` |
| **Despliegue y documentación** | 10 % | README completo con capturas, 3 documentos técnicos, guía de despliegue en Vercel. | `README.md`, `docs/` |

---

## Cómo verificar la trazabilidad

### 1. Comprobación automática de páginas y APIs

```bash
npm run build && npm start          # en una terminal
npm run verificar -- http://localhost:3000
```

El script inicia sesión, recorre las 14 páginas (públicas y privadas) y comprueba 7 endpoints de
la API, indicando el código de estado de cada uno.

### 2. Comprobación de tipos y estilo

```bash
npm run typecheck   # tsc --noEmit → 0 errores
npm run lint        # eslint . → 0 errores, 0 avisos
```

### 3. Comprobación automática de los flujos funcionales

```bash
npm run build && npm start          # en una terminal
npm run prueba -- http://localhost:3000
```

El script recorre los siete flujos principales (registro, catálogo con filtros, disponibilidad y
reserva, cancelación y reutilización del hueco, panel de administración con el ciclo de vida de la
cita, alta y baja de servicios, formulario de contacto y cierre de sesión) y comprueba **46
reglas** de negocio y de seguridad, indicando el resultado de cada una.

### 4. Comprobación manual de los flujos

| Flujo | Pasos | Resultado esperado |
| --- | --- | --- |
| Registro | `/registro` → completar → enviar | Toast verde, inicio de sesión automático y redirección al catálogo. |
| Búsqueda y filtros | `/servicios` → escribir "medic" + elegir categoría + precio | El contador se actualiza y la URL refleja los filtros activos. |
| Reserva | Ficha de un servicio → elegir día → elegir hora → confirmar | Toast verde con el código `CIT-XXXXXX` y la cita en `/mis-reservas`. |
| Bloqueo de hueco | Reservar una hora ya ocupada | El hueco aparece deshabilitado en el calendario y la API devuelve `409`. |
| Gestión de servicios | `/admin/servicios` → editar → guardar | El cambio se ve en el catálogo público. |
| Gestión de citas | `/admin/reservas` → confirmar | La cita cambia de estado y el usuario recibe una notificación. |
| Gestión de usuarios | `/admin/usuarios` → degradar a usuario | La sesión abierta del usuario pierde los permisos de inmediato. |
| Accesibilidad | Recorrer la web solo con `Tab` | Foco visible en todos los controles y enlace de salto funcional. |
| Responsive | Redimensionar a 390 px | Menú móvil, rejillas en una columna y tablas con desplazamiento. |
