import React, { useState } from 'react';
import {
  TrendingUp,
  FileText,
  HardHat,
  Receipt,
  Calendar as CalendarIcon,
  Bath,
  CookingPot,
  Share2,
  Clock,
  ArrowUpRight,
  Plus,
  Users,
  Eye,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import {
  Estimate,
  WorkOrder,
  Invoice,
  CalendarEvent,
  SocialPost,
  Client,
} from '../../types';
import { Profile } from '../../lib/api';
import { SyncModal } from '../modals/SyncModal';

interface DashboardViewProps {
  estimates: Estimate[];
  workOrders: WorkOrder[];
  invoices: Invoice[];
  calendarEvents: CalendarEvent[];
  socialPosts: SocialPost[];
  clients: Client[];
  onNavigate: (view: any) => void;
  onOpenNewEstimate: () => void;
  onOpenNewEvent: () => void;
  currentUser?: Profile | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  estimates,
  workOrders,
  invoices,
  calendarEvents,
  socialPosts,
  onNavigate,
  onOpenNewEstimate,
  onOpenNewEvent,
  currentUser,
}) => {
  const userFullName =
    [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ').trim() ||
    currentUser?.email ||
    '';

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Calculations
  const pendingEstimates = estimates.filter((e) => e.status === 'enviado' || e.status === 'borrador');
  const activeWorkOrders = workOrders.filter((w) => w.status === 'en_progreso');
  const totalBilledMonth = invoices
    .filter((i) => i.status === 'pagada')
    .reduce((sum, i) => sum + i.total, 0);

  const totalTikTokViews = socialPosts.reduce((sum, p) => sum + p.views, 0);
  const totalLeadsSocial = socialPosts.reduce((sum, p) => sum + p.leadsGenerated, 0);

  const upcomingEvents = calendarEvents
    .filter((e) => !e.completed)
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Welcome Banner - Navy & Wine Red */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0A192F] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#580812] text-stone-100 text-xs font-bold uppercase tracking-wider">
              <span>FVJ Remodelaciones</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-stone-100 tracking-tight">
              Bienvenido{userFullName ? <span className="text-stone-100"> {userFullName}</span> : ''}
            </h2>
            <p className="text-stone-300 text-xs md:text-sm leading-relaxed">
              Supervisa agendas de medición, aprueba presupuestos de obras de baños y cocinas, y analiza la conversión de clientes desde TikTok e Instagram.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewEstimate}
              className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Presupuesto</span>
            </button>
            <button
              onClick={onOpenNewEvent}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-100 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4 text-stone-200" />
              <span>Agendar Medición</span>
            </button>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-100 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
              title="Publicar resumen del negocio a EsfuerzoVZ"
            >
              <UploadCloud className="w-4 h-4 text-amber-300" />
              <span>Publicar a EsfuerzoVZ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards - Clear White Cards on White-Bone Canvas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Billed */}
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cobrado este Mes</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0A192F]">
              {totalBilledMonth.toLocaleString('es-ES', { minimumFractionDigits: 2 })} $
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18% vs mes anterior</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Work Orders */}
        <div
          onClick={() => onNavigate('work_orders')}
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Obras en Ejecución</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#580812] flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardHat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0A192F]">
              {activeWorkOrders.length} <span className="text-xs font-semibold text-slate-500">reformas activas</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1 text-[#580812] font-bold">
                <Bath className="w-3.5 h-3.5" /> 1 Baño
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#580812] font-bold">
                <CookingPot className="w-3.5 h-3.5" /> 1 Cocina
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Pending Estimates */}
        <div
          onClick={() => onNavigate('estimates')}
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Presupuestos Enviados</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#0A192F] flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0A192F]">
              {pendingEstimates.length} <span className="text-xs font-semibold text-slate-500">enviados</span>
            </div>
            <div className="mt-1 text-xs font-bold text-[#580812]">
              Valor total: {pendingEstimates.reduce((a, b) => a + b.total, 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })} $
            </div>
          </div>
        </div>

        {/* KPI 4: Social Media Reach */}
        <div
          onClick={() => onNavigate('social_gallery')}
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TikTok & Instagram</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#580812] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0A192F]">
              {(totalTikTokViews / 1000).toFixed(0)}k <span className="text-xs font-semibold text-slate-500">vistas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#580812] font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>{totalLeadsSocial} clientes generados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Active Projects Progress & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Work Orders Live Progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#0A192F] flex items-center gap-2">
                <HardHat className="w-5 h-5 text-[#580812]" />
                <span>Estado de Obras en Tiempo Real</span>
              </h3>
              <p className="text-xs text-slate-500">
                Avance de fases para reformas de baños y cocinas en marcha
              </p>
            </div>
            <button
              onClick={() => onNavigate('work_orders')}
              className="text-xs font-bold text-[#580812] hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Ver todas ({workOrders.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {workOrders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="bg-[#FAF8F5] rounded-xl p-4 space-y-3 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        order.projectType === 'cocina'
                          ? 'bg-amber-100 text-amber-900'
                          : order.projectType === 'baño'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-rose-100 text-[#580812]'
                      }`}
                    >
                      {order.projectType}
                    </span>
                    <span className="font-bold text-sm text-[#0A192F]">{order.title}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Cliente: <span className="text-[#580812] font-bold">{order.clientName}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                      Progreso: <strong className="text-[#0A192F]">{order.progressPercentage}%</strong>
                    </span>
                    <span>Entrega estimada: {order.expectedEndDate}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        order.progressPercentage === 100
                          ? 'bg-emerald-600'
                          : 'bg-[#580812]'
                      }`}
                      style={{ width: `${order.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Next pending stage */}
                <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-[#580812] shrink-0" />
                    <span className="truncate">
                      Próxima etapa:{' '}
                      <strong className="text-slate-900">
                        {order.stages.find((s) => !s.completed)?.name || 'Obra finalizada'}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0 font-semibold">
                    Presupuesto: {order.budgetTotal.toLocaleString('es-ES')} $
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Calendar Events */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#0A192F] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#580812]" />
              <span>Próximas Citas</span>
            </h3>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-bold text-[#580812] hover:underline flex items-center gap-1"
            >
              <span>Agenda</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#FAF8F5] rounded-xl p-3 space-y-1 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-rose-100 text-[#580812]">
                    {evt.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {evt.date} • {evt.startTime}
                  </span>
                </div>

                <div className="font-bold text-xs text-[#0A192F] leading-tight">
                  {evt.title}
                </div>

                <div className="text-[11px] text-slate-600 truncate">
                  📍 {evt.address}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenNewEvent}
            className="w-full py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#580812]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar nueva cita</span>
          </button>
        </div>
      </div>

      {/* Social Media Highlight Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-[#0A192F] flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#580812]" />
              <span>Publicaciones Destacadas en TikTok e Instagram</span>
            </h3>
            <p className="text-xs text-slate-500">
              Vídeos de transformaciones de baños y cocinas que están captando nuevos clientes
            </p>
          </div>
          <button
            onClick={() => onNavigate('social_gallery')}
            className="text-xs font-bold text-[#580812] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Portafolio de Redes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {socialPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => onNavigate('social_gallery')}
              className="group relative overflow-hidden rounded-xl bg-[#FAF8F5] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-[#580812] text-white shadow-md">
                  {post.platform}
                </span>
                <span className="absolute bottom-2 left-2 text-xs font-bold text-white flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-stone-200" />
                  <span>{post.views.toLocaleString('es-ES')} vistas</span>
                </span>
              </div>

              <div className="p-3 space-y-1">
                <div className="font-bold text-xs text-[#0A192F] line-clamp-2">
                  {post.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#C8102E] font-bold">
                  <span>+{post.leadsGenerated} leads solicitados</span>
                  <span className="text-slate-500">{post.publishedDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
    </div>
  );
};
