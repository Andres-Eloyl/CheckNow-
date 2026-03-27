'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';

export default function OwnerLoginPage() {
  const router = useRouter();
  const { setOwnerAuth, isAuthenticated, slug, role } = useAuthStore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated() && slug && role === 'owner') {
      router.replace(`/${slug}/dashboard`);
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, slug, role, router]);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('El email es requerido');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Formato de email inválido');
      return false;
    }
    if (!password.trim()) {
      setError('La contraseña es requerida');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
      toast(`Bienvenido ${res.slug}`, 'success');
      router.push(`/${res.slug}/dashboard`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Email o contraseña incorrectos');
        else if (err.status === 429) setError('Demasiados intentos. Espera un momento.');
        else setError(err.detail);
      } else {
        toast('Error de conexión. Revisa tu internet.', 'error');
      }
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-[100dvh] bg-background-dark flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background-dark font-[Inter] text-white flex">
      {/* Left side: Premium Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-center justify-center border-r border-neutral-border/30">
        {/* Animated fluid background */}
        <div className="absolute inset-0 bg-background-dark" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        
        {/* Floating animated orbs */}
        <motion.div 
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ y: [0, 40, 0], scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-secondary rounded-full blur-[120px]" 
        />

        <div className="relative z-10 p-16 flex flex-col items-start gap-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-20 h-20 rounded-[28px] bg-glass border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl"
          >
            <span className="material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary text-4xl font-black">restaurant</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <h1 className="text-6xl font-black tracking-tighter leading-[1.1]">
              Gestiona tu negocio<br/>de forma <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-secondary">inteligente</span>.
            </h1>
            <p className="text-2xl text-text-muted font-medium max-w-xl leading-relaxed">
              Pedidos en tiempo real, menús dinámicos, cobros fáciles y una cocina conectada.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-5 mt-4"
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-background-dark bg-surface shadow-lg flex items-center justify-center relative overflow-hidden">
                  <span className="material-symbols-outlined text-text-muted/60 text-sm">storefront</span>
                  <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                </div>
              ))}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-warning">
                {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-sm font-solid">star</span>)}
              </div>
              <p className="text-sm text-text-muted font-medium">Con la confianza de cientos de restaurantes</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center px-6 py-12 relative overflow-hidden bg-background-dark/50">
        {/* Mobile ambient glow */}
        <div className="lg:hidden absolute top-0 w-full h-[400px] bg-primary/10 blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center space-y-5 mb-12">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-glass border border-white/10 flex items-center justify-center shadow-xl backdrop-blur-md">
              <span className="material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary text-3xl font-black">restaurant</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">CheckNow<span className="text-primary">!</span></h1>
              <p className="text-text-muted text-sm mt-1 font-medium tracking-wide">Panel de Administración</p>
            </div>
          </div>

          <div className="mb-10 lg:text-left text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Bienvenido de vuelta</h2>
            <p className="text-text-muted font-medium">Inicia sesión para acceder a tu panel</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 relative group">
              <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-text-muted ml-1 group-focus-within:text-primary transition-colors">Email del Restaurante</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-xl group-focus-within:text-primary transition-colors">mail</span>
                <input
                  id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 h-14 bg-surface/50 border-2 border-neutral-border/50 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted/40 transition-all outline-none backdrop-blur-sm"
                  placeholder="ejemplo@restaurante.com" autoComplete="email" disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2 relative group">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-text-muted group-focus-within:text-primary transition-colors">Contraseña</label>
                <Link href="#" className="text-xs font-semibold text-text-muted hover:text-primary transition-colors">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-xl group-focus-within:text-primary transition-colors">lock_outline</span>
                <input
                  id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 h-14 bg-surface/50 border-2 border-neutral-border/50 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted/40 transition-all outline-none backdrop-blur-sm shadow-inner"
                  placeholder="••••••••" autoComplete="current-password" disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-4 mt-2 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium flex items-center gap-3">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={!email.trim() || !password.trim() || loading}
              whileHover={!loading && email.trim() && password.trim() ? { scale: 1.01 } : {}}
              whileTap={!loading && email.trim() && password.trim() ? { scale: 0.99 } : {}}
              className="w-full h-14 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(108,99,255,0.3)] hover:shadow-[0_8px_40px_rgba(108,99,255,0.4)] disabled:shadow-none disabled:from-surface-2 disabled:to-surface-2 disabled:text-text-muted transition-all relative overflow-hidden group mt-4">
              
              {/* Button shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              
              {loading ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span> Validando...</>
              ) : (
                <>Ingresar al Panel <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span></>
              )}
            </motion.button>
          </form>

          {/* Registration link */}
          <div className="mt-12 text-center pt-6 border-t border-neutral-border/30">
            <p className="text-text-muted text-sm font-medium">
              ¿Gestionas un nuevo restaurante?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline transition-colors">
                Solicita acceso
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

