export type DocumentVariant = 'thermal' | 'standard' | 'mobile';
export type DocumentColorMode = 'color' | 'bw';

export type DocumentType =
  | 'receipt'
  | 'quotation'
  | 'purchase-invoice'
  | 'customer-statement'
  | 'vendor-statement'
  | 'credit-note'
  | 'barcode-label';

export interface DocumentStoreInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string; // URL or base64
  taxId?: string;
  website?: string;
}

export interface DocumentLineItem {
  name: string;
  sku?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  discount?: number;
  tax_rate?: number;
}

export interface DocumentTotals {
  subtotal: number;
  discount?: number;
  tax?: number;
  tax_rate?: number;
  total: number;
  currency?: string;
}

export interface DocumentPaymentInfo {
  method: string; // cash, card, bank_transfer, etc.
  amount_paid: number;
  change?: number;
  reference?: string;
}

export interface DocumentPartyInfo {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
}

export interface DocumentLedgerEntry {
  date: Date;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface BaseDocumentProps {
  variant: DocumentVariant;
  store: DocumentStoreInfo;
  documentNumber: string;
  date: Date;
  currency?: string;
  notes?: string;
  colorMode?: DocumentColorMode; // 'color' for digital, 'bw' for B&W printing
}

export interface ReceiptProps extends BaseDocumentProps {
  items: DocumentLineItem[];
  totals: DocumentTotals;
  payment: DocumentPaymentInfo;
  customer?: DocumentPartyInfo;
  cashierName?: string;
}

export interface QuotationProps extends BaseDocumentProps {
  items: DocumentLineItem[];
  totals: DocumentTotals;
  customer: DocumentPartyInfo;
  validUntil?: Date;
  terms?: string;
}

export interface PurchaseInvoiceProps extends BaseDocumentProps {
  items: DocumentLineItem[];
  totals: DocumentTotals;
  vendor: DocumentPartyInfo;
  paymentStatus: 'paid' | 'partial' | 'pending';
  paidAmount?: number;
  pendingAmount?: number;
  dueDate?: Date;
}

export interface CustomerStatementProps extends BaseDocumentProps {
  customer: DocumentPartyInfo;
  ledgerEntries: DocumentLedgerEntry[];
  openingBalance: number;
  closingBalance: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface VendorStatementProps extends BaseDocumentProps {
  vendor: DocumentPartyInfo;
  ledgerEntries: DocumentLedgerEntry[];
  openingBalance: number;
  closingBalance: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface CreditNoteProps extends BaseDocumentProps {
  items: DocumentLineItem[];
  totals: DocumentTotals;
  customer: DocumentPartyInfo;
  creditAmount: number;
  reason: string;
  originalInvoiceNumber?: string;
}

export interface BarcodeLabelData {
  name: string;
  sku?: string;
  barcode?: string;
  price?: number;
  currency?: string;
}

export interface BarcodeLabelProps extends Omit<BaseDocumentProps, 'store'> {
  labels: BarcodeLabelData[];
  labelsPerRow?: number;
  showPrice?: boolean;
}
