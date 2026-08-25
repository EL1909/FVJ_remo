import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Filter,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  Wrench,
  Truck,
  Building2,
  MessageSquare,
  Camera,
  Upload,
  FileText,
} from 'lucide-react';
import { CalendarEvent, Employee } from '../../types';
import { NotesThread } from '../shared/NotesThread';
import { ApiError } from '../../lib/api';

interface CalendarViewProps {
  events: CalendarEvent[];
  employees: Employee[];
  onToggleEventComplete: (id: string) => void;
  onOpenNewEvent: () => void;
  onAddCalendarEventNote: (id: string, text: string) => Promise<void>;
  onAddCalendarEventPhoto: (id: string, file: File, caption: string) => Promise<void>;
  onConvertToEstimate: (event: CalendarEvent) => void;
  onConfirmEvent: (id: string, teamMemberId: string) => Promise<void>;
  // Llega desde el bell de notificaciones ("nueva visita agendada"): abre y
  // resalta esa cita puntual entre todo lo demás que haya en la agenda.
  focusEventId?: string | null;
  onFocusEventConsumed?: () => void;
}

// Fila "Confirmar" para una cita pendiente (reserva de un guest): elegir
// quién la atiende y confirmarla. Componente aparte para poder mantener su
// propio estado (empleado seleccionado) por tarjeta, sin un mapa de estado
// indexado por id en el padre.
const ConfirmAppointmentRow: React.FC<{
  event: CalendarEvent;
  employees: Employee[];
  onConfirm: (id: string, teamMemberId: string) => Promise<void>;
}> = ({ event, employees, onConfirm }) => {
  const [teamMemberId, setTeamMemberId] = useState(event.teamMemberId || employees[0]?.id || '');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!teamMemberId) {
      setError('Elegí quién atiende la cita.');
      return;
    }
    setError('');
    setIsConfirming(true);
    try {
      await onConfirm(event.id, teamMemberId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo confirmar la cita.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
        Reserva pendiente — asigná quién la atiende y confirmá
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={teamMemberId}
          onChange={(e) => setTeamMemberId(e.target.value)}
          className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900"
        >
          <option value="">— Elegir empleado —</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isConfirming ? 'Confirmando...' : 'Confirmar'}</span>
        </button>
      </div>
      {error && <p className="text-[11px] font-bold text-red-600">{error}</p>}
    </div>
  );
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  employees,
  onToggleEventComplete,
  onOpenNewEvent,
  onAddCalendarEventNote,
  onAddCalendarEventPhoto,
  onConvertToEstimate,
  onConfirmEvent,
  focusEventId,
  onFocusEventConsumed,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-05');
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [expandedPhotosId, setExpandedPhotosId] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  useEffect(() => {
    if (!focusEventId) return;
    setFilterType('all');
    setExpandedNotesId(focusEventId);
    setHighlightedId(focusEventId);
    document.getElementById(`calendar-event-${focusEventId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timeout = window.setTimeout(() => setHighlightedId(null), 3000);
    onFocusEventConsumed?.();
    return () => window.clearTimeout(timeout);
  }, [focusEventId]);

  const getEventTypeBadge = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'visita_tecnica':
        return {
          label: 'Visita de Medición',
          icon: <Wrench className="w-3.5 h-3.5" />,
          color: 'bg-[#800020] text-white',
        };
      case 'inicio_obra':
        return {
          label: 'Inicio de Obra',
          icon: <Building2 className="w-3.5 h-3.5" />,
          color: 'bg-[#0A192F] text-white',
        };
      case 'fin_obra':
        return {
          label: 'Entrega de Obra',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          color: 'bg-emerald-700 text-white',
        };
      case 'entrega_material':
        return {
          label: 'Llegada de Material',
          icon: <Truck className="w-3.5 h-3.5" />,
          color: 'bg-purple-800 text-white',
        };
      default:
        return {
          label: 'Reunión Cliente',
          icon: <User className="w-3.5 h-3.5" />,
          color: 'bg-slate-700 text-white',
        };
    }
  };

  const daysInAugust = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleUploadPhoto = async (eventId: string) => {
    if (!newPhotoFile) return;
    setPhotoError('');
    setIsUploadingPhoto(true);
    try {
      await onAddCalendarEventPhoto(eventId, newPhotoFile, newPhotoCaption.trim());
      setNewPhotoFile(null);
      setNewPhotoCaption('');
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
            <span>Planificación & Agendas de Obra</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-stone-100">
            Agenda de Visitas y Mediciones
          </h2>
          <p className="text-xs text-stone-300">
            Control de citas de toma de medidas, entregas de materiales (encimeras, azulejos, mamparas) y finalización de obras.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#580812] text-white shadow'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Mes</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#580812] text-white shadow'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            onClick={onOpenNewEvent}
            className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700 shrink-0">Filtrar por:</span>

          {[
            { id: 'all', label: 'Todas las Citas' },
            { id: 'visita_tecnica', label: 'Mediciones / Visitas' },
            { id: 'inicio_obra', label: 'Inicios de Obra' },
            { id: 'entrega_material', label: 'Entrega Material' },
            { id: 'fin_obra', label: 'Entregas de Obra' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === type.id
                  ? 'bg-[#800020] text-white shadow-sm'
                  : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Mostrando <strong className="text-[#800020] font-black">{filteredEvents.length}</strong> eventos
        </div>
      </div>

      {/* Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar Month Navigation */}
        <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0A192F]">Agosto 2026</h3>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
              <div key={day} className="py-1 font-bold text-slate-400 text-[10px]">
                {day}
              </div>
            ))}

            <div className="p-2 text-slate-300 text-[11px]">27</div>
            <div className="p-2 text-slate-300 text-[11px]">28</div>
            <div className="p-2 text-slate-300 text-[11px]">29</div>
            <div className="p-2 text-slate-300 text-[11px]">30</div>
            <div className="p-2 text-slate-300 text-[11px]">31</div>

            {daysInAugust.map((dayNum) => {
              const dayStr = `2026-08-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const hasEvents = events.some((e) => e.date === dayStr);
              const isSelected = selectedDate === dayStr;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDate(dayStr)}
                  className={`p-2 rounded-xl text-xs font-bold relative transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#800020] text-white shadow-md'
                      : hasEvents
                      ? 'bg-rose-50 text-[#800020] border border-rose-200'
                      : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  {dayNum}
                  {hasEvents && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#800020]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl space-y-2 text-xs">
            <div className="font-extrabold text-[#0A192F]">Leyenda de Colores</div>
            <div className="space-y-1.5 text-[11px] font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                <span className="text-slate-700">Mediciones & Visitas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A192F]" />
                <span className="text-slate-700">Inicios de Obra</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-800" />
                <span className="text-slate-700">Entrega de Materiales</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Event Cards List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0A192F] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#800020]" />
              <span>
                Citas Programadas para: <span className="text-[#800020]">{selectedDate}</span>
              </span>
            </h3>
            <button
              onClick={() => setFilterType('all')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Ver todos los días
            </button>
          </div>

          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 space-y-2 shadow-sm">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">No hay citas para la fecha seleccionada</div>
                <p className="text-xs text-slate-500">
                  Haz clic en "Nueva Cita" para programar una medición o entrega.
                </p>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const badge = getEventTypeBadge(evt.type);
                return (
                  <div
                    key={evt.id}
                    id={`calendar-event-${evt.id}`}
                    className={`bg-white rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all ${
                      evt.completed ? 'opacity-60 bg-stone-50' : ''
                    } ${highlightedId === evt.id ? 'ring-2 ring-[#800020] ring-offset-2' : ''}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                        {evt.status === 'pending' && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800">
                            Pendiente de Confirmar
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#0A192F] bg-slate-100 px-2 py-0.5 rounded-lg">
                          {evt.startTime} - {evt.endTime}
                        </span>
                      </div>

                      {evt.status !== 'pending' && (
                        <button
                          onClick={() => onToggleEventComplete(evt.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            evt.completed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#800020] text-white hover:bg-[#66001a]'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{evt.completed ? 'Completado' : 'Marcar Hecho'}</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-[#0A192F]">{evt.title}</h4>
                      {evt.description && (
                        <p className="text-xs text-slate-600">{evt.description}</p>
                      )}
                    </div>

                    {evt.status === 'pending' && (
                      <ConfirmAppointmentRow event={evt} employees={employees} onConfirm={onConfirmEvent} />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                        <span className="truncate">{evt.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                        <span className="truncate">
                          Cliente:{' '}
                          <strong className="text-[#0A192F]">{evt.clientName || 'Sin asignar'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-[#FAF8F5] px-3 py-1.5 rounded-lg flex items-center justify-between font-semibold">
                      <span>Responsable: <strong className="text-[#0A192F]">{evt.assignedTo}</strong></span>
                      <span>Fecha: {evt.date}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <button
                        onClick={() => setExpandedNotesId(expandedNotesId === evt.id ? null : evt.id)}
                        className="text-xs font-bold text-slate-500 hover:text-[#800020] flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Notas ({evt.notes.length})</span>
                      </button>

                      <button
                        onClick={() => setExpandedPhotosId(expandedPhotosId === evt.id ? null : evt.id)}
                        className="text-xs font-bold text-slate-500 hover:text-[#800020] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Fotos ({evt.photos.length})</span>
                      </button>

                      {(evt.type === 'visita_tecnica' || evt.type === 'medicion') && (
                        <button
                          onClick={() => onConvertToEstimate(evt)}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Convertir a Presupuesto</span>
                        </button>
                      )}
                    </div>

                    {expandedNotesId === evt.id && (
                      <div className="bg-slate-900 rounded-xl p-4">
                        <NotesThread
                          notes={evt.notes}
                          onAddNote={(text) => onAddCalendarEventNote(evt.id, text)}
                          emptyLabel="Sin notas todavía."
                        />
                      </div>
                    )}

                    {expandedPhotosId === evt.id && (
                      <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                        {evt.photos.length === 0 && (
                          <p className="text-xs text-slate-400 italic">Sin fotos todavía.</p>
                        )}
                        {evt.photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {evt.photos.map((ph) => (
                              <div key={ph.id} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                <img src={ph.url} alt={ph.caption} className="w-full h-24 object-cover" />
                                {ph.caption && (
                                  <p className="text-[10px] text-slate-300 p-1.5 truncate">{ph.caption}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-amber-500 file:text-slate-950 file:font-bold file:cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newPhotoCaption}
                            onChange={(e) => setNewPhotoCaption(e.target.value)}
                            placeholder="Descripción (opcional)"
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500"
                          />
                          <button
                            onClick={() => handleUploadPhoto(evt.id)}
                            disabled={isUploadingPhoto || !newPhotoFile}
                            className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingPhoto ? 'Subiendo...' : 'Subir'}</span>
                          </button>
                        </div>
                        {photoError && <p className="text-[11px] font-bold text-red-400">{photoError}</p>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
