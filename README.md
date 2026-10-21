# AgendaFlow

**Sistema web de gestión de citas y reservas.** AgendaFlow permite explorar un catálogo de
servicios, consultar la disponibilidad en tiempo real, reservar una cita en segundos y
gestionar el negocio desde un panel de administración completo.

Desarrollado con **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL**,
y preparado para desplegarse en la nube con un solo clic en **Vercel**.

---

## Índice

1. [Capturas de pantalla](#capturas-de-pantalla)
2. [Funcionalidades](#funcionalidades)
3. [Stack tecnológico](#stack-tecnológico)
4. [Requisitos previos](#requisitos-previos)
5. [Instalación](#instalación)
6. [Variables de entorno](#variables-de-entorno)
7. [Scripts disponibles](#scripts-disponibles)
8. [Cuentas de demostración](#cuentas-de-demostración)
9. [Estructura del proyecto](#estructura-del-proyecto)
10. [Despliegue en la nube](#despliegue-en-la-nube)
11. [Documentación](#documentación)
12. [Trazabilidad de requisitos](#trazabilidad-de-requisitos)
13. [Licencia](#licencia)

---

## Capturas de pantalla

### Portada

![Portada de AgendaFlow](docs/capturas/01-portada.png)

### Catálogo de servicios con búsqueda, filtros y ordenación

![Catálogo de servicios](docs/capturas/02-catalogo.png)

### Ficha de un servicio con el selector de fecha y hora

![Ficha de servicio](docs/capturas/03-servicio.png)

### ¿Cómo funciona?

![Página cómo funciona](docs/capturas/04-como-funciona.png)

### Registro de usuario

![Formulario de registro](docs/capturas/05-registro.png)

### Inicio de sesión

![Formulario de inicio de sesión](docs/capturas/06-login.png)

### Formulario de contacto

![Formulario de contacto](docs/capturas/07-contacto.png)

### Área personal: mis citas

![Panel de citas del usuario](docs/capturas/08-mis-citas.png)

### Panel de administración — resumen

![Resumen del panel de administración](docs/capturas/09-admin-resumen.png)

### Panel de administración — servicios (CRUD)

![Gestión de servicios](docs/capturas/10-admin-servicios.png)

### Panel de administración — reservas

![Gestión de reservas](docs/capturas/11-admin-reservas.png)

### Panel de administración — usuarios

![Gestión de usuarios](docs/capturas/12-admin-usuarios.png)

### Tema oscuro

![Portada de AgendaFlow en modo oscuro](docs/capturas/16-portada-oscuro.png)

### Diseño responsive (móvil)

| Portada | Catálogo | Mis citas |
| :---: | :---: | :---: |
| ![Portada en móvil](docs/capturas/13-movil-portada.png) | ![Catálogo en móvil](docs/capturas/14-movil-catalogo.png) | ![Mis citas en móvil](docs/capturas/15-movil-mis-citas.png) |

> Las capturas se generan automáticamente con `npm run capturas` (Chrome headless vía CDP).

---

## Funcionalidades

### Autenticación y roles (RF-01)

- Registro con **correo electrónico + contraseña segura** (mínimo 8 caracteres, una minúscula,
  una mayúscula y un número).
- Contraseñas almacenadas con **bcrypt** (coste 12) — nunca en texto plano.
- Inicio y cierre de sesión con **JWT (HS256)** entregado en una cookie `httpOnly` + `SameSite=Lax`,
  lo que impide que JavaScript robe el token (protección frente a XSS).
- Cada sesión se registra en la tabla `sesiones`, por lo que el token puede **revocarse** al cerrar
  sesión o al desactivar una cuenta.
- **Dos roles**: `USUARIO` y `ADMIN`. Las rutas privadas (`/admin`, `/mis-reservas`) están
  protegidas en el **middleware** de Next.js antes incluso de renderizar.
- Limitación de intentos (rate limiting) en memoria contra ataques de fuerza bruta.

### Gestión de servicios — CRUD (RF-02)

- Catálogo público con **alta, edición, baja lógica y reactivación** de servicios.
- Editor de **franjas horarias** (día de la semana + hora de inicio/fin) por servicio.
- Baja lógica (`activo = false`) para no perder el histórico de reservas; borrado definitivo
  únicamente cuando el servicio no tiene citas asociadas.
- Los administradores gestionan el catálogo desde `/admin/servicios`.

### Búsqueda, filtros y ordenación (RF-03)

- Búsqueda por palabra clave sobre nombre y descripción, **insensible a mayúsculas** en PostgreSQL.
- **Dos filtros combinables**: categoría y rango de precio (además duración máxima y estado).
- **Ordenación** por relevancia, precio, duración, nombre o fecha de alta.
- Paginación con tamaño de página configurable (9 por defecto, hasta 48).
- Todos los parámetros se validad con Zod antes de tocar la base de datos.

### Módulo interactivo de agenda (RF-04)

- Calendario de **14 días** con los huecos libres calculados en tiempo real.
- Bloqueo de sobre-reservas garantizado por un **índice único parcial**
  `(servicioId, fecha, hora) WHERE estado IN ('PENDIENTE','CONFIRMADA')` en la base de datos, no
  solo en el código. Al ser parcial, cancelar una cita libera su horario para volver a reservarlo.
- Ciclo de vida controlado: `PENDIENTE → CONFIRMADA → COMPLETADA`, con `CANCELADA` disponible
  desde los dos primeros; `COMPLETADA` y `CANCELADA` son estados terminales.
- Reglas de negocio: franja de atención, anticipación mínima, límite de citas activas por usuario
  y citas en el pasado.
- Cada reserva recibe un **código único** (`CIT-XXXXXX`) y genera una notificación.

### Panel de administración (RF-04 / RF-02)

- **Resumen** con métricas (reservas totales, pendientes, ingresos), gráfico de barras CSS y
  desglose por estado.
- **Servicios**: crear, editar, dar de baja, reactivar y eliminar.
- **Reservas**: cambiar el estado (pendiente → confirmada → completada / cancelada) con motivo de
  cancelación y eliminación.
- **Usuarios**: cambiar el rol, activar/desactivar cuentas y editar los datos de contacto.

### Interfaz y usabilidad (RF-05 / RNF-01 / RNF-02)

- **Toasts** de confirmación y error en todas las acciones (éxito, error e información).
- **Spinners y esqueletos de carga** (`loading.tsx` y componentes `Spinner` / `.esqueleto`).
- Diseño **responsive** con menú móvil, rejillas adaptables y botones táctiles.
- **Accesibilidad**: contraste AA, `skip link`, navegación completa por teclado, foco visible,
  `aria-label` en controles de icono, textos alternativos y respeto a
  `prefers-reduced-motion`.
- **Modo claro y oscuro** con selector persistente y sin parpadeo al cargar (script anti-FOUC).
- Iconos SVG inline y tipografía local (Geist) — sin peticiones a terceros.

### Seguridad y calidad (RNF-03)

- Validación de **toda** la entrada con Zod (tipos, longitudes, formatos y enumeraciones).
- Consultas **parametrizadas** mediante Prisma → sin inyección SQL.
- React escapa la salida por defecto y no se usa `dangerouslySetInnerHTML` con datos de usuario
  (únicamente con el script anti-FOUC de constantes).
- Honeypot + límite de intentos en el formulario de contacto y en el registro.
- Contraseñas con bcrypt, tokens firmados y revocables, y cabeceras de seguridad en el middleware.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
| --- | --- | --- |
| Framework | [Next.js](https://nextjs.org) (App Router, RSC, Route Handlers) | 15.5 |
| Lenguaje | [TypeScript](https://www.typescriptlang.org) (modo estricto) | 5.9 |
| Estilos | [Tailwind CSS](https://tailwindcss.com) v4 (`@theme inline` + variante `dark` por clase) | 4.1 |
| Base de datos | [PostgreSQL](https://www.postgresql.org) en producción · [SQLite](https://sqlite.org) en desarrollo | — |
| ORM | [Prisma](https://www.prisma.io) | 6.19 |
| Autenticación | [jose](https://github.com/panva/jose) (JWT HS256) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 6.1 / 3.0 |
| Validación | [Zod](https://zod.dev) | 3.25 |
| Iconos | [lucide-react](https://lucide.dev) (SVG inline, sin imágenes externas) | 0.545 |
| Fechas | [date-fns](https://date-fns.org) | 4.1 |
| Despliegue | [Vercel](https://vercel.com) | — |
| Calidad | ESLint 9 (`eslint-config-next`) + TypeScript estricto | — |

---

## Requisitos previos

- **Node.js ≥ 18.18** (probado con Node 20 y 24).
- **npm 9+** (incluido con Node).
- Para producción: una base de datos **PostgreSQL** (Neon, Railway, Supabase, Vercel Postgres…).
  En desarrollo local **no hace falta instalar nada**: el proyecto usa SQLite.

---

## Instalación

### Opción A — Desarrollo local con SQLite (sin instalación de base de datos)

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/agendaflow.git
cd agendaflow

# 2. Instalar dependencias (el postinstall genera el esquema SQLite y el cliente Prisma)
npm install

# 3. Crear el archivo de entorno
cp .env.example .env          # Windows PowerShell: copy .env.example .env

# 4. Crear la base de datos y cargar los datos de demostración
npm run setup                 # = db:push + db:seed

# 5. Arrancar el servidor de desarrollo
npm run dev
```

La aplicación queda disponible en <http://localhost:3000>.

### Opción B — Desarrollo con PostgreSQL

```bash
npm install
cp .env.example .env
```

En `.env`:

```env
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://usuario:clave@localhost:5432/agendaflow?schema=public"
```

```bash
npm run db:deploy   # aplica prisma/migrations al servidor PostgreSQL
npm run db:seed     # datos de demostración
npm run dev
```

### Opción C — Producción (Vercel + PostgreSQL)

Ver la sección [Despliegue en la nube](#despliegue-en-la-nube).

---

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores. El archivo `.env` **no se sube al
repositorio**; `.env.example` sí.

| Variable | Obligatoria | Descripción | Valor por defecto |
| --- | :---: | --- | --- |
| `DATABASE_PROVIDER` | Sí | Motor de base de datos: `postgresql` o `sqlite`. | `sqlite` |
| `DATABASE_URL` | Sí | Cadena de conexión. `file:./dev.db` en local, `postgresql://…` en producción. | `file:./dev.db` |
| `AUTH_SECRET` | Sí | Clave de firma del JWT (mínimo 32 caracteres). **Cámbiala en producción.** | — |
| `AUTH_SESSION_TTL` | No | Vida de la sesión en segundos (7 días por defecto). | `604800` |
| `NEXT_PUBLIC_APP_URL` | No | URL pública del sitio; se usa en metadatos y enlaces. | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | No | Nombre visible de la aplicación. | `AgendaFlow` |
| `SMTP_*` | No | Reservado para el envío de correo (las notificaciones se guardan en la BD). | — |

Genera una clave segura con:

```bash
openssl rand -base64 48
```

> El archivo [`prisma/schema.sqlite.prisma`](prisma/schema.prisma) **se genera automáticamente**
> a partir de `prisma/schema.prisma` (la única fuente de verdad). No lo edites a mano.

---

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Genera el esquema correcto, el cliente Prisma y compila para producción. |
| `npm start` | Arranca el servidor de producción (después de `npm run build`). |
| `npm run lint` | ESLint sobre todo el proyecto. |
| `npm run typecheck` | Comprobación de tipos sin emitir ficheros. |
| `npm run db:push` | Sincroniza el esquema con la base de datos local (SQLite). |
| `npm run db:seed` | Carga los datos de demostración. |
| `npm run db:migrate` | Crea una migración nueva en PostgreSQL. |
| `npm run db:deploy` | Aplica las migraciones existentes (PostgreSQL). |
| `npm run db:studio` | Prisma Studio para explorar los datos. |
| `npm run db:reset` | Reinicia la base de datos local. |
| `npm run setup` | `db:push` + `db:seed` en un solo paso. |
| `npm run capturas` | Genera las capturas del README (requiere el servidor en marcha). |
| `npm run verificar` | Comprobación funcional por HTTP de páginas y APIs. |
| `npm run prueba` | Prueba funcional de los flujos principales (46 reglas de negocio y seguridad). |

---

## Cuentas de demostración

`npm run db:seed` crea tres cuentas listas para usar:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| **Administrador** | `admin@agendaflow.dev` | `Admin1234` |
| **Usuario** | `usuario@agendaflow.dev` | `Usuario1234` |
| Usuario | `ana.torres@agendaflow.dev` | `Usuario1234` |

Además se siembran **5 categorías, 14 servicios, 45 franjas horarias, 6 citas y 3 notificaciones**
para que la aplicación tenga contenido realista desde el primer arranque.

> En producción cambia o elimina estas cuentas: son únicamente para desarrollo.

---

## Comprobaciones automáticas

El proyecto incluye tres batteries de comprobación que se ejecutan contra el servidor en marcha:

```bash
npm run build && npm start        # en una terminal

npm run typecheck                 # tsc --noEmit  → 0 errores
npm run lint                      # eslint .      → 0 errores, 0 avisos
npm run verificar -- http://localhost:3000   # 14 páginas + 7 APIs
npm run prueba -- http://localhost:3000     # 46 reglas de negocio y seguridad
```

`npm run prueba` recorre los flujos reales de la aplicación: registro con validaciones, búsqueda y
filtros combinados del catálogo, cálculo de disponibilidad, reserva, cancelación, reutilización
del hueco liberado, ciclo de vida de la cita en el panel de administración (incluidos los estados
terminales), alta/edición/baja de servicios, formulario de contacto con trampa *honeypot* y cierre
de sesión con revocación del token.

---

## Estructura del proyecto

```
.
├── docs/                     # Documentación y capturas
│   ├── API.md                # Referencia de la API REST
│   ├── BASE-DE-DATOS.md      # Diagrama ER y modelo de datos
│   ├── REQUERIMIENTOS.md     # Matriz de trazabilidad RF/RNF
│   └── capturas/             # Capturas de pantalla (PNG)
├── prisma/
│   ├── schema.prisma         # Esquema maestro (PostgreSQL)
│   ├── schema.sqlite.prisma  # Derivado automático para desarrollo
│   ├── migrations/           # Migraciones de PostgreSQL
│   └── seed.ts               # Datos de demostración
├── scripts/
│   ├── prisma-esquema.mjs        # Resuelve el esquema según DATABASE_PROVIDER
│   ├── prisma-generate.mjs       # Genera el cliente Prisma
│   ├── prisma-cli.mjs            # db push / reset / studio con el esquema correcto
│   ├── prisma-seed.mjs           # Carga la semilla con el esquema correcto
│   ├── generate-sqlite-schema.mjs # Deriva el esquema SQLite
│   ├── crear-indices.mjs         # Índices parciales (no expresables en Prisma)
│   ├── capturas.mjs              # Generador de capturas (CDP)
│   ├── verificar.mjs             # Test funcional por HTTP
│   └── prueba-flujos.mjs         # Test de los flujos principales de negocio
├── src/
│   ├── app/                  # Rutas (App Router)
│   │   ├── api/              # Route Handlers (REST)
│   │   ├── admin/            # Panel de administración
│   │   ├── mis-reservas/     # Área personal del usuario
│   │   ├── servicios/        # Catálogo y ficha de servicio
│   │   └── ...               # Portada, contacto, legal, accesibilidad
│   ├── components/           # Componentes de interfaz por dominio
│   ├── lib/                  # Servicios de negocio, validaciones y utilidades
│   └── middleware.ts         # Protección de rutas por rol
├── .env.example
└── next.config.ts
```

### Arquitectura

- **Server Components** por defecto: las páginas se renderizan en el servidor y se envían como HTML
  (rápido, accesible y con poco JavaScript en el cliente).
- **Client Components** solo donde hace falta interactividad: formularios, filtros, modales, toasts
  y el panel de administración.
- **Capa de servicios** (`src/lib/services/*`): contiene las reglas de negocio y es la única que
  escribe en la base de datos. Las rutas HTTP solo validan, delegan y formatean la respuesta.
- **Capa de acceso a datos**: Prisma con consultas parametrizadas.
- **Middleware** (`src/middleware.ts`): verifica el JWT antes de dejar pasar a `/admin` y
  `/mis-reservas`.

---

## Despliegue en la nube

### Vercel + PostgreSQL (recomendado)

1. **Crea la base de datos** en [Neon](https://neon.tech), [Railway](https://railway.app),
   [Supabase](https://supabase.com) o el propio Postgres de Vercel y copia la cadena de conexión.

2. **Importa el repositorio** en Vercel (`Add New… → Project`). Vercel detecta Next.js
   automáticamente.

3. Configura las **variables de entorno** del proyecto (Settings → Environment Variables):

   ```env
   DATABASE_PROVIDER="postgresql"
   DATABASE_URL="postgresql://usuario:clave@host/agendaflow?sslmode=require"
   AUTH_SECRET="<cadena aleatoria de 48 bytes>"
   NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"
   ```

4. **Despliega.** El script `build` ejecuta `node scripts/prisma-generate.mjs && next build`, que
   genera el cliente Prisma para PostgreSQL de forma automática.

5. **Aplica las migraciones** sobre la base de datos de producción:

   ```bash
   # Con las mismas variables de entorno, en local
   npx prisma migrate deploy --schema prisma/schema.prisma
   ```

   Alternativa: configura un *Build Command* en Vercel como
   `prisma migrate deploy --schema prisma/schema.prisma && npm run build`.

6. *(Opcional)* Carga los datos de demostración con `npm run db:seed` y crea el primer
   administrador con `npx prisma studio --schema prisma/schema.prisma`.

### Other proveedores

El proyecto es un Next.js estándar, por lo que funciona en cualquier hosting compatible con Node
(Render, Railway, Fly.io, un contenedor Docker propio…). Recuerda:

- `npm run build` y `npm start`.
- `DATABASE_PROVIDER="postgresql"` y `DATABASE_URL` apuntando a tu servidor.
- `AUTH_SECRET` con un valor aleatorio y distinto del de desarrollo.
- Ejecutar `prisma migrate deploy` antes de arrancar.

---

## Documentación

| Documento | Contenido |
| --- | --- |
| [`docs/API.md`](docs/API.md) | Referencia completa de la API REST: endpoints, parámetros, cuerpos, respuestas y códigos de estado. |
| [`docs/BASE-DE-DATOS.md`](docs/BASE-DE-DATOS.md) | Modelo de datos, diagrama ER, claves foráneas, índices y decisiones de diseño. |
| [`docs/REQUERIMIENTOS.md`](docs/REQUERIMIENTOS.md) | Matriz de trazabilidad: cada requisito funcional y no funcional con su implementación y evidencias. |
| [`docs/capturas/`](docs/capturas) | Capturas de pantalla de la aplicación. |

---

## Trazabilidad de requisitos

| Requisito | Descripción | Implementación |
| --- | --- | --- |
| **RF-01** | Registro, login/logout, sesión segura y dos roles | `src/app/api/auth/*`, `src/lib/session.ts`, `src/lib/jwt.ts`, `src/middleware.ts` |
| **RF-02** | CRUD de servicios | `src/app/api/servicios/*`, `src/app/admin/servicios`, `src/lib/services/servicios.ts` |
| **RF-03** | Búsqueda, ≥2 filtros combinables y ordenación | `src/app/servicios`, `src/components/servicios/FiltrosServicios.tsx`, `src/lib/services/filtros.ts` |
| **RF-04** | Módulo interactivo de agenda | `src/components/reservas/FormularioReserva.tsx`, `src/app/api/disponibilidad`, `src/lib/services/reservas.ts` |
| **RF-05** | Panel de administración, toasts, carga y responsive | `src/app/admin/*`, `src/components/providers/ProveedorToast.tsx`, `src/components/ui/Spinner.tsx` |
| **RNF-01** | Accesibilidad | `src/app/accesibilidad`, `globals.css` (foco visible, `prefers-reduced-motion`), `skip link` en `layout.tsx` |
| **RNF-02** | Rendimiento (< 3 s) | RSC, fuentes locales con `next/font`, sin imágenes externas, caché de Next |
| **RNF-03** | Seguridad | `src/lib/validators.ts` (Zod), `src/lib/password.ts` (bcrypt), Prisma parametrizado, rate limiting, `httpOnly` |
| **RNF-04** | Diseño responsive y consistente | Sistema de tokens en `globals.css`, Tailwind v4, `dark` por clase |

El detalle completo está en [`docs/REQUERIMIENTOS.md`](docs/REQUERIMIENTOS.md).

---

## Licencia

Proyecto académico. El código se entrega con fines educativos.
