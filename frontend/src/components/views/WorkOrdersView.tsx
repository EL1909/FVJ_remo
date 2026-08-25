import React, { useState } from 'react';
import {
  HardHat,
  CheckCircle2,
  Clock,
  Camera,
  User,
  UserPlus,
  X,
  MapPin,
  Phone,
  Calendar,
  Plus,
  Image as ImageIcon,
  Check,
  Bath,
  CookingPot,
  Sparkles,
  DollarSign,
  TrendingUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WorkOrder, WorkOrderStage, WorkOrderPhoto, Employee } from '../../types';
import { ApiError } from '../../lib/api';
import { NotesThread } from '../shared/NotesThread';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  employees: Employee[];
  onToggleStage: (orderId: string, stageId: string) => void;
  onAddPhoto: (orderId: string, file: File, caption: string, type: WorkOrderPhoto['type']) => Promise<void>;
  onAddWorkOrderNote: (orderId: string, text: string) => Promise<void>;
  onUpdateTeam: (orderId: string, teamMemberIds: string[]) => Promise<void>;
  onSelectClient: (clientId: string) => void;
}

// Fila para sumar un empleado al equipo de la obra — componente aparte para
// mantener su propio estado (empleado elegido en el select) por tarjeta.
const AssignTeamRow: React.FC<{
  order: WorkOrder;
  employees: Employee[];
  onUpdateTeam: (orderId: string, teamMemberIds: string[]) => Promise<void>;
}> = ({ order, employees, onUpdateTeam }) => {
  const [pickedId, setPickedId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const available = employees.filter(
    (e) => e.status === 'activo' && !order.assignedTeamIds.includes(e.id)
  );

  const handleAssign = async () => {
    if (!pickedId || isSaving) return;
    setIsSaving(true);
    try {
      await onUpdateTeam(order.id, [...order.assignedTeamIds, pickedId]);
      setPickedId('');
    } finally {
      setIsSaving(false);
    }
  };

  if (available.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={pickedId}
        onChange={(e) => setPickedId(e.target.value)}
        className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-[#800020]"
      >
        <option value="">Elegir empleado…</option>
        {available.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={!pickedId || isSaving}
        className="p-1.5 rounded-lg bg-[#0A192F] text-white disabled:opacity-40 cursor-pointer"
        title="Asignar"
      >
        <UserPlus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  employees,
  onToggleStage,
  onAddPhoto,
  onAddWorkOrderNote,
  onUpdateTeam,
  onSelectClient,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'en_progreso' | 'completado'>('en_progreso');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoType, setNewPhotoType] = useState<'antes' | 'durante' | 'despues'>('durante');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Refleja en el modal abierto los cambios que ya llegaron por props
  // (workOrders se actualiza en el padre tras cada acción real).
  const liveSelectedOrder = selectedOrder
    ? workOrders.find((o) => o.id === selectedOrder.id) || selectedOrder
    : null;

  const filteredOrders = workOrders.filter((o) => {
    if (activeTab !== 'all' && o.status !== activeTab) return false;
    return true;
  });

  const handleUploadPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newPhotoFile) return;

    setPhotoError(null);
    setIsUploadingPhoto(true);
    try {
      await onAddPhoto(
        selectedOrder.id,
        newPhotoFile,
        newPhotoCaption || `Avance de obra (${newPhotoType})`,
        newPhotoType
      );
      setNewPhotoCaption('');
      setNewPhotoFile(null);
    } catch (err) {
      setPhotoError(err instanceof ApiError ? err.message : 'No se pudo subir la foto.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Navy & Crimson */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A192F] text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-stone-100 font-bold text-xs uppercase tracking-wider">
            <span>Ejecución de Obras</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-stone-100">
            Órdenes de Trabajo en Curso
          </h2>
          <p className="text-xs text-stone-300">
            Seguimiento de fases técnicas para oficiales, fontaneros y montadores. Galería del Antes, Durante y Después para clientes y redes sociales.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('en_progreso')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'en_progreso' ? 'bg-[#580812] text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            En Curso ({workOrders.filter((w) => w.status === 'en_progreso').length})
          </button>
          <button
            onClick={() => setActiveTab('completado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'completado' ? 'bg-[#580812] text-white' : 'text-stone-300 hover:text-white'
            }`}
          >
            Finalizadas ({workOrders.filter((w) => w.status === 'completado').length})
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#800020]">{order.orderNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      order.projectType === 'cocina'
                        ? 'bg-[#800020] text-white'
                        : 'bg-[#0A192F] text-white'
                    }`}
                  >
                    {order.projectType}
                  </span>
                </div>
                <h3 className="font-black text-base text-[#0A192F] mt-1">{order.title}</h3>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#800020]" />
                  <span>{order.address}</span>
                </div>
                {order.clientId ? (
                  <button
                    onClick={() => onSelectClient(order.clientId)}
                    className="text-xs text-[#0A192F] font-bold flex items-center gap-1 mt-0.5 hover:text-[#800020] hover:underline cursor-pointer"
                    title="Ver ficha del cliente (notas y contacto)"
                  >
                    <User className="w-3.5 h-3.5 text-[#800020]" />
                    <span>{order.clientName}</span>
                    {order.clientPhone && <span className="text-slate-400 font-medium">· {order.clientPhone}</span>}
                  </button>
                ) : (
                  order.clientName && (
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.clientName}</span>
                      {order.clientPhone && <span className="text-slate-400">· {order.clientPhone}</span>}
                    </div>
                  )
                )}
              </div>

              <div className="text-right">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'en_progreso'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {order.status === 'en_progreso' ? 'En Obra' : 'Completada'}
                </span>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-1 bg-[#FAF8F5] p-3 rounded-xl">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Progreso de Reforma</span>
                <span className="text-[#800020]">{order.progressPercentage}%</span>
              </div>
              <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#800020] rounded-full transition-all duration-500"
                  style={{ width: `${order.progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>Inicio: {order.startDate}</span>
                <span>Entrega prevista: {order.expectedEndDate}</span>
              </div>
            </div>

            {/* Team Assignment */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#0A192F] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Empleado Asignado</span>
                </span>
                <AssignTeamRow order={order} employees={employees} onUpdateTeam={onUpdateTeam} />
              </div>

              {order.assignedTeam.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-400">
                  Sin empleado asignado todavía
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {order.assignedTeamIds.map((id, i) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold"
                    >
                      {order.assignedTeam[i]}
                      <button
                        onClick={() => onUpdateTeam(order.id, order.assignedTeamIds.filter((tid) => tid !== id))}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Quitar de la obra"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Checklist of Stages */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#0A192F] flex items-center justify-between">
                <span>Fases de Ejecución Técnica ({order.stages.filter((s) => s.completed).length}/{order.stages.length})</span>
                <span className="text-[11px] text-slate-400">Clic para marcar avance</span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {order.stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => onToggleStage(order.id, stage.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                      stage.completed
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-50 text-slate-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          stage.completed ? 'bg-emerald-700 text-white' : 'border border-stone-300'
                        }`}
                      >
                        {stage.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={stage.completed ? 'line-through opacity-80' : 'font-semibold'}>
                        {stage.name}
                      </span>
                    </div>

                    {stage.assignedWorker && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 font-medium border border-stone-200">
                        👤 {stage.assignedWorker}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos Preview */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0A192F] flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Fotos de Avance ({order.photos.length})</span>
                </span>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-[#800020] hover:text-[#66001a] font-bold cursor-pointer"
                >
                  + Subir / Ver Galería
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {order.photos.map((photo) => (
                  <div key={photo.id} className="relative h-20 rounded-lg overflow-hidden group border border-stone-200">
                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-[#0A192F] text-white">
                      {photo.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments / Notes — visibles en la tarjeta, no solo dentro del modal */}
            <div className="pt-2 border-t border-stone-100">
              <button
                onClick={() => setExpandedNotesId(expandedNotesId === order.id ? null : order.id)}
                className="w-full text-xs font-bold text-[#0A192F] flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Comentarios ({order.notes.length})</span>
                </span>
                {expandedNotesId === order.id ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {expandedNotesId !== order.id && order.notes.length > 0 && (
                <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                  {order.notes[order.notes.length - 1].text}
                </p>
              )}

              {expandedNotesId === order.id && (
                <div className="mt-3 bg-slate-900 rounded-xl p-4">
                  <NotesThread
                    notes={order.notes}
                    onAddNote={(text) => onAddWorkOrderNote(order.id, text)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Upload & Gallery Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Galería de Obra: {selectedOrder.title}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Add New Photo Form */}
              <form onSubmit={handleUploadPhotoSubmit} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Registrar Nueva Fotografía de Avance
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Etapa de la foto</label>
                    <select
                      value={newPhotoType}
                      onChange={(e) => setNewPhotoType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="antes">Antes (Estado Original)</option>
                      <option value="durante">Durante (Trabajo Técnico)</option>
                      <option value="despues">Después (Resultado Final)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 mb-1 font-semibold">Descripción / Comentario</label>
                    <input
                      type="text"
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      placeholder="Ej. Alicatado porcelánico finalizado en pared frontal"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Archivo de la foto *</label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-amber-500 file:text-slate-950 file:font-bold file:cursor-pointer"
                  />
                </div>

                {photoError && (
                  <div className="text-red-400 bg-red-950/40 border border-red-900 rounded-lg p-2">{photoError}</div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploadingPhoto || !newPhotoFile}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isUploadingPhoto ? 'Subiendo...' : 'Guardar Foto'}</span>
                  </button>
                </div>
              </form>

              {/* Photos List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(liveSelectedOrder?.photos || []).map((ph) => (
                  <div key={ph.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 space-y-2 p-2">
                    <img src={ph.url} alt={ph.caption} className="w-full h-40 object-cover rounded-lg" />
                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300">
                          {ph.type}
                        </span>
                        <span className="text-slate-400 text-[10px]">{ph.uploadedAt}</span>
                      </div>
                      <p className="text-slate-200 font-medium">{ph.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
