import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types/dashboard.types';

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [elapsed, setElapsed] = useState('--:--');

  // Calculate elapsed time ONLY on the client to avoid hydration mismatch
  useEffect(() => {
    const update = () => {
      const sent = new Date(order.sent_at);
      const now = new Date();
      const totalSeconds = Math.floor((now.getTime() - sent.getTime()) / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setElapsed(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order.sent_at]);

  // Determine styles based on status
  let glowClass = '';
  let buttonEl = null;

  switch (order.status) {
    case 'sent':
      glowClass = 'border-l-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]';
      buttonEl = (
        <button
          onClick={() => onStatusChange(order.id, 'preparing')}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-[#120d0b] font-black text-lg uppercase transition-all active:scale-[0.98]"
        >
          ▶ Empezar
        </button>
      );
      break;

    case 'preparing':
      glowClass = 'border-l-4 border-primary shadow-[0_0_25px_rgba(244,123,37,0.25)]';
      buttonEl = (
        <button
          onClick={() => onStatusChange(order.id, 'ready')}
          className="w-full py-5 bg-green-500 hover:bg-green-400 text-[#120d0b] font-black text-lg uppercase transition-all shadow-lg active:scale-[0.98]"
        >
          ✓ Listo
        </button>
      );
      break;

    case 'ready':
      glowClass = 'border-l-4 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)] opacity-80';
      buttonEl = (
        <button
          onClick={() => onStatusChange(order.id, 'delivered')}
          className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-base uppercase transition-all border-t border-white/5"
        >
          Entregado ✓
        </button>
      );
      break;

    default:
      break;
  }

  return (
    <div
      className={`rounded-xl overflow-hidden flex flex-col transition-all ${glowClass}`}
      style={{
        background: 'rgba(44, 34, 28, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Encabezado */}
      <div className={`p-4 flex justify-between items-center ${order.status === 'preparing' ? 'bg-primary/10 border-b border-primary/20' : 'border-b border-white/5'}`}>
        <span className="text-xl font-black text-white">Mesa #{order.table}</span>

        {order.status === 'sent' && (
          <div className="flex flex-col items-end">
            <span className="text-blue-400 font-bold text-base">{elapsed}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Espera</span>
          </div>
        )}

        {order.status === 'preparing' && (
          <div className="flex flex-col items-end">
            <span className="text-primary font-bold text-xl">{elapsed}</span>
            <span className="text-[10px] text-primary/70 uppercase font-bold">En Cocina</span>
          </div>
        )}

        {order.status === 'ready' && (
          <span className="text-green-500 font-bold text-sm italic">Listo</span>
        )}
      </div>

      {/* Lista de ítems */}
      <div className={`p-4 space-y-3 ${order.status === 'ready' ? 'opacity-60' : ''}`}>
        {order.items.map((item, idx) => (
          <div key={item.id + idx} className="flex items-start gap-3">
            {order.status !== 'ready' && (
              <span className="text-lg font-black text-primary min-w-[32px]">{item.quantity}x</span>
            )}
            <div className="flex-1">
              <p className={`text-base font-bold ${order.status === 'ready' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                {order.status === 'ready' && <span className="mr-1">{item.quantity}x</span>}
                {item.name}
              </p>
              {item.modifiers && item.modifiers.length > 0 && order.status !== 'ready' && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {item.modifiers.map(m => m.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      {buttonEl}
    </div>
  );
}
