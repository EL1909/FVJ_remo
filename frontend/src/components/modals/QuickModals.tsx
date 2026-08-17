import React, { useState } from 'react';
import { X, Calendar, User, Package } from 'lucide-react';
import { CalendarEvent, Client, MaterialPurchase } from '../../types';

interface QuickEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSaveEvent: (event: CalendarEvent) => void;
}

export const QuickEventModal: React.FC<QuickEventModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSaveEvent,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEvent['type']>('visita_tecnica');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [date, setDate] = useState('2026-08-06');
  const [startTime, setStartTime] = useState('11:00');
  const [assignedTo, setAssignedTo] = useState('Carlos Ruiz');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === clientId);

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: title || `Visita de Medición - ${client?.name || 'Cliente'}`,
      type,
      clientId: client?.id,
      clientName: client?.name,
      address: address || client?.address || 'Dirección de obra',
      date,
      startTime,
      endTime: '12:00',
      assignedTo,
      completed: false,
    };

    onSaveEvent(newEvt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Agendar Cita o Medición Técnica</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Tipo de Evento</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            >
              <option value="visita_tecnica">Visita de Medición / Asesoramiento</option>
              <option value="inicio_obra">Inicio de Obra</option>
              <option value="entrega_material">Llegada de Material (Encimera/Azulejos)</option>
              <option value="reunion">Reunión Cliente</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Cliente</label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                const cl = clients.find((c) => c.id === e.target.value);
                if (cl) setAddress(cl.address);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Título / Concepto</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Medición tomas de agua y desagües de cocina"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Hora Inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Dirección de Cita</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej. Av. Diagonal 450, Barcelona"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Técnico / Responsable</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Guardar en Agenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClient: (client: Client) => void;
}

export const QuickClientModal: React.FC<QuickClientModalProps> = ({
  isOpen,
  onClose,
  onSaveClient,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+34 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Madrid');
  const [tagInput, setTagInput] = useState('Reforma Baño');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: name || 'Nuevo Cliente',
      phone,
      email,
      address,
      city,
      tags: [tagInput, 'Nuevo Lead'],
      createdAt: new Date().toISOString().split('T')[0],
      preferredContact: 'whatsapp',
    };

    onSaveClient(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <span>Registrar Nuevo Cliente CRM</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. María Fernández"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Teléfono</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Ciudad</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Dirección de la vivienda</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle Mayor 12, 1º B"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Etiqueta Principal</label>
            <select
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            >
              <option value="Reforma Baño">Reforma Baño (Ducha Walk-in)</option>
              <option value="Reforma Cocina">Reforma Cocina (Isla Calacatta)</option>
              <option value="Reforma Integral">Reforma Integral Baño + Cocina</option>
              <option value="Lead TikTok">Proveniente de TikTok</option>
              <option value="Lead Instagram">Proveniente de Instagram</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
