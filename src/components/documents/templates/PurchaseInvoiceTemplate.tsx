import React, { forwardRef } from 'react';
import type { PurchaseInvoiceProps } from '../types';
import DocumentShell from './DocumentShell';
import DocumentHeader from './DocumentHeader';
import DocumentFooter from './DocumentFooter';
import DocumentItemsTable from './DocumentItemsTable';
import DocumentTotals from './DocumentTotals';
import DocumentPartyDetails from './DocumentPartyDetails';

function formatCurrency(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const PurchaseInvoiceTemplate = forwardRef<HTMLDivElement, PurchaseInvoiceProps>((props, ref) => {
  const { variant, colorMode = 'color', store, documentNumber, date, currency, notes, items, totals, vendor, paymentStatus, paidAmount, pendingAmount, dueDate } = props;
  const isThermal = variant === 'thermal';
  const cm = isThermal ? 'bw' : colorMode;
  const isColor = cm === 'color';

  const formattedDate = date instanceof Date ? date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : String(date);
  const formattedDueDate = dueDate instanceof Date ? dueDate.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  const statusColor = paymentStatus === 'paid' ? (isColor ? '#16a34a' : '#000') : paymentStatus === 'partial' ? (isColor ? '#f59e0b' : '#555') : (isColor ? '#ef4444' : '#000');

  return (
    <DocumentShell ref={ref} variant={variant} colorMode={cm}>
      <DocumentHeader variant={variant} colorMode={cm} store={store} title="Purchase Invoice" />

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: isThermal ? '10px' : '12px', margin: isThermal ? '4px 0' : '8px 0',
      }}>
        <span style={{ color: '#6b7280' }}>Invoice: {documentNumber}</span>
        <span style={{ color: '#6b7280' }}>{formattedDate}</span>
      </div>

      <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '6px',
        backgroundColor: isColor ? '#f9fafb' : '#f0f0f0',
        border: `1px solid ${isColor ? '#e5e7eb' : '#ccc'}`,
        color: statusColor,
        fontSize: '12px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: '10px',
      }}>
        {paymentStatus}
      </div>

      <DocumentPartyDetails variant={variant} colorMode={cm} party={vendor} label="Vendor" />
      <DocumentItemsTable variant={variant} colorMode={cm} items={items} currency={currency} />
      <DocumentTotals variant={variant} colorMode={cm} totals={totals} currency={currency} />

      {(paymentStatus === 'partial' || paymentStatus === 'pending') && (
        <div style={{
          margin: isThermal ? '4px 0' : '12px 0',
          padding: isThermal ? '0' : '12px 14px',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
        }}>
          {paidAmount !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '11px' : '14px', padding: '3px 0' }}>
              <span style={{ color: '#6b7280' }}>Paid</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(paidAmount, currency)}</span>
            </div>
          )}
          {pendingAmount !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '11px' : '14px', padding: '3px 0' }}>
              <span style={{ color: '#6b7280' }}>Pending</span>
              <span style={{ fontWeight: 700, color: isColor ? '#ef4444' : '#000' }}>{formatCurrency(pendingAmount, currency)}</span>
            </div>
          )}
          {formattedDueDate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '10px' : '12px', padding: '3px 0', color: '#9ca3af' }}>
              <span>Due Date</span><span>{formattedDueDate}</span>
            </div>
          )}
        </div>
      )}

      <DocumentFooter variant={variant} colorMode={cm} notes={notes} />
    </DocumentShell>
  );
});

PurchaseInvoiceTemplate.displayName = 'PurchaseInvoiceTemplate';
export default PurchaseInvoiceTemplate;
