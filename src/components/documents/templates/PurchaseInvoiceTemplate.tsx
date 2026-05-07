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

  const statusStyles: Record<string, { bg: string; border: string; text: string }> = isColor ? {
    paid: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    partial: { bg: '#fef9c3', border: '#f59e0b', text: '#854d0e' },
    pending: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  } : {
    paid: { bg: '#f0f0f0', border: '#000', text: '#000' },
    partial: { bg: '#f0f0f0', border: '#666', text: '#333' },
    pending: { bg: '#f0f0f0', border: '#000', text: '#000' },
  };
  const status = statusStyles[paymentStatus] || statusStyles.pending;

  return (
    <DocumentShell ref={ref} variant={variant} colorMode={cm}>
      <DocumentHeader variant={variant} colorMode={cm} store={store} title="Purchase Invoice" />

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: isThermal ? '10px' : '12px', margin: isThermal ? '4px 0' : '8px 0',
      }}>
        <span style={{ opacity: 0.7 }}>Invoice: {documentNumber}</span>
        <span style={{ opacity: 0.7 }}>{formattedDate}</span>
      </div>

      <div style={{
        display: 'inline-block',
        padding: isThermal ? '2px 6px' : '5px 14px',
        borderRadius: '9999px',
        backgroundColor: isColor ? status.bg : '#f0f0f0',
        border: isColor ? `1px solid ${status.border}` : `1px solid ${isColor ? status.border : '#000'}`,
        color: status.text,
        fontSize: isThermal ? '10px' : '12px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: isThermal ? '4px' : '10px',
      }}>
        {paymentStatus}
      </div>

      <DocumentPartyDetails variant={variant} colorMode={cm} party={vendor} label="Vendor" />
      <DocumentItemsTable variant={variant} colorMode={cm} items={items} currency={currency} />
      <DocumentTotals variant={variant} colorMode={cm} totals={totals} currency={currency} />

      {(paymentStatus === 'partial' || paymentStatus === 'pending') && (
        <div style={{
          margin: isThermal ? '4px 0' : '12px 0',
          padding: isThermal ? '0' : '14px',
          backgroundColor: isThermal ? 'transparent' : (isColor ? '#FFFBF5' : '#f5f5f5'),
          borderRadius: isThermal ? 0 : '8px',
          borderLeft: isThermal ? 'none' : `4px solid ${isColor ? '#F59E0B' : '#000'}`,
        }}>
          {paidAmount !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '11px' : '14px', padding: '3px 0' }}>
              <span>Paid</span>
              <span style={{ color: isColor ? '#166534' : '#000', fontWeight: 700 }}>{formatCurrency(paidAmount, currency)}</span>
            </div>
          )}
          {pendingAmount !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '11px' : '14px', padding: '3px 0' }}>
              <span>Pending</span>
              <span style={{ color: isColor ? '#991b1b' : '#000', fontWeight: 700 }}>{formatCurrency(pendingAmount, currency)}</span>
            </div>
          )}
          {formattedDueDate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '10px' : '12px', padding: '3px 0', opacity: 0.7 }}>
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
