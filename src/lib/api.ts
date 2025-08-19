import { supabase } from './supabase';

export async function getInventorySummary() {
  const { data, error } = await supabase
    .from('items')
    .select(`
      id,
      name,
      quantity,
      unit_price,
      categories(name)
    `)
    .order('quantity');
  
  if (error) throw error;
  return data;
}

export async function getLowStockItems() {
  const { data, error } = await supabase
    .rpc('get_low_stock_items');
  
  if (error) throw error;
  return data;
}

export async function getRecentTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      quantity_changed,
      type,
      created_at,
      items(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) throw error;
  return data;
}