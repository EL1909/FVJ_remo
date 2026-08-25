# Deploy de FVJ Remodelaciones a esfuerzo1909-nginx-host-server

Mismo patrón que MCnails en esta misma VM: un `deploy.sh` que clona/actualiza,
un gunicorn propio por systemd, y un bloque de nginx bajo `/fvj/` en el mismo
`sites-available/esfuerzovz` que ya sirve esfuerzovz y MCnails.

Puerto asignado a FVJ: **8003** (MCnails ya usa 8002, esfuerzovz usa 8001).
Antes de seguir, confirmá que está libre:

```bash
sudo ss -tlnp | grep 8003   # no debería devolver nada
```

## Pasos, una sola vez

### 1. SSH deploy key para este repo

El deploy key de la VM ya puede clonar `evz_backbone` (lo usan MCnails y
esfuerzovz). Falta agregarlo como deploy key de **este** repo también:
GitHub → `EL1909/FVJ_remo` → Settings → Deploy keys → Add. Probalo con:

```bash
ssh -T git@github.com
```

### 2. Base de datos Postgres

```bash
sudo -u postgres psql -c "CREATE DATABASE fvj_remo;"
sudo -u postgres psql -c "CREATE USER fvj_admin WITH PASSWORD 'ELEGIR_UNA';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fvj_remo TO fvj_admin;"
sudo -u postgres psql -d fvj_remo -c "GRANT ALL ON SCHEMA public TO fvj_admin;"
```

### 3. Primer deploy (clona, instala, migra, build)

```bash
curl -o /tmp/deploy.sh https://raw.githubusercontent.com/EL1909/FVJ_remo/main/deploy.sh
# o simplemente pegá el contenido de deploy.sh a mano la primera vez,
# porque backend/.env todavía no existe (paso 4) y el script se corta ahí.
bash /tmp/deploy.sh   # va a fallar en "falta backend/.env" — es esperado
```

### 4. `backend/.env` en el servidor

```bash
cd /home/efrain19091/projects/fvj_remo/fvj_remo/backend
cp .env.example .env
nano .env
```

Completar como mínimo: `SECRET_KEY` (generar uno nuevo, no reusar el de
local), `DEBUG=False`, `DATABASE_URL=postgres://fvj_admin:ELEGIDA@localhost:5432/fvj_remo`,
`EVZ_API_TOKEN` (el mismo que ya está en el `.env` local), y opcionalmente
`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` (par nuevo, generado en el servidor —
no reutilizar el par de desarrollo).

### 5. Correr el deploy de verdad

```bash
bash /home/efrain19091/projects/fvj_remo/fvj_remo/deploy.sh
```

Esta vez llega hasta el final salvo por el último paso (gunicorn), que
todavía no existe — sigue en el paso 6.

### 6. Servicio systemd

```bash
sudo cp /home/efrain19091/projects/fvj_remo/fvj_remo/deploy/gunicorn-fvj.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gunicorn-fvj.service
sudo systemctl status gunicorn-fvj.service   # debe decir "active (running)"
```

### 7. Bloque de nginx

Pegar el contenido de `deploy/nginx-fvj.conf.snippet` dentro del `server{}`
de puerto 443 en `/etc/nginx/sites-available/esfuerzovz` — mismo lugar y
estilo que los bloques de "MCnails" ya existentes.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 8. Verificar

```bash
curl -I https://esfuerzovz.com/fvj/
curl -I https://esfuerzovz.com/fvj/api/business/
curl -I https://esfuerzovz.com/fvj/admin/
```

## Deploys siguientes

Solo:

```bash
bash /home/efrain19091/projects/fvj_remo/fvj_remo/deploy.sh
```

Hace `git pull`, migra, junta estáticos, reconstruye el frontend, y
reinicia gunicorn. nginx no necesita tocarse — solo lee los archivos que el
script actualiza.
