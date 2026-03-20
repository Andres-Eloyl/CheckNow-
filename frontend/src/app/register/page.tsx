'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api/client';

export default function RegisterPage() {
  const router = useRouter();
  const { setOwnerAuth } = useAuthStore();

  const [form, setForm] = useState({
    restaurant_name: '',
    email: '',
    password: '',
    phone: '',
    country: 'VE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const slug = form.restaurant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.restaurant_name || !form.email || !form.password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authService.registerRestaurant({
        name: form.restaurant_name,
        slug,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        country: form.country,
      });

      setOwnerAuth({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        restaurant_id: res.restaurant_id,
        slug: res.slug,
        email: form.email,
      });
      router.push(`/${res.slug}/dashboard`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setError('Ese email o slug ya están en uso');
        else setError(err.detail);
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-[100dvh] bg-background-dark font-[Inter] text-white flex flex-col">
      <div className="fixed top-0 right-1/3 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center shadow-lg shadow-secondary/10">
              <span className="material-symbols-outlined text-secondary text-3xl">storefront</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Registrar Restaurante</h1>
              <p className="text-text-muted text-sm mt-1">Empieza tu prueba gratuita</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Step 1: Restaurant info */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-muted ml-1">Nombre del Restaurante</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">storefront</span>
                      <input value={form.restaurant_name} onChange={e => update('restaurant_name', e.target.value)}
                        className="w-full pl-12 pr-4 h-14 bg-surface border-2 border-neutral-border rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted transition-all outline-none"
                        placeholder="Mi Restaurante" />
                    </div>
                    {slug && <p className="text-xs text-text-muted ml-1">Tu URL: <span className="text-primary font-mono">checknow.app/{slug}</span></p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-muted ml-1">País</label>
                    <select value={form.country} onChange={e => update('country', e.target.value)}
                      className="w-full h-14 bg-surface border-2 border-neutral-border rounded-2xl px-4 text-white outline-none focus:ring-4 focus:ring-primary/20">
                      <option value="VE">🇻🇪 Venezuela</option>
                      <option value="CO">🇨🇴 Colombia</option>
                      <option value="MX">🇲🇽 México</option>
                      <option value="DO">🇩🇴 Rep. Dominicana</option>
                      <option value="EC">🇪🇨 Ecuador</option>
                      <option value="PE">🇵🇪 Perú</option>
                      <option value="CL">🇨🇱 Chile</option>
                      <option value="AR">🇦🇷 Argentina</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => setStep(2)} disabled={!form.restaurant_name}
                    className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 disabled:bg-surface-2 disabled:text-text-muted shadow-lg shadow-primary/30 disabled:shadow-none transition-all">
                    Siguiente <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-muted ml-1">Email del dueño</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">mail</span>
                      <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                        className="w-full pl-12 pr-4 h-14 bg-surface border-2 border-neutral-border rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted transition-all outline-none"
                        placeholder="tu@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-muted ml-1">Contraseña</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">lock</span>
                      <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                        className="w-full pl-12 pr-4 h-14 bg-surface border-2 border-neutral-border rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted transition-all outline-none"
                        placeholder="Mín. 8 caracteres" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-muted ml-1">Teléfono (opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">phone</span>
                      <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                        className="w-full pl-12 pr-4 h-14 bg-surface border-2 border-neutral-border rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted transition-all outline-none"
                        placeholder="+58 412 1234567" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-2xl bg-danger/20 border border-danger/30 text-danger text-sm font-medium text-center">{error}</motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="h-14 px-6 bg-surface-2 text-text-muted font-bold rounded-2xl border border-neutral-border">
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button type="submit" disabled={!form.email || !form.password || loading}
                      className="flex-1 h-14 bg-primary text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 disabled:bg-surface-2 disabled:text-text-muted shadow-lg shadow-primary/30 disabled:shadow-none transition-all">
                      {loading ? 'Creando...' : 'Crear Restaurante'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-center text-sm text-text-muted">
            ¿Ya tienes cuenta? <Link href="/login" className="text-primary font-bold hover:underline">Inicia sesión</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
