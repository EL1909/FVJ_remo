import React, { useState } from 'react';
import { X, Calendar, User, Package, AlertCircle } from 'lucide-react';
import { CalendarEvent, Client, MaterialPurchase } from '../../types';
import { NewClientInput } from '../../lib/crm';
import { NewEventInput } from '../../lib/calendars';
import { ApiError } from '../../lib/api';

interface QuickEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSaveEvent: (event: NewEventInput) => Promise<void>;
}

export const QuickEventModal: React.FC<QuickEventModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSaveEvent,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEvent['type']>('visita_tecnica');
  // El cliente se escribe como texto libre (customer_name/phone/email del
  // backend) — vincular a un Client real del CRM es opcional, solo para
  // trazabilidad. Mismo patrón que el generador de presupuestos.
  const [linkedClientId, setLinkedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [date, setDate] = useState('2026-08-06');
  const [startTime, setStartTime] = useState('11:00');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // El backend asigna automáticamente a quien tenga cupo libre — este
  // formulario no elige responsable, así que solo hace falta una hora de
  // fin coherente con la de inicio (antes venía fija en '12:00', lo que
  // rechazaba el backend si la cita empezaba después del mediodía).
  const endTimeFrom = (start: string) => {
    const [h, m] = start.split(':').map(Number);
    const endH = (h + 1) % 24;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handlePickExistingClient = (id: string) => {
    setLinkedClientId(id);
    const c = clients.find((cl) => cl.id === id);
    if (c) {
      setClientName(c.name);
      setClientPhone(c.phone);
      setClientEmail(c.email);
      setAddress(c.address);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSaveEvent({
        title: title || `Visita de Medición - ${clientName.trim() || 'Cliente'}`,
        type,
        clientId: linkedClientId || undefined,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        address: address.trim() || 'Dirección de obra',
        date,
        startTime,
        endTime: endTimeFrom(startTime),
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo agendar la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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

          {clients.length > 0 && (
            <div>
              <label className="block text-slate-300 font-bold mb-1">Vincular a Cliente Existente (opcional)</label>
              <select
                value={linkedClientId}
                onChange={(e) => handlePickExistingClient(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                <option value="">— Cliente nuevo (sin vincular) —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nombre del Cliente *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. María Fernández"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Teléfono</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+58 414-1234567"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Email</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="maria@ejemplo.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
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
              placeholder="Ej. Av. 5 de Julio, Barcelona"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            El responsable se asigna automáticamente según disponibilidad.
          </p>

          {error && (
            <div className="flex items-start gap-2 text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar en Agenda'}
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
  onSaveClient: (client: NewClientInput) => Promise<void>;
}

export const QuickClientModal: React.FC<QuickClientModalProps> = ({
  isOpen,
  onClose,
  onSaveClient,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+58 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Barcelona');
  const [tagInput, setTagInput] = useState('Reforma Baño');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSaveClient({
        name: name || 'Nuevo Cliente',
        phone,
        email,
        address,
        city,
        tags: [tagInput, 'Nuevo Lead'],
        preferredContact: 'whatsapp',
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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

          {error && (
            <div className="flex items-start gap-2 text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
