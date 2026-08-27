import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Bath,
  CookingPot,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  Edit3,
  DollarSign,
  TrendingUp,
  X,
  FileCheck,
  Building2,
  Download,
  Mail,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Estimate, EstimateItem, Client, ProjectType } from '../../types';
import { NewEstimateInput } from '../../lib/billing';
import { ApiError } from '../../lib/api';
import { NotesThread } from '../shared/NotesThread';

// Precarga del generador desde otro módulo (ej. "Convertir a Presupuesto"
// de una visita en Agenda) — datos de cliente + el id real de la cita, que
// sí queda vinculado en el backend (Quotation.appointment) para poder
// copiar sus fotos como "antes" al crear la Orden de Trabajo.
export interface EstimatePrefill {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress: string;
  appointmentId?: string;
}

interface EstimatesViewProps {
  estimates: Estimate[];
  clients: Client[];
  onSaveEstimate: (estimate: NewEstimateInput) => Promise<void>;
  onUpdateEstimate: (id: string, estimate: NewEstimateInput) => Promise<void>;
  onUpdateEstimateStatus: (id: string, status: Estimate['status']) => Promise<void>;
  onConvertToWorkOrder: (estimate: Estimate) => Promise<void>;
  prefill?: EstimatePrefill | null;
  onPrefillConsumed?: () => void;
  onConvertToInvoice: (estimate: Estimate) => Promise<void>;
  onAddEstimateNote: (id: string, text: string) => Promise<void>;
  // Llega desde el bell de notificaciones ("nuevo presupuesto creado"): abre
  // la vista de ese presupuesto puntual entre todo lo demás que haya.
  focusEstimateId?: string | null;
  onFocusEstimateConsumed?: () => void;
}

// Preset template items to quickly populate bathroom & kitchen quotes
const ITEM_PRESETS: { category: string; description: string; unit: 'm²' | 'm.l.' | 'ud' | 'global' | 'horas'; unitCost: number; unitPrice: number; projectType: ProjectType }[] = [
  // Baño presets
  {
    category: 'Demolición y Desescombro',
    description: 'Retirada de bañera/ducha antigua, picado de alicatado existente y transporte a vertedero.',
    unit: 'global',
    unitCost: 550,
    unitPrice: 820,
    projectType: 'baño',
  },
  {
    category: 'Plato de Ducha y Mampara',
    description: 'Plato de ducha resina extraplano textura pizarra con tratamiento antideslizante C3 + Mampara vidrio templado 8mm.',
    unit: 'ud',
    unitCost: 650,
    unitPrice: 980,
    projectType: 'baño',
  },
  {
    category: 'Alicatado Porcelánico',
    description: 'Suministro y colocación de azulejo porcelánico 120x60 cm rectificado con cemento cola flexible C2TE.',
    unit: 'm²',
    unitCost: 32,
    unitPrice: 52,
    projectType: 'baño',
  },
  {
    category: 'Grifería y Sanitario Empotrado',
    description: 'Conjunto termostático empotrado negro mate / oro cepillado e inodoro suspendido con cisterna oculta.',
    unit: 'ud',
    unitCost: 720,
    unitPrice: 1100,
    projectType: 'baño',
  },

  // Cocina presets
  {
    category: 'Demolición y Tabiquería',
    description: 'Apertura de hueco para cocina americana, demolición de tabique no portante y remates en yeso.',
    unit: 'global',
    unitCost: 850,
    unitPrice: 1250,
    projectType: 'cocina',
  },
  {
    category: 'Mobiliario de Cocina',
    description: 'Muebles de cocina a medida laminado antihuellas gola integrada, bisagras con freno amortiguado Blum.',
    unit: 'm.l.',
    unitCost: 620,
    unitPrice: 890,
    projectType: 'cocina',
  },
  {
    category: 'Encimera Porcelánica / Cuarzo',
    description: 'Encimera tipo Calacatta Oro 20mm con faldón, escurridor tallado en piedra y encastre bajo encimera.',
    unit: 'm.l.',
    unitCost: 380,
    unitPrice: 560,
    projectType: 'cocina',
  },
  {
    category: 'Fontanería y Fregadero',
    description: 'Red multicapa completa para fregadero y lavavajillas + Fregadero bajo encimera y grifo monomando extraíble.',
    unit: 'global',
    unitCost: 580,
    unitPrice: 890,
    projectType: 'cocina',
  },
];

