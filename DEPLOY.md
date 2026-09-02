# Desplegar en Hostinginlimitado

Guía basada en el despliegue real ya hecho para `aeromanten.com.ar` (cuenta cPanel
`aeromant`, servidor `server0808`). Si volvés a desplegar desde cero, seguí estos
pasos en orden — cada uno resuelve un problema real que apareció la primera vez.

## 1. Base de datos

La app usa la base MySQL `aeromant_aero` (creada en Hostinginlimitado).

Cada vez que cambies `prisma/schema.prisma`, sincronizá la base con:

```bash
npx prisma db push
```

(Este hosting no permite crear la "shadow database" que usa `prisma migrate dev`,
por eso se usa `db push` en vez de migraciones versionadas.)

## 2. Subir el código

Subí el código a una **subcarpeta dentro de `public_html`**, por ejemplo
`public_html/aeromanten` — **no** se puede usar `public_html` directamente como
raíz de la app Node (cPanel lo rechaza: "Directory public_html not allowed").

Subí todo **excepto** `node_modules`, `.next` y `.env`.

Después de subir/descomprimir, si lo hiciste por el Administrador de archivos de
cPanel, corré esto para asegurar los permisos correctos (algunas carpetas, sobre
todo las que tienen corchetes en el nombre como `[...nextauth]`, pueden quedar con
permisos que bloquean el build):

```bash
find /home/aeromant/public_html/aeromanten -type d -exec chmod 755 {} \;
find /home/aeromant/public_html/aeromanten -type f -exec chmod 644 {} \;
```

## 3. Configurar la app Node.js en cPanel

En cPanel > **Setup Node.js App** > Create Application:

- **Node.js version**: 22 (recomendado)
- **Application mode**: Production
- **Application root**: `public_html/aeromanten`
- **Application URL**: `aeromanten.com.ar`
- **Application startup file**: `app.js` (default de cPanel — **dejalo así**, no
  `server.js`; si no coincide con el nombre real del archivo, la app nunca arranca
  y el dominio muestra la página genérica "It works!" de LiteSpeed)

Guardá. Esto genera automáticamente un `.htaccess` en `public_html` con la config
de Passenger — no lo edites a mano.

## 4. Variables de entorno

Cargalas en la sección "Environment Variables" de la misma app:

```
DATABASE_URL=mysql://aeromant_admin:********@213.239.205.92:3306/aeromant_aero
AUTH_SECRET=<generar uno nuevo para producción>
NEXTAUTH_URL=https://aeromanten.com.ar
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM="Aeromanten <no-reply@aeromanten.com.ar>"
```

Generá un `AUTH_SECRET` distinto al de desarrollo:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Las variables de SMTP son opcionales al principio: sin ellas el registro y login
funcionan igual, solo que no se manda el email de verificación/recuperación.

## 5. Instalar y generar el cliente de Prisma

Desde la terminal de la app (botón que da cPanel, o `source
/home/aeromant/nodevenv/public_html/aeromanten/22/bin/activate && cd
/home/aeromant/public_html/aeromanten`):

```bash
npm install --include=dev
npx prisma generate
npx prisma db push
```

`--include=dev` es necesario porque el modo "Production" de la app hace que npm
salte las devDependencies por defecto, y varias (`@tailwindcss/postcss`,
`typescript`) hacen falta para el build.

## 6. Build

Esta cuenta de hosting tiene un límite bajo de threads/procesos simultáneos
(CloudLinux LVE), que hace fallar el build de varias formas si se corre tal cual.
Ya está resuelto en el código, pero si vuelve a pasar, esto es lo que se ajustó:

- `package.json` usa `"build": "next build --webpack"` (no Turbopack): Turbopack
  rechaza el symlink de `node_modules` que arma el venv de cPanel por apuntar
  "fuera de la raíz del proyecto".
- `next.config.ts` tiene `experimental.cpus: 1` para que Next arranque un solo
  worker en vez de varios (por defecto intenta usar todos los CPUs disponibles).
- El build en sí necesita correrse con los threads de V8 y de Rust (usados por
  Tailwind v4) limitados a 1, si no el proceso de Node directamente crashea:

