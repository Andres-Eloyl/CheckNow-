'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api/client';

export default function OwnerLoginPage() {
  const router = useRouter();
  const { setOwnerAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authService.loginRestaurant({ email: email.trim(), password });
      setOwnerAuth({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        restaurant_id: res.restaurant_id,
        slug: res.slug,
        email: email.trim(),
      });
      router.push(`/${res.slug}/dashboard`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Email o contraseña incorrectos');
        else if (err.status === 429) setError('Demasiados intentos. Espera un momento.');
        else setError(err.detail);
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background-dark font-[Inter] text-white flex flex-col">
      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo + header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">CheckNow<span className="text-primary">!</span></h1>
              <p className="text-text-muted text-sm mt-1">Panel de Administración</p>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-text-muted ml-1">Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-xl">mail</span>
                <input
                  id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 h-14 bg-surface border-2 border-neutral-border rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted transition-all outline-none"
                  placeholder="tu@email.com" autoComplete="email" disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-text-muted ml-1">Contraseña</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-xl">lock</span>
                <input
                  id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 h-14 bg-surface border-2 border-neutral-border rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted transition-all outline-none"
                  placeholder="••••••••" autoComplete="current-password" disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-2xl bg-danger/20 border border-danger/30 text-danger text-sm font-medium text-center">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={!email.trim() || !password.trim() || loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(108,99,255,0.3)] disabled:shadow-none disabled:bg-surface-2 disabled:text-text-muted transition-all">
              {loading ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span> Ingresando...</>
              ) : (
                <>Iniciar Sesión <span className="material-symbols-outlined text-lg">arrow_forward</span></>
              )}
            </motion.button>
          </form>

          {/* Registration link */}
          <div className="text-center space-y-3">
            <p className="text-text-muted text-sm">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline">Registrar Restaurante</Link>
            </p>
          </div>

          <p className="text-center text-xs text-text-muted">
            Powered by <span className="text-primary font-bold">CheckNow!</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
