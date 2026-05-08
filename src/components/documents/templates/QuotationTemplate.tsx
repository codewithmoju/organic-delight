import React, { forwardRef } from 'react';
import type { QuotationProps } from '../types';
import DocumentShell from './DocumentShell';
import DocumentHeader from './DocumentHeader';
import DocumentFooter from './DocumentFooter';
import DocumentItemsTable from './DocumentItemsTable';
import DocumentTotals from './DocumentTotals';
import DocumentPartyDetails from './DocumentPartyDetails';

const QuotationTemplate = forwardRef<HTMLDivElement, QuotationProps>((props, ref) => {
  const { variant, colorMode = 'color', store, documentNumber, date, currency, notes, items, totals, customer, validUntil, terms } = props;
  const isThermal = variant === 'thermal';
  const cm = isThermal ? 'bw' : colorMode;

  const formattedDate = date instanceof Date ? date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : String(date);
  const formattedValidUntil = validUntil instanceof Date ? validUntil.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : null;
  const accentColor = cm === 'color' ? '#F97316' : '#000';

  return (
    <DocumentShell ref={ref} variant={variant} colorMode={cm}>
      <DocumentHeader variant={variant} colorMode={cm} store={store} title="Quotation" />

      {!isThermal && (
        <div style={{
          display: 'inline-block', padding: '4px 14px', borderRadius: '9999px',
          backgroundColor: '#f9fafb',
          border: `1px solid ${isThermal ? '#999' : '#e5e7eb'}`,
          color: accentColor,
          fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '8px',
        }}>
          Quotation
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: isThermal ? '10px' : '12px',
        margin: isThermal ? '4px 0' : '8px 0', opacity: 0.7,
      }}>
        <span>Ref: {documentNumber}</span>
        <span>Date: {formattedDate}</span>
      </div>

      {formattedValidUntil && (
        <div style={{ fontSize: isThermal ? '10px' : '12px', opacity: 0.7, marginBottom: isThermal ? '2px' : '8px' }}>
          Valid until: {formattedValidUntil}
        </div>
      )}

      <DocumentPartyDetails variant={variant} colorMode={cm} party={customer} label="Quotation For" />
      <DocumentItemsTable variant={variant} colorMode={cm} items={items} currency={currency} />
      <DocumentTotals variant={variant} colorMode={cm} totals={totals} currency={currency} />

      {terms && (
        <div style={{
          margin: isThermal ? '4px 0' : '12px 0',
          padding: isThermal ? '4px 0' : '12px 14px',
          borderRadius: isThermal ? 0 : '8px',
          backgroundColor: isThermal ? 'transparent' : '#f9fafb',
          borderLeft: isThermal ? 'none' : `3px solid ${cm === 'color' ? '#F97316' : '#999'}`,
          fontSize: isThermal ? '10px' : '12px', opacity: 0.8,
        }}>
          <strong style={{ color: '#374151' }}>Terms & Conditions:</strong>
          <p style={{ margin: '4px 0 0' }}>{terms}</p>
        </div>
      )}

      <DocumentFooter variant={variant} colorMode={cm} notes={notes} />
    </DocumentShell>
  );
});

QuotationTemplate.displayName = 'QuotationTemplate';
export default QuotationTemplate;
