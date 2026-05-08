import React from 'react';
import type { DocumentVariant, DocumentColorMode, DocumentLineItem } from '../types';

interface DocumentItemsTableProps {
  variant: DocumentVariant;
  colorMode?: DocumentColorMode;
  items: DocumentLineItem[];
  currency?: string;
}

function formatCurrency(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function DocumentItemsTable({ variant, colorMode = 'color', items, currency = 'PKR' }: DocumentItemsTableProps) {
  const isThermal = variant === 'thermal';
  const isColor = colorMode === 'color';

  // Thermal always monochrome
  if (isThermal) {
    return (
      <div style={{ margin: '6px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          borderBottom: '2px solid #000', paddingBottom: '3px', marginBottom: '4px',
          fontWeight: 700, fontSize: '10px',
        }}>
          <span style={{ flex: 1 }}>Item</span>
          <span style={{ width: '40px', textAlign: 'right' }}>Qty</span>
          <span style={{ width: '70px', textAlign: 'right' }}>Price</span>
          <span style={{ width: '70px', textAlign: 'right' }}>Total</span>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '3px 0', fontSize: '11px',
            borderBottom: '1px dotted #ccc',
          }}>
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{item.name}</span>
            <span style={{ width: '40px', textAlign: 'right' }}>{item.quantity}</span>
            <span style={{ width: '70px', textAlign: 'right' }}>{item.unit_price}</span>
            <span style={{ width: '70px', textAlign: 'right' }}>{item.total}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <table style={{
      width: '100%', borderCollapse: 'collapse',
      margin: '12px 0',
      fontSize: variant === 'mobile' ? '13px' : '14px',
    }}>
      <thead>
        <tr style={{
          borderBottom: `2px solid ${isColor ? '#F97316' : '#000'}`,
        }}>
          <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700, fontSize: '12px', color: '#374151' }}>Item</th>
          <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, fontSize: '12px', color: '#374151' }}>Qty</th>
          <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, fontSize: '12px', color: '#374151' }}>Unit Price</th>
          <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, fontSize: '12px', color: '#374151' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} style={{
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
          }}>
            <td style={{ padding: '10px 8px' }}>
              <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{item.name}</div>
              {item.sku && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>SKU: {item.sku}</div>}
            </td>
            <td style={{ textAlign: 'right', padding: '10px 8px', color: '#374151' }}>
              {item.quantity} {item.unit}
            </td>
            <td style={{ textAlign: 'right', padding: '10px 8px', color: '#374151' }}>
              {formatCurrency(item.unit_price, currency)}
            </td>
            <td style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, color: '#1a1a1a' }}>
              {formatCurrency(item.total, currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
