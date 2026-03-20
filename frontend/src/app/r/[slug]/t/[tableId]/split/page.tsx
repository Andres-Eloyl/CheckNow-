'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSessionStore } from '@/stores/session.store';
import { orderService } from '@/lib/api/order.service';
import { splitService } from '@/lib/api/split.service';
import { sessionService } from '@/lib/api/session.service';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getComensalWebSocketUrl } from '@/lib/api/client';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { OrderItemResponse, SessionUserResponse, SplitCreate } from '@/types/api.types';

export default function GuestSplitPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const slug = params.slug;
  const tableId = params.tableId;
  const router = useRouter();

  const { sessionUserId } = useSessionStore();
  const [orders, setOrders] = useState<OrderItemResponse[]>([]);
  const [users, setUsers] = useState<SessionUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderItemResponse | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showYoInvitoConfirm, setShowYoInvitoConfirm] = useState<OrderItemResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionUserId) router.replace(`/r/${slug}/t/${tableId}`);
  }, [sessionUserId, router, slug, tableId]);

  const fetchData = useCallback(async () => {
    if (!slug || !tableId) return;
    try {
      const [ordersData, sessionData] = await Promise.all([
        orderService.getSessionOrders(slug, tableId),
        sessionService.getSession(slug, tableId),
      ]);
      setOrders(ordersData.filter(o => o.status !== 'pending' && o.status !== 'cancelled'));
      setUsers(sessionData.users);
    } catch {} finally {
      setLoading(false);
    }
  }, [slug, tableId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // WebSocket
  const wsUrl = sessionUserId ? getComensalWebSocketUrl(tableId, sessionUserId) : '';
  useWebSocket({
    url: wsUrl,
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (['split_proposed', 'split_accepted', 'yo_invito'].includes(msg.event)) {
          fetchData();
          if (msg.event === 'yo_invito') {
            triggerConfetti();
            setSuccessMessage(`🎉 ¡${msg.data?.alias || 'Alguien'} invita!`);
            setTimeout(() => setSuccessMessage(null), 5000);
          }
        }
      } catch {}
    },
  });

  const triggerConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#6C63FF', '#FF6B35', '#22C55E'] });
    } catch {}
  };

  const handleProposeSplit = async () => {
    if (!selectedOrder || selectedParticipants.length === 0) return;
    setSubmitting(true);
    try {
      const splitData: SplitCreate = {
        order_item_id: selectedOrder.id,
        participants: selectedParticipants,
      };
      await splitService.createSplit(slug, tableId, splitData);
      setSuccessMessage('¡Split propuesto! Esperando aceptación...');
      setTimeout(() => setSuccessMessage(null), 4000);
      setShowSplitModal(false);
      setSelectedOrder(null);
      setSelectedParticipants([]);
      fetchData();
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleYoInvito = async (order: OrderItemResponse) => {
    setSubmitting(true);
    try {
      await splitService.payForSomeone(slug, tableId, {
        order_item_id: order.id,
        beneficiary_user_id: order.session_user_id,
      });
      triggerConfetti();
      setSuccessMessage('🎁 ¡Ya invitaste! Que viva la generosidad');
      setTimeout(() => setSuccessMessage(null), 5000);
      setShowYoInvitoConfirm(null);
      fetchData();
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const otherUsers = users.filter(u => u.id !== sessionUserId);

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background-dark"><LoadingSpinner /></div>;
  }

  return (
    <div className="bg-background-dark font-[Inter] text-white min-h-[100dvh] flex flex-col pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-5 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link href={`/r/${slug}/t/${tableId}/cart`} className="size-10 rounded-xl bg-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-text-muted">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Dividir Cuenta</h1>
            <p className="text-xs text-text-muted">Divide items o invita a tus amigos</p>
          </div>
        </div>
      </header>

      {/* Success banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mx-5 mt-3 p-4 rounded-2xl bg-success/20 border border-success/30 text-center">
            <p className="text-success font-bold">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 px-5 py-4 max-w-2xl mx-auto w-full space-y-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <span className="material-symbols-outlined text-6xl text-text-muted mb-4">splitscreen</span>
            <h2 className="text-xl font-bold mb-2">Nada para dividir</h2>
            <p className="text-text-muted text-sm">Primero envía tus pedidos a cocina</p>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">Items enviados</h2>
            {orders.map(order => {
              const user = users.find(u => u.id === order.session_user_id);
              const isMyOrder = order.session_user_id === sessionUserId;
              return (
                <motion.div key={order.id} layout className="p-4 rounded-2xl bg-surface flex items-center gap-3">
                  <div className="size-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: user?.color || '#6C63FF' }}>
                    {user?.emoji || '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{order.menu_item_name || 'Item'}</p>
                    <p className="text-primary font-bold text-sm">${(order.unit_price * order.quantity).toFixed(2)}</p>
                    <p className="text-text-muted text-xs">{user?.alias || 'Desconocido'}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isMyOrder && !order.is_locked && (
                      <button
                        onClick={() => { setSelectedOrder(order); setShowSplitModal(true); }}
                        className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/30 transition-colors"
                      >
                        Dividir
                      </button>
                    )}
                    {!isMyOrder && !order.is_locked && (
                      <button
                        onClick={() => setShowYoInvitoConfirm(order)}
                        className="px-3 py-1.5 bg-secondary/20 text-secondary text-xs font-bold rounded-xl hover:bg-secondary/30 transition-colors"
                      >
                        🎁 Yo Invito
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </main>

      {/* Checkout link */}
      {orders.length > 0 && (
        <div className="px-5 pb-4 max-w-2xl mx-auto w-full">
          <Link href={`/r/${slug}/t/${tableId}/checkout`}
            className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30">
            Ir a Pagar <span className="material-symbols-outlined">payment</span>
          </Link>
        </div>
      )}

      {/* Split Modal */}
      <AnimatePresence>
        {showSplitModal && selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowSplitModal(false)}>
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-surface rounded-t-3xl p-6 pb-10">
              <div className="w-10 h-1 bg-neutral-border rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-1">Dividir: {selectedOrder.menu_item_name}</h3>
              <p className="text-primary font-bold mb-4">${(selectedOrder.unit_price * selectedOrder.quantity).toFixed(2)}</p>

              <p className="text-sm text-text-muted font-medium mb-3">Selecciona participantes:</p>
              <div className="space-y-2 mb-6">
                {otherUsers.map(u => (
                  <button key={u.id}
                    onClick={() => toggleParticipant(u.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                      selectedParticipants.includes(u.id) ? 'bg-primary/20 border border-primary/30' : 'bg-surface-2'
                    }`}>
                    <div className="size-9 rounded-full flex items-center justify-center" style={{ backgroundColor: u.color }}>
                      {u.emoji || '👤'}
                    </div>
                    <span className="font-medium text-sm">{u.alias}</span>
                    {selectedParticipants.includes(u.id) && (
                      <span className="ml-auto material-symbols-outlined text-primary">check_circle</span>
                    )}
                  </button>
                ))}
              </div>

              {selectedParticipants.length > 0 && (
                <p className="text-sm text-text-muted text-center mb-4">
                  Cada uno paga: <span className="text-white font-bold">
                    ${((selectedOrder.unit_price * selectedOrder.quantity) / (selectedParticipants.length + 1)).toFixed(2)}
                  </span>
                </p>
              )}

              <button onClick={handleProposeSplit} disabled={selectedParticipants.length === 0 || submitting}
                className="w-full h-13 bg-primary text-white font-bold rounded-2xl disabled:opacity-50 transition-all">
                {submitting ? 'Enviando...' : 'Proponer Split'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yo Invito Confirm Modal */}
      <AnimatePresence>
        {showYoInvitoConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setShowYoInvitoConfirm(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-3xl p-6 text-center">
              <span className="text-5xl">🎁</span>
              <h3 className="text-xl font-bold mt-4 mb-2">¿Invitas?</h3>
              <p className="text-text-muted text-sm mb-6">
                Vas a pagar <span className="text-white font-bold">{showYoInvitoConfirm.menu_item_name}</span> por{' '}
                <span className="text-white font-bold">${(showYoInvitoConfirm.unit_price * showYoInvitoConfirm.quantity).toFixed(2)}</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowYoInvitoConfirm(null)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl">No</button>
                <button onClick={() => handleYoInvito(showYoInvitoConfirm)} disabled={submitting}
                  className="flex-1 h-12 bg-secondary text-white font-bold rounded-2xl disabled:opacity-50">
                  {submitting ? '...' : '¡Sí, yo invito! 🎉'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
