import React, { useEffect, useState } from 'react';
import {
  X,
  UploadCloud,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  History,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Package,
  Receipt,
  DollarSign,
} from 'lucide-react';
import {
  fetchSyncStatus,
  fetchSyncPreview,
  publishSync,
  SyncStatusResponse,
  SyncReport,
} from '../../lib/sync';
import { ApiError } from '../../lib/api';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const [preview, setPreview] = useState<SyncReport | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const loadStatus = () => {
    setIsLoadingStatus(true);
    setStatusError(null);
    fetchSyncStatus()
      .then((data) => {
        setStatus(data);
        setPeriodStart((prev) => prev || data.suggested_period.start);
        setPeriodEnd((prev) => prev || data.suggested_period.end);
      })
      .catch((err) => setStatusError(err instanceof ApiError ? err.message : 'No se pudo cargar el estado.'))
      .finally(() => setIsLoadingStatus(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    // Reinicia el flujo cada vez que se abre — evita mostrar una vista
    // previa vieja de una sesión anterior como si fuera del período actual.
    setPreview(null);
    setPreviewError(null);
    setPublishError(null);
    setPublishSuccess(false);
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePreview = async () => {
    if (!periodStart || !periodEnd) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const data = await fetchSyncPreview(periodStart, periodEnd);
      setPreview(data);
    } catch (err) {
      setPreviewError(err instanceof ApiError ? err.message : 'No se pudo generar la vista previa.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePublish = async () => {
    if (!periodStart || !periodEnd) return;
    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccess(false);
    try {
      await publishSync(periodStart, periodEnd);
      setPublishSuccess(true);
      loadStatus();
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : 'No se pudo publicar.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-400" />
            <span>Publicar a EsfuerzoVZ</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado de conexión */}
        <div className="flex items-center gap-2 text-xs">
          {isLoadingStatus ? (
            <span className="text-slate-400 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Consultando estado...
            </span>
          ) : statusError ? (
            <span className="text-red-400">{statusError}</span>
          ) : status?.remote.available ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Conectado con EsfuerzoVZ
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              {status?.remote.reason === 'not_configured'
                ? 'No configurado (falta EVZ_API_TOKEN en el servidor)'
                : status?.remote.detail || 'No se pudo conectar con EsfuerzoVZ'}
            </span>
          )}
        </div>

        {/* Selector de período */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Desde</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                setPreview(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-1">Hasta</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
                setPreview(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>
        </div>

        <button
          onClick={handlePreview}
          disabled={isLoadingPreview || !periodStart || !periodEnd}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
        >
          {isLoadingPreview ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Eye className="w-4 h-4 text-amber-400" />
          )}
          <span>{isLoadingPreview ? 'Generando vista previa...' : 'Vista Previa'}</span>
        </button>

        {previewError && (
          <div className="text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-2.5 text-xs">
            {previewError}
          </div>
        )}

        {/* Vista previa del reporte */}
        {preview && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Esto es lo que se enviaría — solo agregados, sin datos de clientas individuales
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Ingresos</div>
                  <div className="font-black text-emerald-400 text-base">{preview.totals.income} $</div>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Gastos</div>
                  <div className="font-black text-rose-400 text-base">{preview.totals.expenses} $</div>
                </div>
                <TrendingDown className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <Users className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
                <div className="font-black text-white">{preview.metrics.customers_served}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">Clientes</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <Calendar className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
                <div className="font-black text-white">{preview.metrics.appointments}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">Citas</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <Package className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
                <div className="font-black text-white">{preview.metrics.orders}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">Órdenes</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <Receipt className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
                <div className="font-black text-white">{preview.metrics.receipts_issued}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">Recibos</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <DollarSign className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
                <div className="font-black text-white">{preview.metrics.avg_ticket} $</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">Ticket Prom.</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <Package className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
                <div className="font-black text-white">{preview.metrics.units_sold}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">Unidades</div>
              </div>
            </div>

            {preview.expense_breakdown.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Desglose de Gastos
                </div>
                <div className="space-y-1">
                  {preview.expense_breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-300">{item.category}</span>
                      <span className="text-slate-400">
                        {item.amount} $ <span className="text-slate-600">({item.pct_of_expenses}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <span>{isPublishing ? 'Publicando...' : 'Publicar a EsfuerzoVZ'}</span>
            </button>

            {publishError && (
              <div className="text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-2.5">{publishError}</div>
            )}
            {publishSuccess && (
              <div className="text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-xl p-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Publicado correctamente.</span>
              </div>
            )}
          </div>
        )}

        {/* Historial */}
        {status && status.history.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <History className="w-3 h-3" />
              <span>Publicaciones Anteriores</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {status.history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px]"
                >
                  <span className="text-slate-300">
                    {h.period_start} → {h.period_end}
                  </span>
                  {h.totals && (
                    <span className="text-slate-500">
                      {h.totals.income} $ / {h.totals.expenses} $
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      h.status === 'ok' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-rose-900/60 text-rose-400'
                    }`}
                  >
                    {h.status === 'ok' ? 'Enviado' : 'Falló'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
