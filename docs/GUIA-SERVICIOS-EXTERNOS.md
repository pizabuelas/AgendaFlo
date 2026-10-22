# 🚀 Guía Maestra y Definitiva de Configuración de Servicios Externos

Esta guía detalla paso a paso cómo obtener y configurar cada servicio externo necesario para **AgendaFlow**, con instrucciones precisas para el panel de control de cada plataforma (especialmente **Supabase**).

---

## 📌 ¿Dónde encontrar exactamente la URL en Supabase?

En Supabase la interfaz a veces confunde porque existen dos URLs: la de la API REST (`https://xxx.supabase.co`) y la **cadena de conexión de la base de datos PostgreSQL** (`postgresql://...`). La que necesita este proyecto es la segunda.

Sigue estos pasos dentro de [Supabase Dashboard](https://supabase.com/dashboard):

### Paso 1: Entrar a la configuración de la Base de Datos
1. Abre tu proyecto en **[supabase.com/dashboard](https://supabase.com/dashboard)**.
2. En la barra lateral izquierda, haz clic en el icono de engranaje ⚙️ **Project Settings** (abajo del todo).
3. En el menú secundario, haz clic en **Database** (o **Configuration** > **Database**).

```text
[Supabase Dashboard]
 ├── Table Editor
 ├── SQL Editor
 ├── Authentication
 ├── Storage
 └── ⚙️ Project Settings  <--- Haz clic aquí
      ├── General
      ├── 🗄️ Database      <--- Haz clic aquí
      └── API
```

### Paso 2: Localizar la sección "Connection string"
1. Baja por la página hasta encontrar el apartado **Connection string** (o botón **Connect** en la barra superior en versiones nuevas).
2. Verás opciones como `URI`, `Nodejs`, `Prisma`, etc.
3. Haz clic en la pestaña **URI** (o selecciona el modo `Prisma` o `Direct`).
4. Verás una dirección como esta:
   ```text
   postgresql://postgres.[tu-id-de-proyecto]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
   o bien directa:
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[tu-id-de-proyecto].supabase.co:5432/postgres
   ```

> ⚠️ **IMPORTANTE**: Supabase oculta la contraseña y muestra el texto `[YOUR-PASSWORD]`.
> Debes reemplazar todo el bloque `[YOUR-PASSWORD]` (incluyendo los corchetes) por la contraseña que elegiste al crear el proyecto.
> *Si no la recuerdas*, en esa misma página de Database hay un botón llamado **"Reset database password"** para asignarle una nueva contraseña al instante.

---

## 📋 ¿Qué datos necesito que me proporciones?

Para que yo me encargue de:
1. Configurar tu archivo [.env](file:///c:/Users/Usuario/Desktop/2%20proyectos/2/.env).
2. Ejecutar las migraciones automáticas de Prisma.
3. Crear todas las tablas en Supabase.
4. Poblar la base de datos con los datos iniciales (servicios, categorías, usuarios).

**Solo necesito que me copies y pegues aquí en el chat:**

1. **Tu cadena de conexión PostgreSQL de Supabase**, ya con tu contraseña puesta:
   `postgresql://postgres:MiContraseña123@db.xxxx.supabase.co:5432/postgres`

*(Opcional: Si además tienes una cuenta de correo transaccional como Resend o Gmail para enviar confirmaciones por email, indícamelo y también lo integramos).*

---

## ⚙️ ¿Qué pasos ejecutaré yo automáticamente?

Una vez que me proporciones la cadena:
1. Actualizaré [.env](file:///c:/Users/Usuario/Desktop/2%20proyectos/2/.env) con `DATABASE_PROVIDER="postgresql"` y tu `DATABASE_URL`.
2. Generaré una clave criptográfica de sesión aleatoria de 32 bytes para `AUTH_SECRET`.
3. Ejecutaré `npx prisma migrate deploy --schema prisma/schema.prisma` para crear las tablas en tu nube.
4. Ejecutaré `npm run db:seed` para dejar tu base de datos lista para usar.
