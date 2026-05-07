import { jsPDF } from 'jspdf';
import type {
  DocumentType,
  ReceiptProps,
  QuotationProps,
  PurchaseInvoiceProps,
  CustomerStatementProps,
  VendorStatementProps,
  CreditNoteProps,
  BarcodeLabelProps,
} from '../../components/documents/types';

function fmt(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

function addHeader(doc: jsPDF, storeName: string, title: string, docNumber: string, date: Date, y: number): number {
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName, 105, y, { align: 'center' });
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(14, 165, 233); // sky-500
  doc.text(title, 105, y, { align: 'center' });
  doc.setTextColor(0);
  y += 8;

  doc.setFontSize(10);
  doc.text(`${docNumber}  |  ${fmtDate(date)}`, 105, y, { align: 'center' });
  y += 4;

  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 6;
  return y;
}

function addItemsTable(doc: jsPDF, items: { name: string; quantity: number; unit: string; unit_price: number; total: number }[], currency: string, y: number): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 20, y);
  doc.text('Qty', 120, y);
  doc.text('Price', 140, y);
  doc.text('Total', 170, y, { align: 'right' });
  y += 2;
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  items.forEach(item => {
    doc.text(item.name.substring(0, 40), 20, y);
    doc.text(`${item.quantity} ${item.unit}`, 120, y);
    doc.text(fmt(item.unit_price, currency), 140, y);
    doc.text(fmt(item.total, currency), 190, y, { align: 'right' });
    y += 5;
  });

  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 4;
  return y;
}

function addTotals(doc: jsPDF, totals: { subtotal: number; discount?: number; tax?: number; total: number }, currency: string, y: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Subtotal:', 140, y);
  doc.text(fmt(totals.subtotal, currency), 190, y, { align: 'right' });
  y += 5;

  if (totals.discount && totals.discount > 0) {
    doc.text('Discount:', 140, y);
    doc.text(`-${fmt(totals.discount, currency)}`, 190, y, { align: 'right' });
    y += 5;
  }
  if (totals.tax && totals.tax > 0) {
    doc.text('Tax:', 140, y);
    doc.text(fmt(totals.tax, currency), 190, y, { align: 'right' });
    y += 5;
  }

  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.5);
  doc.line(140, y, 190, y);
  y += 5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 140, y);
  doc.text(fmt(totals.total, currency), 190, y, { align: 'right' });
  y += 8;
  return y;
}

function addFooter(doc: jsPDF, y: number, notes?: string) {
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', 105, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Powered by StockSuite', 105, y, { align: 'center' });
  doc.setTextColor(0);
  if (notes) {
    y += 6;
    doc.setFontSize(9);
    doc.text(`Notes: ${notes}`, 20, y);
  }
}

function generateReceiptPDF(data: ReceiptProps): jsPDF {
  const doc = new jsPDF();
  const currency = data.currency || 'PKR';
  let y = 20;

  y = addHeader(doc, data.store.name, 'Sales Receipt', data.documentNumber, data.date, y);

  if (data.customer) {
    doc.setFontSize(10);
    doc.text(`Customer: ${data.customer.name}`, 20, y);
    y += 5;
  }
  if (data.cashierName) {
    doc.text(`Cashier: ${data.cashierName}`, 20, y);
    y += 6;
  }

  y = addItemsTable(doc, data.items, currency, y);
  y = addTotals(doc, data.totals, currency, y);

  doc.setFontSize(10);
  doc.text(`Payment: ${data.payment.method.replace('_', ' ')}`, 20, y);
  y += 5;
  doc.text(`Amount Paid: ${fmt(data.payment.amount_paid, currency)}`, 20, y);
  if (data.payment.change) {
    y += 5;
    doc.text(`Change: ${fmt(data.payment.change, currency)}`, 20, y);
  }

  addFooter(doc, y + 6, data.notes);
  return doc;
}

function generateQuotationPDF(data: QuotationProps): jsPDF {
  const doc = new jsPDF();
  const currency = data.currency || 'PKR';
  let y = 20;

  y = addHeader(doc, data.store.name, 'Quotation', data.documentNumber, data.date, y);

  doc.setFontSize(10);
  doc.text(`For: ${data.customer.name}`, 20, y);
  y += 5;
  if (data.validUntil) {
    doc.text(`Valid until: ${fmtDate(data.validUntil)}`, 20, y);
    y += 6;
  }

  y = addItemsTable(doc, data.items, currency, y);
  y = addTotals(doc, data.totals, currency, y);

  if (data.terms) {
    doc.setFontSize(9);
    doc.text(`Terms: ${data.terms}`, 20, y);
  }

  addFooter(doc, y + 6, data.notes);
  return doc;
}

function generatePurchaseInvoicePDF(data: PurchaseInvoiceProps): jsPDF {
  const doc = new jsPDF();
  const currency = data.currency || 'PKR';
  let y = 20;

  y = addHeader(doc, data.store.name, 'Purchase Invoice', data.documentNumber, data.date, y);

  doc.setFontSize(10);
  doc.text(`Vendor: ${data.vendor.name}`, 20, y);
  y += 5;
  doc.text(`Status: ${data.paymentStatus.toUpperCase()}`, 20, y);
  y += 6;

  y = addItemsTable(doc, data.items, currency, y);
  y = addTotals(doc, data.totals, currency, y);

  if (data.paidAmount !== undefined) {
    doc.text(`Paid: ${fmt(data.paidAmount, currency)}`, 20, y);
    y += 5;
  }
  if (data.pendingAmount !== undefined) {
    doc.text(`Pending: ${fmt(data.pendingAmount, currency)}`, 20, y);
  }

  addFooter(doc, y + 6, data.notes);
  return doc;
}

