import React from 'react';
import { OrderCard } from './OrderCard';
import { Order, OrderStatus } from '@/types/dashboard.types';

interface KanbanColumnProps {
  title: string;
  status: OrderStatus;
  orders: Order[];
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
}

export function KanbanColumn({ title, status, orders, onStatusChange }: KanbanColumnProps) {
  let headerColorClass = '';
  let dotColorClass = '';
  let badgeColorClass = '';
  let containerRingClass = '';

  switch (status) {
    case 'sent':
      headerColorClass = 'text-blue-400';
      dotColorClass = 'bg-blue-500 animate-pulse';
      badgeColorClass = 'bg-blue-500/20 text-blue-400';
      containerRingClass = 'border-white/5';
      break;
    case 'preparing':
      headerColorClass = 'text-primary';
      dotColorClass = 'bg-primary animate-pulse';
      badgeColorClass = 'bg-primary/20 text-primary';
      containerRingClass = 'border-primary/20 ring-1 ring-primary/20';
      break;
    case 'ready':
      headerColorClass = 'text-green-400';
      dotColorClass = 'bg-green-500';
      badgeColorClass = 'bg-green-500/20 text-green-400';
      containerRingClass = 'border-white/5';
      break;
    default:
      break;
  }

  const getCountLabel = () => {
    const count = orders.length;
    if (status === 'ready') return count === 1 ? '1 Completada' : `${count} Completadas`;
    return count === 1 ? '1 Orden' : `${count} Órdenes`;
  };

  return (
    <div className={`flex flex-col h-full bg-white/5 rounded-2xl border ${containerRingClass}`}>
      {/* Encabezado de columna */}
      <div className={`p-4 border-b border-white/10 flex justify-between items-center ${status === 'preparing' ? 'bg-primary/5' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${dotColorClass}`} />
          <h2 className={`text-lg font-bold uppercase tracking-wider ${headerColorClass}`}>{title}</h2>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColorClass}`}>
          {getCountLabel()}
        </span>
      </div>

      {/* Lista de órdenes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
            Sin órdenes
          </div>
        ) : (
          orders.map(order => (
            <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </div>
  );
}
