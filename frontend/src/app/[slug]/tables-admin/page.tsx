'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { tablesService } from '@/lib/api/tables.service';
import QRCode from 'react-qr-code';
import type { TableResponse, TableCreate } from '@/types/api.types';

export default function TablesAdminPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [tables, setTables] = useState<TableResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTable, setEditingTable] = useState<TableResponse | null>(null);
  const [form, setForm] = useState<TableCreate>({ number: 1, label: '', capacity: 4 });
  const [saving, setSaving] = useState(false);
  const [qrTable, setQrTable] = useState<TableResponse | null>(null);

  useEffect(() => {
    if (!slug) return;
    tablesService.getTables(slug)
      .then(setTables)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingTable) {
        const updated = await tablesService.updateTable(slug, editingTable.id, form);
        setTables(prev => prev.map(t => t.id === editingTable.id ? updated : t));
      } else {
        const created = await tablesService.createTable(slug, form);
        setTables(prev => [...prev, created]);
      }
      setShowCreate(false);
      setEditingTable(null);
      resetForm();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: TableResponse) => {
    if (!confirm(`¿Eliminar mesa ${table.number}?`)) return;
    try {
      await tablesService.deleteTable(slug, table.id);
      setTables(prev => prev.filter(t => t.id !== table.id));
    } catch {}
  };

  const resetForm = () => setForm({ number: (tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1), label: '', capacity: 4 });

  const openEdit = (table: TableResponse) => {
    setEditingTable(table);
    setForm({ number: table.number, label: table.label || '', capacity: table.capacity || 4 });
    setShowCreate(true);
  };

  const openCreate = () => {
    setEditingTable(null);
    resetForm();
    setShowCreate(true);
  };

  const qrUrl = qrTable ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${slug}/t/${qrTable.id}` : '';

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">table_restaurant</span>
            Administrar Mesas
          </h1>
          <p className="text-text-muted text-sm mt-1">{tables.length} mesas configuradas</p>
        </div>
        <button onClick={openCreate} className="h-10 px-5 bg-primary text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <span className="material-symbols-outlined text-lg">add</span> Nueva Mesa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.sort((a, b) => a.number - b.number).map(table => (
          <motion.div key={table.id} layout className="p-5 rounded-2xl bg-surface border border-neutral-border hover:border-primary/20 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-primary tabular-nums">{table.number}</span>
                {table.label && <span className="text-sm text-text-muted">{table.label}</span>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                table.status === 'free' ? 'bg-success/20 text-success' : table.status === 'active' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
              }`}>
                {table.status === 'free' ? 'Libre' : table.status === 'active' ? 'Activa' : 'Reservada'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
              <span className="flex items-center gap-1">🪑 {table.capacity || 4} personas</span>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setQrTable(table)} className="flex-1 py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/30 transition-colors">📱 QR</button>
              <button onClick={() => openEdit(table)} className="flex-1 py-2 bg-surface-2 text-text-muted text-xs font-bold rounded-lg hover:bg-primary/20 hover:text-primary transition-colors">✏️ Editar</button>
              <button onClick={() => handleDelete(table)} className="py-2 px-3 bg-danger/20 text-danger text-xs font-bold rounded-lg hover:bg-danger/30 transition-colors">🗑️</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold">{editingTable ? 'Editar Mesa' : 'Nueva Mesa'}</h3>
              <div className="space-y-3">
                <div><label className="text-xs text-text-muted font-semibold">Número</label>
                  <input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: parseInt(e.target.value) || 1 }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-text-muted font-semibold">Etiqueta (opcional)</label>
                  <input value={form.label || ''} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="Ej: Terraza, VIP" className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-text-muted font-semibold">Capacidad</label>
                  <input type="number" value={form.capacity || 4} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 4 }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {qrTable && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setQrTable(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-3xl p-8 text-center space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Mesa {qrTable.number}</h3>
              <div className="flex justify-center"><QRCode value={qrUrl} size={220} level="H" /></div>
              <p className="text-xs text-gray-500 break-all">{qrUrl}</p>
              <button onClick={() => { window.print(); }} className="w-full h-12 bg-gray-900 text-white font-bold rounded-2xl">🖨️ Imprimir QR</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
