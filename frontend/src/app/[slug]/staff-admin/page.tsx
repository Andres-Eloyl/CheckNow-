'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { staffService } from '@/lib/api/staff.service';
import type { StaffResponse, StaffCreate, StaffUpdate, StaffRole } from '@/types/api.types';

const ROLES: { id: StaffRole, label: string, emoji: string }[] = [
  { id: 'waiter', label: 'Mesero', emoji: '🧑‍🍳' },
  { id: 'kitchen', label: 'Cocina', emoji: '👨‍🍳' },
  { id: 'bar', label: 'Bar', emoji: '🍸' },
  { id: 'cashier', label: 'Cajero', emoji: '💰' },
  { id: 'manager', label: 'Manager', emoji: '👔' },
];

export default function StaffAdminPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [staff, setStaff] = useState<StaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffResponse | null>(null);
  const [form, setForm] = useState<StaffCreate>({ name: '', role: 'waiter', pin: '' });
  const [saving, setSaving] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!slug) return;
    staffService.getStaff(slug)
      .then(setStaff)
      .catch((err: any) => {
        if (err?.status === 402) setLimitReached(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const payload: Partial<StaffUpdate> = {
          name: form.name,
          role: form.role,
        };
        if (form.pin && form.pin.trim() !== '') {
          payload.pin = form.pin;
        }
        const updated = await staffService.updateStaff(slug, editing.id, payload as StaffUpdate);
        setStaff(prev => prev.map(s => s.id === editing.id ? updated : s));
      } else {
        const created = await staffService.createStaff(slug, form);
        setStaff(prev => [...prev, created]);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', role: 'waiter', pin: '' });
    } catch (err: unknown) {
      if ((err as { status?: number })?.status === 402) setLimitReached(true);
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (member: StaffResponse) => {
    try {
      const updated = await staffService.updateStaff(slug, member.id, { is_active: !member.is_active });
      setStaff(prev => prev.map(s => s.id === member.id ? updated : s));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este empleado?')) return;
    try {
      await staffService.deactivateStaff(slug, id);
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const openCreate = () => { setEditing(null); setForm({ name: '', role: 'waiter', pin: '' }); setShowModal(true); };
  const openEdit = (m: StaffResponse) => { setEditing(m); setForm({ name: m.name, role: m.role as StaffRole, pin: '' }); setShowModal(true); };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">people</span>
            Administrar Staff
          </h1>
          <p className="text-text-muted text-sm mt-1">{staff.length} empleados</p>
        </div>
        <button onClick={openCreate} className="h-10 px-5 bg-primary text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-lg">person_add</span> Nuevo
        </button>
      </div>

      {limitReached && (
        <div className="mb-6 p-4 rounded-2xl bg-warning/20 border border-warning/30 flex items-center gap-3">
          <span className="material-symbols-outlined text-warning">workspace_premium</span>
          <div>
            <p className="font-bold text-sm text-warning">Límite de plan alcanzado</p>
            <p className="text-xs text-text-muted">Actualiza tu plan para agregar más empleados</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {staff.map(member => {
          const role = ROLES.find(r => r.id === member.role) || ROLES[0];
          return (
            <motion.div key={member.id} layout className="p-5 rounded-2xl bg-surface border border-neutral-border flex items-center gap-4 hover:border-primary/20 transition-all group">
              <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-xl shrink-0">{role.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{member.name}</p>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">{role.label}</p>
              </div>
              <button onClick={() => handleToggleActive(member)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${member.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                {member.is_active ? 'Activo' : 'Inactivo'}
              </button>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(member)} className="size-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-muted hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={() => handleDelete(member.id)} className="size-8 rounded-lg bg-danger/20 flex items-center justify-center text-danger hover:bg-danger/30 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold">{editing ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
              <div className="space-y-3">
                <div><label className="text-xs text-text-muted font-semibold">Nombre</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nombre del empleado" /></div>
                <div><label className="text-xs text-text-muted font-semibold">Rol</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {ROLES.map(r => (
                      <button key={r.id} type="button" onClick={() => setForm(f => ({ ...f, role: r.id }))}
                        className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          form.role === r.id ? 'bg-primary/20 border border-primary/30 text-primary' : 'bg-surface-2 text-text-muted'
                        }`}>
                        <span>{r.emoji}</span>{r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="text-xs text-text-muted font-semibold">{editing ? 'Nuevo PIN (dejar vacío para mantener)' : 'PIN (4 dígitos)'}</label>
                  <input type="password" value={form.pin || ''} onChange={e => setForm(f => ({ ...f, pin: e.target.value.slice(0, 4) }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm text-center tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="••••" maxLength={4} inputMode="numeric" /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl">Cancelar</button>
                <button onClick={handleSave} disabled={!form.name || saving}
                  className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
