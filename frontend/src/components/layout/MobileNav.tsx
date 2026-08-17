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
  UserCheck,
  Globe,
} from 'lucide-react';
import { ViewType } from './Sidebar';

interface MobileNavProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, setCurrentView, onOpenMenu }) => {
  const items = [
    { id: 'dashboard' as ViewType, label: 'Inicio', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'calendar' as ViewType, label: 'Agenda', icon: <Calendar className="w-5 h-5" /> },
    { id: 'estimates' as ViewType, label: 'Presupuesto', icon: <FileText className="w-5 h-5" /> },
    { id: 'work_orders' as ViewType, label: 'Obras', icon: <HardHat className="w-5 h-5" /> },
    { id: 'employees' as ViewType, label: 'Personal', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'website_cms' as ViewType, label: 'Website', icon: <Globe className="w-5 h-5" /> },
    { id: 'invoices' as ViewType, label: 'Facturas', icon: <Receipt className="w-5 h-5" /> },
    { id: 'materials_costs' as ViewType, label: 'Compras', icon: <Package className="w-5 h-5" /> },
    { id: 'social_gallery' as ViewType, label: 'Redes', icon: <Share2 className="w-5 h-5" /> },
    { id: 'clients' as ViewType, label: 'Clientes', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A192F] text-stone-200 py-2 px-1 shadow-2xl">
      <div className="flex items-center justify-around overflow-x-auto gap-1 text-center">
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'text-white bg-[#580812] font-bold shadow-md shadow-[#580812]/40'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="truncate w-full mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

