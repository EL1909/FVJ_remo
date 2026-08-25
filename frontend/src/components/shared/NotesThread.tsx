import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { NoteEntry } from '../../types';
import { ApiError } from '../../lib/api';

interface NotesThreadProps {
  notes: NoteEntry[];
  onAddNote: (text: string) => Promise<void>;
  emptyLabel?: string;
}

// Hilo de notas reutilizable (Presupuestos, Clientes, Agenda, Órdenes de
// Trabajo) — cada registro agrega notas por separado vía su propia acción
// `message`, sin importar su estado (ver NotesMixin en evz_backbone).
export const NotesThread: React.FC<NotesThreadProps> = ({
  notes,
  onAddNote,
  emptyLabel = 'Sin notas todavía.',
}) => {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    setIsSaving(true);
    try {
      await onAddNote(text.trim());
      setText('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo agregar la nota.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-52 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-xs text-slate-400 italic">{emptyLabel}</p>
        )}
        {notes.map((n, i) => (
          <div key={i} className="text-xs bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="font-bold text-amber-400">{n.authorEmail || 'Sistema'}</span>
              <span>{new Date(n.date).toLocaleString('es-ES')}</span>
            </div>
            <p className="text-slate-200 whitespace-pre-wrap">{n.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Agregar nota..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={isSaving || !text.trim()}
          className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
      {error && <p className="text-[11px] font-bold text-red-400">{error}</p>}
    </div>
  );
};
