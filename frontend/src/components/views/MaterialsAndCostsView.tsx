import React, { useState } from 'react';
import {
  Package,
  Plus,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  DollarSign,
  Bath,
  CookingPot,
  Filter,
  X,
} from 'lucide-react';
import { MaterialPurchase, MaterialCategory, WorkOrder } from '../../types';

interface MaterialsAndCostsViewProps {
  purchases: MaterialPurchase[];
  workOrders: WorkOrder[];
  onSavePurchase: (purchase: MaterialPurchase) => void;
  onUpdatePurchaseStatus: (id: string, status: MaterialPurchase['status']) => void;
}

export const MaterialsAndCostsView: React.FC<MaterialsAndCostsViewProps> = ({
  purchases,
  workOrders,
  onSavePurchase,
  onUpdatePurchaseStatus,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);

  // Form State
  const [supplierName, setSupplierName] = useState('Porcelanosa Barcelona');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>(workOrders[0]?.id || '');
  const [category, setCategory] = useState<MaterialCategory>('azulejos_pavimentos');
  const [itemName, setItemName] = useState('Azulejo Porcelanosa 120x60 Mármol Calacatta');
  const [quantity, setQuantity] = useState<number>(15);
  const [unitPrice, setUnitPrice] = useState<number>(38);

  const filteredPurchases = purchases.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalPrice, 0);

  const handleCreatePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = workOrders.find((w) => w.id === selectedWorkOrderId);
    const totalPrice = quantity * unitPrice;

    const newP: MaterialPurchase = {
      id: `mat-${Date.now()}`,
      purchaseNumber: `COMP-2026-${Math.floor(130 + Math.random() * 50)}`,
      supplierName,
      workOrderId: order?.id,
      workOrderTitle: order?.title || 'General Stock',
      category,
      itemName,
      quantity,
      unitPrice,
      totalPrice,
      purchaseDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'solicitado',
    };

    onSavePurchase(newP);
    setIsNewPurchaseOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Navy & Crimson */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A192F] text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-stone-100 font-bold text-xs uppercase tracking-wider">
            <span>Control de Proveedores & Stock</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-stone-100">
            Compras de Materiales y Registro de Costos
          </h2>
          <p className="text-xs text-stone-300">
            Seguimiento de pedidos de encimeras, azulejos, mamparas, griferías y sanitarios por obra. Análisis de coste real vs presupuesto.
          </p>
        </div>

        <button
          onClick={() => setIsNewPurchaseOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Compra Material</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Gasto Total en Materiales</div>
          <div className="text-2xl font-black text-[#0A192F] mt-1">
            {totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Pedidos en Tránsito</div>
          <div className="text-2xl font-black text-[#800020] mt-1">
            {purchases.filter((p) => p.status === 'en_transito').length} pedidos
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Materiales Recibidos</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {purchases.filter((p) => p.status === 'recibido').length} en obra
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm overflow-x-auto">
        {[
          { id: 'all', label: 'Todas las categorías' },
          { id: 'griferia_sanitarios', label: 'Griferías & Sanitarios' },
          { id: 'azulejos_pavimentos', label: 'Azulejos & Solados' },
          { id: 'muebles_encimeras', label: 'Muebles & Encimeras' },
          { id: 'fontaneria_electricidad', label: 'Fontanería & Elec' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              categoryFilter === cat.id
                ? 'bg-[#800020] text-white shadow-sm'
                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Purchases List */}
      <div className="space-y-3">
        {filteredPurchases.map((purchase) => (
          <div
            key={purchase.id}
            className="bg-white rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#800020]">{purchase.purchaseNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-slate-700 border border-stone-200">
                    {purchase.category.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-black text-base text-[#0A192F]">{purchase.itemName}</h3>
                <div className="text-xs text-slate-600 font-medium">
                  Proveedor: <strong className="text-[#800020]">{purchase.supplierName}</strong> • Asignado a:{' '}
                  <strong className="text-[#0A192F]">{purchase.workOrderTitle}</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-black text-[#0A192F]">
                  {purchase.totalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {purchase.quantity} ud x {purchase.unitPrice} €
                </div>
              </div>
            </div>

            {/* Delivery Status & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-extrabold uppercase text-[10px] ${
                    purchase.status === 'recibido'
                      ? 'bg-emerald-100 text-emerald-800'
                      : purchase.status === 'en_transito'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{purchase.status.replace('_', ' ')}</span>
                </span>
                <span className="text-slate-500 font-medium">Entrega prevista: {purchase.deliveryDate}</span>
              </div>

              {purchase.status !== 'recibido' && (
                <button
                  onClick={() => onUpdatePurchaseStatus(purchase.id, 'recibido')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition-colors cursor-pointer"
                >
                  Confirmar Recepción en Obra
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Purchase Modal */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>Registrar Compra de Material</span>
              </h3>
              <button onClick={() => setIsNewPurchaseOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Obra Asignada</label>
                <select
                  value={selectedWorkOrderId}
                  onChange={(e) => setSelectedWorkOrderId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {workOrders.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.orderNumber} - {w.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Proveedor</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ej. Porcelanosa, Roca, Silestone"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Material</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Precio Unitario (€)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="bg-slate-800 p-3 rounded-xl text-right">
                <span className="text-slate-400">Total Compra:</span>
                <span className="text-lg font-black text-amber-400 ml-2">
                  {(quantity * unitPrice).toFixed(2)} €
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Registrar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
