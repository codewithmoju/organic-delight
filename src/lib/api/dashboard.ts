import { 
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { TimePeriod } from '../../components/dashboard/TimePeriodFilter';
import { getDateRangeForPeriod } from '../utils/dateFilters';
import { DashboardMetrics } from '../types';

export async function getDashboardMetrics(period: TimePeriod): Promise<DashboardMetrics> {
  const { start, end } = getDateRangeForPeriod(period);
  
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('transaction_date', '>=', Timestamp.fromDate(start)),
    where('transaction_date', '<=', Timestamp.fromDate(end)),
    orderBy('transaction_date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  let totalStockIn = 0;
  let totalStockOut = 0;
  let revenueSpentOnStockIn = 0;
  let revenueEarnedFromStockOut = 0;

  snapshot.docs.forEach(doc => {
    const transaction = doc.data();
    
    if (transaction.type === 'stock_in') {
      totalStockIn += transaction.quantity;
      revenueSpentOnStockIn += transaction.total_value;
    } else if (transaction.type === 'stock_out') {
      totalStockOut += transaction.quantity;
      revenueEarnedFromStockOut += transaction.total_value;
    }
  });

  return {
    totalStockIn,
    totalStockOut,
    revenueSpentOnStockIn,
    revenueEarnedFromStockOut
  };
}

export async function getInventoryTrends(period: TimePeriod) {
  const { start, end } = getDateRangeForPeriod(period);
  
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('transaction_date', '>=', Timestamp.fromDate(start)),
    where('transaction_date', '<=', Timestamp.fromDate(end)),
    orderBy('transaction_date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  // Group transactions by time intervals for trend analysis
  const trendData: { [key: string]: any } = {};
  
  snapshot.docs.forEach(doc => {
    const transaction = doc.data();
    const date = transaction.transaction_date?.toDate ? 
      transaction.transaction_date.toDate() : 
      new Date(transaction.transaction_date || Date.now());
    
    let key: string;
    
    switch (period) {
      case 'today':
        key = date.getHours().toString().padStart(2, '0') + ':00';
        break;
      case 'this-week':
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
        break;
      case 'this-month':
      case 'previous-month':
        key = `${date.getDate()}`;
        break;
      default:
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (!trendData[key]) {
      trendData[key] = {
        period: key,
        stockIn: 0,
        stockOut: 0,
        revenueIn: 0,
        revenueOut: 0
      };
    }

    if (transaction.type === 'stock_in') {
      trendData[key].stockIn += transaction.quantity;
      trendData[key].revenueIn += transaction.total_value;
    } else {
      trendData[key].stockOut += transaction.quantity;
      trendData[key].revenueOut += transaction.total_value;
    }
  });

  return Object.values(trendData);
}

export async function getStockLevels() {
  const itemsRef = collection(db, 'items');
  const itemsSnapshot = await getDocs(itemsRef);
  
  const stockLevels = [];
  
  for (const itemDoc of itemsSnapshot.docs) {
    const item = { id: itemDoc.id, ...itemDoc.data() };
    const stockLevel = await import('./items').then(m => m.getItemStockLevel(item.id));
    
    if (stockLevel) {
      stockLevel.item = item;
      stockLevels.push(stockLevel);
    }
  }
  
  return stockLevels.sort((a, b) => b.total_value - a.total_value);
}