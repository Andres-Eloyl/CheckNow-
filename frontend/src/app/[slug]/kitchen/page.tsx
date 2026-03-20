'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { orderService } from '@/lib/api/order.service';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getStaffWebSocketUrl } from '@/lib/api/client';
import type { OrderItemResponse } from '@/types/api.types';

const COLUMNS = [
  { key: 'sent', label: '🔴 Recibido', color: 'border-blue-500/30 bg-blue-500/5' },
  { key: 'preparing', label: '🟡 Preparando', color: 'border-amber-500/30 bg-amber-500/5' },
  { key: 'ready', label: '🟢 Listo', color: 'border-green-500/30 bg-green-500/5' },
];

export default function KitchenPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { accessToken } = useAuthStore();
  const { setWsConnected, addNotification } = useDashboardStore();

  const [orders, setOrders] = useState<OrderItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await orderService.getActiveOrders(slug);
      setOrders(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // WebSocket
  const wsUrl = accessToken ? getStaffWebSocketUrl(slug, accessToken) : '';
  useWebSocket({
    url: wsUrl,
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false),
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (['new_order', 'order_status', 'order_confirmed'].includes(msg.event)) {
          fetchOrders();
          if (msg.event === 'new_order') {
            playNotificationSound();
            addNotification({ type: 'new_order', title: '🍽️ Nuevo pedido', message: `Mesa ${msg.data?.table_number || ''}`, tableNumber: msg.data?.table_number });
          }
        }
      } catch {}
    },
  });

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => { osc.frequency.value = 1000; const o2 = ctx.createOscillator(); o2.connect(gain); o2.frequency.value = 1000; o2.type = 'sine'; o2.start(); o2.stop(ctx.currentTime + 0.15); }, 200);
    } catch {}
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await orderService.updateOrderStatus(slug, orderId, { status: newStatus as OrderItemResponse['status'] });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as OrderItemResponse['status'] } : o));
    } catch {} finally {
      setUpdating(null);
    }
  };

  const ordersByStatus = (status: string) => orders.filter(o => o.status === status);

  return (
    <div className="p-4 lg:p-8 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
            Cocina / KDS
          </h1>
          <p className="text-text-muted text-sm mt-1">{orders.length} pedidos activos</p>
        </div>
        <button onClick={fetchOrders} className="size-10 rounded-xl bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors">
          <span className="material-symbols-outlined text-text-muted">refresh</span>
        </button>
      </div>

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
                      <div>
                        <p className="font-bold text-sm">{order.menu_item_name || 'Item'}</p>
                        {order.quantity > 1 && <span className="text-xs text-text-muted">x{order.quantity}</span>}
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">Mesa {((order as unknown as Record<string, unknown>).table_number as string) || '?'}</span>
                    </div>
                    {order.notes && <p className="text-xs text-text-muted italic mb-2">📝 {order.notes}</p>}
                    {order.modifiers && order.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {order.modifiers.map((m, i) => <span key={i} className="text-[10px] bg-surface-2 px-2 py-0.5 rounded font-medium">{m}</span>)}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {col.key === 'sent' && (
                        <button disabled={updating === order.id} onClick={() => handleStatusChange(order.id, 'preparing')}
                          className="flex-1 py-2 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/30 disabled:opacity-50 transition-all">
                          Preparar
                        </button>
                      )}
                      {col.key === 'preparing' && (
                        <button disabled={updating === order.id} onClick={() => handleStatusChange(order.id, 'ready')}
                          className="flex-1 py-2 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30 disabled:opacity-50 transition-all">
                          ¡Listo!
                        </button>
                      )}
                      {col.key === 'ready' && (
                        <button disabled={updating === order.id} onClick={() => handleStatusChange(order.id, 'delivered')}
                          className="flex-1 py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/30 disabled:opacity-50 transition-all">
                          Entregado ✓
                        </button>
                      )}
                    </div>
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
