import React, { useEffect, useState } from 'react';
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
  Wallet,
  Loader2,
  ListChecks,
  Edit2,
  Trash2,
  EyeOff,
  Eye,
} from 'lucide-react';
import { MaterialPurchase, MaterialCategory, WorkOrder, Supplier, EstimateItemTemplate, ProjectType } from '../../types';
import { NewMaterialPurchaseInput, fetchSuppliers } from '../../lib/materials';
import { ItemTemplateInput } from '../../lib/billing';
import { ApiError } from '../../lib/api';

interface MaterialsAndCostsViewProps {
  purchases: MaterialPurchase[];
  workOrders: WorkOrder[];
  onSavePurchase: (purchase: NewMaterialPurchaseInput) => Promise<void>;
  onUpdatePurchaseStatus: (id: string, status: MaterialPurchase['status']) => Promise<void>;
  onPayPurchase: (id: string) => Promise<void>;
  itemTemplates: EstimateItemTemplate[];
  onAddItemTemplate: (input: ItemTemplateInput) => Promise<void>;
  onUpdateItemTemplate: (id: string, input: Partial<ItemTemplateInput>) => Promise<void>;
  onDeleteItemTemplate: (id: string) => Promise<void>;
}

export const MaterialsAndCostsView: React.FC<MaterialsAndCostsViewProps> = ({
  purchases,
  workOrders,
  onSavePurchase,
  onUpdatePurchaseStatus,
  onPayPurchase,
  itemTemplates,
  onAddItemTemplate,
  onUpdateItemTemplate,
  onDeleteItemTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'catalog'>('purchases');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Catalog (item templates) form state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplCategory, setTplCategory] = useState('');
  const [tplDescription, setTplDescription] = useState('');
  const [tplUnit, setTplUnit] = useState<EstimateItemTemplate['unit']>('global');
  const [tplUnitCost, setTplUnitCost] = useState<number>(0);
  const [tplUnitPrice, setTplUnitPrice] = useState<number>(0);
  const [tplProjectType, setTplProjectType] = useState<ProjectType>('baño');
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Form State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [linkedSupplierId, setLinkedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('Cerámicas Oriente, Barcelona');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>(workOrders[0]?.id || '');
  const [category, setCategory] = useState<MaterialCategory>('azulejos_pavimentos');
  const [itemName, setItemName] = useState('Azulejo Vencerámica 120x60 Mármol Calacatta');
  const [quantity, setQuantity] = useState<number>(15);
  const [unitPrice, setUnitPrice] = useState<number>(38);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);

  // Proveedores solo hacen falta para el desplegable "vincular existente" —
  // se traen al abrir el modal, no en cada carga de la app.
  useEffect(() => {
    if (!isNewPurchaseOpen) return;
    fetchSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
  }, [isNewPurchaseOpen]);

  const handlePickExistingSupplier = (id: string) => {
    setLinkedSupplierId(id);
    const s = suppliers.find((sp) => sp.id === id);
    if (s) {
      setSupplierName(s.name);
      setSupplierPhone(s.phone);
      setSupplierEmail(s.email);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalPrice, 0);

  const handleCreatePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);
    setIsSavingPurchase(true);
    try {
      await onSavePurchase({
        supplierName,
        supplierId: linkedSupplierId || undefined,
        supplierPhone: linkedSupplierId ? undefined : supplierPhone,
        supplierEmail: linkedSupplierId ? undefined : supplierEmail,
        workOrderId: selectedWorkOrderId || undefined,
        category,
        itemName,
        quantity,
        unitPrice,
      });
      setIsNewPurchaseOpen(false);
      setLinkedSupplierId('');
      setSupplierPhone('');
      setSupplierEmail('');
    } catch (err) {
      setPurchaseError(err instanceof ApiError ? err.message : 'No se pudo registrar la compra.');
    } finally {
      setIsSavingPurchase(false);
    }
  };

  const handlePay = async (id: string) => {
    if (payingId) return;
    setPayingId(id);
    try {
      await onPayPurchase(id);
    } catch (err) {
      console.error('No se pudo marcar como pagada.', err);
    } finally {
      setPayingId(null);
    }
  };

  const handleOpenAddTemplate = () => {
    setEditingTemplateId(null);
    setTplCategory('');
    setTplDescription('');
    setTplUnit('global');
    setTplUnitCost(0);
    setTplUnitPrice(0);
    setTplProjectType('baño');
    setTemplateError(null);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: EstimateItemTemplate) => {
    setEditingTemplateId(tpl.id);
    setTplCategory(tpl.category);
    setTplDescription(tpl.description);
    setTplUnit(tpl.unit);
    setTplUnitCost(tpl.unitCost);
    setTplUnitPrice(tpl.unitPrice);
    setTplProjectType(tpl.projectType);
    setTemplateError(null);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateError(null);
    setIsSavingTemplate(true);
    try {
      const input: ItemTemplateInput = {
        category: tplCategory.trim(),
        description: tplDescription.trim(),
        unit: tplUnit,
        unitCost: tplUnitCost,
        unitPrice: tplUnitPrice,
        projectType: tplProjectType,
        isActive: true,
      };
      if (editingTemplateId) {
        await onUpdateItemTemplate(editingTemplateId, input);
      } else {
        await onAddItemTemplate(input);
      }
      setIsTemplateModalOpen(false);
    } catch (err) {
      setTemplateError(err instanceof ApiError ? err.message : 'No se pudo guardar la partida.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleToggleTemplateActive = async (tpl: EstimateItemTemplate) => {
    try {
      await onUpdateItemTemplate(tpl.id, { isActive: !tpl.isActive });
    } catch (err) {
      console.error('No se pudo cambiar el estado de la partida.', err);
    }
  };

  const handleDeleteTemplate = async (tpl: EstimateItemTemplate) => {
    if (!confirm(`¿Eliminar la partida "${tpl.description}" del catálogo?`)) return;
    try {
      await onDeleteItemTemplate(tpl.id);
    } catch (err) {
      console.error('No se pudo eliminar la partida.', err);
    }
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
          onClick={() => (activeTab === 'purchases' ? setIsNewPurchaseOpen(true) : handleOpenAddTemplate())}
          className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'purchases' ? 'Registrar Compra Material' : 'Agregar Partida al Catálogo'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'purchases' ? 'bg-[#0A192F] text-white' : 'text-slate-600 hover:bg-stone-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Compras de Materiales</span>
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'catalog' ? 'bg-[#0A192F] text-white' : 'text-slate-600 hover:bg-stone-100'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>Catálogo de Partidas</span>
        </button>
      </div>

      {activeTab === 'purchases' && (
      <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Gasto Total en Materiales</div>
          <div className="text-2xl font-black text-[#0A192F] mt-1">
            {totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })} $
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
                  {purchase.totalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} $
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {purchase.quantity} ud x {purchase.unitPrice} $
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
                  onClick={() =>
                    onUpdatePurchaseStatus(purchase.id, 'recibido').catch((err) =>
                      console.error('No se pudo confirmar la recepción.', err)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition-colors cursor-pointer"
                >
                  Confirmar Recepción en Obra
                </button>
              )}
            </div>

            {/* Payment Status & Action — sin esto la compra nunca genera un
                movimiento real en tesorería, y por lo tanto nunca aparece en
                el gasto que se publica a EsfuerzoVZ. */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-extrabold uppercase text-[10px] ${
                  purchase.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{purchase.isPaid ? 'Pagado' : 'Pendiente de Pago'}</span>
              </span>

              {!purchase.isPaid && (
                <button
                  onClick={() => handlePay(purchase.id)}
                  disabled={payingId === purchase.id}
                  className="px-3 py-1.5 rounded-lg bg-[#0A192F] hover:bg-[#132a4d] disabled:opacity-50 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {payingId === purchase.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <DollarSign className="w-3.5 h-3.5" />
                  )}
                  <span>Marcar como Pagado</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-3">
          {itemTemplates.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-sm text-slate-500 shadow-sm">
              Aún no hay partidas en el catálogo. Agrega la primera con el botón de arriba.
            </div>
          )}
          {itemTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-wrap items-center justify-between gap-3 ${
                !tpl.isActive ? 'opacity-50' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-slate-700 border border-stone-200">
                    {tpl.projectType}
                  </span>
                  {tpl.category && (
                    <span className="text-xs font-bold text-[#800020]">{tpl.category}</span>
                  )}
                  {!tpl.isActive && (
                    <span className="text-[10px] font-bold uppercase text-slate-400">Inactiva</span>
                  )}
                </div>
                <p className="text-sm text-slate-800 font-medium max-w-xl">{tpl.description}</p>
                <div className="text-xs text-slate-500">
                  {tpl.unit} • Costo: {tpl.unitCost.toLocaleString('es-ES')} $ • Precio: {tpl.unitPrice.toLocaleString('es-ES')} $
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleTemplateActive(tpl)}
                  title={tpl.isActive ? 'Desactivar' : 'Activar'}
                  className="p-2 text-slate-500 hover:text-[#0A192F] hover:bg-stone-100 rounded-lg transition-all cursor-pointer"
                >
                  {tpl.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleOpenEditTemplate(tpl)}
                  title="Editar"
                  className="p-2 text-slate-500 hover:text-[#580812] hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(tpl)}
                  title="Eliminar"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Purchase Modal */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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

              {suppliers.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Vincular a Proveedor Existente (opcional)</label>
                  <select
                    value={linkedSupplierId}
                    onChange={(e) => handlePickExistingSupplier(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="">— Proveedor nuevo (sin vincular) —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.city ? `(${s.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">Proveedor</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => {
                    setSupplierName(e.target.value);
                    setLinkedSupplierId('');
                  }}
                  placeholder="Ej. Vencerámica, Corona, Ferretotal"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              {!linkedSupplierId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Teléfono Proveedor</label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="Opcional"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email Proveedor</label>
                    <input
                      type="email"
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                      placeholder="Opcional"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
              )}

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
                  <label className="block text-slate-300 font-bold mb-1">Precio Unitario ($)</label>
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
                  {(quantity * unitPrice).toFixed(2)} $
                </span>
              </div>

              {purchaseError && (
                <div className="text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-2.5">{purchaseError}</div>
              )}

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
                  disabled={isSavingPurchase}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold"
                >
                  {isSavingPurchase ? 'Registrando...' : 'Registrar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Item Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-amber-400" />
                <span>{editingTemplateId ? 'Editar Partida' : 'Nueva Partida de Catálogo'}</span>
              </h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tipo de Proyecto</label>
                  <select
                    value={tplProjectType}
                    onChange={(e) => setTplProjectType(e.target.value as ProjectType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="baño">Baño</option>
                    <option value="cocina">Cocina</option>
                    <option value="integral">Integral</option>
                    <option value="aseo">Aseo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Unidad</label>
                  <select
                    value={tplUnit}
                    onChange={(e) => setTplUnit(e.target.value as EstimateItemTemplate['unit'])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="global">Global</option>
                    <option value="m²">m²</option>
                    <option value="m.l.">m.l.</option>
                    <option value="ud">Ud</option>
                    <option value="horas">Horas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Categoría</label>
                <input
                  type="text"
                  value={tplCategory}
                  onChange={(e) => setTplCategory(e.target.value)}
                  placeholder="Ej. Demolición y Desescombro"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Descripción</label>
                <textarea
                  required
                  rows={3}
                  value={tplDescription}
                  onChange={(e) => setTplDescription(e.target.value)}
                  placeholder="Detalle de la partida tal como aparece en el presupuesto"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Costo Interno ($)</label>
                  <input
                    type="number"
                    value={tplUnitCost}
                    onChange={(e) => setTplUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Precio al Cliente ($)</label>
                  <input
                    type="number"
                    required
                    value={tplUnitPrice}
                    onChange={(e) => setTplUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {templateError && (
                <div className="text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-2.5">{templateError}</div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold"
                >
                  {isSavingTemplate ? 'Guardando...' : editingTemplateId ? 'Guardar Cambios' : 'Agregar Partida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
