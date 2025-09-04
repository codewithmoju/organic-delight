import { TimePeriod } from '../components/dashboard/TimePeriodFilter';

export function getDateRangeForPeriod(period: TimePeriod): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'this-week':
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(now.getDate() - daysToMonday);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'this-month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'previous-month':
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'last-3-months':
      start.setMonth(now.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'last-6-months':
      start.setMonth(now.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'this-year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
      
    default:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export function formatPeriodLabel(period: TimePeriod): string {
  const labels = {
    'today': 'Today',
    'this-week': 'This Week',
    'this-month': 'This Month',
    'previous-month': 'Previous Month',
    'last-3-months': 'Last 3 Months',
    'last-6-months': 'Last 6 Months',
    'this-year': 'This Year'
  };
  
  return labels[period];
}

export function getChartDataForPeriod(transactions: any[], period: TimePeriod) {
  const { start, end } = getDateRangeForPeriod(period);
  
  // Filter transactions within the date range
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(
      transaction.created_at.toDate ? transaction.created_at.toDate() : transaction.created_at
    );
    return transactionDate >= start && transactionDate <= end;
  });

  // Group data based on period granularity
  const groupedData: { [key: string]: any } = {};

  filteredTransactions.forEach(transaction => {
    const transactionDate = new Date(
      transaction.created_at.toDate ? transaction.created_at.toDate() : transaction.created_at
    );
    
    let key: string;
    
    switch (period) {
      case 'today':
        key = transactionDate.getHours().toString().padStart(2, '0') + ':00';
        break;
      case 'this-week':
        key = transactionDate.toLocaleDateString('en-US', { weekday: 'short' });
        break;
      case 'this-month':
      case 'previous-month':
        key = `Week ${Math.ceil(transactionDate.getDate() / 7)}`;
        break;
      case 'last-3-months':
      case 'last-6-months':
        key = transactionDate.toLocaleDateString('en-US', { month: 'short' });
        break;
      case 'this-year':
        key = transactionDate.toLocaleDateString('en-US', { month: 'short' });
        break;
      default:
        key = transactionDate.toLocaleDateString();
    }

    if (!groupedData[key]) {
      groupedData[key] = {
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
      groupedData[key].stockIn += quantity;
      groupedData[key].revenueIn += revenue;
    } else {
      groupedData[key].stockOut += quantity;
      groupedData[key].revenueOut += revenue;
    }
  });

  return Object.values(groupedData);
}