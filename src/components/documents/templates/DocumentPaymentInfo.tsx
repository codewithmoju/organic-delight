import React from 'react';
import type { DocumentVariant, DocumentColorMode, DocumentPaymentInfo as PaymentType } from '../types';

interface DocumentPaymentInfoProps {
  variant: DocumentVariant;
  colorMode?: DocumentColorMode;
  payment: PaymentType;
  currency?: string;
}

function formatCurrency(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function DocumentPaymentInfo({ variant, colorMode = 'color', payment, currency = 'PKR' }: DocumentPaymentInfoProps) {
  const isThermal = variant === 'thermal';
  const isColor = colorMode === 'color';

  if (isThermal) {
    return (
      <div style={{ margin: '4px 0', padding: '4px 0', borderTop: '2px solid #000', borderBottom: '1px dashed #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '11px' }}>
          <span>Method</span><span style={{ fontWeight: 600 }}>{payment.method.replace('_', ' ')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '11px' }}>
          <span>Paid</span><span style={{ fontWeight: 600 }}>{formatCurrency(payment.amount_paid, currency)}</span>
        </div>
        {payment.change !== undefined && payment.change > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '11px' }}>
            <span>Change</span><span style={{ fontWeight: 600 }}>{formatCurrency(payment.change, currency)}</span>
          </div>
        )}
      </div>
    );
  }

  const bg = isColor ? '#FFF7ED' : '#f5f5f5';
  const borderColor = isColor ? '#F97316' : '#000';
  const labelColor = isColor ? '#9A3412' : '#333';

  return (
    <div style={{
      margin: '12px 0', padding: '14px',
      borderRadius: '8px', backgroundColor: bg,
      borderLeft: `4px solid ${borderColor}`,
    }}>
      <h3 style={{
        fontSize: '12px', fontWeight: 700, margin: '0 0 10px',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: labelColor,
      }}>
        Payment Details
      </h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
        <span style={{ opacity: 0.7 }}>Method</span>
        <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{payment.method.replace('_', ' ')}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
        <span style={{ opacity: 0.7 }}>Amount Paid</span>
        <span style={{ fontWeight: 700 }}>{formatCurrency(payment.amount_paid, currency)}</span>
      </div>
      {payment.change !== undefined && payment.change > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
          <span style={{ opacity: 0.7 }}>Change</span>
          <span style={{ fontWeight: 700 }}>{formatCurrency(payment.change, currency)}</span>
        </div>
      )}
      {payment.reference && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', opacity: 0.6 }}>
          <span>Ref</span><span>{payment.reference}</span>
        </div>
      )}
    </div>
  );
}
