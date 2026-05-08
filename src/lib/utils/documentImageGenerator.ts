import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import type { DocumentType } from '../../components/documents/types';
import {
  ReceiptTemplate,
  QuotationTemplate,
  PurchaseInvoiceTemplate,
  CustomerStatementTemplate,
  VendorStatementTemplate,
  CreditNoteTemplate,
} from '../../components/documents';

const templateMap: Record<string, React.ComponentType<any>> = {
  'receipt': ReceiptTemplate,
  'quotation': QuotationTemplate,
  'purchase-invoice': PurchaseInvoiceTemplate,
  'customer-statement': CustomerStatementTemplate,
  'vendor-statement': VendorStatementTemplate,
  'credit-note': CreditNoteTemplate,
};

/**
 * Renders a document template off-screen and captures it as a PNG image.
 */
export async function generateDocumentImage(
  type: DocumentType,
  data: any,
): Promise<Blob> {
  const Template = templateMap[type];
  if (!Template) {
    throw new Error(`No template found for document type: ${type}`);
  }

  // Create off-screen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // Render template with standard variant and color mode
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(Template, {
          ...data,
          variant: 'standard',
          colorMode: 'color',
          ref: () => resolve(),
        })
      );
      // Fallback resolve in case ref callback doesn't fire
      setTimeout(resolve, 500);
    });

    // Wait for fonts and layout
    await new Promise((r) => setTimeout(r, 200));
    await document.fonts.ready;

    const element = container.firstElementChild as HTMLElement;
    if (!element) {
      throw new Error('Template render failed — no element found');
    }

    // Capture with html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to convert canvas to blob'));
        },
        'image/png',
        0.95
      );
    });

    return blob;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

/**
 * Generate image and trigger download.
 */
export async function downloadDocumentImage(
  type: DocumentType,
  data: any,
  filename?: string,
): Promise<void> {
  const blob = await generateDocumentImage(type, data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${type}-${data.documentNumber || 'document'}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate image and share via Web Share API (mobile).
 * Falls back to download if sharing not supported.
 */
export async function shareDocumentImage(
  type: DocumentType,
  data: any,
): Promise<void> {
  const blob = await generateDocumentImage(type, data);
  const filename = `${type}-${data.documentNumber || 'document'}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  // Try Web Share API (works on mobile browsers)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `${type.replace(/-/g, ' ')} #${data.documentNumber || ''}`,
      files: [file],
    });
    return;
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
