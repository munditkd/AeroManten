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

# Reintenta un comando hasta 3 veces (con pausa) porque estos "panics" por
# limite de threads suelen ser intermitentes en este hosting. Cada intento
# tiene un limite de tiempo (primer argumento, en segundos): si el comando
# se cuelga en vez de fallar, se lo corta solo en vez de esperar para siempre.
run_with_retry() {
  local timeout_seg="$1"
  shift
  local intentos=3
  local espera=5
  local intento=1
  until timeout "$timeout_seg" "$@"; do
    local codigo=$?
    if [ "$codigo" -eq 124 ]; then
      echo "Se colgó (más de ${timeout_seg}s sin terminar): $*"
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

echo "== 5/6: Generando cliente de Prisma y sincronizando la base =="
run_with_retry 90 npx prisma generate
run_with_retry 90 npx prisma db push --accept-data-loss

echo "== 6/6: Compilando (build limpio) =="
rm -rf .next
run_with_retry 600 npm run build

echo ""
echo "Listo. Ahora reiniciá la app desde cPanel:"
echo "  Setup Node.js App -> aeromanten -> Restart"
