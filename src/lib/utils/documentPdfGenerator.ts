import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
 * Renders a document template off-screen and captures it as a PDF.
 * Uses the same React templates as the image generator for visual consistency.
 */
export async function generateDocumentPDF(type: DocumentType, data: any): Promise<jsPDF> {
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

    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png', 0.95);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    // Scale image to fit A4 width with margins
    const margin = 10; // mm
    const contentWidth = pdfWidth - margin * 2;
    const ratio = contentWidth / (imgWidth / 2); // divide by 2 because scale: 2
    const scaledHeight = (imgHeight / 2) * ratio;

    const doc = new jsPDF({
      orientation: scaledHeight > pdfHeight ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // If content is taller than one page, split across pages
    if (scaledHeight <= pdfHeight - margin * 2) {
      // Fits on one page
      doc.addImage(imgData, 'PNG', margin, margin, contentWidth, scaledHeight);
    } else {
      // Multi-page: slice the canvas into page-sized chunks
      const pageContentHeight = pdfHeight - margin * 2; // usable height per page in mm
      const pixelsPerMm = imgWidth / contentWidth; // pixels per mm (at scale 2)
      const pagePixelHeight = pageContentHeight * pixelsPerMm; // pixels per page

      let sourceY = 0;
      let pageNumber = 0;

      while (sourceY < imgHeight) {
        if (pageNumber > 0) {
          doc.addPage();
        }

        const sliceHeight = Math.min(pagePixelHeight, imgHeight - sourceY);

        // Create a canvas slice for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, imgWidth, sliceHeight);
        ctx.drawImage(canvas, 0, sourceY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);

        const pageImgData = pageCanvas.toDataURL('image/png', 0.95);
        const pageScaledHeight = (sliceHeight / 2) * ratio;
        doc.addImage(pageImgData, 'PNG', margin, margin, contentWidth, pageScaledHeight);

        sourceY += sliceHeight;
        pageNumber++;
      }
    }

    return doc;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

/**
 * Generate PDF and trigger download.
 */
export async function downloadDocumentPDF(type: DocumentType, data: any, filename?: string): Promise<void> {
  const doc = await generateDocumentPDF(type, data);
  const name = filename || `${type}-${data.documentNumber || 'document'}.pdf`;
  doc.save(name);
}