```bash
RAYON_NUM_THREADS=1 NODE_OPTIONS="--v8-pool-size=1" npm run build
```

Un error de Prisma tipo `PANIC: timer has gone away` puede aparecer en medio del
build (durante el análisis de `/admin`) sin que el build falle — se puede ignorar
mientras el build termine y muestre la tabla de rutas al final.

## 7. Arrancar la app

`app.js` (en la raíz del proyecto) es el servidor custom que cPanel ejecuta:

```js
const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port);
});
```

Reiniciá la app desde **Setup Node.js App → Reiniciar**. Si después de reiniciar
seguís viendo "It works!" en el dominio, verificá:

1. Que `Archivo de inicio de la aplicación` diga exactamente `app.js` y que ese
   archivo exista en la raíz (`ls app.js`).
2. Que `/home/aeromant/public_html/.htaccess` tenga `PassengerStartupFile app.js`
   (no `server.js` ni otro nombre).
3. Que `node app.js` corrido a mano en la terminal levante sin errores (si
   funciona a mano pero no vía cPanel, el problema es la config de Passenger, no
   el código).

## 8. Primer usuario admin

1. Entrá a `https://aeromanten.com.ar/register` y creá una cuenta.
2. Conectate a la base MySQL (phpMyAdmin desde cPanel) y corré:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'tu-email@aeromanten.com.ar';
   ```
3. Iniciá sesión en `/login` y entrá a `/admin`.

## 9. Verificación

- `/`, `/servicios`, `/nosotros`, `/contacto` cargan sin sesión.
- `/admin` redirige a `/login` sin sesión, y a `/` si el usuario no es ADMIN.
- Como ADMIN: crear un propietario, agregarle una aeronave, agregarle un registro
  de mantenimiento.

## 10. Sincronizar actualizaciones desde GitHub

El código vive en [github.com/munditkd/AeroManten](https://github.com/munditkd/AeroManten).
Este hosting no tiene deploy automático desde GitHub, así que cada actualización
se trae a mano con **Git™ Version Control** de cPanel:

### La primera vez

En cPanel → **Git™ Version Control** → **Create**:

- **Clone URL**: `https://github.com/munditkd/AeroManten.git`
- **Repository Path**: `repositories/AeroManten` (separado de `public_html/aeromanten`,
  que es la carpeta que sirve la app y tiene `node_modules`/`.next`/`.env` que no
  están en git)

### Cada actualización

Desde la terminal de la app (`Setup Node.js App` → `aeromanten` → ícono de
terminal, o la Terminal general de cPanel):

1. Traer los últimos commits: en **Git Version Control → Manage → Pull or
   Deploy → Update from Remote** (o `cd ~/repositories/AeroManten && git pull`
   desde la terminal).
2. Copiar los archivos a la carpeta que sirve la app. Este hosting no tiene
   `rsync`, así que se usa `cp` — como el clon en `~/repositories/AeroManten`
   viene de git, ahí nunca van a existir `.env`, `node_modules` ni `.next`
   (están en `.gitignore`), por eso no hace falta excluirlos al copiar, solo
   borrar la carpeta `.git` que queda copiada de más:

   ```bash
   cd ~/public_html/aeromanten
   cp -a ~/repositories/AeroManten/. ./
   rm -rf ./.git
   ```

3. Reinstalar dependencias, regenerar Prisma y buildear (igual que en el
   despliegue inicial — pasos 5 y 6). **Es clave borrar `.next` antes de
   buildear**: si se rebuildea encima de un `.next` de una build anterior,
   quedan chunks/manifests mezclados y la app tira en producción errores
   tipo `Invariant: The client reference manifest for route "..." does not
   exist` (Internal Server Error en cualquier página):

   ```bash
   source /home/aeromant/nodevenv/public_html/aeromanten/22/bin/activate
   npm install --include=dev
   npx prisma generate
   npx prisma db push
   rm -rf .next
   RAYON_NUM_THREADS=1 NODE_OPTIONS="--v8-pool-size=1" npm run build
   ```

4. Reiniciar: **Setup Node.js App → aeromanten → Restart**.
