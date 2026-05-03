import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { requireCurrentUserId } from './userScope';

// Sales by product: aggregate POS transactions by item
export async function getSalesByProduct(startDate: Date, endDate: Date) {
  const userId = requireCurrentUserId();
  const q = query(
    collection(db, 'pos_transactions'),
    where('cashier_id', '==', userId),
    where('created_at', '>=', Timestamp.fromDate(startDate)),
    where('created_at', '<=', Timestamp.fromDate(endDate))
  );
  const snap = await getDocs(q);
  const map: Record<string, { name: string; quantity: number; revenue: number; cost: number }> = {};

  snap.docs.forEach(d => {
    const t = d.data();
    if (t.status !== 'completed') return;
    (t.items || []).forEach((item: any) => {
      if (!map[item.item_id]) map[item.item_id] = { name: item.item_name, quantity: 0, revenue: 0, cost: 0 };
      map[item.item_id].quantity += item.quantity;
      map[item.item_id].revenue += item.line_total;
      map[item.item_id].cost += (item.purchase_rate || 0) * item.quantity;
    });
  });

  return Object.entries(map).map(([id, v]) => ({
    item_id: id,
    name: v.name,
    quantity: v.quantity,
    revenue: v.revenue,
    cost: v.cost,
    profit: v.revenue - v.cost,
    margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
  })).sort((a, b) => b.revenue - a.revenue);
}

// Sales by category: join with items collection
export async function getSalesByCategory(startDate: Date, endDate: Date) {
  const userId = requireCurrentUserId();
  // Get all items to map item_id -> category
  const itemsSnap = await getDocs(query(collection(db, 'items'), where('created_by', '==', userId)));
  const categoryMap: Record<string, string> = {};
  itemsSnap.docs.forEach(d => { categoryMap[d.id] = d.data().category_id || 'Uncategorized'; });

  // Get categories for names
  const catsSnap = await getDocs(query(collection(db, 'categories'), where('created_by', '==', userId)));
  const catNames: Record<string, string> = {};
  catsSnap.docs.forEach(d => { catNames[d.id] = d.data().name || d.id; });

  const txSnap = await getDocs(query(
    collection(db, 'pos_transactions'),
    where('cashier_id', '==', userId),
    where('created_at', '>=', Timestamp.fromDate(startDate)),
    where('created_at', '<=', Timestamp.fromDate(endDate))
  ));

  const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
  txSnap.docs.forEach(d => {
    const t = d.data();
    if (t.status !== 'completed') return;
    (t.items || []).forEach((item: any) => {
      const catId = categoryMap[item.item_id] || 'uncategorized';
      const catName = catNames[catId] || 'Uncategorized';
      if (!map[catId]) map[catId] = { name: catName, quantity: 0, revenue: 0 };
      map[catId].quantity += item.quantity;
      map[catId].revenue += item.line_total;
    });
  });

  return Object.entries(map).map(([id, v]) => ({ category_id: id, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}

// P&L statement
export async function getProfitLossStatement(startDate: Date, endDate: Date) {
  const userId = requireCurrentUserId();

  const [txSnap, expSnap, purchSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'pos_transactions'),
      where('cashier_id', '==', userId),
      where('created_at', '>=', Timestamp.fromDate(startDate)),
      where('created_at', '<=', Timestamp.fromDate(endDate))
    )),
    getDocs(query(
      collection(db, 'expenses'),
      where('created_by', '==', userId),
      where('expense_date', '>=', Timestamp.fromDate(startDate)),
      where('expense_date', '<=', Timestamp.fromDate(endDate))
    )),
    getDocs(query(
      collection(db, 'purchases'),
      where('created_by', '==', userId),
      where('purchase_date', '>=', Timestamp.fromDate(startDate)),
      where('purchase_date', '<=', Timestamp.fromDate(endDate))
    )),
  ]);

  let revenue = 0, discounts = 0, returns = 0, cogs = 0, taxCollected = 0;
  txSnap.docs.forEach(d => {
    const t = d.data();
    if (t.status === 'completed') {
      revenue += t.total_amount || 0;
      discounts += t.discount_amount || 0;
      taxCollected += t.tax_amount || 0;
      cogs += t.cost_of_goods || 0;
    }
    if (t.status === 'refunded') returns += t.total_amount || 0;
  });

  let totalExpenses = 0;
  const expenseByCategory: Record<string, number> = {};
  expSnap.docs.forEach(d => {
    const e = d.data();
    totalExpenses += e.amount || 0;
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + (e.amount || 0);
  });

  let totalPurchases = 0;
  purchSnap.docs.forEach(d => {
    const p = d.data();
    totalPurchases += p.total_amount || 0;
  });

  const netRevenue = revenue - discounts - returns;
  const grossProfit = netRevenue - cogs;
  const operatingProfit = grossProfit - totalExpenses;

  return {
    revenue, discounts, returns, netRevenue,
    cogs, grossProfit,
    expenses: totalExpenses, expenseByCategory,
    operatingProfit,
    taxCollected,
    totalPurchases,
  };
}

