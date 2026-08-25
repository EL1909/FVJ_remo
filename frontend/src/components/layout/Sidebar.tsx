import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  HardHat,
  Receipt,
  Package,
  Share2,
  Bath,
  CookingPot,
  Sparkles,
  X,
  ChevronRight,
  LayoutGrid,
  UserCheck,
  Globe,
  LogOut,
} from 'lucide-react';

export type ViewType =
  | 'dashboard'
  | 'calendar'
  | 'clients'
  | 'employees'
  | 'estimates'
  | 'work_orders'
  | 'invoices'
  | 'materials_costs'
  | 'social_gallery'
  | 'website_cms';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  pendingEstimatesCount: number;
  activeWorkOrdersCount: number;
  unpaidInvoicesCount: number;
  isMenuOpen: boolean;
  onCloseMenu: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  pendingEstimatesCount,
  activeWorkOrdersCount,
  unpaidInvoicesCount,
  isMenuOpen,
  onCloseMenu,
  onLogout,
}) => {
  const menuItems: {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
    sublabel?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Panel General',
      sublabel: 'Métricas e indicadores',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'calendar',
      label: 'Agenda y Calendario',
      sublabel: 'Visitas y fechas clave',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'clients',
      label: 'Clientes',
      sublabel: 'Directorio y contactos CRM',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'employees',
      label: 'Personal y Equipo',
      sublabel: 'Asignaciones, sueldos y gastos',
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      id: 'estimates',
      label: 'Presupuestos',
      sublabel: 'Cotizaciones y márgenes',
      icon: <FileText className="w-5 h-5" />,
      badge: pendingEstimatesCount,
      badgeColor: 'bg-[#580812] text-white',
    },
    {
      id: 'work_orders',
      label: 'Órdenes de Trabajo',
      sublabel: 'Progreso y etapas de obra',
      icon: <HardHat className="w-5 h-5" />,
      badge: activeWorkOrdersCount,
      badgeColor: 'bg-[#0A192F] text-white',
    },
    {
      id: 'invoices',
      label: 'Facturas',
      sublabel: 'Cobros y certificaciones',
      icon: <Receipt className="w-5 h-5" />,
      badge: unpaidInvoicesCount,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'materials_costs',
      label: 'Materiales y Costos',
      sublabel: 'Compras y proveedores',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'social_gallery',
      label: 'TikTok & Instagram',
      sublabel: 'Portafolio y vídeos',
      icon: <Share2 className="w-5 h-5" />,
    },
    {
      id: 'website_cms',
      label: 'Gestión Website',
      sublabel: 'Vídeo hero, proyectos y footer',
      icon: <Globe className="w-5 h-5" />,
    },
  ];

  const handleSelectView = (view: ViewType) => {
    setCurrentView(view);
    onCloseMenu();
  };

  return (
    <>
      {/* Full Screen Hamburger Menu Overlay (Mobile & Desktop Drawer) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A192F] text-white flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
          {/* Menu Header */}
          <div className="p-6 flex items-center justify-between border-b border-white/10 bg-[#071324]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#580812] flex items-center justify-center text-white font-black shadow-lg">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  Módulos de Gestión
                </h2>
                <p className="text-xs text-stone-300">
                  REMODELACIONES FVJ • Especialistas en Baños y Cocinas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-[#580812] text-white transition-all cursor-pointer flex items-center gap-1.5"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Salir</span>
                </button>
              )}

              <button
                onClick={onCloseMenu}
                className="p-2.5 rounded-full bg-white/10 hover:bg-[#580812] text-white transition-all cursor-pointer"
                aria-label="Cerrar menú"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Module Links List */}
          <div className="p-6 flex-1 space-y-3 max-w-2xl mx-auto w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
              Selecciona un Módulo
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-[#580812] text-white shadow-xl shadow-[#580812]/40 font-bold ring-2 ring-stone-400/50'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-stone-200 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-stone-300 group-hover:text-rose-300 group-hover:bg-white/10'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold truncate">{item.label}</div>
                        <div
                          className={`text-xs truncate ${
                            isActive ? 'text-rose-100' : 'text-stone-400'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isActive ? 'text-white translate-x-1' : 'text-stone-500 group-hover:text-white'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-6 bg-[#071324] border-t border-white/10 text-center text-xs text-stone-400">
            <p className="font-semibold text-stone-300">REMODELACIONES FVJ ERP & CRM v2.5</p>
            <p className="mt-1">Gestión integral de cotizaciones, proveedores, obras y redes sociales.</p>
          </div>
        </div>
      )}
    </>
  );
};
