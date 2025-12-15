// =====================================================
// USE SUPABASE BTW HOOK
// =====================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { BTWDeclaration, BTWPeriod, BTWStatus } from '../types';

const TABLE_NAME = 'invoice_btw_declarations';

export function useSupabaseBTW(userId: string) {
  const [declarations, setDeclarations] = useState<BTWDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeclarations = useCallback(async () => {
    if (!userId) {
      setDeclarations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedData = (data || []).map((record) => ({
        id: record.id as string,
        user_id: record.user_id as string,
        year: record.year as number,
        quarter: record.quarter as BTWPeriod,
        status: record.status as BTWStatus,
        revenue_21: record.revenue_21 ?? 0,
        revenue_9: record.revenue_9 ?? 0,
        revenue_0: record.revenue_0 ?? 0,
        revenue_eu: record.revenue_eu ?? 0,
        revenue_export: record.revenue_export ?? 0,
        input_vat: record.input_vat ?? 0,
        output_vat_21: record.output_vat_21 ?? 0,
        output_vat_9: record.output_vat_9 ?? 0,
        total_output_vat: record.total_output_vat ?? 0,
        balance: record.balance ?? 0,
        submitted_at: record.submitted_at || undefined,
        paid_at: record.paid_at || undefined,
        notes: record.notes || undefined,
        created_at: record.created_at || '',
        updated_at: record.updated_at || '',
      })) as BTWDeclaration[];

      setDeclarations(mappedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching BTW declarations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch declarations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  const createDeclaration = async (declaration: Partial<BTWDeclaration>) => {
    const year = declaration.year ?? new Date().getFullYear();
    const quarter = declaration.quarter ?? 'Q1';
    
    try {
      const { data, error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert({
          user_id: userId,
          year,
          quarter,
          status: declaration.status ?? 'draft',
          revenue_21: declaration.revenue_21 ?? 0,
          revenue_9: declaration.revenue_9 ?? 0,
          revenue_0: declaration.revenue_0 ?? 0,
          revenue_eu: declaration.revenue_eu ?? 0,
          revenue_export: declaration.revenue_export ?? 0,
          input_vat: declaration.input_vat ?? 0,
          output_vat_21: declaration.output_vat_21 ?? 0,
          output_vat_9: declaration.output_vat_9 ?? 0,
          total_output_vat: declaration.total_output_vat ?? 0,
          balance: declaration.balance ?? 0,
          notes: declaration.notes ?? null,
          submitted_at: declaration.submitted_at ?? null,
          paid_at: declaration.paid_at ?? null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchDeclarations();
      return data;
    } catch (err) {
      console.error('Error creating BTW declaration:', err);
      throw err;
    }
  };

  const updateDeclaration = async (id: string, updates: Partial<BTWDeclaration>) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.year !== undefined) updateData.year = updates.year;
      if (updates.quarter !== undefined) updateData.quarter = updates.quarter;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.revenue_21 !== undefined) updateData.revenue_21 = updates.revenue_21;
      if (updates.revenue_9 !== undefined) updateData.revenue_9 = updates.revenue_9;
      if (updates.revenue_0 !== undefined) updateData.revenue_0 = updates.revenue_0;
      if (updates.revenue_eu !== undefined) updateData.revenue_eu = updates.revenue_eu;
      if (updates.revenue_export !== undefined) updateData.revenue_export = updates.revenue_export;
      if (updates.input_vat !== undefined) updateData.input_vat = updates.input_vat;
      if (updates.output_vat_21 !== undefined) updateData.output_vat_21 = updates.output_vat_21;
      if (updates.output_vat_9 !== undefined) updateData.output_vat_9 = updates.output_vat_9;
      if (updates.total_output_vat !== undefined) updateData.total_output_vat = updates.total_output_vat;
      if (updates.balance !== undefined) updateData.balance = updates.balance;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.submitted_at !== undefined) updateData.submitted_at = updates.submitted_at;
      if (updates.paid_at !== undefined) updateData.paid_at = updates.paid_at;

      const { data, error: updateError } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchDeclarations();
      return data;
    } catch (err) {
      console.error('Error updating BTW declaration:', err);
      throw err;
    }
  };

  const deleteDeclaration = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      await fetchDeclarations();
    } catch (err) {
      console.error('Error deleting BTW declaration:', err);
      throw err;
    }
  };

  return {
    declarations,
    loading,
    error,
    createDeclaration,
    updateDeclaration,
    deleteDeclaration,
    refetch: fetchDeclarations,
  };
}

export default useSupabaseBTW;