// Tax report
export async function getTaxReport(startDate: Date, endDate: Date) {
  const userId = requireCurrentUserId();
  const snap = await getDocs(query(
    collection(db, 'pos_transactions'),
    where('cashier_id', '==', userId),
    where('created_at', '>=', Timestamp.fromDate(startDate)),
    where('created_at', '<=', Timestamp.fromDate(endDate))
  ));

  let totalTaxCollected = 0;
  let taxableRevenue = 0;
  let transactionCount = 0;
  const byMethod: Record<string, number> = {};

  snap.docs.forEach(d => {
    const t = d.data();
    if (t.status !== 'completed') return;
    totalTaxCollected += t.tax_amount || 0;
    taxableRevenue += t.subtotal || 0;
    transactionCount++;
    const m = t.payment_method || 'cash';
    byMethod[m] = (byMethod[m] || 0) + (t.tax_amount || 0);
  });

  return { totalTaxCollected, taxableRevenue, transactionCount, byMethod };
}

// Inventory aging: items with no stock_out transactions in N days
export async function getInventoryAging(days: number = 30) {
  const userId = requireCurrentUserId();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const [itemsSnap, txSnap] = await Promise.all([
    getDocs(query(collection(db, 'items'), where('created_by', '==', userId))),
    getDocs(query(
      collection(db, 'transactions'),
      where('created_by', '==', userId),
      where('type', '==', 'stock_out'),
      where('transaction_date', '>=', Timestamp.fromDate(cutoff))
    )),
  ]);

  const recentlySold = new Set(txSnap.docs.map(d => d.data().item_id));

  return itemsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((item: any) => !item.is_archived && (item.current_quantity || 0) > 0 && !recentlySold.has(item.id))
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      quantity: item.current_quantity || 0,
      value: (item.current_quantity || 0) * (item.purchase_rate || item.unit_price || 0),
      lastSold: item.last_transaction_date ? new Date(item.last_transaction_date.toDate ? item.last_transaction_date.toDate() : item.last_transaction_date) : null,
      daysStagnant: days,
    }))
    .sort((a: any, b: any) => b.value - a.value);
}

// Customer credit aging
export async function getCustomerCreditAging() {
  const userId = requireCurrentUserId();
  const snap = await getDocs(query(collection(db, 'customers'), where('created_by', '==', userId)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data(), created_at: d.data().created_at?.toDate?.() || new Date(), updated_at: d.data().updated_at?.toDate?.() || new Date() }))
    .filter((c: any) => c.is_active !== false && c.outstanding_balance > 0)
    .sort((a: any, b: any) => b.outstanding_balance - a.outstanding_balance);
}

// Vendor payment aging
export async function getVendorPaymentAging() {
  const userId = requireCurrentUserId();
  const snap = await getDocs(query(collection(db, 'vendors'), where('created_by', '==', userId)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data(), created_at: d.data().created_at?.toDate?.() || new Date(), updated_at: d.data().updated_at?.toDate?.() || new Date() }))
    .filter((v: any) => v.is_active !== false && v.outstanding_balance > 0)
    .sort((a: any, b: any) => b.outstanding_balance - a.outstanding_balance);
}
