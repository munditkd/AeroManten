# Motor de Prisma pre-descargado + db push manual (workaround)

## Por qué existe esto

En el hosting de producción, `npx prisma generate` / `npx prisma db push`
se quedaban colgados bajo carga (no era un firewall: soporte de Hostinger
confirmó, y confirmamos con `curl`, que la conexión saliente a
`binaries.prisma.sh` funciona bien). El problema real era la descarga en
caliente de los binarios de motor bajo los recursos limitados de este
hosting (CloudLinux LVE).

Se resolvió en dos partes distintas:

1. **`prisma generate`** (necesita el motor de consultas, `libquery-engine`):
   se pre-descargó el binario correcto desde una máquina sin esa
   restricción, se verificó contra su checksum SHA256 oficial, y se apunta
   a él con la variable `PRISMA_QUERY_ENGINE_LIBRARY`, que Prisma respeta
   para usar un binario "custom" sin intentar descargarlo. Esto **sí
   funciona** en el servidor.

2. **`prisma db push`** (necesita el `schema-engine`): incluso con el
   binario correcto pre-descargado y verificado, falla en este servidor con
   `Error: Could not parse schema engine response: Unexpected end of JSON
   input` — el proceso no llega a producir salida. No se identificó la
   causa exacta (podría ser CageFS bloqueando la ejecución de un binario
   fuera de las rutas manejadas por npm, alguna librería faltante, etc.).
   En vez de seguir insistiendo ahí, `db push` se corre **desde una máquina
   de desarrollo** apuntando directo a la base de producción (el puerto
   3306 de `213.239.205.92` es accesible desde afuera), y el servidor nunca
   necesita ejecutar schema-engine.

`deploy-update.sh` ya exporta `PRISMA_QUERY_ENGINE_LIBRARY` automáticamente
si encuentra el archivo en `$HOME/prisma-engines/`, y **ya no intenta
`db push`** como parte del deploy normal.

## Cuándo correr `db push` manualmente

Solo hace falta cuando `prisma/schema.prisma` cambia (nueva tabla, campo,
etc.) — no en cada deploy. Desde la máquina de desarrollo, en la carpeta
del proyecto:

```powershell
# PowerShell
$env:DATABASE_URL = "mysql://aeromant_admin:<password>@213.239.205.92:3306/aeromant_aero"
npx prisma db push --accept-data-loss
Remove-Item Env:\DATABASE_URL
```

```bash
# Git Bash
DATABASE_URL="mysql://aeromant_admin:<password>@213.239.205.92:3306/aeromant_aero" npx prisma db push --accept-data-loss
```

Esto aplica el schema directo a la base de producción real — revisar el
resumen de cambios que imprime antes de confirmar si alguna vez pide
`--accept-data-loss` de forma inesperada (una columna/tabla que no
debería perderse).

## Verificación de integridad del motor de consultas (ya hecha, para referencia)

El `libquery_engine-rhel-openssl-3.0.x.so.node` se obtuvo con el mecanismo
oficial de Prisma para pre-descargar motores de otra plataforma
(`binaryTargets` en `prisma/schema.prisma`), no con una URL armada a mano,
así que ya viene verificado por la propia herramienta al generarse
localmente. El target es `rhel-openssl-3.0.x` porque el hosting corre
AlmaLinux (familia RHEL) — Prisma no lo detecta solo (cae a "debian" por
defecto porque no puede leer `/etc/os-release` en este entorno).

El hash `e922089b7d7502aff4249d5da3420f6fa55fc6ad` corresponde a la versión
de Prisma usada en este proyecto (`prisma@6.19.3`).

## Cómo subirlo al servidor (una sola vez)

1. Subí `prisma-engines-rhel.zip` a `$HOME` (la carpeta home de la cuenta
   `aeromant`, **no** dentro de `public_html/aeromanten`) usando el
   Administrador de Archivos de cPanel.
2. Extraelo ahí mismo (botón derecho → Extract). Debe quedar:
   ```
   /home/aeromant/prisma-engines/libquery_engine-rhel-openssl-3.0.x.so.node
   ```
   (Si de un intento anterior quedó ahí un `schema-engine` o un
   `libquery_engine-debian-openssl-3.0.x.so.node`, se pueden borrar — ya no
   se usan.)
3. Listo — `deploy-update.sh` lo detecta solo en la próxima corrida.

## Si se actualiza la versión de Prisma más adelante

Este binario es específico de la versión `6.19.3`. Si en el futuro se
actualiza Prisma, hay que repetir el proceso para la nueva versión (avisen
y se regenera el paquete) — y volver a intentar si para esa versión
`db push` sí logra correr en el servidor, por si el problema era específico
de esta versión del schema-engine.
