import type {
  DocumentType,
  ReceiptProps,
  QuotationProps,
  PurchaseInvoiceProps,
  CustomerStatementProps,
  VendorStatementProps,
  CreditNoteProps,
} from '../../components/documents/types';

function fmtCurrency(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

// --- WhatsApp Messages ---

function receiptWhatsApp(data: ReceiptProps): string {
  const lines = [
    `*${data.store.name}*`,
    data.store.address || '',
    '',
    `*Sales Receipt* #${data.documentNumber}`,
    `Date: ${fmtDate(data.date)}`,
    data.cashierName ? `Cashier: ${data.cashierName}` : '',
    '',
    '--- Items ---',
    ...data.items.map(item => `${item.name}  x${item.quantity}  ${fmtCurrency(item.total, data.currency)}`),
    '',
    `Subtotal: ${fmtCurrency(data.totals.subtotal, data.currency)}`,
    data.totals.discount ? `Discount: -${fmtCurrency(data.totals.discount, data.currency)}` : '',
    `*Total: ${fmtCurrency(data.totals.total, data.currency)}*`,
    '',
    `Paid (${data.payment.method}): ${fmtCurrency(data.payment.amount_paid, data.currency)}`,
    data.payment.change ? `Change: ${fmtCurrency(data.payment.change, data.currency)}` : '',
    '',
    'Thank you for your business!',
  ];
  return lines.filter(Boolean).join('\n');
}

function quotationWhatsApp(data: QuotationProps): string {
  const lines = [
    `*${data.store.name}*`,
    '',
    `*Quotation* #${data.documentNumber}`,
    `Date: ${fmtDate(data.date)}`,
    data.validUntil ? `Valid until: ${fmtDate(data.validUntil)}` : '',
    `For: ${data.customer.name}`,
    '',
    '--- Items ---',
    ...data.items.map(item => `${item.name}  x${item.quantity}  ${fmtCurrency(item.total, data.currency)}`),
    '',
    `*Total: ${fmtCurrency(data.totals.total, data.currency)}*`,
    '',
    data.terms || '',
    '',
    'Please contact us to proceed.',
  ];
  return lines.filter(Boolean).join('\n');
}

function purchaseInvoiceWhatsApp(data: PurchaseInvoiceProps): string {
  const lines = [
    `*${data.store.name}*`,
    '',
    `*Purchase Invoice* #${data.documentNumber}`,
    `Date: ${fmtDate(data.date)}`,
    `Vendor: ${data.vendor.name}`,
    `Status: *${data.paymentStatus.toUpperCase()}*`,
    '',
    '--- Items ---',
    ...data.items.map(item => `${item.name}  x${item.quantity}  ${fmtCurrency(item.total, data.currency)}`),
    '',
    `*Total: ${fmtCurrency(data.totals.total, data.currency)}*`,
    data.paidAmount !== undefined ? `Paid: ${fmtCurrency(data.paidAmount, data.currency)}` : '',
    data.pendingAmount !== undefined ? `Pending: ${fmtCurrency(data.pendingAmount, data.currency)}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function customerStatementWhatsApp(data: CustomerStatementProps): string {
  const lines = [
    `*${data.store.name}*`,
    '',
    `*Customer Statement* #${data.documentNumber}`,
    `Period: ${fmtDate(data.periodStart)} - ${fmtDate(data.periodEnd)}`,
    `Customer: ${data.customer.name}`,
    '',
    `Opening Balance: ${fmtCurrency(data.openingBalance, data.currency)}`,
    `*Closing Balance: ${fmtCurrency(data.closingBalance, data.currency)}*`,
    '',
    '--- Transactions ---',
    ...data.ledgerEntries.map(e =>
      `${fmtDate(e.date)} | ${e.description} | Bal: ${fmtCurrency(e.balance, data.currency)}`
    ),
  ];
  return lines.join('\n');
}

function vendorStatementWhatsApp(data: VendorStatementProps): string {
  const lines = [
    `*${data.store.name}*`,
    '',
    `*Vendor Statement* #${data.documentNumber}`,
    `Period: ${fmtDate(data.periodStart)} - ${fmtDate(data.periodEnd)}`,
    `Vendor: ${data.vendor.name}`,
    '',
    `Opening Balance: ${fmtCurrency(data.openingBalance, data.currency)}`,
    `*Amount Due: ${fmtCurrency(data.closingBalance, data.currency)}*`,
    '',
    '--- Transactions ---',
    ...data.ledgerEntries.map(e =>
      `${fmtDate(e.date)} | ${e.description} | Bal: ${fmtCurrency(e.balance, data.currency)}`
    ),
  ];
  return lines.join('\n');
}

function creditNoteWhatsApp(data: CreditNoteProps): string {
  const lines = [
    `*${data.store.name}*`,
    '',
    `*Credit Note* #${data.documentNumber}`,
    `Date: ${fmtDate(data.date)}`,
    `Customer: ${data.customer.name}`,
    data.originalInvoiceNumber ? `Ref: ${data.originalInvoiceNumber}` : '',
    '',
    `*Credit Amount: ${fmtCurrency(data.creditAmount, data.currency)}*`,
    `Reason: ${data.reason}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export function generateWhatsAppMessage(type: DocumentType, data: any): string {
  switch (type) {
    case 'receipt': return receiptWhatsApp(data);
    case 'quotation': return quotationWhatsApp(data);
    case 'purchase-invoice': return purchaseInvoiceWhatsApp(data);
    case 'customer-statement': return customerStatementWhatsApp(data);
    case 'vendor-statement': return vendorStatementWhatsApp(data);
    case 'credit-note': return creditNoteWhatsApp(data);
    default: return `Document #${data.documentNumber} from ${data.store?.name || 'StockSuite'}`;
  }
}

// --- Email ---

export function generateEmailSubject(type: DocumentType, data: any): string {
  const store = data.store?.name || 'StockSuite';
  switch (type) {
    case 'receipt': return `Sales Receipt #${data.documentNumber} - ${store}`;
    case 'quotation': return `Quotation #${data.documentNumber} - ${store}`;
    case 'purchase-invoice': return `Purchase Invoice #${data.documentNumber} - ${store}`;
    case 'customer-statement': return `Account Statement #${data.documentNumber} - ${store}`;
    case 'vendor-statement': return `Vendor Statement #${data.documentNumber} - ${store}`;
    case 'credit-note': return `Credit Note #${data.documentNumber} - ${store}`;
    default: return `Document #${data.documentNumber} - ${store}`;
  }
}

export function generateEmailBody(type: DocumentType, data: any): string {
  // Returns a simple HTML body for mailto:
  const text = generateWhatsAppMessage(type, data);
  return text.replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');
}
