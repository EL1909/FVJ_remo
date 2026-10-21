#!/usr/bin/env bash
#
# Despliega/actualiza FVJ Remodelaciones en esfuerzo1909-nginx-host-server.
#
# nginx sirve frontend/dist bajo /fvj/ y hace proxy de /fvj/api/,
# /fvj/admin/ y /fvj/clerk/ a 127.0.0.1:8003 (gunicorn-fvj.service). Sus
# bloques viven en deploy/nginx-fvj.conf.snippet; este script los copia a
# /etc/nginx/snippets/fvj.conf (incluido desde sites-available/esfuerzovz) y
# recarga nginx solo si cambiaron.
#
# Primer uso: clona el repo si la carpeta no existe todavía. Uso normal:
# hace git pull. Antes de correrlo la primera vez hace falta:
#   1. backend/.env ya creado a mano en el servidor (ver deploy/env.example)
#   2. La base de datos Postgres ya creada (ver deploy/README.md)
#   3. deploy/gunicorn-fvj.service copiado a /etc/systemd/system/ y habilitado
#   4. La línea `include /etc/nginx/snippets/fvj.conf;` en el server{} de
#      puerto 443 de /etc/nginx/sites-available/esfuerzovz

set -euo pipefail

PROJECT_DIR="/home/efrain19091/projects/fvj_remo"
APP_DIR="$PROJECT_DIR/fvj_remo"
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
pip install --upgrade -r requirements.txt

# Aun con --upgrade, pip a veces da por satisfecha una dependencia instalada
# desde git y no la reemplaza. Se compara la versión instalada con el tag de
# requirements.txt y, si no coinciden, se fuerza la reinstalación.
EVZ_REQ=$(grep -E '^evz-backbone(\[[^]]*\])? @' requirements.txt | tr -d '\r' | sed 's/[[:space:]]*$//')
EVZ_TAG=$(sed -E 's/.*@v?([0-9][0-9.]*)$/\1/' <<<"$EVZ_REQ")
evz_instalada() { python -c 'from importlib.metadata import version; print(version("evz-backbone"))'; }
if [ "$(evz_instalada)" != "$EVZ_TAG" ]; then
  echo "==> evz-backbone instalado $(evz_instalada), se esperaba $EVZ_TAG: reinstalando"
  pip install --force-reinstall --no-deps "$EVZ_REQ"
fi
if [ "$(evz_instalada)" != "$EVZ_TAG" ]; then
  echo "ERROR: evz-backbone quedó en $(evz_instalada), se esperaba $EVZ_TAG." >&2
  exit 1
fi
echo "==> evz-backbone $EVZ_TAG"

if [ ! -f ".env" ]; then
  echo "ERROR: falta $APP_DIR/backend/.env — crealo antes de seguir (ver deploy/env.example)." >&2
  exit 1
fi

echo "==> Backend: migraciones y estáticos"
python manage.py migrate
# Tablas de evz_showcase/evz_treasury cuyas migraciones el backbone reescribió
# después de aplicadas. Idempotente: en una base sana solo imprime "ok".
python manage.py repair_backbone_schema
python manage.py collectstatic --noinput

echo "==> Frontend: dependencias y build"
cd "$APP_DIR/frontend"
npm install
npm run build

echo "==> Reiniciar gunicorn"
sudo systemctl restart gunicorn-fvj.service

# Después de gunicorn: las rutas nuevas del snippet ya tienen a dónde ir.
# Si nginx -t no acepta el snippet nuevo se restaura el anterior y nginx
# sigue con la configuración que tenía.
NGINX_SNIPPET="/etc/nginx/snippets/fvj.conf"
if ! sudo cmp -s "$APP_DIR/deploy/nginx-fvj.conf.snippet" "$NGINX_SNIPPET"; then
  echo "==> nginx: actualizando $NGINX_SNIPPET"
  if sudo test -f "$NGINX_SNIPPET"; then
    sudo cp "$NGINX_SNIPPET" "$NGINX_SNIPPET.bak"
  fi
  sudo cp "$APP_DIR/deploy/nginx-fvj.conf.snippet" "$NGINX_SNIPPET"
  if sudo nginx -t; then
    sudo systemctl reload nginx
  else
    echo "ERROR: nginx -t rechazó el snippet nuevo; se restaura el anterior." >&2
    if sudo test -f "$NGINX_SNIPPET.bak"; then
      sudo cp "$NGINX_SNIPPET.bak" "$NGINX_SNIPPET"
    else
      sudo rm -f "$NGINX_SNIPPET"
    fi
    exit 1
  fi
else
  echo "==> nginx: sin cambios"
fi

echo "==> Listo."
