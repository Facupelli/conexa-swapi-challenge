# Conexa SWAPI Challenge

API backend desarrollada con NestJS para gestionar películas y sincronizar información desde SWAPI.

Incluye autenticación JWT, autorización por roles, persistencia en PostgreSQL, CRUD de películas, sincronización con SWAPI, documentación OpenAPI y pruebas unitarias.

## Funcionalidades

- Registro e inicio de sesión
- Autenticación JWT
- Roles `REGULAR` y `ADMIN`
- Listado y detalle de películas
- Creación, edición y eliminación de películas para administradores
- Sincronización de películas desde SWAPI
- Validación runtime de requests, responses e integración externa
- Rate limiting en endpoints públicos de autenticación
- Documentación Swagger / OpenAPI
- Pruebas unitarias

## Stack

- Node.js
- TypeScript
- NestJS 12
- PostgreSQL 18
- Prisma 7
- Passport + JWT
- Argon2id
- Valibot
- better-result
- Vitest
- Swagger / OpenAPI
- Docker Compose

## Requisitos

- Node.js 24+
- pnpm
- Docker

## Puesta en marcha

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Crear un archivo `.env` a partir de `.env.example`.

Las variables `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` se utilizan únicamente para crear o actualizar el usuario administrador mediante el seed.

### 3. Iniciar PostgreSQL

```bash
docker compose up -d
```

### 4. Generar el cliente de Prisma

```bash
pnpm exec prisma generate
```

### 5. Aplicar las migraciones

```bash
pnpm exec prisma migrate deploy
```

### 6. Crear el usuario administrador

```bash
pnpm db:seed
```

El seed es idempotente: puede ejecutarse nuevamente para actualizar la contraseña configurada y asegurar que el usuario mantenga el rol `ADMIN`.

### 7. Iniciar la aplicación

```bash
pnpm start:dev
```

API local:

```text
http://localhost:3000
```

Swagger:

```text
http://localhost:3000/api/docs
```

## API y autorización

El endpoint público de registro siempre crea usuarios con rol `REGULAR`. El cliente no puede asignarse el rol `ADMIN`.

Los roles se interpretan literalmente según la consigna y no forman una jerarquía: un `ADMIN` no obtiene implícitamente acceso a endpoints restringidos a `REGULAR`.

| Endpoint | Público | REGULAR | ADMIN |
|---|---:|---:|---:|
| `POST /auth/signup` | Sí | Sí | Sí |
| `POST /auth/login` | Sí | Sí | Sí |
| `GET /movies` | Sí | Sí | Sí |
| `GET /movies/:id` | No | Sí | No |
| `POST /movies` | No | No | Sí |
| `PATCH /movies/:id` | No | No | Sí |
| `DELETE /movies/:id` | No | No | Sí |
| `POST /movies/sync` | No | No | Sí |

Para obtener un token de administrador:

1. Ejecutar el seed.
2. Iniciar sesión con las credenciales configuradas en `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`.

En Swagger se puede utilizar el botón **Authorize** con el token retornado por `/auth/login`.

## Tests y calidad

Ejecutar la suite:

```bash
pnpm test
```

La suite cubre lógica de autenticación, autorización, usuarios, películas y sincronización con SWAPI.

## Decisiones técnicas

### Persistencia local para las lecturas

SWAPI se utiliza únicamente durante la sincronización. Los endpoints de lectura consultan PostgreSQL, por lo que una caída de SWAPI no impide acceder a películas previamente sincronizadas.

### Integración externa aislada

La integración con SWAPI vive detrás de un cliente dedicado. El payload externo se valida antes de entrar a la lógica de la aplicación y sólo se mapean los campos necesarios.

### Sincronización idempotente

Las películas importadas utilizan un `externalId` único y la sincronización persiste mediante `upsert`.

Esto permite ejecutar la sincronización repetidamente sin generar duplicados y evita depender de un flujo `leer → comprobar → escribir` para preservar unicidad.

### Validación en los límites

Valibot se utiliza para validar datos en los principales límites de confianza:

- requests HTTP
- responses HTTP
- respuestas provenientes de SWAPI
- variables de entorno

### Errores esperados como valores

Los services representan errores esperados mediante `better-result`.

La traducción de esos errores a códigos y excepciones HTTP queda en los controllers, manteniendo la lógica de aplicación desacoplada de NestJS.

## Supuestos y trade-offs

- `GET /movies` se dejó público porque la consigna no especifica una restricción para ese endpoint.
- `REGULAR` y `ADMIN` se consideran roles independientes.
- El rate limiting de los endpoints de autenticación utiliza almacenamiento en memoria. En un despliegue con múltiples instancias utilizaría un storage compartido.
- La sincronización no elimina automáticamente películas locales que dejen de aparecer en SWAPI.
- El proyecto mantiene una arquitectura deliberadamente simple y evita agregar capas que sólo dupliquen APIs ya provistas por Prisma o NestJS.

## Posibles mejoras

Con más tiempo o ante nuevas necesidades:

- automatizar una suite e2e sobre la API HTTP
- utilizar storage distribuido para rate limiting en múltiples instancias
- agregar paginación si el volumen de películas creciera
- agregar observabilidad y métricas para la sincronización con SWAPI

## Documentación de la API

Con la aplicación ejecutándose:

```text
http://localhost:3000/api/docs
```

Swagger incluye schemas de entrada y salida, autenticación Bearer, restricciones de autorización y respuestas HTTP relevantes.
