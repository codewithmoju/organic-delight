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

export interface DashboardMetrics {
  totalStockIn: number;
  totalStockOut: number;
  revenueSpentOnStockIn: number;
  revenueEarnedFromStockOut: number;
}

export async function getDashboardMetrics(period: TimePeriod): Promise<DashboardMetrics> {
  const { start, end } = getDateRangeForPeriod(period);
  
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('created_at', '>=', Timestamp.fromDate(start)),
    where('created_at', '<=', Timestamp.fromDate(end)),
    orderBy('created_at', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  let totalStockIn = 0;
  let totalStockOut = 0;
  let revenueSpentOnStockIn = 0;
  let revenueEarnedFromStockOut = 0;

  snapshot.docs.forEach(doc => {
    const transaction = doc.data();
    const quantity = Math.abs(transaction.quantity_changed);
    const costPerUnit = transaction.cost_per_unit || 0;
    const revenue = quantity * costPerUnit;

    if (transaction.type === 'in') {
      totalStockIn += quantity;
      revenueSpentOnStockIn += revenue;
    } else if (transaction.type === 'out') {
      totalStockOut += quantity;
      revenueEarnedFromStockOut += revenue;
    }
  });

  return {
    totalStockIn,
    totalStockOut,
    revenueSpentOnStockIn,
    revenueEarnedFromStockOut
  };
}

export async function getTransactionsForPeriod(period: TimePeriod) {
  const { start, end } = getDateRangeForPeriod(period);
  
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('created_at', '>=', Timestamp.fromDate(start)),
    where('created_at', '<=', Timestamp.fromDate(end)),
    orderBy('created_at', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getInventoryTrends(period: TimePeriod) {
  const transactions = await getTransactionsForPeriod(period);
  
  // Group transactions by time intervals for trend analysis
  const trendData: { [key: string]: any } = {};
  
  transactions.forEach(transaction => {
    const date = new Date(
      transaction.created_at.toDate ? transaction.created_at.toDate() : transaction.created_at
    );
    
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

    const quantity = Math.abs(transaction.quantity_changed);
    const revenue = quantity * (transaction.cost_per_unit || 0);

    if (transaction.type === 'in') {
      trendData[key].stockIn += quantity;
      trendData[key].revenueIn += revenue;
    } else {
      trendData[key].stockOut += quantity;
      trendData[key].revenueOut += revenue;
    }
  });

  return Object.values(trendData);
}