function generateCustomerStatementPDF(data: CustomerStatementProps): jsPDF {
  const doc = new jsPDF();
  const currency = data.currency || 'PKR';
  let y = 20;

  y = addHeader(doc, data.store.name, 'Customer Statement', data.documentNumber, data.date, y);

  doc.setFontSize(10);
  doc.text(`Customer: ${data.customer.name}`, 20, y);
  y += 5;
  doc.text(`Period: ${fmtDate(data.periodStart)} - ${fmtDate(data.periodEnd)}`, 20, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text(`Opening Balance: ${fmt(data.openingBalance, currency)}`, 20, y);
  y += 5;
  doc.text(`Closing Balance: ${fmt(data.closingBalance, currency)}`, 20, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Date', 20, y);
  doc.text('Description', 50, y);
  doc.text('Debit', 130, y);
  doc.text('Credit', 150, y);
  doc.text('Balance', 175, y, { align: 'right' });
  y += 4;
  doc.line(20, y, 190, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  data.ledgerEntries.forEach(entry => {
    doc.text(fmtDate(entry.date), 20, y);
    doc.text(entry.description.substring(0, 30), 50, y);
    doc.text(entry.debit > 0 ? fmt(entry.debit, currency) : '-', 130, y);
    doc.text(entry.credit > 0 ? fmt(entry.credit, currency) : '-', 150, y);
    doc.text(fmt(entry.balance, currency), 190, y, { align: 'right' });
    y += 5;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  addFooter(doc, y + 4, data.notes);
  return doc;
}

function generateVendorStatementPDF(data: VendorStatementProps): jsPDF {
  const doc = new jsPDF();
  const currency = data.currency || 'PKR';
  let y = 20;

  y = addHeader(doc, data.store.name, 'Vendor Statement', data.documentNumber, data.date, y);

  doc.setFontSize(10);
  doc.text(`Vendor: ${data.vendor.name}`, 20, y);
  y += 5;
  doc.text(`Period: ${fmtDate(data.periodStart)} - ${fmtDate(data.periodEnd)}`, 20, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text(`Opening Balance: ${fmt(data.openingBalance, currency)}`, 20, y);
  y += 5;
  doc.text(`Amount Due: ${fmt(data.closingBalance, currency)}`, 20, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Date', 20, y);
  doc.text('Description', 50, y);
  doc.text('Debit', 130, y);
  doc.text('Credit', 150, y);
  doc.text('Balance', 175, y, { align: 'right' });
  y += 4;
  doc.line(20, y, 190, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  data.ledgerEntries.forEach(entry => {
    doc.text(fmtDate(entry.date), 20, y);
    doc.text(entry.description.substring(0, 30), 50, y);
    doc.text(entry.debit > 0 ? fmt(entry.debit, currency) : '-', 130, y);
    doc.text(entry.credit > 0 ? fmt(entry.credit, currency) : '-', 150, y);
    doc.text(fmt(entry.balance, currency), 190, y, { align: 'right' });
    y += 5;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  addFooter(doc, y + 4, data.notes);
  return doc;
}

function generateCreditNotePDF(data: CreditNoteProps): jsPDF {
  const doc = new jsPDF();
  const currency = data.currency || 'PKR';
  let y = 20;

  y = addHeader(doc, data.store.name, 'Credit Note', data.documentNumber, data.date, y);

  doc.setFontSize(10);
  doc.text(`Customer: ${data.customer.name}`, 20, y);
  y += 5;
  if (data.originalInvoiceNumber) {
    doc.text(`Ref: ${data.originalInvoiceNumber}`, 20, y);
    y += 6;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // red-600
  doc.text(`Credit Amount: ${fmt(data.creditAmount, currency)}`, 105, y, { align: 'center' });
  doc.setTextColor(0);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reason: ${data.reason}`, 20, y);
  y += 8;

  y = addItemsTable(doc, data.items, currency, y);
  y = addTotals(doc, data.totals, currency, y);

  addFooter(doc, y, data.notes);
  return doc;
}

export function generateDocumentPDF(type: DocumentType, data: any): jsPDF {
  switch (type) {
    case 'receipt': return generateReceiptPDF(data);
    case 'quotation': return generateQuotationPDF(data);
    case 'purchase-invoice': return generatePurchaseInvoicePDF(data);
    case 'customer-statement': return generateCustomerStatementPDF(data);
    case 'vendor-statement': return generateVendorStatementPDF(data);
    case 'credit-note': return generateCreditNotePDF(data);
    default: {
      const doc = new jsPDF();
      doc.text('Document', 105, 100, { align: 'center' });
      return doc;
    }
  }
}

export function downloadDocumentPDF(type: DocumentType, data: any, filename?: string): void {
  const doc = generateDocumentPDF(type, data);
  const name = filename || `${type}-${data.documentNumber || 'document'}.pdf`;
  doc.save(name);
}
