import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Tag,
  Search,
  FileText,
  HardHat,
  MessageSquare,
  Bath,
  CookingPot,
  X,
  ExternalLink,
} from 'lucide-react';
import { Client, Estimate, WorkOrder, Invoice } from '../../types';
import { NotesThread } from '../shared/NotesThread';

interface ClientsViewProps {
  clients: Client[];
  estimates: Estimate[];
  workOrders: WorkOrder[];
  invoices: Invoice[];
  onOpenNewClient: () => void;
  onSelectClientForEstimate: (client: Client) => void;
  onAddClientNote: (clientId: string, text: string) => Promise<void>;
  // Llega desde otra vista (ej. click en el cliente de una Orden de
  // Trabajo): abre directo la ficha de ese cliente para ver notas/contacto.
  focusClientId?: string | null;
  onFocusClientConsumed?: () => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  estimates,
  workOrders,
  invoices,
  onOpenNewClient,
  onSelectClientForEstimate,
  onAddClientNote,
  focusClientId,
  onFocusClientConsumed,
}) => {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // El modal abierto debe reflejar notas nuevas apenas se agregan, no solo
  // la foto del cliente en el momento de abrirlo.
  useEffect(() => {
    if (!selectedClient) return;
    const fresh = clients.find((c) => c.id === selectedClient.id);
    if (fresh && fresh !== selectedClient) setSelectedClient(fresh);
  }, [clients, selectedClient]);

  useEffect(() => {
    if (!focusClientId) return;
    const target = clients.find((c) => c.id === focusClientId);
    if (target) setSelectedClient(target);
    onFocusClientConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusClientId, clients]);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Navy & Crimson */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A192F] text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-stone-100 font-bold text-xs uppercase tracking-wider">
            <span>Directorio CRM</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-stone-100">
            Registro de Clientes
          </h2>
          <p className="text-xs text-stone-300">
            Ficha completa de propietarios con proyectos de baño o cocina, histórico de presupuestos y fotos de obra.
          </p>
        </div>

        <button
          onClick={onOpenNewClient}
          className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente por nombre, ciudad o etiqueta..."
          className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs text-[#0A192F] placeholder-slate-400 focus:outline-none focus:border-[#800020] shadow-sm transition-all"
        />
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientEstimates = estimates.filter((e) => e.clientId === client.id);
          const clientOrders = workOrders.filter((w) => w.clientId === client.id);

          return (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top User Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        client.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={client.name}
                      className="w-11 h-11 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h3 className="font-black text-sm text-[#0A192F]">{client.name}</h3>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#800020]" />
                        <span>{client.city}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {client.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-slate-700 border border-stone-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5 text-xs text-slate-700 bg-[#FAF8F5] p-3 rounded-xl font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#800020]" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate text-[11px] text-slate-500 pt-1 border-t border-stone-200">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                </div>

                {/* Client Stats Summary */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                    <div className="text-slate-500 text-[10px] font-bold">Presupuestos</div>
                    <div className="font-black text-[#0A192F] text-sm">{clientEstimates.length}</div>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                    <div className="text-slate-500 text-[10px] font-bold">Obras</div>
                    <div className="font-black text-[#800020] text-sm">{clientOrders.length}</div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedClient(client)}
                  className="flex-1 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#0A192F] font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Ver Ficha Completa
                </button>
                <button
                  onClick={() => onSelectClientForEstimate(client)}
                  className="px-3 py-1.5 rounded-lg bg-[#800020] hover:bg-[#66001a] text-white font-bold text-xs transition-colors cursor-pointer"
                  title="Crear presupuesto para este cliente"
                >
                  + Presupuesto
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client Detail Drawer/Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedClient.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={selectedClient.name}
                  className="w-12 h-12 rounded-xl object-cover border border-amber-500/50"
                />
                <div>
                  <h3 className="font-bold text-base text-white">{selectedClient.name}</h3>
                  <div className="text-xs text-slate-400">{selectedClient.city} • Registrado el {selectedClient.createdAt}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Contact & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
                  <div className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Datos de Contacto</div>
                  <div className="text-slate-200"><strong>Teléfono:</strong> {selectedClient.phone}</div>
                  <div className="text-slate-200"><strong>Email:</strong> {selectedClient.email}</div>
                  <div className="text-slate-200"><strong>Dirección:</strong> {selectedClient.address}</div>
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Notas</div>
                <NotesThread
                  notes={selectedClient.notes}
                  onAddNote={(text) => onAddClientNote(selectedClient.id, text)}
                  emptyLabel="Sin notas todavía."
                />
              </div>

              {/* Quotes / Estimates History */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Historial de Presupuestos</span>
                </h4>
                {estimates.filter((e) => e.clientId === selectedClient.id).length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-800/40 p-3 rounded-xl text-center">
                    No se han creado presupuestos para este cliente aún.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {estimates
                      .filter((e) => e.clientId === selectedClient.id)
                      .map((est) => (
                        <div
                          key={est.id}
                          className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-100">{est.estimateNumber} - {est.title}</div>
                            <div className="text-slate-400 text-[11px]">{est.date} • {est.projectType}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-amber-400 text-sm">{est.total.toLocaleString('es-ES')} $</div>
                            <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                              {est.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
