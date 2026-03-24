'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/api/admin.service';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setOwnerAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await adminService.login(email.trim(), password);
      setOwnerAuth({
        access_token: res.access_token,
        refresh_token: '',
        restaurant_id: '__superadmin__',
        slug: '__admin__',
        email: email.trim(),
      });
      router.push('/admin/restaurants');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Credenciales inválidas' : err.detail);
      } else {
        setError('Error de conexión');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a14] font-[Inter] text-white flex items-center justify-center px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(108,99,255,0.05)_0%,transparent_70%)]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="mx-auto size-14 rounded-2xl bg-danger/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-danger text-3xl">shield</span>
          </div>
          <h1 className="text-2xl font-black">SuperAdmin</h1>
          <p className="text-text-muted text-xs">Acceso restringido</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-14 bg-surface border-2 border-neutral-border rounded-2xl px-4 text-white placeholder:text-text-muted outline-none focus:ring-4 focus:ring-danger/20 focus:border-danger"
            placeholder="admin@checknow.app" autoComplete="email" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-14 bg-surface border-2 border-neutral-border rounded-2xl px-4 text-white placeholder:text-text-muted outline-none focus:ring-4 focus:ring-danger/20 focus:border-danger"
            placeholder="••••••••" autoComplete="current-password" />

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-danger/20 text-danger text-sm text-center font-medium">{error}</motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={!email || !password || loading}
            className="w-full h-14 bg-danger text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-danger/30 disabled:opacity-50 transition-all">
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
