#!/bin/bash
# Actualiza aeromanten.com.ar con los ultimos cambios de GitHub.
# Correr desde la Terminal de cPanel (o "Setup Node.js App" -> aeromanten -> icono terminal).
# Basado en DEPLOY.md, seccion 10.

set -e

REPO_DIR="$HOME/repositories/AeroManten"
APP_DIR="$HOME/public_html/aeromanten"
NODEVENV="$HOME/nodevenv/public_html/aeromanten/22/bin/activate"

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
npx prisma generate
npx prisma db push --accept-data-loss

echo "== 6/6: Compilando (build limpio) =="
rm -rf .next
RAYON_NUM_THREADS=1 NODE_OPTIONS="--v8-pool-size=1" npm run build

echo ""
echo "Listo. Ahora reiniciá la app desde cPanel:"
echo "  Setup Node.js App -> aeromanten -> Restart"
