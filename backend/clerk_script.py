"""
Guion de evz_clerk para FVJ: qué se pregunta en cada etapa de la carga por
chat (/fvj/clerk/) y qué acción del backbone guarda las respuestas al
confirmar. Formato y reglas: evz_backbone/docs/clerk.md.

Etapas sobre una obra existente: avance (fotos y notas), compras de
material, gastos de la cuadrilla y cobros. Las compras, gastos y cobros
son lo que evz_sync suma en el reporte mensual a EVZ. La visita, la
cotización y el cierre llegan en las fases 4 y 5.
"""

# Las opciones se guardan por nombre; la acción las traduce a los métodos de
# evz_treasury (Pago móvil queda como «Otro»).
METODOS = ["Efectivo", "Transferencia", "Pago móvil", "Zelle", "Cripto (USDT)"]

SCRIPT = [
    {"id": "avance.fotos", "stage": "obra_avance",
     "prompt": "Mándame las fotos de hoy",
     "field": "task.photos", "type": "photos", "required": True},
    {"id": "avance.nota", "stage": "obra_avance",
     "prompt": "¿Qué se hizo hoy? Puedes escribirlo o mandar una nota de voz",
     "field": "task.note", "type": "text"},

    {"id": "compra.factura", "stage": "compra_material",
     "prompt": "Mándame la foto de la factura o la nota de entrega",
     "field": "purchase.photos", "type": "photos"},
    {"id": "compra.proveedor", "stage": "compra_material",
     "prompt": "¿Dónde compraste?",
     "field": "purchase.supplier", "type": "text", "required": True,
     "from_photo": "compra.factura"},
    {"id": "compra.partidas", "stage": "compra_material",
     "prompt": "¿Qué compraste? Cantidad, unidad y precio de cada cosa",
     "field": "purchase.items", "type": "line_items", "required": True,
     "from_photo": "compra.factura"},
    {"id": "compra.fecha", "stage": "compra_material",
     "prompt": "¿Cuándo fue la compra?",
     "field": "purchase.date", "type": "date"},
    {"id": "compra.recibido", "stage": "compra_material",
     "prompt": "¿El material ya está en la obra?",
     "field": "purchase.received", "type": "yes_no", "required": True},
    {"id": "compra.pagada", "stage": "compra_material",
     "prompt": "¿Ya está pagada?",
     "field": "purchase.paid", "type": "yes_no", "role": "owner"},
    {"id": "compra.metodo", "stage": "compra_material",
     "prompt": "¿Cómo se pagó?",
     "field": "purchase.method", "type": "choice", "options": METODOS,
     "role": "owner", "when": lambda r: r.get("compra.pagada") is True},

    {"id": "gasto.comprobante", "stage": "gasto",
     "prompt": "Mándame la foto del comprobante, si la tienes",
     "field": "expense.photos", "type": "photos"},
    {"id": "gasto.concepto", "stage": "gasto",
     "prompt": "¿En qué gastaste? (taxi, comida, herramienta…)",
     "field": "expense.concept", "type": "text", "required": True},
    {"id": "gasto.monto", "stage": "gasto",
     "prompt": "¿Cuánto fue?",
     "field": "expense.amount", "type": "money", "required": True,
     "from_photo": "gasto.comprobante"},
    {"id": "gasto.fecha", "stage": "gasto",
     "prompt": "¿Cuándo fue?",
     "field": "expense.date", "type": "date"},

    {"id": "cobro.monto", "stage": "cobro",
     "prompt": "¿Cuánto cobraste?",
     "field": "payment.amount", "type": "money", "required": True},
    {"id": "cobro.metodo", "stage": "cobro",
     "prompt": "¿Cómo pagó el cliente?",
     "field": "payment.method", "type": "choice", "options": METODOS, "required": True},
    {"id": "cobro.fecha", "stage": "cobro",
     "prompt": "¿Cuándo?",
     "field": "payment.date", "type": "date"},
    {"id": "cobro.comprobante", "stage": "cobro",
     "prompt": "Foto del comprobante, si la tienes",
     "field": "payment.photos", "type": "photos"},
]

STAGES = {
    "obra_avance": {
        "title": "Avance de obra",
        "action": "evz_clerk.actions.fieldwork.add_task_photos",
        # La cuadrilla puede cargarlo en sus obras asignadas; lo revisa un
        # dueño antes de que entre a la obra.
        "role": "crew",
        "object": "evz_fieldwork.Task",
        # Varias personas pueden sumar fotos a la misma obra a la vez.
        "exclusive": False,
    },
    "compra_material": {
        "title": "Compra de material",
        "action": "evz_clerk.actions.treasury.add_material_purchase",
        # Una MaterialPurchase por partida, ligada a la obra. Si la carga la
        # cuadrilla, el dueño la aprueba y el pago queda pendiente en
        # tesorería.
        "role": "crew",
        "object": "evz_fieldwork.Task",
        "exclusive": False,
    },
    "gasto": {
        "title": "Gasto por reembolsar",
        "action": "evz_clerk.actions.treasury.add_expense_claim",
        # Lo que alguien de la cuadrilla pagó de su bolsillo: al aprobarlo
        # queda listo para reembolsar en tesorería.
        "role": "crew",
        "object": "evz_fieldwork.Task",
        "exclusive": False,
    },
    "cobro": {
        "title": "Cobro",
        "action": "evz_clerk.actions.treasury.record_task_payment",
        # Abono o saldo de la orden de la obra. Solo dueños.
        "role": "owner",
        "object": "evz_fieldwork.Task",
    },
}
