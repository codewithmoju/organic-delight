import React, { forwardRef } from 'react';
import type { CreditNoteProps } from '../types';
import DocumentShell from './DocumentShell';
import DocumentHeader from './DocumentHeader';
import DocumentFooter from './DocumentFooter';
import DocumentItemsTable from './DocumentItemsTable';
import DocumentTotals from './DocumentTotals';
import DocumentPartyDetails from './DocumentPartyDetails';

function formatCurrency(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const CreditNoteTemplate = forwardRef<HTMLDivElement, CreditNoteProps>((props, ref) => {
  const { variant, colorMode = 'color', store, documentNumber, date, currency, notes, items, totals, customer, creditAmount, reason, originalInvoiceNumber } = props;
  const isThermal = variant === 'thermal';
  const cm = isThermal ? 'bw' : colorMode;
  const isColor = cm === 'color';

  const formattedDate = date instanceof Date ? date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : String(date);

  return (
    <DocumentShell ref={ref} variant={variant} colorMode={cm}>
      <DocumentHeader variant={variant} colorMode={cm} store={store} title="Credit Note" />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '10px' : '12px', margin: isThermal ? '4px 0' : '8px 0', color: '#6b7280' }}>
        <span>CN: {documentNumber}</span>
        <span>{formattedDate}</span>
      </div>

      {originalInvoiceNumber && (
        <div style={{ fontSize: isThermal ? '10px' : '12px', color: '#6b7280', marginBottom: isThermal ? '2px' : '8px' }}>
          Ref: {originalInvoiceNumber}
        </div>
      )}

      {/* Credit amount */}
      <div style={{
        textAlign: 'center', margin: isThermal ? '6px 0' : '16px 0',
        padding: isThermal ? '6px 4px' : '20px',
        borderRadius: '8px',
        backgroundColor: isColor ? '#fef2f2' : '#f5f5f5',
        border: `1px solid ${isColor ? '#fecaca' : '#ccc'}`,
      }}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', fontWeight: 600 }}>
          Credit Amount
        </div>
        <div style={{
          fontSize: isThermal ? '18px' : '30px', fontWeight: 800,
          color: isColor ? '#ef4444' : '#000',
          marginTop: '4px',
        }}>
          {formatCurrency(creditAmount, currency)}
        </div>
      </div>

      <DocumentPartyDetails variant={variant} colorMode={cm} party={customer} label="Issued To" />

      <div style={{
        margin: isThermal ? '4px 0' : '10px 0',
        padding: isThermal ? '0' : '12px 14px',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        fontSize: isThermal ? '11px' : '13px',
        color: '#374151',
      }}>
        <strong style={{ color: '#6b7280' }}>Reason:</strong> {reason}
      </div>

      <DocumentItemsTable variant={variant} colorMode={cm} items={items} currency={currency} />
      <DocumentTotals variant={variant} colorMode={cm} totals={totals} currency={currency} />
      <DocumentFooter variant={variant} colorMode={cm} notes={notes} />
    </DocumentShell>
  );
});

CreditNoteTemplate.displayName = 'CreditNoteTemplate';
export default CreditNoteTemplate;
