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

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '10px' : '12px', margin: isThermal ? '4px 0' : '8px 0', opacity: 0.7 }}>
        <span>CN: {documentNumber}</span>
        <span>{formattedDate}</span>
      </div>

      {originalInvoiceNumber && (
        <div style={{ fontSize: isThermal ? '10px' : '12px', opacity: 0.7, marginBottom: isThermal ? '2px' : '8px' }}>
          Ref: {originalInvoiceNumber}
        </div>
      )}

      {/* Prominent credit amount */}
      <div style={{
        textAlign: 'center', margin: isThermal ? '6px 0' : '16px 0',
        padding: isThermal ? '6px 4px' : '20px',
        backgroundColor: isThermal ? 'transparent' : (isColor ? '#FEF2F2' : '#f5f5f5'),
        border: isThermal ? '2px solid #000' : `2px solid ${isColor ? '#EF4444' : '#000'}`,
        borderRadius: isThermal ? 0 : '10px',
      }}>
        <div style={{ fontSize: isThermal ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, fontWeight: 600 }}>
          Credit Amount
        </div>
        <div style={{
          fontSize: isThermal ? '18px' : '32px', fontWeight: 800,
          color: isColor ? '#DC2626' : '#000',
          marginTop: '4px',
        }}>
          {formatCurrency(creditAmount, currency)}
        </div>
      </div>

      <DocumentPartyDetails variant={variant} colorMode={cm} party={customer} label="Issued To" />

      <div style={{
        margin: isThermal ? '4px 0' : '10px 0',
        padding: isThermal ? '0' : '12px 14px',
        borderRadius: isThermal ? 0 : '8px',
        backgroundColor: isThermal ? 'transparent' : (isColor ? '#FFFBF5' : '#f5f5f5'),
        borderLeft: isThermal ? 'none' : `3px solid ${isColor ? '#F59E0B' : '#000'}`,
        fontSize: isThermal ? '11px' : '13px',
      }}>
        <strong style={{ color: isColor ? '#9A3412' : '#333' }}>Reason:</strong> {reason}
      </div>

      <DocumentItemsTable variant={variant} colorMode={cm} items={items} currency={currency} />
      <DocumentTotals variant={variant} colorMode={cm} totals={totals} currency={currency} />
      <DocumentFooter variant={variant} colorMode={cm} notes={notes} />
    </DocumentShell>
  );
});

CreditNoteTemplate.displayName = 'CreditNoteTemplate';
export default CreditNoteTemplate;
