import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Receipt, ClipboardList, Truck, Users, Building2,
  CreditCard, Tag, Printer, Download, ChevronRight, Palette, CircleDot,
} from 'lucide-react';
import type { DocumentType, DocumentVariant, DocumentColorMode } from '../../components/documents/types';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

import ReceiptTemplate from '../../components/documents/templates/ReceiptTemplate';
import QuotationTemplate from '../../components/documents/templates/QuotationTemplate';
import PurchaseInvoiceTemplate from '../../components/documents/templates/PurchaseInvoiceTemplate';
import CustomerStatementTemplate from '../../components/documents/templates/CustomerStatementTemplate';
import VendorStatementTemplate from '../../components/documents/templates/VendorStatementTemplate';
import CreditNoteTemplate from '../../components/documents/templates/CreditNoteTemplate';
import BarcodeLabelTemplate from '../../components/documents/templates/BarcodeLabelTemplate';
import SharePanel from '../../components/documents/SharePanel';

import {
  sampleReceiptProps,
  sampleQuotationProps,
  samplePurchaseInvoiceProps,
  sampleCustomerStatementProps,
  sampleVendorStatementProps,
  sampleCreditNoteProps,
  sampleBarcodeLabelProps,
} from '../../components/documents/sampleData';
import { downloadDocumentPDF } from '../../lib/utils/documentPdfGenerator';

const documentTypes: { id: DocumentType; label: string; icon: typeof FileText; description: string }[] = [
  { id: 'receipt', label: 'Sales Receipt', icon: Receipt, description: 'POS transaction receipt' },
  { id: 'quotation', label: 'Quotation', icon: ClipboardList, description: 'Price estimate for customers' },
  { id: 'purchase-invoice', label: 'Purchase Invoice', icon: Truck, description: 'Vendor purchase bill' },
  { id: 'customer-statement', label: 'Customer Statement', icon: Users, description: 'Customer ledger summary' },
  { id: 'vendor-statement', label: 'Vendor Statement', icon: Building2, description: 'Vendor ledger summary' },
  { id: 'credit-note', label: 'Credit Note', icon: CreditCard, description: 'Refund / return credit' },
  { id: 'barcode-label', label: 'Barcode Labels', icon: Tag, description: 'Product barcode stickers' },
];

const variants: { id: DocumentVariant; label: string }[] = [
  { id: 'standard', label: 'A4 Standard' },
  { id: 'thermal', label: 'Thermal 80mm' },
  { id: 'mobile', label: 'Mobile 360px' },
];

const colorModes: { id: DocumentColorMode; label: string; icon: typeof Palette; description: string }[] = [
  { id: 'color', label: 'Color', icon: Palette, description: 'Brand colors for digital sharing' },
  { id: 'bw', label: 'B&W', icon: CircleDot, description: 'Black & white for printing' },
];

function getSampleProps(type: DocumentType, variant: DocumentVariant, colorMode: DocumentColorMode) {
  switch (type) {
    case 'receipt': return { ...sampleReceiptProps, variant, colorMode };
    case 'quotation': return { ...sampleQuotationProps, variant, colorMode };
    case 'purchase-invoice': return { ...samplePurchaseInvoiceProps, variant, colorMode };
    case 'customer-statement': return { ...sampleCustomerStatementProps, variant, colorMode };
    case 'vendor-statement': return { ...sampleVendorStatementProps, variant, colorMode };
    case 'credit-note': return { ...sampleCreditNoteProps, variant, colorMode };
    case 'barcode-label': return { ...sampleBarcodeLabelProps, variant };
    default: return { ...sampleReceiptProps, variant, colorMode };
  }
}

