'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { menuService } from '@/lib/api/menu.service';
import { useMenuStore } from '@/stores/menu.store';
import type { MenuItemResponse, CategoryResponse, MenuItemCreate, MenuItemUpdate, CategoryCreate } from '@/types/api.types';

// Local form state (not tied to API types)
interface ItemFormState {
  name: string;
  description: string;
  price_usd: number;
  category_id: string;
}

export default function MenuAdminPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { categories, setCategories, items, setItems } = useMenuStore();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemResponse | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [saving, setSaving] = useState(false);

  const [itemForm, setItemForm] = useState<ItemFormState>({
    name: '', description: '', price_usd: 0, category_id: '',
  });
  const [catForm, setCatForm] = useState<CategoryCreate>({ name: '', display_order: 0 });

  useEffect(() => {
    if (!slug) return;
    menuService.getMenu(slug)
      .then(data => {
        setCategories(data.categories);
        setItems(data.categories.flatMap(c => c.items.map(i => ({ ...i, category_id: c.id }))));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, setCategories, setItems]);

  const filteredItems = items.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'all' || i.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Item CRUD
  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm({ name: '', description: '', price_usd: 0, category_id: categories[0]?.id || '' });
    setShowItemModal(true);
  };
  const openEditItem = (item: MenuItemResponse) => {
    setEditingItem(item);
    setItemForm({ name: item.name, description: item.description || '', price_usd: item.price_usd, category_id: item.category_id || '' });
    setShowItemModal(true);
  };
  const handleSaveItem = async () => {
    setSaving(true);
    try {
      if (editingItem) {
        const updateData: MenuItemUpdate = { name: itemForm.name, description: itemForm.description, price_usd: itemForm.price_usd };
        const updated = await menuService.updateItem(slug, editingItem.id, updateData);
        setItems(items.map(i => i.id === editingItem.id ? { ...updated, category_id: itemForm.category_id } : i));
      } else {
        const createData: MenuItemCreate = { name: itemForm.name, description: itemForm.description, price_usd: itemForm.price_usd, category_id: itemForm.category_id };
        const created = await menuService.createItem(slug, createData);
        setItems([...items, { ...created, category_id: itemForm.category_id }]);
      }
      setShowItemModal(false);
    } catch {} finally { setSaving(false); }
  };
  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este item?')) return;
    try { await menuService.deleteItem(slug, id); setItems(items.filter(i => i.id !== id)); } catch {}
  };
  const handleToggleAvailability = async (item: MenuItemResponse) => {
    try {
      const updateData: MenuItemUpdate = { is_available: !item.is_available };
      await menuService.updateItem(slug, item.id, updateData);
      setItems(items.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    } catch {}
  };

  // Category CRUD
  const openCreateCat = () => { setEditingCategory(null); setCatForm({ name: '', display_order: categories.length }); setShowCategoryModal(true); };
  const handleSaveCat = async () => {
    setSaving(true);
    try {
      if (editingCategory) {
        const updated = await menuService.updateCategory(slug, editingCategory.id, { name: catForm.name, display_order: catForm.display_order });
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...updated, items: [] } : c));
      } else {
        const created = await menuService.createCategory(slug, catForm);
        setCategories([...categories, { ...created, items: [] }]);
      }
      setShowCategoryModal(false);
    } catch {} finally { setSaving(false); }
  };
  const handleDeleteCat = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Se eliminarán todos sus items.')) return;
    try { await menuService.deleteCategory(slug, id); setCategories(categories.filter(c => c.id !== id)); setItems(items.filter(i => i.category_id !== id)); } catch {}
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">menu_book</span> Administrar Menú
        </h1>
        <div className="flex gap-2">
          <button onClick={openCreateCat} className="h-10 px-4 bg-surface text-text-muted font-bold text-sm rounded-xl flex items-center gap-2 border border-neutral-border hover:border-primary/20">
            <span className="material-symbols-outlined text-lg">category</span> Categoría
          </button>
          <button onClick={openCreateItem} className="h-10 px-4 bg-primary text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">add</span> Nuevo Item
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-lg">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar items..."
            className="w-full h-11 pl-11 pr-4 bg-surface border border-neutral-border rounded-xl text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-surface text-text-muted'}`}>Todos</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === c.id ? 'bg-primary text-white' : 'bg-surface text-text-muted'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Categories with delete */}
      {selectedCategory === 'all' && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 custom-scrollbar">
          {categories.map(c => (
            <span key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg text-xs font-bold shrink-0">
              {c.name}
              <button onClick={() => handleDeleteCat(c.id)} className="text-danger hover:text-danger/80"><span className="material-symbols-outlined text-xs">close</span></button>
            </span>
          ))}
        </div>
      )}

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <motion.div key={item.id} layout className="rounded-2xl bg-surface border border-neutral-border overflow-hidden hover:border-primary/20 transition-all group">
            {item.image_url ? (
              <div className="h-32 bg-surface-2 bg-cover bg-center relative" style={{ backgroundImage: `url(${item.image_url})` }}>
                <div className="absolute top-2 right-2 flex gap-1">
                  {!item.is_available && <span className="text-[10px] bg-danger/80 text-white px-2 py-0.5 rounded-full font-bold">Agotado</span>}
                </div>
              </div>
            ) : (
              <div className="h-20 bg-surface-2 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-text-muted opacity-30">fastfood</span>
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm">{item.name}</p>
                  {item.description && <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{item.description}</p>}
                </div>
                <p className="text-primary font-black text-sm shrink-0">${item.price_usd.toFixed(2)}</p>
              </div>
              <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggleAvailability(item)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${item.is_available ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                  {item.is_available ? '✓ Disponible' : '✗ Agotado'}
                </button>
                <button onClick={() => openEditItem(item)} className="py-1.5 px-3 bg-surface-2 text-text-muted text-xs font-bold rounded-lg hover:text-primary transition-colors">✏️</button>
                <button onClick={() => handleDeleteItem(item.id)} className="py-1.5 px-3 bg-danger/20 text-danger text-xs font-bold rounded-lg hover:bg-danger/30 transition-colors">🗑️</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setShowItemModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-md bg-surface rounded-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-lg font-bold">{editingItem ? 'Editar Item' : 'Nuevo Item'}</h3>
              <div className="space-y-3">
                <div><label className="text-xs text-text-muted font-semibold">Nombre</label>
                  <input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-text-muted font-semibold">Descripción</label>
                  <textarea value={itemForm.description || ''} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full h-20 bg-surface-2 border border-neutral-border rounded-xl px-4 py-3 text-white text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-text-muted font-semibold">Precio ($)</label>
                    <input type="number" step="0.01" value={itemForm.price_usd} onChange={e => setItemForm(f => ({ ...f, price_usd: parseFloat(e.target.value) || 0 }))}
                      className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  <div><label className="text-xs text-text-muted font-semibold">Categoría</label>
                    <select value={itemForm.category_id} onChange={e => setItemForm(f => ({ ...f, category_id: e.target.value }))}
                      className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/30">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowItemModal(false)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl">Cancelar</button>
                <button onClick={handleSaveItem} disabled={!itemForm.name || saving}
                  className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setShowCategoryModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <div className="space-y-3">
                <div><label className="text-xs text-text-muted font-semibold">Nombre</label>
                  <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ej: Entradas, Bebidas" /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCategoryModal(false)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl">Cancelar</button>
                <button onClick={handleSaveCat} disabled={!catForm.name || saving}
                  className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl disabled:opacity-50">{saving ? '...' : 'Guardar'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
