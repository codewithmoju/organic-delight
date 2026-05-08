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

  return (
    <div style={{
      margin: '12px 0', padding: '12px 14px',
      borderRadius: '8px',
      backgroundColor: isColor ? '#f9fafb' : '#f5f5f5',
      border: `1px solid ${isColor ? '#e5e7eb' : '#ddd'}`,
    }}>
      <h3 style={{
        fontSize: '11px', fontWeight: 700, margin: '0 0 10px',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: isColor ? '#F97316' : '#333',
      }}>
        Payment Details
      </h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
        <span style={{ color: '#6b7280' }}>Method</span>
        <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{payment.method.replace('_', ' ')}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
        <span style={{ color: '#6b7280' }}>Amount Paid</span>
        <span style={{ fontWeight: 700 }}>{formatCurrency(payment.amount_paid, currency)}</span>
      </div>
      {payment.change !== undefined && payment.change > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
          <span style={{ color: '#6b7280' }}>Change</span>
          <span style={{ fontWeight: 700 }}>{formatCurrency(payment.change, currency)}</span>
        </div>
      )}
      {payment.reference && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#9ca3af' }}>
          <span>Ref</span><span>{payment.reference}</span>
        </div>
      )}
    </div>
  );
}
