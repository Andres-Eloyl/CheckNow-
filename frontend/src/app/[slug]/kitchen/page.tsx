'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { orderService } from '@/lib/api/order.service';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getStaffWebSocketUrl } from '@/lib/api/client';
import type { OrderItemResponse } from '@/types/api.types';

const COLUMNS = [
  { key: 'sent', label: '🔴 Recibido', color: 'border-blue-500/30 bg-blue-500/5', nextStatus: 'preparing', nextLabel: '🍳 Preparar', nextColor: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' },
  { key: 'preparing', label: '🟡 Preparando', color: 'border-amber-500/30 bg-amber-500/5', nextStatus: 'ready', nextLabel: '✅ ¡Listo!', nextColor: 'bg-green-500/20 text-green-400 hover:bg-green-500/30' },
  { key: 'ready', label: '🟢 Listo', color: 'border-green-500/30 bg-green-500/5', nextStatus: 'delivered', nextLabel: '📦 Entregado', nextColor: 'bg-primary/20 text-primary hover:bg-primary/30' },
];

function ElapsedTime({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
      if (diff < 60) setElapsed(`${diff}s`);
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m`);
      else setElapsed(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [since]);

  return <span className="text-[10px] text-slate-500 font-mono tabular-nums">⏱ {elapsed}</span>;
}

export default function KitchenPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { accessToken } = useAuthStore();
  const { setWsConnected, addNotification } = useDashboardStore();

  const [orders, setOrders] = useState<OrderItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [flashNew, setFlashNew] = useState(false);
  const prevOrderCount = useRef(0);

  const fetchOrders = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await orderService.getActiveOrders(slug);
      // Detect new orders for flash animation
      const sentCount = data.filter((o: OrderItemResponse) => o.status === 'sent').length;
      if (sentCount > prevOrderCount.current && prevOrderCount.current > 0) {
        setFlashNew(true);
        setTimeout(() => setFlashNew(false), 2000);
      }
      prevOrderCount.current = sentCount;
      setOrders(data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-polling fallback every 15s in case WS fails
  useEffect(() => {
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // WebSocket
  const wsUrl = accessToken ? getStaffWebSocketUrl(slug, accessToken) : '';
  const { isConnected } = useWebSocket({
    url: wsUrl,
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false),
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (['new_order', 'order_status', 'order_status_changed', 'order_confirmed'].includes(msg.event)) {
          fetchOrders();
          if (msg.event === 'new_order') {
            playNotificationSound();
            addNotification({
              type: 'new_order',
              title: '🍽️ Nuevo pedido',
              message: `Mesa ${msg.data?.table_number || msg.data?.table || ''}`,
              tableNumber: msg.data?.table_number || msg.data?.table,
            });
          }
        }
      } catch { /* ignore */ }
    },
  });

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.value = 0.3;
      // Two-tone beep
      const osc1 = ctx.createOscillator();
      osc1.connect(gain);
      osc1.frequency.value = 800;
      osc1.type = 'sine';
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        osc2.connect(gain);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);
      }, 200);
    } catch { /* audio not available */ }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await orderService.updateOrderStatus(slug, orderId, { status: newStatus as OrderItemResponse['status'] });
      // Optimistic update
      if (newStatus === 'delivered') {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as OrderItemResponse['status'] } : o));
      }
    } catch { /* silent */ } finally {
      setUpdating(null);
    }
  };

  const ordersByStatus = (status: string) => orders.filter(o => o.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
            Cocina / KDS
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-text-muted text-sm">{orders.length} pedidos activos</p>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
              {isConnected ? 'En vivo' : 'Reconectando'}
            </div>
          </div>
        </div>
        <button onClick={fetchOrders} className="size-10 rounded-xl bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors active:scale-95">
          <span className="material-symbols-outlined text-text-muted">refresh</span>
        </button>
      </div>

      {/* Flash overlay for new orders */}
      <AnimatePresence>
        {flashNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/5 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {COLUMNS.map(col => (
          <div key={col.key} className={`rounded-2xl border p-4 ${col.color} min-h-[300px]`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm">{col.label}</h2>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full font-bold tabular-nums">{ordersByStatus(col.key).length}</span>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {ordersByStatus(col.key).map(order => (
                  <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-xl bg-surface border border-neutral-border relative group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{order.menu_item_name || 'Item'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {order.quantity > 1 && <span className="text-xs text-text-muted bg-white/5 px-1.5 py-0.5 rounded font-bold">x{order.quantity}</span>}
                          {order.session_user_alias && <span className="text-xs text-text-muted">👤 {order.session_user_alias}</span>}
                          {order.sent_at && <ElapsedTime since={order.sent_at} />}
                        </div>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold shrink-0 ml-2">
                        Mesa {((order as unknown as Record<string, unknown>).table_number as string) || '?'}
                      </span>
                    </div>
                    {order.notes && <p className="text-xs text-text-muted italic mb-2">📝 {order.notes}</p>}
                    {order.modifiers && order.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {order.modifiers.map((m, i) => <span key={i} className="text-[10px] bg-surface-2 px-2 py-0.5 rounded font-medium">{m}</span>)}
                      </div>
                    )}
                    <button
                      disabled={updating === order.id}
                      onClick={() => handleStatusChange(order.id, col.nextStatus)}
                      className={`w-full py-2.5 text-xs font-bold rounded-lg disabled:opacity-50 transition-all active:scale-[0.98] ${col.nextColor}`}
                    >
                      {updating === order.id ? (
                        <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : col.nextLabel}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {ordersByStatus(col.key).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-text-muted text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2 opacity-30">inbox</span>
                  Sin pedidos
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
