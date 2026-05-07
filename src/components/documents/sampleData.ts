import type {
  DocumentStoreInfo,
  DocumentLineItem,
  DocumentTotals,
  DocumentPaymentInfo,
  DocumentPartyInfo,
  DocumentLedgerEntry,
  BarcodeLabelData,
  ReceiptProps,
  QuotationProps,
  PurchaseInvoiceProps,
  CustomerStatementProps,
  VendorStatementProps,
  CreditNoteProps,
  BarcodeLabelProps,
} from './types';

export const sampleStore: DocumentStoreInfo = {
  name: 'NAMS Electronics',
  address: 'Hall Road, Lahore, Pakistan',
  phone: '+92 321 1234567',
  email: 'info@namselectronics.pk',
  taxId: 'NTN: 1234567-8',
  website: 'www.namselectronics.pk',
};

export const sampleCustomer: DocumentPartyInfo = {
  name: 'Ahmed Khan',
  phone: '+92 300 9876543',
  email: 'ahmed.khan@gmail.com',
  address: 'DHA Phase 5, Lahore',
};

export const sampleVendor: DocumentPartyInfo = {
  name: 'TechWorld Distributors',
  company: 'TechWorld (Pvt) Ltd',
  phone: '+92 42 35761234',
  email: 'orders@techworld.pk',
  address: 'Shah Alam Market, Lahore',
};

export const sampleItems: DocumentLineItem[] = [
  { name: 'Samsung Galaxy A54 5G', sku: 'SAM-A54-128', quantity: 2, unit: 'pcs', unit_price: 89999, total: 179998 },
  { name: 'iPhone 15 Pro Max 256GB', sku: 'APL-15PM-256', quantity: 1, unit: 'pcs', unit_price: 449999, total: 449999 },
  { name: 'Anker PowerBank 20000mAh', sku: 'ANK-PB20K', quantity: 3, unit: 'pcs', unit_price: 5499, total: 16497 },
  { name: 'USB-C Cable 1m (Pack of 3)', sku: 'CBL-USBC-1M', quantity: 5, unit: 'pack', unit_price: 899, total: 4495 },
  { name: 'Samsung 25W Fast Charger', sku: 'SAM-CHG25W', quantity: 2, unit: 'pcs', unit_price: 3499, total: 6998 },
  { name: 'AirPods Pro 2nd Gen', sku: 'APL-APP2', quantity: 1, unit: 'pcs', unit_price: 59999, total: 59999 },
];

export const sampleTotals: DocumentTotals = {
  subtotal: 717986,
  discount: 15000,
  tax: 0,
  tax_rate: 0,
  total: 702986,
  currency: 'PKR',
};

export const samplePayment: DocumentPaymentInfo = {
  method: 'cash',
  amount_paid: 710000,
  change: 7014,
  reference: 'TXN-20260507-001',
};

export const sampleLedgerEntries: DocumentLedgerEntry[] = [
  { date: new Date('2026-05-01'), description: 'Opening Balance', reference: '', debit: 0, credit: 0, balance: 25000 },
  { date: new Date('2026-05-02'), description: 'Invoice #INV-20260502-001', reference: 'INV-20260502-001', debit: 179998, credit: 0, balance: 204998 },
  { date: new Date('2026-05-03'), description: 'Payment received', reference: 'PAY-001', debit: 0, credit: 100000, balance: 104998 },
  { date: new Date('2026-05-04'), description: 'Invoice #INV-20260504-001', reference: 'INV-20260504-001', debit: 449999, credit: 0, balance: 554997 },
  { date: new Date('2026-05-05'), description: 'Payment received', reference: 'PAY-002', debit: 0, credit: 200000, balance: 354997 },
  { date: new Date('2026-05-06'), description: 'Credit note applied', reference: 'CN-001', debit: 0, credit: 5000, balance: 349997 },
  { date: new Date('2026-05-07'), description: 'Invoice #INV-20260507-001', reference: 'INV-20260507-001', debit: 59999, credit: 0, balance: 409996 },
];

