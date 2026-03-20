import { useState, useEffect, useCallback } from 'react';
import { tablesService } from '@/lib/api/tables.service';
import type { TableResponse, TableCreate, TableUpdate } from '@/types/api.types';
import { useToast } from '@/components/ui/Toast';

export function useTables(slug: string | null) {
  const [tables, setTables] = useState<TableResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTables = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await tablesService.getTables(slug);
      setTables(data);
    } catch (err: any) {
      toast(err.detail || 'Error al cargar las mesas', 'error');
    } finally {
      setLoading(false);
    }
  }, [slug, toast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = async (data: TableCreate): Promise<boolean> => {
    if (!slug) return false;
    setSaving(true);
    try {
      const created = await tablesService.createTable(slug, data);
      setTables((prev) => [...prev, created]);
      toast('Mesa creada exitosamente', 'success');
      return true;
    } catch (err: any) {
      toast(err.detail || 'Error al crear la mesa', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateTable = async (tableId: string, data: TableUpdate): Promise<boolean> => {
    if (!slug) return false;
    setSaving(true);
    try {
      const updated = await tablesService.updateTable(slug, tableId, data);
      setTables((prev) => prev.map((t) => (t.id === tableId ? updated : t)));
      toast('Mesa actualizada', 'success');
      return true;
    } catch (err: any) {
      toast(err.detail || 'Error al actualizar la mesa', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteTable = async (tableId: string): Promise<boolean> => {
    if (!slug) return false;
    try {
      await tablesService.deleteTable(slug, tableId);
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      toast('Mesa eliminada', 'success');
      return true;
    } catch (err: any) {
      toast(err.detail || 'Error al eliminar la mesa', 'error');
      return false;
    }
  };

  return {
    tables,
    loading,
    saving,
    createTable,
    updateTable,
    deleteTable,
    refreshTables: fetchTables,
  };
}
