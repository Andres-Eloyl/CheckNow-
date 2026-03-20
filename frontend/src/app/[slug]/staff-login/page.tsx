'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/api/auth.service';
import { staffService } from '@/lib/api/staff.service';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError, setStaffAuth } from '@/lib/api/client';
import type { StaffResponse } from '@/types/api.types';

const PIN_LENGTH = 4;
const PIN_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function StaffLoginPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { setStaffAuth: setAuthStoreStaff } = useAuthStore();

  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffResponse | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Load staff list
  useEffect(() => {
    if (!slug) return;
    staffService.getStaff(slug)
      .then(setStaffList)
      .catch(() => {
        // Demo fallback
        setStaffList([
          { id: 'demo-1', name: 'María', role: 'mesero', is_active: true } as StaffResponse,
          { id: 'demo-2', name: 'Carlos', role: 'cocina', is_active: true } as StaffResponse,
          { id: 'demo-3', name: 'Ana', role: 'bar', is_active: true } as StaffResponse,
        ]);
      })
      .finally(() => setLoadingStaff(false));
  }, [slug]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH && selectedStaff) {
      handleLogin();
    }
  }, [pin]);

  const handleDigitPress = (digit: string) => {
    if (digit === '⌫') {
      setPin(p => p.slice(0, -1));
      setError(null);
      return;
    }
    if (digit === '' || pin.length >= PIN_LENGTH) return;
    setPin(p => p + digit);
    setError(null);
  };

  const handleLogin = async () => {
    if (!selectedStaff || pin.length !== PIN_LENGTH || !slug) return;
    setLoading(true);
    setError(null);

    try {
      const res = await authService.loginStaff(slug, {
        name: selectedStaff.name,
        pin,
      });

      setAuthStoreStaff({
        access_token: res.access_token,
        staff_id: res.staff_id,
        name: res.name,
        role: res.role,
        slug,
      });

      setStaffAuth({
        access_token: res.access_token,
        staff_id: res.staff_id,
        name: res.name,
        role: res.role,
        slug,
      });

      router.push(`/${slug}/dashboard`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'PIN incorrecto' : err.detail);
      } else {
        setError('Error de conexión');
      }
      setPin('');
      setLoading(false);
    }
  };

  const roleEmoji: Record<string, string> = { mesero: '🧑‍🍳', cocina: '👨‍🍳', bar: '🍸', cajero: '💰', manager: '👔' };

  return (
    <div className="min-h-[100dvh] bg-background-dark font-[Inter] text-white flex flex-col items-center justify-center px-6 py-8">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">badge</span>
          </div>
          <h1 className="text-2xl font-black">Staff Login</h1>
          <p className="text-text-muted text-sm">{slug}</p>
        </div>

        {!selectedStaff ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-muted ml-1">Selecciona tu nombre:</p>
            {loadingStaff ? (
              <div className="flex justify-center py-8"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {staffList.filter(s => s.is_active).map(staff => (
                  <motion.button key={staff.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedStaff(staff)}
                    className="p-4 rounded-2xl bg-surface hover:bg-surface-2 border border-neutral-border flex flex-col items-center gap-2 transition-all">
                    <span className="text-2xl">{roleEmoji[staff.role] || '👤'}</span>
                    <span className="font-bold text-sm">{staff.name}</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">{staff.role}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => { setSelectedStaff(null); setPin(''); setError(null); }} className="size-8 rounded-lg bg-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-text-muted text-lg">arrow_back</span>
              </button>
              <span className="text-2xl">{roleEmoji[selectedStaff.role] || '👤'}</span>
              <span className="font-bold text-lg">{selectedStaff.name}</span>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-4">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <motion.div key={i}
                  animate={pin.length === i ? { scale: [1, 1.2, 1] } : {}}
                  className={`size-5 rounded-full transition-all duration-200 ${
                    i < pin.length ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-surface-2 border-2 border-neutral-border'
                  }`} />
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-danger text-sm text-center font-medium">{error}</motion.p>
              )}
            </AnimatePresence>

            {/* PIN Pad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {PIN_DIGITS.map((digit, i) => (
                <motion.button key={i} whileTap={digit ? { scale: 0.9 } : {}}
                  onClick={() => handleDigitPress(digit)} disabled={!digit || loading}
                  className={`h-16 rounded-2xl font-bold text-2xl transition-all ${
                    digit === '⌫'
                      ? 'bg-surface text-text-muted hover:bg-surface-2'
                      : digit
                        ? 'bg-surface hover:bg-surface-2 text-white active:bg-primary/20'
                        : 'bg-transparent cursor-default'
                  }`}>
                  {digit === '⌫' ? <span className="material-symbols-outlined text-2xl">backspace</span> : digit}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
