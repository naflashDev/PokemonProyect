# Pokémon Manager — Proyecto inicial

Este repositorio contiene un scaffold inicial para una aplicación de gestión de Pokédex usando Clean Architecture con Next.js (App Router), TypeScript, Tailwind y Prisma (SQLite por defecto).

**Estructura principal creada**

- `src/domain` — Entidades y repositorios (interfaces)
- `src/application` — Casos de uso (RegisterPokemon, MarkAsCaptured, GetPokedexProgress)
- `src/infrastructure` — Repositorios basados en Prisma
- `app` — Next.js App Router (página principal y `app/api/pokemon/route.ts`)
- `prisma/schema.prisma` — Esquema inicial (SQLite)

Archivos clave:

- [prisma/schema.prisma](prisma/schema.prisma)
- [src/domain/entities/Pokemon.ts](src/domain/entities/Pokemon.ts)
- [src/application/use-cases/registerPokemon.ts](src/application/use-cases/registerPokemon.ts)
- [src/infrastructure/repositories/PrismaPokemonRepository.ts](src/infrastructure/repositories/PrismaPokemonRepository.ts)
- [app/api/pokemon/route.ts](app/api/pokemon/route.ts)

Quick start

1. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` si quieres (por defecto usa SQLite `file:./dev.db`).

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Tests

- Run unit tests locally:

```bash
npm run test
```

- Integration tests are available under `test/integration` and are executed only when `RUN_INTEGRATION=1`.
To run them locally (ensure your test database and migrations are applied):

```bash
npx cross-env RUN_INTEGRATION=1 npm run test:integration
```

2. Abre `http://localhost:3000`.

Notas de diseño y próximos pasos

- Autenticación (NextAuth) no está implementada en este scaffold — queda como siguiente paso.
- Autenticación (NextAuth) integrada con Prisma + GitHub OAuth (configurar `GITHUB_ID`/`GITHUB_SECRET`).
- Middleware añadido para proteger rutas `/admin` y `app/api/admin/**`.

Despliegue en Vercel
--------------------

Este proyecto está preparado para desplegar en Vercel. Pasos recomendados:

1. Crear una base de datos PostgreSQL (por ejemplo, Supabase, Neon o un servidor Postgres).
2. En tu proyecto de Vercel -> Settings -> Environment Variables, configura las variables (Production y Preview):
- `DATABASE_URL` (Postgres connection string)
- `NEXTAUTH_URL` (ej: `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` (una cadena aleatoria larga)
- `GITHUB_ID` y `GITHUB_SECRET` (GitHub OAuth App)

3. En Vercel, las builds usarán el script `vercel-build` que ejecuta las migraciones y luego construye la app. Asegúrate de que la base de datos sea accesible desde Vercel antes de desplegar.

Comandos locales para preparar y probar antes de desplegar:

```bash
cp .env.example .env
# Edita .env con tu PostgreSQL y credenciales OAuth
npm install
npx prisma generate
# Para desarrollo local con migraciones (SQLite o Postgres local):
npx prisma migrate dev --name init
npm run dev
```

Notas operacionales
- `postinstall` ejecuta `prisma generate` para garantizar el cliente Prisma durante la instalación.
- `vercel-build` ejecuta `npx prisma migrate deploy` y `next build`. En entornos donde no quieras ejecutar migraciones automáticamente, puedes ajustar este script y ejecutar migraciones manualmente.
- No subas secretos al repositorio. Usa las Environment Variables de Vercel.

- Validación con `zod` ya se usa en el endpoint POST.
- Mantener la lógica de negocio en `src/application` y `src/domain`.
- Añadir tests/unit e integración con PokéAPI para poblar Pokedex.

Si quieres, continúo con:
- Integración de NextAuth y protección de rutas
- Páginas CRUD completas para Pokédex y Pokémon
- Tests y scripts de seed con la PokéAPI
# PokemonProyect