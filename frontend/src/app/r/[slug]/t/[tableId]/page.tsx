'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { sessionService } from '@/lib/api/session.service';
import { restaurantService } from '@/lib/api/restaurant.service';
import { useSessionStore } from '@/stores/session.store';
import { ApiError, setSessionAuth } from '@/lib/api/client';
import type { RestaurantPublic } from '@/types/api.types';

/**
 * QR Landing page — /r/{slug}/t/{tableId}
 * Validates the session exists and lets users join by entering their alias.
 */
export default function QRLandingPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const slug = params.slug;
  const tableId = params.tableId;
  const router = useRouter();

  const { sessionToken, sessionUserId, setSession } = useSessionStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionNotOpen, setSessionNotOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantPublic | null>(null);

  // If user already has a session, redirect to menu
  useEffect(() => {
    if (sessionToken && sessionUserId) {
      router.replace(`/r/${slug}/t/${tableId}/menu`);
    }
  }, [sessionToken, sessionUserId, router, slug, tableId]);

  // Load restaurant info and validate session
  useEffect(() => {
    if (!slug || !tableId) return;

    const init = async () => {
      try {
        const restData = await restaurantService.getPublicInfo(slug);
        setRestaurant(restData);

        // The tableId IS the session token from the QR code
        const session = await sessionService.getSession(slug, tableId);
        if (session.status === 'closed') {
          setSessionNotOpen(true);
        }
      } catch (err: any) {
        console.error("Session validation error:", err);
        if (err?.status === 404) {
          setSessionNotOpen(true);
        }
        // If not 404, we intentionally do not block or show a red error yet.
        // The join process will catch and display real errors via handleJoin.
      } finally {
        setValidating(false);
      }
    };

    init();
  }, [slug, tableId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug || !tableId) return;

    setLoading(true);
    setError(null);

    try {
      const user = await sessionService.joinSession(slug, tableId, { alias: name.trim() });
      const session = await sessionService.getSession(slug, tableId);

      // Persist to zustand + storage
      setSession({ session, user, slug, token: tableId });
      setSessionAuth({ session_user_id: user.id, session_token: tableId, slug });

      router.push(`/r/${slug}/t/${tableId}/menu`);
    } catch (err: any) {
      console.error("Session join error:", err);
      if (err?.status || err?.detail) {
        setError(err.detail || 'Error al procesar.');
      } else {
        setError('Error al unirse a la mesa. Intenta de nuevo.');
      }
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  if (validating) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark">
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
          <div className="relative size-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl animate-pulse">qr_code_scanner</span>
          </div>
        </div>
        <p className="text-text-muted text-sm mt-4">Validando mesa...</p>
      </div>
    );
  }

  if (sessionNotOpen) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark px-6 text-center">
        <div className="size-24 bg-warning/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-warning text-5xl">hourglass_empty</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Mesa no disponible</h1>
        <p className="text-text-muted text-sm max-w-xs leading-relaxed">
          Esta mesa todavía no ha sido abierta por el mesero. Por favor avisa al staff.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 bg-primary/20 text-primary font-bold py-3 px-8 rounded-2xl border border-primary/30 hover:bg-primary/30 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background-dark font-[Inter] text-white min-h-[100dvh] flex flex-col">
      <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden">
        
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 flex items-center justify-between p-6 pt-12"
        >
          <div className="flex items-center gap-3">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="size-10 rounded-xl object-cover" />
            ) : (
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary/20 text-primary">
                <span className="material-symbols-outlined text-2xl">restaurant</span>
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-white">{restaurant?.name || 'CheckNow'}</h2>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Menú Digital</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            En Vivo
          </div>
        </motion.header>

        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 flex-1 flex flex-col items-center px-6 pt-8 gap-8"
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 w-full">
            {/* Avatar preview */}
            <div className="relative h-28 w-28">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-[pulse_3s_ease-in-out_infinite]" />
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={name.trim() || 'default'}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="relative z-10 border-4 border-background-dark rounded-full shadow-xl shadow-primary/20"
                >
                  <Avatar alias={name} size="xl" />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight">¡Bienvenido!</h1>
              <p className="text-text-muted text-base font-medium">Ingresa tu nombre para empezar a pedir</p>
            </div>
          </motion.div>

          <motion.form id="joinForm" variants={itemVariants} onSubmit={handleJoin} className="w-full space-y-5 max-w-sm">
            <div className="flex flex-col gap-2">
              <label htmlFor="nameInput" className="text-sm font-semibold text-text-muted ml-1">
                ¿Cómo te llamas?
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 material-symbols-outlined text-text-muted z-10">person</span>
                <input
                  id="nameInput"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 h-14 bg-surface border-2 border-neutral-border rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary text-white placeholder:text-text-muted transition-all outline-none font-medium"
                  placeholder="Escribe tu nombre o apodo"
                  autoComplete="off"
                  disabled={loading}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-2xl bg-danger/20 text-danger text-[13px] font-medium text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table info card */}
            <div className="p-4 rounded-2xl glass flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 relative z-10">
                <span className="material-symbols-outlined">table_restaurant</span>
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-white">Mesa en {restaurant?.name || 'Restaurante'}</p>
                <p className="text-xs font-medium text-text-muted">Sesión activa • Pide desde tu celular</p>
              </div>
            </div>
          </motion.form>
        </motion.main>

        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
          className="relative z-10 p-6 pb-10 w-full max-w-sm mx-auto"
        >
          <motion.button
            type="submit"
            form="joinForm"
            disabled={!name.trim() || loading}
            whileHover={name.trim() && !loading ? { scale: 1.02 } : {}}
            whileTap={name.trim() && !loading ? { scale: 0.98 } : {}}
            className="group w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition-all outline-none shadow-[0_8px_30px_rgba(108,99,255,0.3)] disabled:shadow-none disabled:bg-surface-2 disabled:text-text-muted focus:ring-4 focus:ring-primary/30"
          >
            <span>{loading ? 'Uniendo...' : 'Unirme a la Mesa'}</span>
            <span className={`text-xl transition-all duration-300 ${name.trim() && !loading ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>🚀</span>
          </motion.button>
          
          <p className="text-center text-xs font-medium text-text-muted mt-4">
            Powered by <span className="text-primary font-bold">CheckNow!</span>
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
