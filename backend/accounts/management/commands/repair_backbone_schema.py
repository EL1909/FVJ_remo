from django.apps import apps
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.db import connection

# evz_backbone 13e4368 (antes de v1.2.1) reescribió en el lugar migraciones
# ya aplicadas: el FK `task` a evz_fieldwork.Task pasó a GenericForeignKey.
# Una base que corrió las versiones viejas las tiene marcadas como aplicadas
# pero conserva task_id y le faltan las columnas nuevas (500 en
# /api/showcase/projects/: no such column source_content_type_id).
#
# Idempotente: si la tabla ya está bien, no hace nada. Lo corre deploy.sh
# después de migrate. Los task_id existentes pasan a las columnas genéricas
# apuntando a evz_fieldwork.Task antes de borrar la columna vieja.
TABLES = [
    # (modelo, campo ContentType, campo id del objeto)
    ('evz_showcase.SocialPost', 'source_content_type', 'source_object_id'),
    ('evz_showcase.WebsiteProject', 'source_content_type', 'source_object_id'),
    ('evz_treasury.MaterialPurchase', 'task_content_type', 'task_object_id'),
    ('evz_treasury.ExpenseClaim', 'task_content_type', 'task_object_id'),
]


class Command(BaseCommand):
    help = 'Repara tablas de evz_backbone con migraciones reescritas en el lugar (task_id → GenericForeignKey).'

    def handle(self, *args, **options):
        task_ct = ContentType.objects.get_for_model(apps.get_model('evz_fieldwork', 'Task'))
        q = connection.ops.quote_name

        for label, ct_name, oid_name in TABLES:
            model = apps.get_model(label)
            table = model._meta.db_table
            ct_field = model._meta.get_field(ct_name)
            oid_field = model._meta.get_field(oid_name)

            with connection.cursor() as cursor:
                columns = {c.name for c in connection.introspection.get_table_description(cursor, table)}
            if ct_field.column in columns and 'task_id' not in columns:
                self.stdout.write(f'{table}: ok')
                continue

            # schema_editor ya es atómico (en SQLite y en Postgres).
            with connection.schema_editor() as editor:
                if ct_field.column not in columns:
                    editor.add_field(model, ct_field)
                if oid_field.column not in columns:
                    editor.add_field(model, oid_field)
                if 'task_id' in columns:
                    editor.execute(
                        f'UPDATE {q(table)} SET {q(ct_field.column)} = %s, {q(oid_field.column)} = task_id '
                        f'WHERE task_id IS NOT NULL',
                        [task_ct.pk],
                    )
                    if connection.vendor == 'sqlite':
                        # SQLite no borra una columna con FK: se rehace la
                        # tabla a partir del modelo, que ya no tiene task_id.
                        editor._remake_table(model)
                    else:
                        editor.execute(f'ALTER TABLE {q(table)} DROP COLUMN task_id')
            self.stdout.write(self.style.SUCCESS(f'{table}: reparada'))
