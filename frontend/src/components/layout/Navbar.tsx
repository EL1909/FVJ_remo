import React, { useState, useRef, useEffect } from 'react';
import {
  Bath,
  CookingPot,
  Plus,
  Search,
  Bell,
  BellRing,
  Calendar,
  Package,
  Share2,
  FileText,
  LayoutGrid,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Profile } from '../../lib/api';
import { AppNotification } from '../../lib/notifications';
import { useNotifications } from '../../hooks/useNotifications';
import { getPermission, getSubscription, pushSupported, subscribeToPush } from '../../lib/push';

interface NavbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenNewEstimate: () => void;
  onOpenNewEvent: () => void;
  onOpenNewPurchase: () => void;
  activeViewTitle: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onSwitchToPublic?: () => void;
  currentUser?: Profile | null;
  onNotificationClick: (notification: AppNotification) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  setSearchTerm,
  onOpenNewEstimate,
  onOpenNewEvent,
  onOpenNewPurchase,
  activeViewTitle,
  isMenuOpen,
  onToggleMenu,
  onSwitchToPublic,
  currentUser,
  onNotificationClick,
}) => {

  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { notifications, markRead } = useNotifications(!!currentUser);

  // null mientras se resuelve; true solo si el dispositivo puede recibir
  // push y todavía no está suscrito — evita ofrecer "Activar" de más.
  const [canEnablePush, setCanEnablePush] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    if (!isNotifOpen || !pushSupported() || getPermission() === 'denied') return;
    getSubscription().then((sub) => setCanEnablePush(!sub));
  }, [isNotifOpen]);

  const handleEnablePush = async () => {
    if (enablingPush) return;
    setEnablingPush(true);
    try {
      if (await subscribeToPush()) setCanEnablePush(false);
    } catch {
      /* silencioso: el bell no debe romperse si el navegador niega el permiso */
    } finally {
      setEnablingPush(false);
    }
  };

  const handleOpenNotification = (n: AppNotification) => {
    if (!n.is_read) markRead(n.id);
    setIsNotifOpen(false);
    onNotificationClick(n);
  };

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#0A192F] backdrop-blur-md text-white px-4 lg:px-6 py-3 shadow-md">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToPublic}
            className="flex items-center gap-2.5 cursor-pointer text-left"
            title="Ir a la página de inicio"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider uppercase text-white">
                  REMODELACIONES <span className="text-stone-300">FVJ</span>
                </span>
              </div>
              {activeViewTitle && activeViewTitle !== 'Panel General' && (
                <h1 className="text-xs text-stone-300 font-medium capitalize hidden md:block">
                  {activeViewTitle}
                </h1>
              )}
            </div>
          </button>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, nº presupuesto, material o dirección..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#580812] focus:ring-1 focus:ring-[#580812] transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <span className="hidden md:inline text-[11px] text-stone-300 font-medium">
              {currentUser.first_name || currentUser.email}
            </span>
          )}

          {/* '+' Button with Toggle Selection (Presupuesto | Visita) */}
          <div className="relative" ref={plusMenuRef}>
            <button
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-white font-bold transition-all shadow-md cursor-pointer ${
                isPlusMenuOpen
                  ? 'bg-[#42050D] ring-2 ring-stone-400/50 shadow-[#580812]/40'
                  : 'bg-[#580812] hover:bg-[#42050D] shadow-[#580812]/25'
              }`}
              title="Nueva acción (+ Presupuesto / Visita)"
              aria-label="Toggle selección nueva acción"
            >
              <Plus className={`w-5 h-5 stroke-[3] transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Popover Selection: Presupuesto | Visita */}
            {isPlusMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-2xl shadow-2xl border border-stone-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-stone-100 mb-1">
                  Seleccionar Tipo
                </div>
                <button
                  onClick={() => {
                    onOpenNewEstimate();
                    setIsPlusMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-100 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#580812] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#0A192F] group-hover:text-[#580812]">
                      Presupuesto
                    </div>
                    <div className="text-[10px] text-slate-500">Cotización y cálculo de obra</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onOpenNewEvent();
                    setIsPlusMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-100 text-left transition-colors cursor-pointer group mt-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0A192F] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar className="w-4 h-4 text-stone-200" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#0A192F] group-hover:text-[#580812]">
                      Visita de Medición
                    </div>
                    <div className="text-[10px] text-slate-500">Agendar toma de datos o cita</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onOpenNewPurchase}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-stone-200 font-medium text-xs transition-colors cursor-pointer"
            title="Registrar compra de material"
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>Material</span>
          </button>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
                isNotifOpen
                  ? 'bg-[#580812] text-white'
                  : 'bg-slate-800/80 text-stone-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Notificaciones"
              aria-label="Ver notificaciones"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#580812] text-white text-[9px] font-black flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white text-slate-900 rounded-2xl shadow-2xl border border-stone-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Notificaciones
                  </span>
                  {notifications.length > 0 && (
                    <span className="text-[10px] font-bold text-[#580812]">
                      {notifications.length} sin leer
                    </span>
                  )}
                </div>

                {canEnablePush && (
                  <div className="mx-3 mt-3 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                    <BellRing className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-[#0A192F]">Avisos en este dispositivo</div>
                      <div className="text-[10px] text-slate-500">Nuevas visitas y presupuestos al instante.</div>
                    </div>
                    <button
                      onClick={handleEnablePush}
                      disabled={enablingPush}
                      className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg bg-[#0A192F] text-white disabled:opacity-40 cursor-pointer"
                    >
                      {enablingPush ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Activar'}
                    </button>
                  </div>
                )}

                <div className="max-h-96 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">Sin notificaciones nuevas</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleOpenNotification(n)}
                        className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#580812] mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#0A192F] truncate">{n.title}</div>
                          {n.body && <div className="text-[11px] text-slate-500 line-clamp-2">{n.body}</div>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Apps Menu Icon (Replaces RL avatar on far right) */}
          <button
            onClick={onToggleMenu}
            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              isMenuOpen
                ? 'bg-[#580812] text-white shadow-md shadow-[#580812]/40 ring-2 ring-stone-400/50'
                : 'bg-white/10 hover:bg-[#580812] text-white'
            }`}
            title="Módulos de Gestión (Apps)"
            aria-label="Abrir Módulos de Gestión"
          >
            <LayoutGrid className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

