import React from 'react';
import type { DocumentVariant, DocumentColorMode, DocumentTotals as TotalsType } from '../types';

interface DocumentTotalsProps {
  variant: DocumentVariant;
  colorMode?: DocumentColorMode;
  totals: TotalsType;
  currency?: string;
}

function formatCurrency(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function DocumentTotals({ variant, colorMode = 'color', totals, currency = 'PKR' }: DocumentTotalsProps) {
  const isThermal = variant === 'thermal';
  const isColor = colorMode === 'color';

  if (isThermal) {
    const row = (label: string, value: string, bold = false) => (
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '1px 0', fontWeight: bold ? 700 : 400,
        fontSize: bold ? '13px' : '11px',
        borderTop: bold ? '2px solid #000' : undefined,
        paddingTop: bold ? '3px' : undefined,
        marginTop: bold ? '3px' : undefined,
      }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
    );

    return (
      <div style={{ margin: '4px 0' }}>
        {row('Subtotal', formatCurrency(totals.subtotal, currency))}
        {totals.discount !== undefined && totals.discount > 0 && row('Discount', `-${formatCurrency(totals.discount, currency)}`)}
        {totals.tax !== undefined && totals.tax > 0 && row(`Tax`, formatCurrency(totals.tax, currency))}
        {row('TOTAL', formatCurrency(totals.total, currency), true)}
      </div>
    );
  }

  const accentColor = isColor ? '#F97316' : '#000';

  const row = (label: string, value: string, bold = false) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '5px 0', fontWeight: bold ? 700 : 400,
      fontSize: bold ? '18px' : '14px',
      borderTop: bold ? `2px solid ${accentColor}` : undefined,
      paddingTop: bold ? '10px' : undefined,
      marginTop: bold ? '6px' : undefined,
      color: bold ? accentColor : '#374151',
    }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div style={{ margin: '8px 0' }}>
      {row('Subtotal', formatCurrency(totals.subtotal, currency))}
      {totals.discount !== undefined && totals.discount > 0 &&
        row('Discount', `-${formatCurrency(totals.discount, currency)}`)}
      {totals.tax !== undefined && totals.tax > 0 &&
        row(`Tax (${((totals.tax_rate ?? 0) * 100).toFixed(0)}%)`, formatCurrency(totals.tax, currency))}
      {row('Total', formatCurrency(totals.total, currency), true)}
    </div>
  );
}
