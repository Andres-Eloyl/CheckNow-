'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/stores/session.store';
import { orderService } from '@/lib/api/order.service';
import { sessionService } from '@/lib/api/session.service';
import { Avatar } from '@/components/ui/Avatar';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function GuestProfilePage() {
  const { slug, tableId } = useParams<{ slug: string; tableId: string }>();
  const router = useRouter();
  const { sessionToken, sessionUserId, alias, clearSession, session: sessionData } = useSessionStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!sessionToken || !sessionUserId) {
      router.replace(`/r/${slug}/t/${tableId}`);
      return;
    }

    const fetchProfileData = async () => {
      try {
        const myOrders = await orderService.getSessionOrders(slug, tableId);
        // Filter only orders made by this user that are not pending
        setOrders(myOrders.filter(o => o.session_user_id === sessionUserId && o.status !== 'pending'));
      } catch (err) {
        console.error('Failed to load profile orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [sessionToken, sessionUserId, slug, tableId, router]);

  const handleLeaveTable = async () => {
    if (!confirm('¿Estás seguro que deseas salir de la mesa? Tendrás que pedir acceso nuevamente para ordenar.')) return;
    
    setLeaving(true);
    try {
      // In a full implementation we might notify backend we are leaving
      // await sessionService.leaveSession(slug, tableId);
    } catch (e) {
      console.error(e);
    } finally {
      clearSession();
      router.replace(`/r/${slug}/t/${tableId}`);
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.total_price_usd, 0);

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background-dark"><LoadingSpinner /></div>;
  }

  return (
    <div className="bg-background-dark font-[Inter] text-white min-h-[100dvh] flex flex-col pb-24 relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      {/* Header Profile Section */}
      <header className="relative z-10 pt-16 pb-10 px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative size-28 mb-4 border-4 border-background-dark rounded-full shadow-[0_10px_40px_rgba(108,99,255,0.3)] bg-surface"
        >
          <Avatar alias={alias || '?'} size="xl" />
          <div className="absolute bottom-0 right-0 size-7 bg-success border-[3px] border-background-dark rounded-full flex items-center justify-center text-white" title="Activo en sesión">
             <span className="material-symbols-outlined text-[14px]">bolt</span>
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-black tracking-tight"
        >
          {alias || 'Invitado'}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-text-muted font-medium mt-1 flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">table_restaurant</span> 
          Mesa {sessionData?.table_number || '...'}
        </motion.p>
      </header>

      <main className="relative z-10 flex-1 px-5 max-w-2xl mx-auto w-full space-y-6">
        
        {/* Stats Glass Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="p-5 rounded-[24px] bg-surface/80 backdrop-blur-xl border border-neutral-border/50 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="size-12 bg-primary/20 text-primary flex items-center justify-center rounded-2xl mb-3">
              <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
            </div>
            <p className="text-3xl font-black">{orders.length}</p>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-1">Órdenes Mías</p>
          </div>
          
          <div className="p-5 rounded-[24px] bg-surface/80 backdrop-blur-xl border border-neutral-border/50 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="size-12 bg-green-500/20 text-green-400 flex items-center justify-center rounded-2xl mb-3">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <p className="text-2xl font-black">${totalSpent.toFixed(2)}</p>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-1">Mi Consumo</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 pt-4"
        >
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider ml-2">Ajustes de Sesión</h2>
          
          <button
            onClick={handleLeaveTable}
            disabled={leaving}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-surface/80 hover:bg-surface-2 transition-colors border border-neutral-border relative overflow-hidden group"
          >
            <div className="size-10 bg-danger/10 text-danger flex items-center justify-center rounded-xl group-hover:bg-danger group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">logout</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-base text-danger group-hover:text-white transition-colors">Salir de la mesa</p>
              <p className="text-xs font-medium text-text-muted group-hover:text-danger-100 transition-colors">Requerirá escanear el QR para volver</p>
            </div>
            <span className="material-symbols-outlined text-text-muted group-hover:text-white transition-colors">chevron_right</span>
          </button>
        </motion.div>

        {/* Empty Space filler or additional info can go here */}
      </main>

      <BottomNavigation />
    </div>
  );
}
