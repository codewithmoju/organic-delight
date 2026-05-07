import React, { forwardRef } from 'react';
import type { ReceiptProps } from '../types';
import DocumentShell from './DocumentShell';
import DocumentHeader from './DocumentHeader';
import DocumentFooter from './DocumentFooter';
import DocumentItemsTable from './DocumentItemsTable';
import DocumentTotals from './DocumentTotals';
import DocumentPaymentInfo from './DocumentPaymentInfo';
import DocumentPartyDetails from './DocumentPartyDetails';

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>((props, ref) => {
  const { variant, colorMode = 'color', store, documentNumber, date, currency, notes, items, totals, payment, customer, cashierName } = props;
  const isThermal = variant === 'thermal';
  const cm = isThermal ? 'bw' : colorMode; // thermal always bw

  const formattedDate = date instanceof Date ? date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : String(date);
  const formattedTime = date instanceof Date ? date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <DocumentShell ref={ref} variant={variant} colorMode={cm}>
      <DocumentHeader variant={variant} colorMode={cm} store={store} title="Sales Receipt" />

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: isThermal ? '10px' : '12px',
        margin: isThermal ? '4px 0' : '8px 0',
        opacity: 0.7,
      }}>
        <span>Receipt: {documentNumber}</span>
        <span>{formattedDate} {formattedTime}</span>
      </div>

      {cashierName && (
        <div style={{ fontSize: isThermal ? '10px' : '12px', opacity: 0.7, marginBottom: isThermal ? '2px' : '8px' }}>
          Cashier: {cashierName}
        </div>
      )}

      {customer && <DocumentPartyDetails variant={variant} colorMode={cm} party={customer} label="Customer" />}

      <DocumentItemsTable variant={variant} colorMode={cm} items={items} currency={currency} />
      <DocumentTotals variant={variant} colorMode={cm} totals={totals} currency={currency} />
      <DocumentPaymentInfo variant={variant} colorMode={cm} payment={payment} currency={currency} />
      <DocumentFooter variant={variant} colorMode={cm} notes={notes} />
    </DocumentShell>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
export default ReceiptTemplate;
