'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { analyticsService, type DashboardKPIs } from '@/lib/api/analytics.service';
import { tablesService } from '@/lib/api/tables.service';
import { sessionService } from '@/lib/api/session.service';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getStaffWebSocketUrl } from '@/lib/api/client';
import type { TableResponse } from '@/types/api.types';

const KPI_CARDS = [
  { key: 'total_revenue_today', label: 'Ventas Hoy', icon: 'payments', color: 'text-success', prefix: '$' },
  { key: 'avg_ticket_today', label: 'Ticket Promedio', icon: 'receipt_long', color: 'text-primary', prefix: '$' },
  { key: 'active_sessions', label: 'Sesiones Activas', icon: 'groups', color: 'text-secondary', prefix: '' },
  { key: 'total_revenue_month', label: 'Ventas del Mes', icon: 'trending_up', color: 'text-amber-400', prefix: '$' },
];

const TABLE_STATUS_CONFIG: Record<string, { label: string; colorClass: string; dotClass: string }> = {
  free: { label: 'Libre', colorClass: 'bg-success/10 border-success/20', dotClass: 'dot-free' },
  active: { label: 'Activa', colorClass: 'bg-warning/10 border-warning/20 animate-pulse-amber', dotClass: 'dot-active' },
  reserved: { label: 'Reservada', colorClass: 'bg-danger/10 border-danger/20', dotClass: 'dot-reserved' },
};

export default function DashboardHomePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { accessToken, staffName } = useAuthStore();
  const { activeTables, setTables, updateTableStatus, addNotification, setWsConnected } = useDashboardStore();

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingTable, setOpeningTable] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    Promise.all([
      analyticsService.getDashboardKPIs(slug).catch(err => {
        console.error('[Dashboard] Error fetching KPIs:', err);
        return null;
      }),
      tablesService.getTables(slug).catch(err => {
        console.error('[Dashboard] Error fetching Tables:', err);
        return [];
      }),
    ]).then(([kpiData, tableData]) => {
      // If BOTH fail, it's likely a connection issue
      if (!kpiData && (!tableData || tableData.length === 0)) {
        setError('No se pudo conectar con el servidor. Por favor, recarga la página.');
      }
      
      if (kpiData) setKpis(kpiData);
      setTables(tableData as TableResponse[]);
    }).catch(err => {
      setError('Error inesperado al cargar los datos.');
      console.error(err);
    }).finally(() => setLoading(false));
  }, [slug, setTables]);

  // WebSocket for real-time
  const wsUrl = accessToken ? getStaffWebSocketUrl(slug, accessToken) : '';
  useWebSocket({
    url: wsUrl,
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false),
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.event) {
          case 'session_opened':
            updateTableStatus(msg.data?.table_id, 'active');
            addNotification({ type: 'new_order', title: 'Mesa abierta', message: `Mesa ${msg.data?.table_number || ''} abierta`, tableNumber: msg.data?.table_number });
            break;
          case 'session_closed':
            updateTableStatus(msg.data?.table_id, 'free');
            break;
          case 'new_order':
            addNotification({ type: 'new_order', title: '🍽️ Nuevo pedido', message: `Mesa ${msg.data?.table_number || ''}`, tableNumber: msg.data?.table_number });
            break;
          case 'payment_pending':
            addNotification({ type: 'payment_pending', title: '💳 Pago pendiente', message: `Mesa ${msg.data?.table_number || ''}`, tableNumber: msg.data?.table_number });
            break;
        }
      } catch {}
    },
  });

  const handleOpenSession = async (tableId: string) => {
    setOpeningTable(tableId);
    try {
      await sessionService.openSession(slug, { table_id: tableId });
      updateTableStatus(tableId, 'active');
    } catch (err: any) {
      console.error('Error opening session:', err?.detail || err?.message || err);
      alert(err?.detail || 'Error al abrir la mesa. Intenta de nuevo.');
    } finally {
      setOpeningTable(null);
    }
  };

  const handleCloseSession = async (table: TableResponse) => {
    try {
      // closeSession requires the session token, but from dashboard we don't have it
      // so we use table_id-based approach — the backend will find the active session
      await sessionService.closeSession(slug, table.id);
      updateTableStatus(table.id, 'free');
    } catch {}
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Buenos días' : greetingHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-vh-100 p-6 text-center">
        <div className="size-20 rounded-full bg-danger/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-danger text-4xl">cloud_off</span>
        </div>
        <h1 className="text-xl font-black mb-2">Error de conexión</h1>
        <p className="text-text-muted mb-8 max-w-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-2xl bg-primary text-white font-bold hover:scale-105 transition-all"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight">{greeting}, <span className="text-primary">{staffName || 'Admin'}</span></h1>
        <p className="text-text-muted text-sm mt-1">Aquí está el resumen de tu restaurante</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map((card) => {
          const kpiMap: Record<string, number> = kpis ? {
            total_revenue_today: kpis.total_revenue_today,
            avg_ticket_today: kpis.avg_ticket_today,
            active_sessions: kpis.active_sessions,
            total_revenue_month: kpis.total_revenue_month,
          } : {};
          const value = kpiMap[card.key] ?? 0;
          return (
            <motion.div key={card.key} variants={itemVariants} className="p-5 rounded-2xl glass hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className={`size-10 rounded-xl bg-surface-2 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-black tabular-nums">{card.prefix}{typeof value === 'number' ? value.toLocaleString('es-VE', { minimumFractionDigits: card.prefix === '$' ? 2 : 0, maximumFractionDigits: 2 }) : '--'}</p>
              <p className="text-xs text-text-muted font-medium mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Table Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">table_restaurant</span>
          Mesas del Restaurante
        </h2>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {activeTables.map((table) => {
          const config = TABLE_STATUS_CONFIG[table.status] || TABLE_STATUS_CONFIG.free;
          const isOpening = openingTable === table.id;
          return (
            <motion.div key={table.id} variants={itemVariants}
              className={`relative p-4 rounded-2xl border ${config.colorClass} flex flex-col items-center gap-2 cursor-pointer hover:scale-[1.03] transition-all group`}
              onClick={() => {
                if (table.status === 'free') handleOpenSession(table.id);
                else if (table.status === 'active') handleCloseSession(table);
              }}
            >
              <div className={`size-3 rounded-full ${config.dotClass} absolute top-2 right-2`} />
              <span className="text-2xl font-black tabular-nums">{table.number}</span>
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">{config.label}</span>
              {table.capacity && <span className="text-[10px] text-text-muted">🪑 {table.capacity}</span>}
              {isOpening && <span className="material-symbols-outlined animate-spin text-primary text-lg absolute">progress_activity</span>}

              {/* Hover action tooltip */}
              <div className="absolute inset-0 bg-surface/80 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-xs font-bold">
                  {table.status === 'free' ? '▶ Abrir' : table.status === 'active' ? '⏹ Cerrar' : 'Reservada'}
                </span>
              </div>
            </motion.div>
          );
        })}

        {activeTables.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-text-muted mb-4">table_restaurant</span>
            <p className="text-text-muted font-medium">No hay mesas configuradas</p>
            <p className="text-text-muted text-sm">Ve a Mesas para agregar mesas</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
