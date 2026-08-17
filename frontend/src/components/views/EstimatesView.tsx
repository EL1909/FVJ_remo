import React, { useState } from 'react';
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
} from 'lucide-react';
import { Estimate, EstimateItem, Client, ProjectType } from '../../types';

interface EstimatesViewProps {
  estimates: Estimate[];
  clients: Client[];
  onSaveEstimate: (estimate: Estimate) => void;
  onUpdateEstimateStatus: (id: string, status: Estimate['status']) => void;
  onConvertToWorkOrder: (estimate: Estimate) => void;
  onConvertToInvoice: (estimate: Estimate) => void;
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
  onUpdateEstimateStatus,
  onConvertToWorkOrder,
  onConvertToInvoice,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [printEstimate, setPrintEstimate] = useState<Estimate | null>(null);

  // Form State for new estimate
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
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
  const [notes, setNotes] = useState('Garantía de 5 años en instalaciones. Limpieza final de obra incluida.');
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

  const handleCreateEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    const clientObj = clients.find((c) => c.id === selectedClientId) || clients[0];
    const newEstNumber = `PRES-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newEstimate: Estimate = {
      id: `est-${Date.now()}`,
      estimateNumber: newEstNumber,
      clientId: clientObj.id,
      clientName: clientObj.name,
      clientPhone: clientObj.phone,
      clientAddress: `${clientObj.address}, ${clientObj.city}`,
      projectType,
      title: title || `Presupuesto Reforma ${projectType.toUpperCase()} - ${clientObj.name}`,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'borrador',
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      estimatedCost,
      estimatedMargin,
      notes,
      terms,
    };

    onSaveEstimate(newEstimate);
    setIsBuilderOpen(false);
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
          onClick={() => setIsBuilderOpen(true)}
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
            className="bg-white rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
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
                    {est.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
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
                      <span className="font-bold text-[#0A192F] shrink-0 ml-2">{it.totalPrice} €</span>
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

                {est.status === 'enviado' && (
                  <button
                    onClick={() => onUpdateEstimateStatus(est.id, 'aprobado')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprobar</span>
                  </button>
                )}
              </div>

              {est.status === 'aprobado' && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onConvertToWorkOrder(est)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0A192F] hover:bg-[#081324] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Crear Orden Obra
                  </button>
                  <button
                    onClick={() => onConvertToInvoice(est)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#800020] hover:bg-[#66001a] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Generar Factura
                  </button>
                </div>
              )}
            </div>
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
                <h3 className="font-extrabold text-lg text-white">Generador de Presupuestos</h3>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEstimate} className="p-6 overflow-y-auto space-y-6">
              {/* Select Client & Project Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cliente</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

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
                          <label className="text-[10px] text-slate-400">Coste Proveedor (€)</label>
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => handleUpdateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 text-right"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-amber-400 font-bold">Precio Cliente (€)</label>
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
                              {(item.quantity * item.unitPrice).toFixed(2)} €
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
                  <div className="text-lg font-bold text-white">{subtotal.toFixed(2)} €</div>
                </div>
                <div>
                  <div className="text-slate-400">Coste Materiales/Mano Obra</div>
                  <div className="text-lg font-bold text-slate-300">{estimatedCost.toFixed(2)} €</div>
                </div>
                <div>
                  <div className="text-slate-400">Margen Beneficio Estimado</div>
                  <div className="text-lg font-black text-emerald-400">
                    +{(subtotal - estimatedCost).toFixed(2)} € ({estimatedMargin.toFixed(1)}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold">Total con IVA (21%)</div>
                  <div className="text-2xl font-black text-amber-400">{total.toFixed(2)} €</div>
                </div>
              </div>

              {/* Terms and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Notas de Garantía y Limpieza</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20"
                >
                  Guardar Presupuesto
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
                  <p className="text-xs text-slate-500">CIF: B-987654321 • Tel: +34 912 345 678</p>
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
                    <th className="p-2 text-right rounded-r">Total (€)</th>
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
                      <td className="p-2 text-right text-slate-700">{it.unitPrice.toFixed(2)} €</td>
                      <td className="p-2 text-right font-bold text-slate-900">{it.totalPrice.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Imponible:</span>
                    <span className="font-semibold">{printEstimate.subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (21%):</span>
                    <span className="font-semibold">{printEstimate.taxAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                    <span>TOTAL PRESUPUESTO:</span>
                    <span className="text-amber-600">{printEstimate.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="text-[11px] text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Condiciones y Forma de Pago:</div>
                <p>{printEstimate.terms}</p>
                <p className="pt-1 italic">{printEstimate.notes}</p>
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
