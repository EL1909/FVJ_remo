import React, { useState } from 'react';
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
} from 'lucide-react';
import { CalendarEvent } from '../../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  onToggleEventComplete: (id: string) => void;
  onOpenNewEvent: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onToggleEventComplete,
  onOpenNewEvent,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-05');

  const filteredEvents = events.filter((e) => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

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
                    className={`bg-white rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all ${
                      evt.completed ? 'opacity-60 bg-stone-50' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-xs font-bold text-[#0A192F] bg-slate-100 px-2 py-0.5 rounded-lg">
                          {evt.startTime} - {evt.endTime}
                        </span>
                      </div>

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
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-[#0A192F]">{evt.title}</h4>
                      {evt.description && (
                        <p className="text-xs text-slate-600">{evt.description}</p>
                      )}
                    </div>

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