export const sampleBarcodeLabels: BarcodeLabelData[] = [
  { name: 'Samsung Galaxy A54', sku: 'SAM-A54', barcode: '8806094884011', price: 89999 },
  { name: 'iPhone 15 Pro Max', sku: 'APL-15PM', barcode: '194252793400', price: 449999 },
  { name: 'Anker PowerBank', sku: 'ANK-PB20K', barcode: '848061096536', price: 5499 },
  { name: 'USB-C Cable 1m', sku: 'CBL-USBC', barcode: '6920174700011', price: 899 },
  { name: 'Samsung 25W Charger', sku: 'SAM-CHG', barcode: '8806091110013', price: 3499 },
  { name: 'AirPods Pro 2', sku: 'APL-APP2', barcode: '194253393406', price: 59999 },
];

// Full props for each template
export const sampleReceiptProps: ReceiptProps = {
  variant: 'standard',
  store: sampleStore,
  documentNumber: 'RCP-20260507-001',
  date: new Date(),
  currency: 'PKR',
  items: sampleItems,
  totals: sampleTotals,
  payment: samplePayment,
  customer: sampleCustomer,
  cashierName: 'Ali Hassan',
};

export const sampleQuotationProps: QuotationProps = {
  variant: 'standard',
  store: sampleStore,
  documentNumber: 'QUO-20260507-001',
  date: new Date(),
  currency: 'PKR',
  items: sampleItems,
  totals: sampleTotals,
  customer: sampleCustomer,
  validUntil: new Date('2026-05-21'),
  terms: 'Prices valid for 14 days. 50% advance required for order confirmation. Delivery within 3-5 business days.',
};

export const samplePurchaseInvoiceProps: PurchaseInvoiceProps = {
  variant: 'standard',
  store: sampleStore,
  documentNumber: 'PUR-20260507-001',
  date: new Date(),
  currency: 'PKR',
  items: sampleItems,
  totals: { ...sampleTotals, total: 717986, discount: 0 },
  vendor: sampleVendor,
  paymentStatus: 'partial',
  paidAmount: 400000,
  pendingAmount: 317986,
  dueDate: new Date('2026-05-21'),
};

export const sampleCustomerStatementProps: CustomerStatementProps = {
  variant: 'standard',
  store: sampleStore,
  documentNumber: 'STMT-20260507-AHM',
  date: new Date(),
  currency: 'PKR',
  customer: sampleCustomer,
  ledgerEntries: sampleLedgerEntries,
  openingBalance: 25000,
  closingBalance: 409996,
  periodStart: new Date('2026-05-01'),
  periodEnd: new Date('2026-05-07'),
};

export const sampleVendorStatementProps: VendorStatementProps = {
  variant: 'standard',
  store: sampleStore,
  documentNumber: 'VSTMT-20260507-TW',
  date: new Date(),
  currency: 'PKR',
  vendor: sampleVendor,
  ledgerEntries: sampleLedgerEntries.map(e => ({
    ...e,
    debit: e.credit,
    credit: e.debit,
  })),
  openingBalance: 50000,
  closingBalance: 349997,
  periodStart: new Date('2026-05-01'),
  periodEnd: new Date('2026-05-07'),
};

export const sampleCreditNoteProps: CreditNoteProps = {
  variant: 'standard',
  store: sampleStore,
  documentNumber: 'CN-20260507-001',
  date: new Date(),
  currency: 'PKR',
  items: [{ name: 'Defective USB-C Cable (returned)', sku: 'CBL-USBC-1M', quantity: 2, unit: 'pack', unit_price: 899, total: 1798 }],
  totals: { subtotal: 1798, total: 1798, currency: 'PKR' },
  customer: sampleCustomer,
  creditAmount: 1798,
  reason: 'Defective product returned within warranty period',
  originalInvoiceNumber: 'RCP-20260507-001',
};

export const sampleBarcodeLabelProps: BarcodeLabelProps = {
  variant: 'standard',
  documentNumber: 'LBL-20260507',
  date: new Date(),
  labels: sampleBarcodeLabels,
  labelsPerRow: 3,
  showPrice: true,
};
