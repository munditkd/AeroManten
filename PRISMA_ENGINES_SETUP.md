# Motores de Prisma pre-descargados (workaround de firewall)

## Por qué existe esto

En el hosting de producción, `npx prisma generate` / `npx prisma db push`
se quedaban colgados para siempre (sin error) justo después de leer el
schema. Con `DEBUG=*` se vio que el paso siguiente era descargar los
binarios `schema-engine` y `libquery-engine` desde `binaries.prisma.sh`, y
soporte de Hostinger confirmó que ese hosting tiene un firewall saliente.

En vez de depender de que desbloqueen ese dominio, se descargaron los
binarios correctos para el servidor (AlmaLinux/CloudLinux, target de Prisma
`debian-openssl-3.0.x`) desde una máquina sin esa restricción, se
verificaron contra el checksum SHA256 oficial publicado por Prisma, y se
apunta a ellos directamente con variables de entorno que Prisma respeta
para usar binarios "custom" sin intentar descargarlos:

- `PRISMA_SCHEMA_ENGINE_BINARY` → binario ejecutable del schema-engine
- `PRISMA_QUERY_ENGINE_LIBRARY` → librería del motor de consultas

`deploy-update.sh` ya exporta estas variables automáticamente si
encuentra los archivos en `$HOME/prisma-engines/`.

## Verificación de integridad (ya hecha, para referencia)

```
schema-engine (descomprimido):
  6a516632d085842ec5a31a6a9e81f39feea3963ec4574f54f62886e4403f6b53

Fuente: https://binaries.prisma.sh/all_commits/e922089b7d7502aff4249d5da3420f6fa55fc6ad/debian-openssl-3.0.x/schema-engine.gz
Checksum oficial: https://binaries.prisma.sh/all_commits/e922089b7d7502aff4249d5da3420f6fa55fc6ad/debian-openssl-3.0.x/schema-engine.sha256
```

El hash `e922089b7d7502aff4249d5da3420f6fa55fc6ad` corresponde a la versión
de Prisma usada en este proyecto (`prisma@6.19.3`). El `libquery_engine`
se obtuvo con el mecanismo oficial de Prisma para pre-descargar motores de
otra plataforma (`binaryTargets` en `prisma/schema.prisma`), no con una URL
armada a mano, así que ya viene verificado por la propia herramienta.

## Cómo subirlos al servidor (una sola vez)

1. Subí `prisma-engines-debian.zip` a `$HOME` (la carpeta home de la
   cuenta `aeromant`, **no** dentro de `public_html/aeromanten`) usando el
   Administrador de Archivos de cPanel.
2. Extraelo ahí mismo (botón derecho → Extract). Debe quedar:
   ```
   /home/aeromant/prisma-engines/schema-engine
   /home/aeromant/prisma-engines/libquery_engine-debian-openssl-3.0.x.so.node
   ```
3. Listo — `deploy-update.sh` los detecta solo en la próxima corrida. No
   hace falta tocar nada más; si el firewall algún día se destraba, alcanza
   con borrar la carpeta `~/prisma-engines` para volver a la descarga
   normal.

## Si se actualiza la versión de Prisma más adelante

Estos binarios son específicos de la versión `6.19.3`. Si en el futuro se
actualiza Prisma, hay que repetir el proceso para la nueva versión (avisen
y se regenera el paquete).
