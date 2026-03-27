'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSessionStore } from '@/stores/session.store';
import { orderService } from '@/lib/api/order.service';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getComensalWebSocketUrl } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { OrderItemResponse } from '@/types/api.types';

export default function GuestCartPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const slug = params.slug;
  const tableId = params.tableId;
  const router = useRouter();

  const { sessionUserId, sessionToken } = useSessionStore();
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Redirect if no session ──
  useEffect(() => {
    if (!sessionUserId) router.replace(`/r/${slug}/t/${tableId}`);
  }, [sessionUserId, router, slug, tableId]);

  // ── Fetch orders ──
  const fetchOrders = useCallback(async () => {
    if (!slug || !tableId) return;
    try {
      const data = await orderService.getSessionOrders(slug, tableId);
      setOrders(data);
    } catch {
      // Silent — WS will retry
    } finally {
      setLoading(false);
    }
  }, [slug, tableId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── WebSocket ──
  const wsUrl = sessionUserId
    ? getComensalWebSocketUrl(tableId, sessionUserId)
    : '';

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (['item_added', 'item_removed', 'order_confirmed', 'order_status'].includes(msg.event)) {
          fetchOrders();
        }
      } catch { /* ignore parse errors */ }
    },
  });

  // ── Derived data ──
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const sentOrders = orders.filter(o => ['sent', 'preparing', 'ready', 'delivered'].includes(o.status));
  const myPendingOrders = pendingOrders.filter(o => o.session_user_id === sessionUserId);
  const otherPendingOrders = pendingOrders.filter(o => o.session_user_id !== sessionUserId);
  const pendingTotal = pendingOrders.reduce((sum, o) => sum + o.unit_price * o.quantity, 0);
  const sentTotal = sentOrders.reduce((sum, o) => sum + o.unit_price * o.quantity, 0);

  // ── Handlers ──
  const handleDeleteItem = async (orderId: string) => {
    setDeletingId(orderId);
    try {
      await orderService.removeItem(slug, tableId, orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast('Item eliminado', 'success');
    } catch {
      toast('No se pudo eliminar', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmOrders = async () => {
    if (pendingOrders.length === 0) return;
    setConfirming(true);
    try {
      await orderService.confirmOrders(slug, tableId);
      setJustSent(true);
      toast('¡Pedido enviado a cocina! 🍳', 'success');
      await fetchOrders();
      setTimeout(() => setJustSent(false), 4000);
    } catch {
      toast('Error al enviar pedido', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const statusConfig: Record<string, { label: string; icon: string; badgeClass: string }> = {
    sent:      { label: 'Recibido',  icon: 'schedule',      badgeClass: 'badge-sent' },
    preparing: { label: 'Preparando', icon: 'skillet',       badgeClass: 'badge-preparing' },
    ready:     { label: '¡Listo!',   icon: 'check_circle',  badgeClass: 'badge-ready' },
    delivered: { label: 'Entregado', icon: 'task_alt',      badgeClass: 'badge-delivered' },
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background-dark">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-background-dark min-h-[100dvh] flex flex-col pb-24 font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-5 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/r/${slug}/t/${tableId}/menu`} className="size-10 rounded-xl bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors active:scale-95">
              <span className="material-symbols-outlined text-text-muted">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Tu Orden</h1>
              <p className="text-xs text-text-muted">{orders.length} {orders.length === 1 ? 'item' : 'items'} en la mesa</p>
            </div>
          </div>
          {/* Connection indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-warning'}`} />
            {isConnected ? 'En vivo' : 'Reconectando...'}
          </div>
        </div>
      </header>

      {/* Success banner after sending */}
      <AnimatePresence>
        {justSent && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="mx-5 mt-3"
          >
            <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-center">
              <span className="text-2xl">🍳</span>
              <p className="text-success font-bold text-sm mt-1">¡Enviado a cocina!</p>
              <p className="text-text-muted text-xs mt-0.5">Te avisaremos cuando esté listo</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 px-5 py-4 max-w-2xl mx-auto w-full space-y-6">
        {/* Empty state */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="size-20 rounded-3xl bg-surface flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-4xl text-text-muted" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Tu carrito está vacío</h2>
            <p className="text-text-muted text-sm mb-6 max-w-[250px]">Explora el menú y agrega deliciosos platos a tu orden</p>
            <Link
              href={`/r/${slug}/t/${tableId}/menu`}
              className="h-12 px-8 bg-primary text-white font-bold text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
              Ver Menú
            </Link>
          </div>
        )}

        {/* ─── PENDING ORDERS (in cart, not sent) ─── */}
        {pendingOrders.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">En tu carrito</h2>
              <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{pendingOrders.length}</span>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {/* My pending orders — deletable */}
                {myPendingOrders.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-neutral-border hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{order.menu_item_name || 'Item'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary font-bold text-sm">${(order.unit_price * order.quantity).toFixed(2)}</span>
                        {order.quantity > 1 && (
                          <span className="text-text-muted text-xs">x{order.quantity}</span>
                        )}
                        {order.notes && (
                          <span className="text-text-muted text-xs truncate max-w-[120px]">— {order.notes}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(order.id)}
                      disabled={deletingId === order.id}
                      className="size-9 rounded-xl bg-danger/10 hover:bg-danger/20 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                      aria-label="Eliminar item"
                    >
                      {deletingId === order.id ? (
                        <div className="size-4 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-danger text-[18px]">delete</span>
                      )}
                    </button>
                  </motion.div>
                ))}

                {/* Other users' pending orders — read-only */}
                {otherPendingOrders.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-surface/50 border border-neutral-border"
                  >
                    <div className="size-8 rounded-full bg-secondary/20 flex items-center justify-center text-sm shrink-0">
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white/80 truncate">{order.menu_item_name || 'Item'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary/80 font-bold text-sm">${(order.unit_price * order.quantity).toFixed(2)}</span>
                        <span className="text-text-muted text-xs">{order.session_user_alias || 'Otro'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Subtotal + Confirm Button */}
            <div className="mt-4 p-4 rounded-2xl bg-surface border border-neutral-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-text-muted">Subtotal carrito</span>
                <span className="text-lg font-bold text-white">${pendingTotal.toFixed(2)}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirmOrders}
                disabled={confirming || pendingOrders.length === 0}
                className="w-full h-14 bg-primary text-white font-bold text-base rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] skew-x-[-15deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                {confirming ? 'Enviando...' : 'Enviar a Cocina'}
              </motion.button>
            </div>
          </section>
        )}

        {/* ─── SENT ORDERS (already in kitchen) ─── */}
        {sentOrders.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-success/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-success text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Enviado a Cocina</h2>
              <span className="ml-auto bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full">{sentOrders.length}</span>
            </div>

            <div className="space-y-2">
              {sentOrders.map(order => {
                const cfg = statusConfig[order.status] || statusConfig.sent;
                return (
                  <motion.div
                    key={order.id}
                    layout
                    className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-neutral-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{order.menu_item_name || 'Item'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary font-bold text-sm">${(order.unit_price * order.quantity).toFixed(2)}</span>
                        {order.session_user_alias && (
                          <span className="text-text-muted text-xs">{order.session_user_alias}</span>
                        )}
                      </div>
                    </div>
                    {/* Status badge — using design system badge classes */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${cfg.badgeClass}`}>
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                      <span className="text-xs font-bold">{cfg.label}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Sent subtotal */}
            <div className="mt-4 p-4 rounded-2xl bg-surface border border-neutral-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Total en cocina</span>
                <span className="text-lg font-bold text-white">${sentTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ─── BOTTOM ACTIONS (above BottomNav) ─── */}
      {sentOrders.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-5 pb-[env(safe-area-inset-bottom)] z-40">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Link
              href={`/r/${slug}/t/${tableId}/menu`}
              className="flex-1 h-13 bg-surface hover:bg-surface-2 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all border border-neutral-border active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Pedir Más
            </Link>
            <Link
              href={`/r/${slug}/t/${tableId}/checkout`}
              className="flex-1 h-13 bg-primary hover:brightness-110 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              Ir a Pagar
            </Link>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
