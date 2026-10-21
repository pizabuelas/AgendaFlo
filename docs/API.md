# API de AgendaFlow

Referencia de la API REST que expone AgendaFlow. Todos los endpoints son
**Route Handlers** de Next.js 15 (`src/app/api/**/route.ts`) y responden siempre en
**JSON**.

- **Base URL local:** `http://localhost:3000/api`
- **Formato de las respuestas:** UTF-8 JSON
- **Autenticación:** cookie `httpOnly` `agendaflow_sesion` (JWT HS256)

---

## Índice

1. [Formato de las respuestas](#formato-de-las-respuestas)
2. [Autenticación](#autenticación)
3. [Servicios](#servicios)
4. [Reservas](#reservas)
5. [Disponibilidad](#disponibilidad)
6. [Notificaciones](#notificaciones)
7. [Usuarios (administración)](#usuarios-administración)
8. [Contacto](#contacto)
9. [Códigos de error](#códigos-de-error)
10. [Resumen de endpoints](#resumen-de-endpoints)

---

## Formato de las respuestas

Todas las respuestas comparten la misma envolvente (`src/lib/api-response.ts`):

**Éxito**

```json
{
  "ok": true,
  "mensaje": "Sesión iniciada correctamente.",
  "datos": { }
}
```

`mensaje` es opcional; `datos` contiene la carga útil y depende del endpoint.

**Error**

```json
{
  "ok": false,
  "mensaje": "Revisa los datos del formulario.",
  "errores": {
    "email": ["Introduce un correo electrónico válido."],
    "password": ["La contraseña debe incluir al menos un número."]
  }
}
```

`errores` solo aparece en los **400** de validación y contiene un array de mensajes por campo.

### Autenticación y permisos

| Nivel | Requisito |
| --- | --- |
| **Público** | Ninguno. |
| **Autenticado** | Cookie `agendaflow_sesion` válida y con la sesión aún activa en la tabla `sesiones`. |
| **Administrador** | Lo anterior y `rol === "ADMIN"`. |

Las respuestas `401` y `403` nunca devuelven datos del recurso protegido.

---

## Autenticación

### `POST /api/auth/registro`

Crea una cuenta de usuario e inicia la sesión automáticamente. (RF-01)

**Cuerpo**

| Campo | Tipo | Requisitos |
| --- | --- | --- |
| `nombre` | `string` | 3–80 caracteres, obligatorio. |
| `email` | `string` | Formato de correo, 5–254 caracteres, único. |
| `password` | `string` | 8–72 caracteres, al menos una minúscula, una mayúscula y un número. |
| `confirmPassword` | `string` | Debe coincidir con `password`. |
| `telefono` | `string?` | Opcional, máx. 20 caracteres, solo `+ ( ) . -` y dígitos. |
| `aceptarTerminos` | `true` | Obligatorio, debe ser exactamente `true`. |

```bash
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Marta Ruiz",
    "email": "marta.ruiz@ejemplo.com",
    "password": "Segura2026",
    "confirmPassword": "Segura2026",
    "aceptarTerminos": true
  }'
```

**Respuestas**

| Código | Cuándo |
| --- | --- |
| `201` | Cuenta creada. Devuelve `{ id, nombre, email, rol }` y la cookie de sesión. |
| `400` | Fallo de validación (detalle por campo). |
| `409` | El correo ya está registrado. |
| `429` | Se han superado los intentos de registro permitidos desde esa IP. |

---

### `POST /api/auth/login`

Inicia sesión. (RF-01)

**Cuerpo**

```json
{ "email": "admin@agendaflow.dev", "password": "Admin1234" }
```

**Respuestas**

| Código | Cuándo |
| --- | --- |
| `200` | Credenciales correctas. Devuelve `{ id, nombre, email, rol }` y la cookie `agendaflow_sesion`. |
| `400` | Formato de correo o contraseña inválido. |
| `401` | Credenciales incorrectas, cuenta desactivada o demasiados intentos fallidos. |

> El mensaje de error es idéntico para "correo no registrado" y "contraseña incorrecta":
> no se revela qué correos existen.

**Cookies de la respuesta**

```
Set-Cookie: agendaflow_sesion=<JWT>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
```

---

### `POST /api/auth/logout`

Revoca la sesión en la base de datos y elimina la cookie. (RF-01)

**Respuesta:** `200` → `{ "ok": true, "mensaje": "Sesión cerrada correctamente." }`

---

### `GET /api/auth/sesion`

Devuelve los datos del usuario de la sesión actual.

| Código | Cuándo |
| --- | --- |
| `200` | `{ id, nombre, email, rol }` |
| `401` | No hay ninguna sesión activa. |

---

## Servicios

Entidad principal del sistema (RF-02 y RF-03).

### `GET /api/servicios`

Listado con búsqueda, filtros, ordenación y paginación.

**Parámetros de consulta**

| Parámetro | Tipo | Por defecto | Descripción |
| --- | --- | --- | --- |
| `q` | `string` (≤120) | `""` | Texto libre; busca en nombre y descripción. |
| `categoria` | `string` (≤60) | `""` | Slug o nombre de la categoría. |
| `precio` | `string` | — | Rango compuesto `"50-100"`; también acepta `precioMin` y `precioMax`. |
| `duracion` | `number` | — | Duración máxima en minutos. |
| `estado` | `todos \| activo \| inactivo` | `activo` | Los administradores pueden ver los dados de baja. |
| `orden` | `relevancia \| precio-asc \| precio-desc \| duracion-asc \| duracion-desc \| nombre-asc \| nombre-desc \| recientes` | `relevancia` | Criterio de ordenación. |
| `pagina` | `number` ≥1 | `1` | Página actual. |
| `porPagina` | `number` 1–48 | `9` | Servicios por página. |

```bash
curl "http://localhost:3000/api/servicios?q=medic&categoria=salud-y-bienestar&precio=40-120&orden=precio-asc&pagina=1&porPagina=9"
```

**Respuesta `200`**

```json
{
  "ok": true,
  "datos": {
    "servicios": [
      {
        "id": "cmvilm4ql001av0woig2aj6gn",
        "nombre": "Asesoría estratégica",
        "slug": "asesoria-estrategica",
        "descripcion": "Sesión de trabajo para definir hoja de ruta…",
        "precio": 95,
        "duracionMin": 60,
        "icono": "target",
        "color": "indigo",
        "activo": true,
        "destacado": true,
        "categoria": { "id": "…", "nombre": "Consultoría", "slug": "consultoria" },
        "horarios": [
          { "id": "…", "diaSemana": 1, "horaInicio": "09:00", "horaFin": "14:00" }
        ],
        "createdAt": "2026-10-21T21:02:38.205Z"
      }
    ],
    "total": 14,
    "pagina": 1,
    "porPagina": 9,
    "totalPaginas": 2
  }
}
```

| Código | Cuándo |
| --- | --- |
| `200` | Listado correcto. |
| `400` | Algún parámetro no cumple el esquema (por ejemplo, `orden` inexistente). |

---

### `GET /api/servicios/:id`

Detalle de un servicio, incluidos sus horarios.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, datos: { …servicio } }` |
| `404` | El servicio no existe. |

---

### `POST /api/servicios` — *administrador*

Crea un servicio y sus franjas horarias. (RF-02)

**Cuerpo**

| Campo | Tipo | Requisitos |
| --- | --- | --- |
| `nombre` | `string` | 3–100 caracteres. |
| `descripcion` | `string` | 20–1200 caracteres. |
| `categoriaId` | `string` | Id de una categoría existente. |
| `precio` | `number` | Mayor que 0, máximo 100 000. |
| `duracionMin` | `number` | 15–480, múltiplo de 15. |
| `icono` | `string` | ≤40 caracteres, por defecto `calendar`. |
| `color` | `indigo \| violet \| sky \| emerald \| amber \| rose \| teal \| orange` | Por defecto `indigo`. |
| `destacado` | `boolean` | Por defecto `false`. |
| `activo` | `boolean` | Por defecto `true`. |
| `horarios` | `array` | Hasta 21 elementos: `{ diaSemana: 0-6, horaInicio: "HH:mm", horaFin: "HH:mm" }`. |

```json
{
  "nombre": "Consultoría de imagen personal",
  "descripcion": "Sesión de una hora para revisar estilo, prendas y核心竞争力.",
  "categoriaId": "cmvilm4nj0002v0wotq8p4q4k",
  "precio": 75,
  "duracionMin": 60,
  "horarios": [{ "diaSemana": 2, "horaInicio": "10:00", "horaFin": "14:00" }]
}
```

| Código | Cuándo |
| --- | --- |
| `201` | Servicio creado. |
| `400` | Fallo de validación. |
| `401` | Sin sesión. |
| `403` | La sesión no es de administrador. |

---

### `PATCH /api/servicios/:id` — *administrador*

Actualiza un servicio. Acepta cualquiera de los campos de `POST` (todos opcionales).
Los `horarios` enviados sustituyen a los anteriores.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, mensaje: "Servicio actualizado correctamente." }` |
| `400` | Fallo de validación. |
| `401` / `403` | Sin permisos. |
| `404` | El servicio no existe. |

---

### `DELETE /api/servicios/:id` — *administrador*

Da de baja el servicio (baja lógica: `activo = false`). Los servicios dados de baja
desaparecen del catálogo pero conservan su histórico de citas.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, mensaje: "Servicio dado de baja." }` |
| `401` / `403` | Sin permisos. |
| `404` | El servicio no existe. |

---

### `DELETE /api/servicios/:id?definitivo=true` — *administrador*

Elimina el servicio de forma definitiva. Solo es posible si **no tiene reservas
asociadas**.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, mensaje: "Servicio eliminado definitivamente." }` |
| `401` / `403` | Sin permisos. |
| `409` | El servicio tiene reservas o categorías que lo impiden. |

---

### `POST /api/servicios/:id` — *administrador*

Reactiva un servicio dado de baja.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, mensaje: "Servicio reactivado." }` |
| `401` / `403` | Sin permisos. |
| `404` | El servicio no existe. |

---

## Reservas

### `GET /api/reservas`

Lista las citas del usuario actual. Los administradores pueden consultar las de
cualquier usuario con `?usuarioId=`. (RF-04)

**Parámetros**

| Parámetro | Tipo | Por defecto | Descripción |
| --- | --- | --- | --- |
| `usuarioId` | `string` | usuario actual | Solo para administradores. |
| `estado` | `PENDIENTE \| CONFIRMADA \| COMPLETADA \| CANCELADA \| todos` | `todos` | Filtro por estado. |
| `q` | `string` | `""` | Búsqueda por código de cita o nombre del servicio. |
| `pagina` | `number` ≥1 | `1` | Página actual. |
| `porPagina` | `number` 1–48 | `10` | Citas por página. |

**Respuesta `200`**

```json
{
  "ok": true,
  "datos": {
    "reservas": [
      {
        "id": "…",
        "codigo": "CIT-DEMO01",
        "fecha": "2026-10-22T00:00:00.000Z",
        "hora": "09:00",
        "duracionMin": 60,
        "precio": 70,
        "estado": "CONFIRMADA",
        "notas": null,
        "servicio": { "id": "…", "nombre": "Terapia individual", "slug": "…", "color": "teal" },
        "usuario": { "id": "…", "nombre": "Carlos Ramírez", "email": "usuario@agendaflow.dev" }
      }
    ],
    "total": 3,
    "pagina": 1,
    "porPagina": 10,
    "totalPaginas": 1
  }
}
```

| Código | Cuándo |
| --- | --- |
| `200` | Listado correcto. |
| `401` | Sin sesión. |

---

### `POST /api/reservas`

Crea una cita. Todas las reglas de negocio se validan en
`src/lib/services/reservas.ts`. (RF-04)

**Cuerpo**

| Campo | Tipo | Requisitos |
| --- | --- | --- |
| `servicioId` | `string` | Servicio activo. |
| `fecha` | `string` | Formato `AAAA-MM-DD`, no puede estar en el pasado. |
| `hora` | `string` | Formato `HH:mm`, debe estar dentro de una franja de atención libre. |
| `notas` | `string?` | Opcional, máx. 500 caracteres. |

**Reglas de negocio**

1. La fecha debe respetar la **ventana de anticipación** y no estar en el pasado.
2. La hora debe caer dentro de una **franja de atención** del servicio.
3. El hueco debe estar **libre** (índice único `(servicioId, fecha, hora)`).
4. El usuario no puede superar el **límite de citas activas**.

**Respuestas**

| Código | Cuándo |
| --- | --- |
| `200` | Cita creada. Devuelve la reserva y genera una notificación de tipo `EXITO`. |
| `400` | Fallo de validación. |
| `401` | Sin sesión. |
| `409` | El hueco ya está ocupado. |
| `422` | La operación es válida pero la rechaza una regla de negocio (fuera de franja, demasiadas citas, etc.). |

---

### `GET /api/reservas/:id`

Detalle de una cita. Un usuario estándar solo puede consultar las suyas.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, datos: { …reserva } }` |
| `401` | Sin sesión. |
| `403` | La reserva pertenece a otro usuario. |
| `404` | La reserva no existe. |

---

### `PATCH /api/reservas/:id`

Cambia el estado de la cita. (RF-04)

**Cuerpo**

```json
{ "estado": "CONFIRMADA", "motivoCancelacion": "" }
```

| `estado` | Usuario estándar | Administrador |
| --- | :---: | :---: |
| `PENDIENTE` | — | ✅ |
| `CONFIRMADA` | — | ✅ |
| `COMPLETADA` | — | ✅ |
| `CANCELADA` | ✅ (propias) | ✅ (todas) |

**Transiciones válidas**

```
PENDIENTE  → CONFIRMADA | CANCELADA
CONFIRMADA → COMPLETADA | CANCELADA
COMPLETADA → (terminal)
CANCELADA  → (terminal)
```

| Código | Cuándo |
| --- | --- |
| `200` | Estado actualizado. Se genera una notificación para el usuario afectado. |
| `400` | Estado no válido. |
| `401` | Sin sesión. |
| `403` | El usuario intenta una transición que no le corresponde. |
| `404` | La reserva no existe. |
| `422` | Transición no permitida desde el estado actual. |

---

### `DELETE /api/reservas/:id` — *administrador*

Elimina definitivamente una cita.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, mensaje: "… eliminada correctamente." }` |
| `401` / `403` | Sin permisos. |
| `404` | La reserva no existe. |

---

## Disponibilidad

### `GET /api/disponibilidad`

Calcula los huecos libres de un servicio en una fecha concreta. Es la fuente de datos
del calendario interactivo. (RF-04)

**Parámetros**

| Parámetro | Tipo | Obligatorio | Descripción |
| --- | --- | :---: | --- |
| `servicioId` | `string` | ✅ | Id del servicio. |
| `fecha` | `string` | ✅ | Fecha `AAAA-MM-DD`. |

```bash
curl "http://localhost:3000/api/disponibilidad?servicioId=cmvilm4ql001av0woig2aj6gn&fecha=2026-10-24"
```

**Respuesta `200`**

```json
{
  "ok": true,
  "datos": {
    "fecha": "2026-10-24",
    "servicioId": "cmvilm4ql001av0woig2aj6gn",
    "disponibles": 4,
    "huecos": [
      { "hora": "09:00", "disponible": true },
      { "hora": "10:00", "disponible": false, "motivo": "ocupado" }
    ]
  }
}
```

| Código | Cuándo |
| --- | --- |
| `200` | Cálculo correcto (puede devolver `huecos: []`). |
| `400` | Falta `servicioId` o la fecha no tiene formato `AAAA-MM-DD`. |

---

## Notificaciones

### `GET /api/notificaciones`

Notificaciones del usuario actual.

| Parámetro | Tipo | Por defecto | Descripción |
| --- | --- | --- | --- |
| `limite` | `number` | `20` | Máximo 50. |

```json
{
  "ok": true,
  "datos": [
    {
      "id": "…",
      "titulo": "Cita reservada",
      "mensaje": "Tu cita de Terapia individual (CIT-DEMO01) está confirmada.",
      "tipo": "EXITO",
      "leida": false,
      "createdAt": "2026-10-21T21:10:12.000Z"
    }
  ]
}
```

| Código | Cuándo |
| --- | --- |
| `200` | Listado correcto. |
| `401` | Sin sesión. |

### `PATCH /api/notificaciones`

Marca **todas** las notificaciones del usuario como leídas.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, mensaje: "Notificaciones marcadas como leídas." }` |
| `401` | Sin sesión. |

---

## Usuarios (administración)

### `GET /api/admin/usuarios` — *administrador*

Lista los usuarios de la plataforma.

| Parámetro | Tipo | Por defecto | Descripción |
| --- | --- | --- | --- |
| `q` | `string` | `""` | Búsqueda por nombre o correo. |
| `rol` | `ADMIN \| USUARIO \| todos` | `todos` | Filtro por rol. |
| `pagina` | `number` ≥1 | `1` | Página actual. |
| `porPagina` | `number` | `10` | Usuarios por página. |

```json
{
  "ok": true,
  "datos": {
    "usuarios": [
      {
        "id": "…",
        "nombre": "Laura Fernández",
        "email": "admin@agendaflow.dev",
        "rol": "ADMIN",
        "telefono": "+34 600 111 222",
        "activo": true,
        "createdAt": "2026-10-21T20:55:00.000Z",
        "_count": { "reservas": 0 }
      }
    ],
    "total": 3,
    "pagina": 1,
    "porPagina": 10,
    "totalPaginas": 1
  }
}
```

| Código | Cuándo |
| --- | --- |
| `200` | Listado correcto. |
| `401` | Sin sesión. |
| `403` | La sesión no es de administrador. |

---

### `PATCH /api/admin/usuarios/:id` — *administrador*

Actualiza un usuario.

**Cuerpo** (todos opcionales)

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `rol` | `USUARIO \| ADMIN` | Cambia el rol. |
| `activo` | `boolean` | Activa o desactiva la cuenta. |
| `nombre` | `string` | 3–80 caracteres. |
| `telefono` | `string?` | Máx. 20 caracteres. |

Desactivar una cuenta (`activo = false`) impide iniciar sesión y revoca sus sesiones activas.
Si un usuario deja de ser administrador, sus sesiones abiertas también se revocan, de modo que
los privilegios se pierden de inmediato.

| Código | Cuándo |
| --- | --- |
| `200` | `{ ok: true, mensaje: "Usuario actualizado." }` |
| `400` | Fallo de validación. |
| `401` / `403` | Sin permisos. |
| `404` | El usuario no existe. |
| `422` | El administrador intenta quitarse a sí mismo el rol o desactivar su propia cuenta. |

---

## Contacto

### `POST /api/contacto`

Recibe un mensaje del formulario de contacto y lo persiste en la tabla
`mensajes_contacto`. (RNF-02 / RF-05)

**Cuerpo**

| Campo | Tipo | Requisitos |
| --- | --- | --- |
| `nombre` | `string` | 3–80 caracteres. |
| `email` | `string` | Formato de correo. |
| `asunto` | `string` | 3–120 caracteres. |
| `mensaje` | `string` | 20–2000 caracteres. |
| `honeypot` | `string?` | Campo trampa; si viene relleno, el envío se descarta en silencio. |

```json
{
  "nombre": "Marta Ruiz",
  "email": "marta.ruiz@ejemplo.com",
  "asunto": "Consulta sobre servicios",
  "mensaje": "Me gustaría saber si tenéis un plan de suscripción mensual."
}
```

| Código | Cuándo |
| --- | --- |
| `201` | Mensaje recibido. Devuelve `{ id }`. |
| `400` | Fallo de validación o mensaje sin contenido significativo. |

> El contenido almacenado nunca se devuelve al cliente, lo que evita acumular datos
> personales en respuestas intermedias.

---

## Códigos de error

| Código | Significado | Cuándo se usa |
| --- | --- | --- |
| `200` | Correcto | Consulta o actualización completada. |
| `201` | Creado | Registro, servicio, reserva o mensaje de contacto creado. |
| `400` | Error de validación | Los datos no cumplen el esquema Zod; incluye `errores` por campo. |
| `401` | No autenticado | Falta la cookie o la sesión está revocada o expirada. |
| `403` | Sin permisos | Autenticado pero con rol o rol insuficiente. |
| `404` | No encontrado | El recurso no existe. |
| `409` | Conflicto | Correo duplicado, hueco ya ocupado o servicio con reservas. |
| `422` | No procesable | La petición es válida pero una regla de negocio la rechaza. |
| `429` | Demasiadas peticiones | Límite de intentos de registro o de inicio de sesión. |
| `500` | Error interno | Fallo inesperado; se registra en el servidor. |

---

## Resumen de endpoints

| Método | Ruta | Acceso | Requisito |
| --- | --- | --- | --- |
| `POST` | `/api/auth/registro` | Público | RF-01 |
| `POST` | `/api/auth/login` | Público | RF-01 |
| `POST` | `/api/auth/logout` | Público | RF-01 |
| `GET` | `/api/auth/sesion` | Público | RF-01 |
| `GET` | `/api/servicios` | Público | RF-03 |
| `GET` | `/api/servicios/:id` | Público | RF-02 |
| `POST` | `/api/servicios` | Administrador | RF-02 |
| `PATCH` | `/api/servicios/:id` | Administrador | RF-02 |
| `DELETE` | `/api/servicios/:id` | Administrador | RF-02 |
| `POST` | `/api/servicios/:id` | Administrador | RF-02 |
| `GET` | `/api/reservas` | Autenticado | RF-04 |
| `POST` | `/api/reservas` | Autenticado | RF-04 |
| `GET` | `/api/reservas/:id` | Autenticado | RF-04 |
| `PATCH` | `/api/reservas/:id` | Autenticado / Administrador | RF-04 |
| `DELETE` | `/api/reservas/:id` | Administrador | RF-04 |
| `GET` | `/api/disponibilidad` | Público | RF-04 |
| `GET` | `/api/notificaciones` | Autenticado | RF-05 |
| `PATCH` | `/api/notificaciones` | Autenticado | RF-05 |
| `GET` | `/api/admin/usuarios` | Administrador | RF-05 |
| `PATCH` | `/api/admin/usuarios/:id` | Administrador | RF-05 |
| `POST` | `/api/contacto` | Público | RNF-02 |

---

## Probar la API con `curl`

```bash
# 1. Iniciar sesión y guardar la cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agendaflow.dev","password":"Admin1234"}'

# 2. Consultar el catálogo filtrado
curl "http://localhost:3000/api/servicios?categoria=formacion&orden=precio-asc"

# 3. Crear una cita
curl -b cookies.txt -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{"servicioId":"<ID_SERVICIO>","fecha":"2026-10-28","hora":"10:00","notas":""}'

# 4. Confirmar la cita desde el panel
curl -b cookies.txt -X PATCH http://localhost:3000/api/reservas/<ID_RESERVA> \
  -H "Content-Type: application/json" \
  -d '{"estado":"CONFIRMADA"}'
```

El proyecto incluye un comprobador funcional que valida páginas y APIs de golpe:

```bash
npm run verificar -- http://localhost:3000
```
