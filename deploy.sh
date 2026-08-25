#!/usr/bin/env bash
#
# Despliega/actualiza FVJ Remodelaciones en esfuerzo1909-nginx-host-server.
#
# nginx (sites-available/esfuerzovz) sirve frontend/dist bajo /fvj/ y hace
# proxy de /fvj/api/ y /fvj/admin/ a 127.0.0.1:8003 (gunicorn-fvj.service) —
# no necesita recargarse: solo lee los archivos que este script actualiza.
#
# Primer uso: clona el repo si la carpeta no existe todavía. Uso normal:
# hace git pull. Antes de correrlo la primera vez hace falta:
#   1. backend/.env ya creado a mano en el servidor (ver deploy/env.example)
#   2. La base de datos Postgres ya creada (ver deploy/README.md)
#   3. deploy/gunicorn-fvj.service copiado a /etc/systemd/system/ y habilitado
#   4. El bloque de deploy/nginx-fvj.conf.snippet ya agregado a
#      /etc/nginx/sites-available/esfuerzovz (y nginx recargado una vez)

set -euo pipefail

PROJECT_DIR="/home/efrain19091/projects/fvj_remodelaciones"
APP_DIR="$PROJECT_DIR/fvj_remodelaciones"
VENV="$PROJECT_DIR/venv"
REPO_URL="git@github.com:EL1909/FVJ_remo.git"

if [ ! -d "$APP_DIR" ]; then
  echo "==> Primer deploy: clonando repositorio"
  mkdir -p "$PROJECT_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "==> Actualizando código"
  cd "$APP_DIR"
  git pull
fi

if [ ! -d "$VENV" ]; then
  echo "==> Creando entorno virtual"
  python3 -m venv "$VENV"
fi

echo "==> Backend: dependencias"
cd "$APP_DIR/backend"
source "$VENV/bin/activate"
pip install -r requirements.txt

if [ ! -f ".env" ]; then
  echo "ERROR: falta $APP_DIR/backend/.env — crealo antes de seguir (ver deploy/env.example)." >&2
  exit 1
fi

echo "==> Backend: migraciones y estáticos"
python manage.py migrate
python manage.py collectstatic --noinput

echo "==> Frontend: dependencias y build"
cd "$APP_DIR/frontend"
npm install
npm run build

echo "==> Reiniciar gunicorn"
sudo systemctl restart gunicorn-fvj.service

echo "==> Listo."
