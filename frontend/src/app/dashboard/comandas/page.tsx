'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { KanbanColumn } from '@/components/dashboard/KanbanColumn';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { playAlertSound } from '@/lib/utils/audio';
import { Order, OrderStatus } from '@/types/dashboard.types';

// Datos de demostración
const DEMO_ORDERS: Order[] = [
  {
    id: 'o1',
    table: '12',
    status: 'sent',
    sent_at: new Date(Date.now() - 4 * 60000).toISOString(),
    items: [
      { id: 'i1', name: 'Classic Burger', quantity: 2, modifiers: [{ name: 'Extra Bacon', extra_price: 2 }, { name: 'Sin Cebolla', extra_price: 0 }] },
      { id: 'i2', name: 'Tacos al Pastor', quantity: 1, modifiers: [{ name: 'Picante suave', extra_price: 0 }] },
    ],
  },
  {
    id: 'o2',
    table: 'Llevar #402',
    status: 'sent',
    sent_at: new Date(Date.now() - 1 * 60000).toISOString(),
    items: [
      { id: 'i3', name: 'Margarita Pizza', quantity: 4, modifiers: [{ name: 'Familiar, Masa fina', extra_price: 0 }] },
    ],
  },
  {
    id: 'o3',
    table: '4',
    status: 'preparing',
    sent_at: new Date(Date.now() - 12 * 60000).toISOString(),
    items: [
      { id: 'i4', name: 'BBQ Burger', quantity: 2, modifiers: [{ name: 'Doble Queso', extra_price: 2 }] },
      { id: 'i5', name: 'Margarita Cocktail', quantity: 1, modifiers: [{ name: 'Sin sal', extra_price: 0 }] },
    ],
  },
  {
    id: 'o4',
    table: '8',
    status: 'ready',
    sent_at: new Date(Date.now() - 25 * 60000).toISOString(),
    items: [
      { id: 'i6', name: 'Ensalada César', quantity: 1, modifiers: [] },
      { id: 'i7', name: 'Pasta Carbonara', quantity: 2, modifiers: [] },
    ],
  },
];

/**
 * AI Context: The core Kitchen/Bar Display system page.
 * Uses WebSockets to receive real-time order updates. 
 * Renders a Kanban board separated by order statuses: 'sent', 'preparing', 'ready'.
 */
export default function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [isConnected, setIsConnected] = useState(false);
  const [time, setTime] = useState('');

  // Reloj en vivo (solo en cliente)
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const slug = 'demo';
    const token = localStorage.getItem('staff_token') || '';
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/ws/dashboard/${slug}?token=${token}`);

        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws?.close();
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === 'new_order') {
              playAlertSound();
              setOrders(prev => [data.payload as Order, ...prev]);
            } else if (data.event === 'order_status_changed') {
              const { order_id, status } = data.payload;
              setOrders(prev => prev.map(o => o.id === order_id ? { ...o, status } : o));
            }
          } catch {
            // Ignorar mensajes inválidos
          }
        };
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const handleStatusChange = useCallback(async (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

    try {
      await fetch(`/api/demo/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Actualización local funciona para demo
    }
  }, []);

  const categorized = useMemo(() => ({
    sent: orders.filter(o => o.status === 'sent'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
  }), [orders]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#120d0b] text-slate-100 font-display">
      {/* Navegación lateral */}
      <DashboardNav />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#120d0b]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-2xl leading-none">soup_kitchen</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Panel de Cocina</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Sistema de Display</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón de sonido de prueba */}
            <button
              onClick={playAlertSound}
              className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
              title="Probar sonido"
            >
              <span className="material-symbols-outlined text-slate-400 text-lg leading-none">volume_up</span>
              <span className="text-xs text-slate-400">Probar</span>
            </button>

            {/* Reloj */}
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg leading-none">schedule</span>
              <span className="text-xl font-bold">{time || '--:--'}</span>
            </div>
          </div>
        </header>

        {/* Tablero Kanban */}
        <main className="flex-1 overflow-hidden p-4 grid grid-cols-3 gap-4">
          <KanbanColumn title="Pendiente" status="sent" orders={categorized.sent} onStatusChange={handleStatusChange} />
          <KanbanColumn title="Preparando" status="preparing" orders={categorized.preparing} onStatusChange={handleStatusChange} />
          <KanbanColumn title="Listo" status="ready" orders={categorized.ready} onStatusChange={handleStatusChange} />
        </main>

        {/* Barra de estado */}
        <footer className="bg-[#1c1613] px-6 py-2 flex justify-between items-center border-t border-white/10 text-xs">
          <div className="flex gap-6 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>
          </div>
          <span className="text-slate-600">Actualización en tiempo real</span>
        </footer>
      </div>
    </div>
  );
}
