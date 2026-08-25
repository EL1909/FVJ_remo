import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  DollarSign,
  TrendingUp,
  Search,
  Building2,
  X,
  Loader2,
  MessageSquare,
  User,
} from 'lucide-react';
import { Invoice, WorkOrder } from '../../types';
import { NewInvoiceInput, OrderDetail, fetchOrderDetail } from '../../lib/treasury';
import { ApiError } from '../../lib/api';
import { NotesThread } from '../shared/NotesThread';

interface InvoicesViewProps {
  invoices: Invoice[];
  workOrders: WorkOrder[];
  onMarkInvoicePaid: (id: string) => Promise<void>;
  onSaveInvoice: (invoice: NewInvoiceInput) => Promise<void>;
  onAddInvoiceNote: (id: string, text: string) => Promise<void>;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  workOrders,
  onMarkInvoicePaid,
  onSaveInvoice,
  onAddInvoiceNote,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  // New Invoice Form State — un hito de cobro sobre una obra real, no una
  // factura suelta: el backend valida el monto contra el total de la obra.
  const [selectedOrderId, setSelectedOrderId] = useState(workOrders[0]?.id || '');
  const [concept, setConcept] = useState('Anticipo 30% para Reforma de Baño');
  // Arranca en 0, no en un monto inventado: se precarga con el saldo real
  // de la obra apenas carga su detalle (ver useEffect de abajo).
  const [subtotal, setSubtotal] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(21);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  // Detalle real de la Order (evz_store) detrás de la obra elegida — sus
  // partidas, notas y estado de cobro. No viene en WorkOrder (eso es Task,
  // solo fases de ejecución), así que se trae aparte al elegir la obra.
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isLoadingOrderDetail, setIsLoadingOrderDetail] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNewInvoiceOpen) return;
    const order = workOrders.find((w) => w.id === selectedOrderId);
    if (!order?.orderId) {
      setOrderDetail(null);
      return;
    }
    setOrderDetail(null);
    setOrderDetailError(null);
    setIsLoadingOrderDetail(true);
    fetchOrderDetail(order.orderId)
      .then((detail) => {
        setOrderDetail(detail);
        // La Base Imponible arrancaba en un 3000 fijo sin relación a la
        // obra elegida — el backend rechaza cualquier monto que sumado a
        // lo ya facturado supere el total, así que precargar el saldo
        // pendiente es lo único que tiene sentido como default.
        setSubtotal(Number(detail.balanceDue.toFixed(2)));
      })
      .catch((err) =>
        setOrderDetailError(err instanceof ApiError ? err.message : 'No se pudo cargar el detalle de la obra.')
      )
      .finally(() => setIsLoadingOrderDetail(false));
  }, [isNewInvoiceOpen, selectedOrderId, workOrders]);

  const filteredInvoices = invoices.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  const totalCollected = invoices
    .filter((i) => i.status === 'pagada')
    .reduce((sum, i) => sum + i.total, 0);

  const totalPending = invoices
    .filter((i) => i.status === 'pendiente' || i.status === 'vencida')
    .reduce((sum, i) => sum + i.total, 0);

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = workOrders.find((w) => w.id === selectedOrderId);
    if (!order?.orderId) return;

    setInvoiceError(null);
    setIsSavingInvoice(true);
    try {
      await onSaveInvoice({
        orderId: order.orderId,
        description: concept,
        amount: subtotal,
        taxRate,
        dueDate,
      });
      setIsNewInvoiceOpen(false);
    } catch (err) {
      setInvoiceError(err instanceof ApiError ? err.message : 'No se pudo emitir la factura.');
    } finally {
      setIsSavingInvoice(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Navy & Crimson */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A192F] text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-stone-100 font-bold text-xs uppercase tracking-wider">
            <span>Gestión de Cobros</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-stone-100">
            Facturas y Certificaciones de Obra
          </h2>
          <p className="text-xs text-stone-300">
            Emisión de facturas por hitos (Anticipo, Avance de Obra, Entrega Final) con desglose de IVA y control de cobros.
          </p>
        </div>

        <button
          onClick={() => setIsNewInvoiceOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-slate-500">Total Cobrado</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {totalCollected.toLocaleString('es-ES', { minimumFractionDigits: 2 })} $
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-slate-500">Pendiente de Cobro</div>
            <div className="text-2xl font-black text-[#800020] mt-1">
              {totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })} $
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#800020] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm overflow-x-auto">
        {[
          { id: 'all', label: 'Todas las Facturas' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'pagada', label: 'Pagadas' },
          { id: 'vencida', label: 'Vencidas' },
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

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.map((inv) => (
          <div
            key={inv.id}
            onClick={() => setPrintInvoice(inv)}
            className="bg-white rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black text-[#800020] bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  {inv.invoiceNumber}
                </span>
                <div>
                  <h3 className="font-black text-sm text-[#0A192F]">{inv.concept}</h3>
                  <div className="text-xs text-slate-600 font-medium">Cliente: {inv.clientName}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-black text-[#0A192F]">
                    {inv.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} $
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Emisión: {inv.issueDate}</div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    inv.status === 'pagada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : inv.status === 'pendiente'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPrintInvoice(inv);
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#0A192F] text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#800020]" />
                <span>Imprimir Factura</span>
              </button>

              {inv.status !== 'pagada' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkInvoicePaid(inv.id).catch((err) =>
                      console.error('No se pudo marcar como cobrada.', err)
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#800020] hover:bg-[#66001a] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar como Cobrada</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for New Invoice */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span>Emitir Nueva Factura</span>
              </h3>
              <button onClick={() => setIsNewInvoiceOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 font-bold mb-1">Obra</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                {workOrders.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.orderNumber} - {w.title} ({w.budgetTotal.toLocaleString('es-ES')} $ presupuesto)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Detalle completo de la obra: partidas, notas y estado de cobro */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Detalle de la Obra</span>
                </div>

                {isLoadingOrderDetail && (
                  <div className="flex items-center justify-center py-8 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}

                {orderDetailError && (
                  <div className="text-red-400 bg-red-950/40 border border-red-900 rounded-lg p-2.5">
                    {orderDetailError}
                  </div>
                )}

                {orderDetail && !isLoadingOrderDetail && (
                  <>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold text-white">{orderDetail.customerName}</span>
                      {orderDetail.customerPhone && <span>· {orderDetail.customerPhone}</span>}
                    </div>

                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Total Obra</div>
                        <div className="font-black text-white">{orderDetail.total.toFixed(2)} $</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Cobrado</div>
                        <div className="font-black text-emerald-400">{orderDetail.amountPaid.toFixed(2)} $</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Saldo</div>
                        <div className="font-black text-amber-400">{orderDetail.balanceDue.toFixed(2)} $</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Ítems ({orderDetail.items.length})
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {orderDetail.items.length === 0 ? (
                          <p className="text-slate-500 italic">Sin ítems.</p>
                        ) : (
                          orderDetail.items.map((it) => (
                            <div
                              key={it.id}
                              className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-slate-200 font-semibold truncate">{it.productName}</div>
                                <div className="text-[10px] text-slate-500">
                                  {it.quantity} {it.unit} × {it.unitPrice.toFixed(2)} $
                                  {it.category && <span> · {it.category}</span>}
                                </div>
                              </div>
                              <div className="text-slate-200 font-bold shrink-0">{it.subtotal.toFixed(2)} $</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Notas ({orderDetail.notes.length})</span>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {orderDetail.notes.length === 0 ? (
                          <p className="text-slate-500 italic">Sin notas.</p>
                        ) : (
                          orderDetail.notes.map((n, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                                <span className="font-bold text-amber-400">{n.authorEmail || 'Sistema'}</span>
                                <span>{new Date(n.date).toLocaleDateString('es-ES')}</span>
                              </div>
                              <p className="text-slate-300 whitespace-pre-wrap">{n.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Datos de la factura */}
              <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Concepto Factura</label>
                  <input
                    type="text"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Base Imponible ($)
                      {orderDetail && (
                        <span className="text-slate-500 font-normal normal-case">
                          {' '}
                          · saldo pendiente: {orderDetail.balanceDue.toFixed(2)} $
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={subtotal}
                      onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">IVA (%)</label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="bg-slate-800 p-3 rounded-xl text-right">
                  <span className="text-slate-400">Total con {taxRate}% IVA:</span>
                  <span className="text-lg font-black text-amber-400 ml-2">
                    {(subtotal * (1 + taxRate / 100)).toFixed(2)} $
                  </span>
                </div>

                {invoiceError && (
                  <div className="text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-2.5">{invoiceError}</div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNewInvoiceOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingInvoice || !workOrders.length}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold"
                  >
                    {isSavingInvoice ? 'Emitiendo...' : 'Emitir Factura'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Printable Modal */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-8 space-y-6 font-sans overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b-2 border-emerald-500 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">FVJ REMODELACIONES S.L.</h2>
                <p className="text-xs text-slate-500">Factura de Remodelaciones de Interiores</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-emerald-600">{printInvoice.invoiceNumber}</div>
                <div className="text-xs text-slate-500">Fecha: {printInvoice.issueDate}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-800">Facturado a: {printInvoice.clientName}</div>
              <div className="text-slate-600">{printInvoice.clientAddress}</div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 text-xs space-y-2">
              <div className="font-bold text-slate-900 text-sm">{printInvoice.concept}</div>
              <div className="flex justify-between pt-2 border-t text-slate-700">
                <span>Base Imponible:</span>
                <span>{printInvoice.subtotal.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>IVA 21%:</span>
                <span>{printInvoice.taxAmount.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>TOTAL FACTURA:</span>
                <span className="text-emerald-600">{printInvoice.total.toFixed(2)} $</span>
              </div>
            </div>

            {/* Notas — visibles en pantalla, no en el documento impreso/PDF */}
            <div className="print:hidden space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#800020]" />
                <span>Notas ({printInvoice.notes.length})</span>
              </div>
              <div className="bg-slate-900 rounded-xl p-4">
                <NotesThread
                  notes={printInvoice.notes}
                  onAddNote={(text) => onAddInvoiceNote(printInvoice.id, text)}
                />
              </div>
            </div>

            <div className="print:hidden flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Imprimir Documento
              </button>
              <button
                onClick={() => setPrintInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
