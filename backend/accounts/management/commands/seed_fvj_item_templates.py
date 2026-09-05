from django.core.management.base import BaseCommand

from evz_billing.models import QuotationItemTemplate

# Partidas de reforma de baños/cocinas que hasta ahora vivían hardcodeadas
# en ITEM_PRESETS del frontend de FVJ. Vive aquí (accounts, el app propio
# de este negocio) y no en evz_backbone: QuotationItemTemplate es un
# modelo genérico compartido con otros negocios, pero este catálogo de
# datos es específico de FVJ Remodelaciones.
PRESETS = [
    {
        'category': 'Demolición y Desescombro',
        'description': 'Retirada de bañera/ducha antigua, picado de alicatado existente y transporte a vertedero.',
        'unit': 'global',
        'unit_cost': 550,
        'unit_price': 820,
        'kind': 'baño',
    },
    {
        'category': 'Plato de Ducha y Mampara',
        'description': 'Plato de ducha resina extraplano textura pizarra con tratamiento antideslizante C3 + Mampara vidrio templado 8mm.',
        'unit': 'ud',
        'unit_cost': 650,
        'unit_price': 980,
        'kind': 'baño',
    },
    {
        'category': 'Alicatado Porcelánico',
        'description': 'Suministro y colocación de azulejo porcelánico 120x60 cm rectificado con cemento cola flexible C2TE.',
        'unit': 'm²',
        'unit_cost': 32,
        'unit_price': 52,
        'kind': 'baño',
    },
    {
        'category': 'Grifería y Sanitario Empotrado',
        'description': 'Conjunto termostático empotrado negro mate / oro cepillado e inodoro suspendido con cisterna oculta.',
        'unit': 'ud',
        'unit_cost': 720,
        'unit_price': 1100,
        'kind': 'baño',
    },
    {
        'category': 'Demolición y Tabiquería',
        'description': 'Apertura de hueco para cocina americana, demolición de tabique no portante y remates en yeso.',
        'unit': 'global',
        'unit_cost': 850,
        'unit_price': 1250,
        'kind': 'cocina',
    },
    {
        'category': 'Mobiliario de Cocina',
        'description': 'Muebles de cocina a medida laminado antihuellas gola integrada, bisagras con freno amortiguado Blum.',
        'unit': 'm.l.',
        'unit_cost': 620,
        'unit_price': 890,
        'kind': 'cocina',
    },
    {
        'category': 'Encimera Porcelánica / Cuarzo',
        'description': 'Encimera tipo Calacatta Oro 20mm con faldón, escurridor tallado en piedra y encastre bajo encimera.',
        'unit': 'm.l.',
        'unit_cost': 380,
        'unit_price': 560,
        'kind': 'cocina',
    },
    {
        'category': 'Fontanería y Fregadero',
        'description': 'Red multicapa completa para fregadero y lavavajillas + Fregadero bajo encimera y grifo monomando extraíble.',
        'unit': 'global',
        'unit_cost': 580,
        'unit_price': 890,
        'kind': 'cocina',
    },
]


class Command(BaseCommand):
    """
    Carga como catálogo real las partidas de reforma que antes vivían
    hardcodeadas en el frontend de FVJ (ITEM_PRESETS en EstimatesView.tsx).

    Idempotente por (category, description): correrlo varias veces no
    duplica filas, solo crea las que falten.
    """

    help = "Siembra el catálogo de partidas de baño/cocina específico de FVJ Remodelaciones."

    def handle(self, *args, **options):
        creadas = 0
        existentes = 0
        for preset in PRESETS:
            _, created = QuotationItemTemplate.objects.get_or_create(
                category=preset['category'],
                description=preset['description'],
                defaults={
                    'unit': preset['unit'],
                    'unit_cost': preset['unit_cost'],
                    'unit_price': preset['unit_price'],
                    'kind': preset['kind'],
                    'is_active': True,
                },
            )
            if created:
                creadas += 1
            else:
                existentes += 1

        self.stdout.write(self.style.SUCCESS(
            f"Listo: {creadas} partida(s) creada(s), {existentes} ya existían."
        ))
