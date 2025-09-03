import { Item, Transaction, ExportOptions } from '../types';

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

export function exportToJSON(data: any[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

export function exportItems(items: Item[], options: ExportOptions) {
  const exportData = items.map(item => ({
    name: item.name,
    description: item.description || '',
    category: item.category?.name || '',
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    currency: item.currency,
    reorder_point: item.reorder_point,
    sku: item.sku || '',
    supplier: item.supplier || '',
    location: item.location || '',
    total_value: item.quantity * item.unit_price,
    created_at: item.created_at
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `stocksuite-items-${timestamp}`;

  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, `${filename}.csv`);
      break;
    case 'json':
      exportToJSON(exportData, `${filename}.json`);
      break;
    default:
      exportToCSV(exportData, `${filename}.csv`);
  }
}

export function exportTransactions(transactions: Transaction[], options: ExportOptions) {
  let filteredTransactions = transactions;

  if (options.dateRange) {
    filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at.toDate ? t.created_at.toDate() : t.created_at);
      return transactionDate >= options.dateRange!.start && transactionDate <= options.dateRange!.end;
    });
  }

  const exportData = filteredTransactions.map(transaction => ({
    date: new Date(transaction.created_at.toDate ? transaction.created_at.toDate() : transaction.created_at).toISOString(),
    item_name: transaction.item?.name || '',
    type: transaction.type,
    quantity_changed: transaction.quantity_changed,
    unit: transaction.item?.unit || '',
    cost_per_unit: transaction.cost_per_unit || 0,
    total_value: Math.abs(transaction.quantity_changed) * (transaction.cost_per_unit || 0),
    reference: transaction.reference || '',
    notes: transaction.notes || '',
    created_by: transaction.created_by
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `stocksuite-transactions-${timestamp}`;

  switch (options.format) {
    case 'csv':
      exportToCSV(exportData, `${filename}.csv`);
      break;
    case 'json':
      exportToJSON(exportData, `${filename}.json`);
      break;
    default:
      exportToCSV(exportData, `${filename}.csv`);
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}