import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { CompanyData } from '../../types';

interface CapabilitiesPresentationProps {
  companyData?: CompanyData;
}

interface ModuleGroup {
  label: string;
  modules: { title: string; items: string[] }[];
}

const GROUPS: ModuleGroup[] = [
  {
    label: 'Sitio web público',
    modules: [
      {
        title: 'Presentación & captación de clientes',
        items: [
          'Página de portada con video o imagen personalizable, editable sin tocar código',
          'Catálogo de proyectos realizados con fotos múltiples, ubicación, tiempo de ejecución y precio estimado',
          'Reseñas de clientes verificadas, con calificación y comentario',
          'Formulario de solicitud de cita de medición gratuita, con confirmación automática',
          'Vitrina de publicaciones de Instagram y TikTok',
          'Datos de contacto, horario y dirección siempre actualizados desde el panel',
        ],
      },
    ],
  },
  {
    label: 'Panel de gestión interno',
    modules: [
      {
        title: 'Clientes & presupuestos',
        items: [
          'Ficha de cliente con historial, notas y preferencia de contacto',
          'Presupuestos desglosados por partida (materiales, mano de obra, impuestos)',
          'Aprobación del presupuesto genera automáticamente la orden de obra',
          'Facturación con hitos de pago parciales y seguimiento de cobros',
        ],
      },
      {
        title: 'Obras en curso',
        items: [
          'Calendario de citas, visitas técnicas y entregas de material',
          'Seguimiento de obra por etapas, con equipo asignado y fotos de avance',
          'Registro de materiales comprados, proveedores y costos reales',
          'Control de gastos de empleados asociados a cada obra',
        ],
      },
      {
        title: 'Equipo de trabajo',
        items: [
          'Perfil de cada empleado: oficio, contacto y condición salarial',
          'Asignación de personal a obras y visitas programadas',
          'Historial de gastos y notas por empleado',
        ],
      },
    ],
  },
  {
    label: 'Contenido web autogestionable',
    modules: [
      {
        title: 'Panel de sitio web',
        items: [
          'Editar datos de la empresa (nombre, contacto, RIF, logo) sin ayuda técnica',
          'Subir o reemplazar el video de portada, con velocidad de reproducción ajustable',
          'Administrar el catálogo de proyectos mostrados al público',
          'Aprobar o rechazar reseñas antes de que se publiquen',
        ],
      },
    ],
  },
  {
    label: 'Notificaciones & conectividad',
    modules: [
      {
        title: 'Siempre al tanto',
        items: [
          'Notificaciones internas para el equipo (citas, cotizaciones, pagos)',
          'Notificaciones push en el navegador, incluso con el panel cerrado',
          'Sincronización de resúmenes financieros con EsfuerzoVZ',
        ],
      },
    ],
  },
];

export const CapabilitiesPresentation: React.FC<CapabilitiesPresentationProps> = ({ companyData }) => {
  const companyName = companyData?.companyName || 'Remodelaciones FVJ';

  const handleClose = () => {
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#580812] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al sitio</span>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Resumen de Capacidades
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-wider text-[#580812] mb-3">
          Resumen de capacidades
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-[#0A192F] leading-tight tracking-tight mb-4 text-balance">
          Sistema de Gestión {companyName}
        </h1>
        <p className="text-slate-600 max-w-xl leading-relaxed mb-14">
          Panel administrativo, sitio web y herramientas de seguimiento de obra, todo conectado en un solo sistema.
        </p>

        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-14 mb-1 first:mt-0">
              {group.label}
            </p>
            {group.modules.map((mod) => (
              <section key={mod.title} className="py-9 border-b border-stone-200">
                <h2 className="text-lg font-black text-[#0A192F] mb-5">{mod.title}</h2>
                <ul className="space-y-3">
                  {mod.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                      <span className="w-2 h-0.5 bg-[#580812] mt-2.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ))}

        <div className="mt-16 p-6 rounded-2xl bg-[#0A192F] text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Desarrollo</p>
            <p className="font-bold text-sm">Este sistema fue construido por EsfuerzoVZ</p>
          </div>
          <a
            href="https://esfuerzovz.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <span>Ver más desarrollos</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
};
