#!/bin/bash
# Actualiza aeromanten.com.ar con los ultimos cambios de GitHub.
# Correr desde la Terminal de cPanel (o "Setup Node.js App" -> aeromanten -> icono terminal).
# Basado en DEPLOY.md, seccion 10.

set -e

REPO_DIR="$HOME/repositories/AeroManten"
APP_DIR="$HOME/public_html/aeromanten"
NODEVENV="$HOME/nodevenv/public_html/aeromanten/22/bin/activate"

# Esta cuenta de hosting (CloudLinux LVE) tiene un limite bajo de threads
# simultaneos, que hace "panicar" a los binarios en Rust (schema-engine de
# Prisma, motor de Tailwind v4, SWC) si intentan usar varios. Se limita todo
# a 1 thread para toda la sesion, no solo para el build.
export RAYON_NUM_THREADS=1
export NODE_OPTIONS="--v8-pool-size=1"

# Prisma hace un ping de telemetria/chequeo de actualizacion a un servidor
# externo en cada comando. Si el hosting bloquea/filtra esa conexion saliente
# sin rechazarla (en vez de cortarla), el comando se queda esperando esa
# respuesta para siempre. Esto lo desactiva.
export CHECKPOINT_DISABLE=1

# La descarga en caliente de los motores de Prisma (schema-engine y
# libquery-engine) desde binaries.prisma.sh no funciona bien en este hosting
# (se cuelga bajo carga). Se usa el motor de consultas ya descargado a mano
# (verificado con su sha256 oficial) que esta en $HOME/prisma-engines para
# que "prisma generate" no necesite red. schema-engine tambien esta ahi pero
# YA NO SE USA en el servidor (ver mas abajo, paso 5/6): ese binario no logra
# ejecutarse en este entorno (CloudLinux/AlmaLinux) por una razon que no
# terminamos de identificar, asi que "prisma db push" se corre a mano desde
# una maquina de desarrollo apuntando a la base de produccion, no aca.
# Ver PRISMA_ENGINES_SETUP.md para el detalle completo.
ENGINES_DIR="$HOME/prisma-engines"
if [ -f "$ENGINES_DIR/libquery_engine-rhel-openssl-3.0.x.so.node" ]; then
  export PRISMA_QUERY_ENGINE_LIBRARY="$ENGINES_DIR/libquery_engine-rhel-openssl-3.0.x.so.node"
fi

# Reintenta un comando hasta 3 veces (con pausa) porque estos cuelgues/panics
# suelen ser intermitentes en este hosting. Cada intento tiene un limite de
# tiempo (primer argumento, en segundos): si se cuelga en vez de fallar, se
# lo mata con SIGKILL (no se puede ignorar) en vez de esperar para siempre.
run_with_retry() {
  local timeout_seg="$1"
  shift
  local intentos=3
  local espera=10
  local intento=1
  until timeout -s KILL "$timeout_seg" "$@"; do
    local codigo=$?
    if [ "$codigo" -eq 137 ]; then
      echo "Se colgó (más de ${timeout_seg}s sin terminar, lo maté): $*"
    fi
    if [ "$intento" -ge "$intentos" ]; then
      echo "Fallo tras $intentos intentos: $*"
      return 1
    fi
    echo "Fallo (intento $intento/$intentos), reintentando en ${espera}s..."
    intento=$((intento + 1))
    sleep "$espera"
  done
}

# Igual que run_with_retry, pero ademas graba un log detallado (DEBUG=*) de
# Prisma y, si falla, muestra las ultimas lineas automaticamente. Asi, si se
# vuelve a colgar, ya tenemos el diagnostico sin correr nada a mano de nuevo.
run_prisma_with_retry() {
  local timeout_seg="$1"
  local logfile="$2"
  shift 2
  local intentos=3
  local espera=10
  local intento=1
  until DEBUG="prisma:fetch-engine:env,prisma:engines,prisma:cli:*" timeout -s KILL "$timeout_seg" "$@" >"$logfile" 2>&1; do
    local codigo=$?
    echo "--- últimas líneas de $logfile (para diagnóstico) ---"
    tail -30 "$logfile" || true
    echo "-----------------------------------------------------"
    if [ "$codigo" -eq 137 ]; then
      echo "Se colgó (más de ${timeout_seg}s sin terminar, lo maté): $*"
    fi
    if [ "$intento" -ge "$intentos" ]; then
      echo "Fallo tras $intentos intentos: $*"
      return 1
    fi
    echo "Fallo (intento $intento/$intentos), reintentando en ${espera}s..."
    intento=$((intento + 1))
    sleep "$espera"
  done
}

echo "== 1/6: Trayendo los ultimos cambios de GitHub =="
cd "$REPO_DIR"
git pull

echo "== 2/6: Copiando archivos a $APP_DIR =="
cd "$APP_DIR"
cp -a "$REPO_DIR"/. ./
rm -rf ./.git

echo "== 3/6: Activando el entorno de Node =="
source "$NODEVENV"

echo "== 4/6: Instalando dependencias =="
npm install --include=dev

# npm install es pesado (cientos de paquetes) en un hosting con recursos muy
# limitados. Le damos un respiro antes de que Prisma necesite esos mismos
# recursos, para no chocar con la carga residual del paso anterior.
echo "Esperando 15s a que se asiente el sistema..."
sleep 15

echo "== 5/6: Generando cliente de Prisma =="
# OJO: aca NO se corre "prisma db push". El schema-engine no logra ejecutarse
# en este servidor (falla con "Unexpected end of JSON input" sin mas
# detalle), asi que sincronizar la base con cambios de schema.prisma se hace
# a mano, una sola vez por cambio, desde una maquina de desarrollo:
#   DATABASE_URL="<url de produccion>" npx prisma db push --accept-data-loss
# Este paso 5/6 solo genera el cliente (@prisma/client), que el build
# necesita y que SI funciona bien aca con el motor pre-descargado.
run_prisma_with_retry 180 /tmp/prisma-generate.log npx prisma generate

echo "== 6/6: Compilando (build limpio) =="
rm -rf .next
run_with_retry 600 npm run build

echo ""
echo "Listo. Ahora reiniciá la app desde cPanel:"
echo "  Setup Node.js App -> aeromanten -> Restart"
