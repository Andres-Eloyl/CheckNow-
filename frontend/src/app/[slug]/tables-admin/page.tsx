'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import type { TableResponse, TableCreate } from '@/types/api.types';
import { useTables } from '@/hooks/useTables';

export default function TablesAdminPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const {
    tables,
    loading,
    saving,
    createTable,
    updateTable,
    deleteTable,
  } = useTables(slug);

  const [showCreate, setShowCreate] = useState(false);
  const [editingTable, setEditingTable] = useState<TableResponse | null>(null);
  const [form, setForm] = useState<TableCreate>({ number: 1, label: '', capacity: 4 });
  const [qrTable, setQrTable] = useState<TableResponse | null>(null);

  const handleSave = async () => {
    let success = false;
    if (editingTable) {
      success = await updateTable(editingTable.id, form);
    } else {
      success = await createTable(form);
    }
    
    if (success) {
      setShowCreate(false);
      setEditingTable(null);
      resetForm();
    }
  };

  const handleDelete = async (table: TableResponse) => {
    if (!confirm(`¿Eliminar mesa ${table.number}?`)) return;
    await deleteTable(table.id);
  };

  const resetForm = () => setForm({ 
    number: (tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1), 
    label: '', 
    capacity: 4 
  });

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

  const qrUrl = qrTable && typeof window !== 'undefined' ? `${window.location.origin}/r/${slug}/t/${qrTable.id}` : '';
  
  const handleDownloadQR = () => {
    if (!qrTable) return;
    const svg = document.querySelector('.qr-wrapper svg') as SVGElement;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_Mesa_${qrTable.number}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQR = () => {
    if (!qrTable) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const svg = document.querySelector('.qr-wrapper svg') as SVGElement;
    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Mesa ${qrTable.number} - CheckNow</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif; }
            .card { text-align: center; padding: 40px; border: 1px dashed #ccc; border-radius: 40px; background: white; width: 300px; }
            .brand { font-weight: 900; color: #6C63FF; font-size: 24px; margin-bottom: 5px; }
            .subtitle { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 30px; }
            h1 { margin: 0 0 30px 0; font-size: 28px; color: #1a1a24; }
            .qr-container { padding: 20px; border: 1px solid #eee; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
            .footer { font-size: 8px; color: #aaa; word-break: break-all; max-width: 250px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">CheckNow!</div>
            <div class="subtitle">Pide desde tu mesa</div>
            <h1>Mesa ${qrTable.number}</h1>
            <div class="qr-container">
              ${svgData}
            </div>
            <div class="footer">${qrUrl}</div>
          </div>
          <script>
            window.onload = () => { 
              window.print(); 
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-32 rounded-2xl bg-surface-2 border border-neutral-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.sort((a, b) => a.number - b.number).map(table => (
            <motion.div key={table.id} layout className="p-5 rounded-2xl bg-surface border border-neutral-border hover:border-primary/20 transition-all group flex flex-col justify-between">
              <div>
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
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setQrTable(table)} className="flex-1 py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/30 transition-colors">📱 QR</button>
                <button onClick={() => openEdit(table)} className="flex-1 py-2 bg-surface-2 text-text-muted text-xs font-bold rounded-lg hover:bg-primary/20 hover:text-primary transition-colors">✏️ Editar</button>
                <button onClick={() => handleDelete(table)} className="py-2 px-3 bg-danger/20 text-danger text-xs font-bold rounded-lg hover:bg-danger/30 transition-colors">🗑️</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-4 shadow-xl border border-neutral-border">
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
                <button onClick={() => setShowCreate(false)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl hover:bg-surface-3 transition">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl disabled:opacity-50 hover:bg-primary-hover transition shadow-lg shadow-primary/20">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {qrTable && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6 print-overlay-fix" onClick={() => setQrTable(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl printable-qr relative">
              
              {/* Branding for print */}
              <div className="hidden print:flex print-brand">
                <span>CheckNow!</span>
                <span>Pide desde tu mesa</span>
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Mesa {qrTable.number} {qrTable.label ? `(${qrTable.label})` : ''}
              </h3>
              
              <div className="flex justify-center bg-white p-4 rounded-xl shadow-inner border border-gray-100 qr-wrapper">
                <QRCode value={qrUrl} size={220} level="H" />
              </div>
              
              <div className="hidden print:block print-footer">
                <p>{qrUrl}</p>
              </div>

              <p className="text-[10px] text-gray-500 break-all select-all p-2 bg-gray-50 rounded-lg border border-gray-100 no-print">
                {qrUrl}
              </p>
              
              <div className="flex flex-col gap-2 no-print">
                <button onClick={handlePrintQR} className="w-full h-12 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">print</span> Imprimir Tarjeta
                </button>
                <button onClick={handleDownloadQR} className="w-full h-12 bg-gray-100 text-gray-900 font-bold rounded-2xl hover:bg-gray-200 transition flex items-center justify-center gap-2 border border-gray-200">
                  <span className="material-symbols-outlined text-xl">download</span> Descargar Imagen
                </button>
              </div>

              {/* Close button for screen */}
              <button onClick={() => setQrTable(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition no-print">
                <span className="material-symbols-outlined">close</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
