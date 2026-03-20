'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSessionStore } from '@/stores/session.store';
import { orderService } from '@/lib/api/order.service';
import { sessionService } from '@/lib/api/session.service';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getComensalWebSocketUrl } from '@/lib/api/client';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { OrderItemResponse, SessionUserResponse } from '@/types/api.types';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: 'En carrito', class: 'badge-pending' },
  sent: { label: 'Enviado 🍳', class: 'badge-sent' },
  preparing: { label: 'Preparando...', class: 'badge-preparing' },
  ready: { label: '¡Listo! 🔔', class: 'badge-ready' },
  delivered: { label: 'Entregado ✓', class: 'badge-delivered' },
};

export default function GuestCartPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const slug = params.slug;
  const tableId = params.tableId;
  const router = useRouter();

  const { sessionUserId, alias } = useSessionStore();
  const [orders, setOrders] = useState<OrderItemResponse[]>([]);
  const [users, setUsers] = useState<SessionUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  // Redirect if no session
  useEffect(() => {
    if (!sessionUserId) router.replace(`/r/${slug}/t/${tableId}`);
  }, [sessionUserId, router, slug, tableId]);

  // Fetch orders and users
  const fetchData = useCallback(async () => {
    if (!slug || !tableId) return;
    try {
      const [ordersData, sessionData] = await Promise.all([
        orderService.getSessionOrders(slug, tableId),
        sessionService.getSession(slug, tableId),
      ]);
      setOrders(ordersData);
      setUsers(sessionData.users);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [slug, tableId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // WebSocket for real-time updates
  const wsUrl = sessionUserId ? getComensalWebSocketUrl(tableId, sessionUserId) : '';
  useWebSocket({
    url: wsUrl,
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'item_added' || msg.event === 'item_removed' || msg.event === 'order_confirmed' || msg.event === 'order_status') {
          fetchData();
        }
      } catch {}
    },
  });

  const handleDelete = async (orderId: string) => {
    try {
      await orderService.removeItem(slug, tableId, orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch {}
  };

  const handleConfirmOrders = async () => {
    setConfirming(true);
    try {
      await orderService.confirmOrders(slug, tableId);
      setConfirmSuccess(true);
      setTimeout(() => setConfirmSuccess(false), 3000);
      fetchData();
    } catch {} finally {
      setConfirming(false);
    }
  };

  const myPendingOrders = orders.filter(o => o.session_user_id === sessionUserId && o.status === 'pending');
  const subtotal = orders.reduce((acc, o) => acc + o.unit_price * o.quantity, 0);

  // Group orders by user
  const groupedOrders = orders.reduce((acc, order) => {
    const userId = order.session_user_id;
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(order);
    return acc;
  }, {} as Record<string, OrderItemResponse[]>);

  const getUserInfo = (userId: string) => users.find(u => u.id === userId);

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background-dark"><LoadingSpinner /></div>;
  }

  return (
    <div className="bg-background-dark font-[Inter] text-white min-h-[100dvh] flex flex-col pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-5 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/r/${slug}/t/${tableId}/menu`} className="size-10 rounded-xl bg-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-text-muted">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Carrito</h1>
              <p className="text-xs text-text-muted">{orders.length} items • {users.length} personas</p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {users.slice(0, 4).map(u => (
              <div key={u.id} className="size-8 rounded-full border-2 border-background-dark">
                <Avatar alias={u.alias} size="sm" />
              </div>
            ))}
            {users.length > 4 && (
              <div className="size-8 rounded-full bg-surface flex items-center justify-center text-xs font-bold border-2 border-background-dark">
                +{users.length - 4}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Success animation */}
      <AnimatePresence>
        {confirmSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-5 mt-3 p-4 rounded-2xl bg-success/20 border border-success/30 text-center"
          >
            <span className="text-2xl">🎉</span>
            <p className="text-success font-bold mt-1">¡Pedido enviado a cocina!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders grouped by user */}
      <main className="flex-1 px-5 py-4 max-w-2xl mx-auto w-full space-y-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <span className="material-symbols-outlined text-6xl text-text-muted mb-4">shopping_cart</span>
            <h2 className="text-xl font-bold mb-2">Carrito vacío</h2>
            <p className="text-text-muted text-sm mb-6">Agrega items desde el menú</p>
            <Link href={`/r/${slug}/t/${tableId}/menu`} className="bg-primary text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-primary/30">
              Ver Menú
            </Link>
          </div>
        ) : (
          Object.entries(groupedOrders).map(([userId, userOrders]) => {
            const user = getUserInfo(userId);
            const isMe = userId === sessionUserId;
            return (
              <div key={userId}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-7 rounded-full" style={{ backgroundColor: user?.color || '#6C63FF' }}>
                    <div className="flex items-center justify-center h-full text-xs">{user?.emoji || '👤'}</div>
                  </div>
                  <span className="text-sm font-bold">{isMe ? 'Mis items' : user?.alias || 'Desconocido'}</span>
                  {isMe && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">Tú</span>}
                </div>
                <div className="space-y-2">
                  {userOrders.map(order => {
                    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-surface flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{order.menu_item_name || 'Item'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-primary font-bold text-sm">${(order.unit_price * order.quantity).toFixed(2)}</span>
                            {order.quantity > 1 && <span className="text-text-muted text-xs">x{order.quantity}</span>}
                            {order.is_shared && <span className="text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-bold">Compartido</span>}
                          </div>
                          {order.notes && <p className="text-text-muted text-xs mt-1 italic">📝 {order.notes}</p>}
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${status.class}`}>{status.label}</span>
                        {isMe && order.status === 'pending' && !order.is_locked && (
                          <button onClick={() => handleDelete(order.id)} className="size-8 rounded-xl bg-danger/20 text-danger flex items-center justify-center hover:bg-danger/30 transition-colors shrink-0">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Bottom bar */}
      {orders.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 glass border-t border-neutral-border p-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-sm">Subtotal mesa</span>
              <span className="text-lg font-black">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              {myPendingOrders.length > 0 && (
                <button
                  onClick={handleConfirmOrders}
                  disabled={confirming}
                  className="flex-1 h-13 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50 transition-all active:scale-95"
                >
                  {confirming ? 'Enviando...' : `Enviar a Cocina (${myPendingOrders.length})`}
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              )}
              <Link
                href={`/r/${slug}/t/${tableId}/split`}
                className="h-13 px-5 bg-surface-2 text-white font-bold rounded-2xl flex items-center justify-center gap-2 border border-neutral-border"
              >
                <span className="material-symbols-outlined text-lg">splitscreen</span>
                Dividir
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
