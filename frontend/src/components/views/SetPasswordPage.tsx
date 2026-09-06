import React, { useState } from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { confirmPasswordReset, ApiError } from '../../lib/api';

interface SetPasswordPageProps {
  uid: string;
  token: string;
}

// Sirve tanto para "olvidé mi contraseña" como para activar una invitación
// de equipo — ambas llegan aquí con el mismo par uid/token (ver App.tsx,
// que detecta la ruta /reset-password igual que hace con #capacidades).
export const SetPasswordPage: React.FC<SetPasswordPageProps> = ({ uid, token }) => {
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPw) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(uid, token, password);
      setIsDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo actualizar la contraseña. El enlace puede haber expirado.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center space-y-4 border border-stone-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-[#0A192F]">¡Contraseña actualizada!</h1>
          <p className="text-sm text-slate-600">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <a
            href="/fvj/"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-sm cursor-pointer"
          >
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl space-y-5 border border-stone-200">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-[#580812] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black text-[#0A192F] mt-2">Elige tu Contraseña</h1>
          <p className="text-xs text-slate-500">Se usará para entrar al panel de FVJ Remodelaciones.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#580812]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#580812]"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm cursor-pointer transition-all"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};
