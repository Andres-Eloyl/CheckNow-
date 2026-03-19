'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AI Context: The authentication page for the restaurant staff.
 * Currently supports a fallback "demo" mode (user: admin, pin: 1234) if the actual
 * backend is unreachable. Uses `localStorage` to save the `staff_token`.
 */
export default function StaffLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', pin: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.pin.trim()) {
      setError('Nombre y PIN son requeridos');
      return;
    }

    if (formData.pin.length < 4) {
      setError('El PIN debe tener al menos 4 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      const slug = 'demo';
      const response = await fetch(`/api/${slug}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Credenciales inválidas');

      const data = await response.json();
      if (data.staff_token) {
        localStorage.setItem('staff_token', data.staff_token);
        router.push('/dashboard/comandas');
      } else {
        throw new Error('No se recibió token');
      }
    } catch {
      // Demo fallback
      if (formData.name === 'admin' && formData.pin === '1234') {
        localStorage.setItem('staff_token', 'demo_token_123');
        router.push('/dashboard/comandas');
      } else {
        setError('Credenciales inválidas. Prueba: admin / 1234');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'pin' && value && !/^\d+$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#120d0b] px-4 overflow-hidden font-display">
      {/* Fondo decorativo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: 'rgba(244, 123, 37, 0.06)' }}
      />

      <div className="flex flex-col w-full max-w-[400px] z-10">
        {/* Tarjeta de Login */}
        <div
          className="rounded-xl p-8 shadow-2xl"
          style={{
            background: 'rgba(28, 22, 19, 0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(244, 123, 37, 0.1)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center rounded-xl p-3 mb-3 border border-primary/20 bg-primary/10">
              <span className="material-symbols-outlined text-primary text-3xl leading-none">restaurant</span>
            </div>
            <h2 className="text-white text-xl font-bold tracking-tight">CheckNow</h2>
            <p className="text-slate-400 text-sm mt-1">Panel de Administración</p>
          </div>

          {/* Formulario */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Campo Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium px-1">Nombre del Staff</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xl leading-none">person</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ingresa tu nombre"
                  className="w-full pl-11 pr-4 py-3 bg-[#1c1613]/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-slate-600 transition-all text-sm"
                />
              </div>
            </div>

            {/* Campo PIN */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium px-1">PIN de Seguridad</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xl leading-none">lock</span>
                <input
                  type="password"
                  name="pin"
                  value={formData.pin}
                  onChange={handleInputChange}
                  required
                  maxLength={4}
                  placeholder="••••"
                  className="w-full pl-11 pr-4 py-3 bg-[#1c1613]/50 border border-white/10 rounded-lg text-white tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-slate-600 transition-all text-sm"
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-[#ff9852] hover:shadow-[0_0_20px_rgba(244,123,37,0.4)] text-[#120d0b] font-bold py-3.5 rounded-lg transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'Verificando...' : 'Ingresar al Panel'}
              {!isLoading && <span className="material-symbols-outlined text-lg leading-none">arrow_forward</span>}
            </button>
          </form>

          {/* Pie de tarjeta */}
          <p className="text-slate-500 text-xs text-center mt-6">
            Solo personal autorizado. Todos los accesos son registrados.
          </p>
        </div>
      </div>
    </div>
  );
}
