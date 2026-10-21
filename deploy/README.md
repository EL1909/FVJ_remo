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

## Subida a backbone v1.8.0 + evz_clerk (una vez)

FVJ pasa de backbone `v1.3.0` a `v1.8.0`, con migraciones de varias
versiones y la app `evz_clerk` (carga por chat en `/fvj/clerk/`).

1. **Respaldo**, por si hay que volver atrás:

   ```bash
   cd /home/efrain19091/projects/fvj_remo/fvj_remo && git rev-parse HEAD   # anotarlo
   sudo -u postgres pg_dump -Fc fvj_remo > ~/fvj_remo-$(date +%F).dump
   ```

2. **nginx:** agregar los bloques nuevos de `deploy/nginx-fvj.conf.snippet`
   (`/fvj/clerk/`, `/fvj/api/clerk/` y el `deny` de `private/`), cada uno
   antes del bloque más general que lo cubriría, y `sudo nginx -t && sudo
   systemctl reload nginx`.
3. **`backend/.env`:** `GEMINI_API_KEY` y `EVZ_CLERK_AI_MODEL` (ver
   `.env.example`). Sin `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` no hay push
   de los avisos, solo la campana.
4. **Deploy:** `bash deploy.sh`.
5. **Comprobar:**

   ```bash
   cd backend && source ../../venv/bin/activate
   python manage.py clerk_ai_check            # key y modelo de Gemini
   curl -I https://esfuerzovz.com/fvj/clerk/  # 200, servido por Django
   ```

   Una URL directa a un archivo `.../media/clerk/private/...` tiene que dar
   403.
6. **Cron diario** (`crontab -e`): abandona cargas de más de 15 días y borra
   sus archivos de preparación.

   ```
   30 3 * * * cd /home/efrain19091/projects/fvj_remo/fvj_remo/backend && ../../venv/bin/python manage.py clerk_maintenance >> ../../clerk_maintenance.log 2>&1
   ```

**Volver atrás:** revertir el commit en `main` desde local (`git revert`) y
hacer push, porque `deploy.sh` hace `git pull` y no sirve un `checkout` suelto.
En la VM: `sudo systemctl stop gunicorn-fvj.service`, restaurar el respaldo
(`sudo -u postgres pg_restore --clean -d fvj_remo ~/fvj_remo-<fecha>.dump`)
y `bash deploy.sh`.