export const EstimatesView: React.FC<EstimatesViewProps> = ({
  estimates,
  clients,
  onSaveEstimate,
  onUpdateEstimate,
  onUpdateEstimateStatus,
  onConvertToWorkOrder,
  onConvertToInvoice,
  onAddEstimateNote,
  prefill,
  onPrefillConsumed,
  focusEstimateId,
  onFocusEstimateConsumed,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [printEstimate, setPrintEstimate] = useState<Estimate | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  // null = creando uno nuevo; con valor = editando ese presupuesto (solo
  // posible en borrador, ver onUpdateEstimate).
  const [editingEstimateId, setEditingEstimateId] = useState<string | null>(null);
  // Viene de "Convertir a Presupuesto" (prefill) — solo aplica al crear.
  const [sourceAppointmentId, setSourceAppointmentId] = useState<string | undefined>(undefined);

  // Form State for new estimate — el cliente se escribe como "Customer" en
  // texto libre (customer_name/phone/address del backend); vincular a un
  // Client real del CRM es opcional, solo para trazabilidad.
  const [linkedClientId, setLinkedClientId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('cocina');
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<EstimateItem[]>([
    {
      id: 'item-1',
      category: 'Demolición y Fontanería',
      description: 'Retirada de elementos antiguos, picado y adaptación de tuberías.',
      unit: 'global',
      quantity: 1,
      unitCost: 600,
      unitPrice: 950,
      totalPrice: 950,
    },
  ]);
  const [taxRate, setTaxRate] = useState<number>(21);
  // Primera entrada del hilo de notas internas (opcional) — no aparece en
  // el documento impreso, ver NotesThread para el resto del hilo.
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('30% a la firma del contrato, 40% a la llegada de los materiales, 30% a la finalización.');

  // Calculation helpers
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const estimatedCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  const estimatedMargin = subtotal > 0 ? ((subtotal - estimatedCost) / subtotal) * 100 : 0;

  const handleAddItem = (preset?: typeof ITEM_PRESETS[0]) => {
    const newItem: EstimateItem = preset
      ? {
          id: `item-${Date.now()}-${Math.random()}`,
          category: preset.category,
          description: preset.description,
          unit: preset.unit,
          quantity: 1,
          unitCost: preset.unitCost,
          unitPrice: preset.unitPrice,
          totalPrice: preset.unitPrice,
        }
      : {
          id: `item-${Date.now()}`,
          category: 'Partida de Obra',
          description: 'Nueva descripción de trabajo o suministro',
          unit: 'ud',
          quantity: 1,
          unitCost: 100,
          unitPrice: 150,
          totalPrice: 150,
        };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof EstimateItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.totalPrice = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const [builderError, setBuilderError] = useState<string | null>(null);
  const [isSavingEstimate, setIsSavingEstimate] = useState(false);

  const handlePickExistingClient = (id: string) => {
    setLinkedClientId(id);
    const c = clients.find((cl) => cl.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      setCustomerEmail(c.email);
      setCustomerAddress(`${c.address}, ${c.city}`);
    }
  };

  const resetBuilderForm = () => {
    setEditingEstimateId(null);
    setLinkedClientId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setProjectType('cocina');
    setTitle('');
    setItems([
      {
        id: 'item-1',
        category: 'Demolición y Fontanería',
        description: 'Retirada de elementos antiguos, picado y adaptación de tuberías.',
        unit: 'global',
        quantity: 1,
        unitCost: 600,
        unitPrice: 950,
        totalPrice: 950,
      },
    ]);
    setTaxRate(21);
    setNotes('');
    setTerms('30% a la firma del contrato, 40% a la llegada de los materiales, 30% a la finalización.');
    setSourceAppointmentId(undefined);
    setBuilderError(null);
  };

  const handleOpenNewEstimate = () => {
    resetBuilderForm();
    setIsBuilderOpen(true);
  };

  // Llega precargado desde otro módulo (ej. "Convertir a Presupuesto" de una
  // visita en Agenda) — abre el generador ya con los datos del cliente, y
  // guarda el id de la cita para vincularla al crear (habilita copiar sus
  // fotos como "antes" a la Orden de Trabajo más adelante).
  useEffect(() => {
    if (!prefill) return;
    resetBuilderForm();
    setCustomerName(prefill.clientName);
    setCustomerPhone(prefill.clientPhone);
    setCustomerEmail(prefill.clientEmail || '');
    setCustomerAddress(prefill.clientAddress);
    setSourceAppointmentId(prefill.appointmentId);
    setIsBuilderOpen(true);
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  // Viene del bell de notificaciones ("nuevo presupuesto creado") — abre su
  // vista/impresión entre todo lo demás que haya en el listado.
  useEffect(() => {
    if (!focusEstimateId) return;
    const target = estimates.find((e) => e.id === focusEstimateId);
    if (target) {
      setStatusFilter('all');
      setSearch('');
      setPrintEstimate(target);
      setHighlightedId(focusEstimateId);
      document.getElementById(`estimate-${focusEstimateId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => setHighlightedId(null), 3000);
    }
    onFocusEstimateConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusEstimateId, estimates]);

  const handleOpenEditEstimate = (est: Estimate) => {
    setEditingEstimateId(est.id);
    setLinkedClientId(est.clientId);
    setCustomerName(est.clientName);
    setCustomerPhone(est.clientPhone);
    setCustomerEmail(est.clientEmail || '');
    setCustomerAddress(est.clientAddress);
    setProjectType(est.projectType);
    setTitle(est.title);
    setItems(est.items);
    setTaxRate(est.taxRate);
    setNotes('');
    setTerms(est.terms || '');
    setBuilderError(null);
    setIsBuilderOpen(true);
  };

  const handleCreateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    setBuilderError(null);
    setIsSavingEstimate(true);
    try {
      const input: NewEstimateInput = {
        clientId: linkedClientId,
        clientName: customerName.trim(),
        clientPhone: customerPhone.trim(),
        clientEmail: customerEmail.trim(),
        clientAddress: customerAddress.trim(),
        projectType,
        title: title || `Presupuesto Reforma ${projectType.toUpperCase()} - ${customerName.trim()}`,
        items: items.map(({ category, description, unit, quantity, unitCost, unitPrice }) => ({
          category, description, unit, quantity, unitCost, unitPrice,
        })),
        taxRate,
        notes,
        terms,
      };

      if (editingEstimateId) {
        await onUpdateEstimate(editingEstimateId, input);
      } else {
        await onSaveEstimate({ ...input, appointmentId: sourceAppointmentId });
      }
      setIsBuilderOpen(false);
    } catch (err) {
      setBuilderError(err instanceof ApiError ? err.message : 'No se pudo guardar el presupuesto.');
    } finally {
      setIsSavingEstimate(false);
    }
  };

  const filteredEstimates = estimates.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (
      search &&
      !e.clientName.toLowerCase().includes(search.toLowerCase()) &&
      !e.estimateNumber.toLowerCase().includes(search.toLowerCase()) &&
      !e.title.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // mailto: no admite adjuntos (limitación del protocolo, no del código) —
  // abre el cliente de correo con destinatario/asunto/cuerpo prellenados;
  // el PDF hay que adjuntarlo a mano tras "Imprimir / Exportar PDF".
  const handleEmailEstimate = (est: Estimate) => {
    const subject = `Presupuesto ${est.estimateNumber} — ${est.title}`;
    const body =
      `Hola ${est.clientName},\n\n` +
      `Adjunto el presupuesto ${est.estimateNumber} (${est.title}) por un total de ${est.total.toFixed(2)} $` +
      (est.validUntil ? `, válido hasta el ${est.validUntil}.\n\n` : '.\n\n') +
      `Recuerda adjuntar el PDF: usa "Imprimir / Exportar PDF" y guárdalo antes de enviar este correo.\n\n` +
      `Saludos,\nRemodelaciones FVJ`;
    const to = est.clientEmail || '';
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Navy & Crimson */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A192F] text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-stone-100 font-bold text-xs uppercase tracking-wider">
            <span>Cotizaciones de Remodelación</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-stone-100">
            Crear y Gestionar Presupuestos
          </h2>
          <p className="text-xs text-stone-300">
            Calculadora inteligente de costes para reformas de baños y cocinas, desglose de partidas y márgenes netos.
          </p>
        </div>

        <button
          onClick={handleOpenNewEstimate}
          className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'borrador', label: 'Borradores' },
            { id: 'enviado', label: 'Enviados' },
            { id: 'aprobado', label: 'Aprobados' },
            { id: 'rechazado', label: 'Rechazados' },
            { id: 'vencida', label: 'Vencidos' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-[#800020] text-white shadow-sm'
                  : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o nº..."
            className="w-full bg-stone-100 border border-stone-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#800020]"
          />
        </div>
      </div>

      {/* Estimates Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEstimates.map((est) => (
          <div
            key={est.id}
            id={`estimate-${est.id}`}
            className={`bg-white rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              highlightedId === est.id ? 'ring-2 ring-[#800020] ring-offset-2' : ''
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#800020]">{est.estimateNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        est.status === 'aprobado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : est.status === 'enviado'
                          ? 'bg-blue-100 text-blue-800'
                          : est.status === 'borrador'
                          ? 'bg-amber-100 text-amber-800'
                          : est.status === 'vencida'
                          ? 'bg-stone-200 text-stone-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {est.status}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-[#0A192F] mt-1 leading-snug">{est.title}</h3>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-[#0A192F]">
                    {est.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} $
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    Margen: +{est.estimatedMargin.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Client & Date details */}
              <div className="bg-[#FAF8F5] p-3 rounded-xl space-y-1 text-xs text-slate-700 font-medium">
                <div><strong className="text-[#0A192F]">Cliente:</strong> {est.clientName} ({est.clientPhone})</div>
                <div><strong className="text-[#0A192F]">Dirección:</strong> {est.clientAddress}</div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-stone-200">
                  <span>Fecha: {est.date}</span>
                  <span>Válido hasta: {est.validUntil}</span>
                </div>
              </div>

              {/* Items Preview */}
              <div className="space-y-1 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Desglose ({est.items.length} partidas):</div>
                <ul className="space-y-1">
                  {est.items.slice(0, 3).map((it) => (
                    <li key={it.id} className="flex justify-between text-slate-700 text-[11px] truncate">
                      <span className="truncate">• {it.description}</span>
                      <span className="font-bold text-[#0A192F] shrink-0 ml-2">{it.totalPrice} $</span>
                    </li>
                  ))}
                  {est.items.length > 3 && (
                    <li className="text-[10px] text-[#800020] font-bold">
                      + {est.items.length - 3} partidas más en documento oficial...
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPrintEstimate(est)}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#0A192F] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  onClick={() => handleEmailEstimate(est)}
                  title="Abre tu cliente de correo — el PDF se adjunta a mano (mailto: no admite adjuntos)"
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#0A192F] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Email</span>
                </button>

                <button
                  onClick={() => setExpandedNotesId(expandedNotesId === est.id ? null : est.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#0A192F] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Notas ({est.notes.length})</span>
                </button>

                {est.status === 'borrador' && (
                  <button
                    onClick={() => handleOpenEditEstimate(est)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#0A192F] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#800020]" />
                    <span>Editar</span>
                  </button>
                )}

                {est.status === 'borrador' && (
                  <button
                    onClick={() =>
                      onUpdateEstimateStatus(est.id, 'enviado').catch((err) =>
                        console.error('No se pudo enviar el presupuesto.', err)
                      )
                    }
                    title="Marca el presupuesto como enviado al cliente. A partir de aquí ya no se puede editar el desglose ni los datos del cliente — solo agregar notas o aprobar/rechazar."
                    className="px-2.5 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                )}

                {(est.status === 'borrador' || est.status === 'enviado') && (
                  <button
                    onClick={() =>
                      onUpdateEstimateStatus(est.id, 'aprobado').catch((err) =>
                        console.error('No se pudo aprobar el presupuesto.', err)
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprobar</span>
                  </button>
                )}

                {est.status === 'enviado' && (
                  <button
                    onClick={() => {
                      if (!confirm(`¿Marcar el presupuesto "${est.title}" como rechazado por el cliente?`)) return;
                      onUpdateEstimateStatus(est.id, 'rechazado').catch((err) =>
                        console.error('No se pudo rechazar el presupuesto.', err)
                      );
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>
                )}
              </div>

              {est.status === 'aprobado' && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onConvertToWorkOrder(est).catch((err) =>
                        console.error('No se pudo crear la orden de obra.', err)
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#0A192F] hover:bg-[#081324] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Crear Orden Obra
                  </button>
                  <button
                    onClick={() =>
                      onConvertToInvoice(est).catch((err) =>
                        console.error('No se pudo generar la factura.', err)
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#800020] hover:bg-[#66001a] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Generar Factura
                  </button>
                </div>
              )}
            </div>

            {expandedNotesId === est.id && (
              <div className="bg-slate-900 rounded-xl p-4 -mx-1">
                <NotesThread
                  notes={est.notes}
                  onAddNote={(text) => onAddEstimateNote(est.id, text)}
                  emptyLabel="Sin notas todavía."
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estimate Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-lg text-white">
                  {editingEstimateId ? 'Editar Presupuesto' : 'Generador de Presupuestos'}
                </h3>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEstimate} className="p-6 overflow-y-auto space-y-6">
              {/* Client (free text) + optional link to an existing CRM client */}
              <div className="space-y-4">
                {clients.length > 0 && (
                  <div className="text-xs">
                    <label className="block text-slate-300 font-bold mb-1">Vincular a Cliente Existente (opcional)</label>
                    <select
                      value={linkedClientId}
                      onChange={(e) => handlePickExistingClient(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">— Cliente nuevo (sin vincular) —</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nombre del Cliente *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej. María Fernández"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+58 414-1234567"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="maria@ejemplo.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Dirección</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Calle, ciudad"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Especialidad de Obra</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="cocina">Reforma de Cocina</option>
                    <option value="baño">Reforma de Baño</option>
                    <option value="integral">Reforma Integral Baño + Cocina</option>
                    <option value="aseo">Aseo de Cortesía</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Título del Presupuesto</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Reforma Baño Principal con Ducha Walk-in"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Template Preset Buttons */}
              <div className="space-y-2 bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Añadir Partidas Predefinidas Recomendadas:
                </div>
                <div className="flex flex-wrap gap-2">
                  {ITEM_PRESETS.filter((p) => p.projectType === projectType || projectType === 'integral').map(
                    (preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddItem(preset)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{preset.category}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">Partidas y Materiales</h4>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 font-semibold text-xs hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Partida Libre</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-2 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                          placeholder="Categoría (Ej. Alicatado)"
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="Descripción detallada de la partida"
                          className="sm:col-span-3 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                        <div>
                          <label className="text-[10px] text-slate-400">Unidad</label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                          >
                            <option value="m²">m²</option>
                            <option value="m.l.">m.l.</option>
                            <option value="ud">ud</option>
                            <option value="global">global</option>
                            <option value="horas">horas</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400">Cant.</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-right"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400">Coste Proveedor ($)</label>
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => handleUpdateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 text-right"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-amber-400 font-bold">Precio Cliente ($)</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-amber-500/50 rounded px-2 py-1 text-white font-bold text-right"
                          />
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">Total Lineal</div>
                            <div className="font-bold text-amber-400 text-sm">
                              {(item.quantity * item.unitPrice).toFixed(2)} $
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Summary Banner */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">Subtotal</div>
                  <div className="text-lg font-bold text-white">{subtotal.toFixed(2)} $</div>
                </div>
                <div>
                  <div className="text-slate-400">Coste Materiales/Mano Obra</div>
                  <div className="text-lg font-bold text-slate-300">{estimatedCost.toFixed(2)} $</div>
                </div>
                <div>
                  <div className="text-slate-400">Margen Beneficio Estimado</div>
                  <div className="text-lg font-black text-emerald-400">
                    +{(subtotal - estimatedCost).toFixed(2)} $ ({estimatedMargin.toFixed(1)}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold">Total con IVA (21%)</div>
                  <div className="text-2xl font-black text-amber-400">{total.toFixed(2)} $</div>
                </div>
              </div>

              {/* Terms and Notes */}
              <div className={`grid grid-cols-1 ${editingEstimateId ? '' : 'md:grid-cols-2'} gap-4 text-xs`}>
                {!editingEstimateId && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nota Inicial (interna, opcional)</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="No aparece en el documento impreso — solo para el equipo."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Condiciones de Pago</label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              {builderError && (
                <div className="flex items-start gap-2 text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-2.5 text-xs">
                  <span>{builderError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEstimate}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20"
                >
                  {isSavingEstimate
                    ? 'Guardando...'
                    : editingEstimateId
                    ? 'Guardar Cambios'
                    : 'Guardar Presupuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable / PDF Preview Modal */}
      {printEstimate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-400">Vista de Impresión / PDF Oficial</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
                <button
                  onClick={() => handleEmailEstimate(printEstimate)}
                  title="Abre tu cliente de correo — el PDF se adjunta a mano (mailto: no admite adjuntos)"
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar por Email</span>
                </button>
                <button
                  onClick={() => setPrintEstimate(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 font-sans">
              {/* Header Company Logo */}
              <div className="flex justify-between items-start border-b-2 border-amber-500 pb-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">REMODELACIONES FVJ</h1>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Especialistas en Remodelación de Baños & Cocinas</p>
                  <p className="text-xs text-slate-500">RIF: J-40123456-7 • Tel: +58 281-2345678</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-bold text-amber-600">{printEstimate.estimateNumber}</span>
                  <p className="text-xs text-slate-600">Fecha: {printEstimate.date}</p>
                  <p className="text-xs text-slate-600">Validez: 30 días</p>
                </div>
              </div>

              {/* Client Info Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-700 uppercase">Cliente:</span>
                  <div className="font-bold text-slate-900 text-sm">{printEstimate.clientName}</div>
                  <div className="text-slate-600">{printEstimate.clientPhone}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-700 uppercase">Dirección de Obra:</span>
                  <div className="text-slate-900 font-medium">{printEstimate.clientAddress}</div>
                  <div className="text-amber-600 font-bold capitalize mt-1">Obra: {printEstimate.projectType}</div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                    <th className="p-2 rounded-l">Partida / Descripción</th>
                    <th className="p-2 text-center">Unidad</th>
                    <th className="p-2 text-right">Cant.</th>
                    <th className="p-2 text-right">P. Unitario</th>
                    <th className="p-2 text-right rounded-r">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printEstimate.items.map((it) => (
                    <tr key={it.id}>
                      <td className="p-2">
                        <div className="font-bold text-slate-900">{it.category}</div>
                        <div className="text-slate-600 text-[11px]">{it.description}</div>
                      </td>
                      <td className="p-2 text-center text-slate-600">{it.unit}</td>
                      <td className="p-2 text-right font-medium">{it.quantity}</td>
                      <td className="p-2 text-right text-slate-700">{it.unitPrice.toFixed(2)} $</td>
                      <td className="p-2 text-right font-bold text-slate-900">{it.totalPrice.toFixed(2)} $</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Imponible:</span>
                    <span className="font-semibold">{printEstimate.subtotal.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (21%):</span>
                    <span className="font-semibold">{printEstimate.taxAmount.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                    <span>TOTAL PRESUPUESTO:</span>
                    <span className="text-amber-600">{printEstimate.total.toFixed(2)} $</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="text-[11px] text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Condiciones y Forma de Pago:</div>
                <p>{printEstimate.terms}</p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
                <div className="border-t border-slate-300 pt-2">Firma Empresa (Remodelaciones FVJ)</div>
                <div className="border-t border-slate-300 pt-2">Conforme Cliente ({printEstimate.clientName})</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
