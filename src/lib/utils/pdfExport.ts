/**
 * PDF export utility using jsPDF (already in package.json).
 * Provides two functions:
 *   - exportTableToPDF: generic table → PDF
 *   - exportReportToPDF: styled report with header, summary, and table
 */
import jsPDF from 'jspdf';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRIMARY = [99, 102, 241] as [number, number, number];   // indigo-500
const HEADER_BG = [232, 240, 254] as [number, number, number]; // light blue
const ROW_ALT = [248, 250, 252] as [number, number, number];   // slate-50
const TEXT_DARK = [15, 23, 42] as [number, number, number];    // slate-900
const TEXT_MID = [100, 116, 139] as [number, number, number];  // slate-500
const BORDER = [226, 232, 240] as [number, number, number];    // slate-200

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ── Generic table export ──────────────────────────────────────────────────────

export function exportTableToPDF(
  data: Record<string, any>[],
  filename: string,
  title?: string
): void {
  if (!data.length) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const usableW = pageW - margin * 2;

  const headers = Object.keys(data[0]);
  const colW = usableW / headers.length;
  const rowH = 8;
  let y = margin;

  // ── Title ──
  if (title) {
    doc.setFontSize(16);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y + 6);
    y += 12;
  }

  // ── Timestamp ──
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 4);
  y += 8;

  // ── Header row ──
  doc.setFillColor(...HEADER_BG);
  doc.rect(margin, y, usableW, rowH, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  headers.forEach((h, i) => {
    doc.text(truncate(h, 18), margin + i * colW + 2, y + 5.5);
  });
  y += rowH;

  // ── Data rows ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  data.forEach((row, ri) => {
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    if (ri % 2 === 1) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(margin, y, usableW, rowH, 'F');
    }
    doc.setTextColor(...TEXT_DARK);
    headers.forEach((h, i) => {
      const val = row[h] ?? '';
      doc.text(truncate(String(val), 20), margin + i * colW + 2, y + 5.5);
    });
    // bottom border
    doc.setDrawColor(...BORDER);
    doc.line(margin, y + rowH, margin + usableW, y + rowH);
    y += rowH;
  });

  doc.save(`${filename}.pdf`);
}

// ── Styled report export ──────────────────────────────────────────────────────

export interface ReportSection {
  title: string;
  rows: { label: string; value: string }[];
}

export function exportReportToPDF(options: {
  title: string;
  subtitle?: string;
  sections?: ReportSection[];
  tableData?: Record<string, any>[];
  tableTitle?: string;
  filename: string;
}): void {
  const { title, subtitle, sections, tableData, tableTitle, filename } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const usableW = pageW - margin * 2;
  let y = margin;

  // ── Header banner ──
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin, 13);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, margin, 21);
  }
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin, 21, { align: 'right' });
  y = 36;

  // ── Summary sections ──
  if (sections?.length) {
    sections.forEach(section => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEXT_DARK);
      doc.text(section.title, margin, y);
      y += 6;

      section.rows.forEach(({ label, value }) => {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...TEXT_MID);
        doc.text(label, margin + 4, y);
        doc.setTextColor(...TEXT_DARK);
        doc.setFont('helvetica', 'bold');
        doc.text(value, pageW - margin, y, { align: 'right' });
        doc.setDrawColor(...BORDER);
        doc.line(margin + 4, y + 1.5, pageW - margin, y + 1.5);
        y += 7;
      });
      y += 4;
    });
  }

  // ── Table ──
  if (tableData?.length) {
    if (tableTitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEXT_DARK);
      doc.text(tableTitle, margin, y);
      y += 6;
    }

    const headers = Object.keys(tableData[0]);
    const colW = usableW / headers.length;
    const rowH = 7.5;

    // header
    doc.setFillColor(...HEADER_BG);
    doc.rect(margin, y, usableW, rowH, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    headers.forEach((h, i) => doc.text(truncate(h, 16), margin + i * colW + 2, y + 5));
    y += rowH;

    // rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    tableData.forEach((row, ri) => {
      if (y + rowH > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      if (ri % 2 === 1) {
        doc.setFillColor(...ROW_ALT);
        doc.rect(margin, y, usableW, rowH, 'F');
      }
      doc.setTextColor(...TEXT_DARK);
      headers.forEach((h, i) => {
        doc.text(truncate(String(row[h] ?? ''), 18), margin + i * colW + 2, y + 5);
      });
      doc.setDrawColor(...BORDER);
      doc.line(margin, y + rowH, margin + usableW, y + rowH);
      y += rowH;
    });
  }

  doc.save(`${filename}.pdf`);
}