function renderTemplate(type: DocumentType, variant: DocumentVariant, colorMode: DocumentColorMode) {
  const props = getSampleProps(type, variant, colorMode);
  switch (type) {
    case 'receipt': return <ReceiptTemplate {...props} />;
    case 'quotation': return <QuotationTemplate {...(props as any)} />;
    case 'purchase-invoice': return <PurchaseInvoiceTemplate {...(props as any)} />;
    case 'customer-statement': return <CustomerStatementTemplate {...(props as any)} />;
    case 'vendor-statement': return <VendorStatementTemplate {...(props as any)} />;
    case 'credit-note': return <CreditNoteTemplate {...(props as any)} />;
    case 'barcode-label': return <BarcodeLabelTemplate {...(props as any)} />;
    default: return null;
  }
}

export default function DocumentsPage() {
  const [selectedType, setSelectedType] = useState<DocumentType>('receipt');
  const [selectedVariant, setSelectedVariant] = useState<DocumentVariant>('standard');
  const [selectedColorMode, setSelectedColorMode] = useState<DocumentColorMode>('color');
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef });

  const currentType = documentTypes.find(t => t.id === selectedType)!;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-teal-600 p-6 sm:p-8 text-white"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Document Templates</h1>
              <p className="text-white/80 text-sm mt-1">
                Preview and test all bill layouts — color mode for digital sharing, B&W for printing
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -right-4 -bottom-12 w-32 h-32 bg-teal-400/20 rounded-full blur-xl" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar — Document Type Selector */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Document Type</h2>
          <div className="space-y-2">
            {documentTypes.map(docType => (
              <motion.button
                key={docType.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType(docType.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  selectedType === docType.id
                    ? 'bg-primary/10 border-2 border-primary text-primary shadow-sm'
                    : 'bg-card border-2 border-transparent hover:bg-muted text-foreground'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  selectedType === docType.id ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <docType.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{docType.label}</div>
                  <div className="text-xs opacity-60 truncate">{docType.description}</div>
                </div>
                {selectedType === docType.id && (
                  <ChevronRight className="w-4 h-4 text-primary" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right — Preview Area */}
        <div className="space-y-4">
          {/* Toggles Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Variant Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
              {variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedVariant === v.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Color Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
              {colorModes.map(cm => (
                <button
                  key={cm.id}
                  onClick={() => setSelectedColorMode(cm.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedColorMode === cm.id
                      ? cm.id === 'color'
                        ? 'bg-gradient-to-r from-orange-500 to-teal-600 text-white shadow-sm'
                        : 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={cm.description}
                >
                  <cm.icon size={14} />
                  {cm.label}
                </button>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Printer size={16} />
                Print
              </button>
              <button
                onClick={() => {
                  const props = getSampleProps(selectedType, selectedVariant, selectedColorMode);
                  downloadDocumentPDF(selectedType, props);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Download size={16} />
                PDF
              </button>
            </div>
          </div>

          {/* Template Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <currentType.icon size={16} />
            <span className="font-medium">{currentType.label}</span>
            <span>&middot;</span>
            <span>{variants.find(v => v.id === selectedVariant)?.label}</span>
            <span>&middot;</span>
            <span className={selectedColorMode === 'color' ? 'text-orange-500 font-semibold' : 'font-semibold'}>
              {selectedColorMode === 'color' ? 'Color Mode' : 'B&W Mode'}
            </span>
          </div>

          {/* Preview Frame */}
          <motion.div
            key={`${selectedType}-${selectedVariant}-${selectedColorMode}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-muted rounded-2xl p-4 sm:p-6 overflow-auto"
            style={{ maxHeight: '80vh' }}
          >
            <div style={{ margin: '0 auto', display: 'flex', justifyContent: 'center' }} ref={contentRef}>
              {renderTemplate(selectedType, selectedVariant, selectedColorMode)}
            </div>
          </motion.div>

          {/* Share Panel */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="text-sm font-semibold mb-3">Share this document</h3>
            <SharePanel type={selectedType} data={getSampleProps(selectedType, selectedVariant, selectedColorMode)} />
          </div>
        </div>
      </div>
    </div>
  );
}
