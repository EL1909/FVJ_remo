import React, { useState, useRef, useEffect } from 'react';
import {
  Bath,
  CookingPot,
  Plus,
  Search,
  Bell,
  Calendar,
  Package,
  Share2,
  FileText,
  LayoutGrid,
  ChevronDown,
  Globe,
} from 'lucide-react';

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
}) => {

  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Close plus popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
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
          <div className="flex items-center gap-2.5">
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
          </div>
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
          {onSwitchToPublic && (
            <button
              onClick={onSwitchToPublic}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-stone-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Ver Landing Page pública para clientes"
            >
              <Globe className="w-4 h-4 text-stone-300" />
              <span className="hidden sm:inline">Ver Web Pública</span>
            </button>
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

          {/* Social feed status indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800/80 border border-stone-700/60 rounded-xl text-xs text-stone-200">
            <span className="font-semibold text-[11px]">TikTok / IG Activo</span>
          </div>

          {/* Notification bell */}
          <button className="relative p-2 rounded-xl bg-slate-800/80 text-stone-300 hover:text-white hover:bg-slate-700 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#580812]"></span>
          </button>

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

