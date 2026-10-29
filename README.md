# AeroManten

Sistema de gestión de mantenimiento aeronáutico. Administra aeronaves y los
activos montados en ellas, su mantenimiento (correctivo y preventivo), órdenes
de trabajo, personal, inventario de piezas, requerimientos/cotizaciones a
proveedores, bitácora de vuelos y auditoría de cambios y accesos.

## Stack

- **Next.js 16** (App Router, React 19, Server Actions) — `next build --webpack`.
- **Prisma 6** sobre **MySQL / MariaDB** — sin migraciones versionadas, se usa
  `prisma db push` (ver [DEPLOY.md](DEPLOY.md)).
- **NextAuth v5** para autenticación (login, registro, recuperación de contraseña).
- **Tailwind CSS 4**.
- **Brevo** (API HTTP) para el envío de emails — verificación de cuenta,
  recuperación de contraseña y envío de requerimientos a proveedores. No se usa
  SMTP directo (los puertos SMTP suelen estar bloqueados en los hostings).
- **Puppeteer** + **ExcelJS** para generar reportes (PDF / JPG / Excel).

## Entornos

El proyecto corre en **dos entornos de producción** independientes, los dos
documentados en [DEPLOY.md](DEPLOY.md):

- **Hostinger / cPanel** → `aeromanten.com.ar`
- **Droplet DigitalOcean "doliarg"** → `157.230.212.99` (PM2 + nginx)

El código vive en [github.com/munditkd/AeroManten](https://github.com/munditkd/AeroManten),
rama única `main`.

## Desarrollo local

Requisitos: **Node 22** y un **MySQL/MariaDB** local (en esta máquina se usa el
MySQL de **XAMPP** — hay que tenerlo levantado antes de arrancar la app).

1. **Base de datos.** Levantá MySQL (XAMPP → Start en MySQL) y creá una base
   vacía, por ejemplo `aeromanten_local`.

2. **Variables de entorno.** Copiá `.env.example` a `.env` y completá los
   valores (como mínimo `DATABASE_URL` apuntando a tu base local):

   ```bash
   cp .env.example .env
   ```

3. **Dependencias y cliente de Prisma:**

   ```bash
   npm install
   npx prisma generate
   npx prisma db push     # crea las tablas en tu base local
   ```

4. **Arrancar el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

   Abrí [http://localhost:3000](http://localhost:3000).

5. **Primer usuario admin.** Registrate en `/register`, después marcá tu usuario
   como admin en la base:

   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'tu-email@ejemplo.com';
   ```

   Iniciá sesión en `/login` y entrá a `/admin`.

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `localhost:3000`. |
| `npm run build` | Build de producción (`next build --webpack`). |
| `npm run start` | Sirve el build de producción. |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | Chequeo de tipos (el build lo saltea, correrlo a mano). |
| `npx prisma studio` | Explorador visual de la base. |
| `npx prisma db push` | Sincroniza la base con `prisma/schema.prisma`. |

## Documentación relacionada

- [DEPLOY.md](DEPLOY.md) — desplegar en los dos entornos de producción.
- [PRISMA_ENGINES_SETUP.md](PRISMA_ENGINES_SETUP.md) — workaround de los motores
  de Prisma en Hostinger (motor pre-descargado + `db push` manual).
