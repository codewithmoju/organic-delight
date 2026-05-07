import React from 'react';
import type { DocumentVariant, DocumentColorMode } from '../types';

interface DocumentFooterProps {
  variant: DocumentVariant;
  colorMode?: DocumentColorMode;
  notes?: string;
  showBranding?: boolean;
}

export default function DocumentFooter({ variant, colorMode = 'color', notes, showBranding = true }: DocumentFooterProps) {
  const isThermal = variant === 'thermal';
  const isColor = colorMode === 'color';

  if (isThermal) {
    return (
      <div style={{ marginTop: '8px' }}>
        {notes && (
          <div style={{ padding: '4px 0', borderTop: '1px dashed #999', fontSize: '10px', opacity: 0.7 }}>
            <strong>Notes:</strong> {notes}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '2px solid #000' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 2px' }}>Thank you for your business!</p>
          {showBranding && <p style={{ fontSize: '9px', margin: 0, opacity: 0.5 }}>Powered by StockSuite</p>}
        </div>
      </div>
    );
  }

  const accentColor = isColor ? '#0E3D3B' : '#666';
  const borderColor = isColor ? '#FED7AA' : '#ddd';

  return (
    <div style={{ marginTop: '24px' }}>
      {notes && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px',
          backgroundColor: isColor ? '#FFFBF5' : '#f9f9f9',
          borderLeft: `3px solid ${isColor ? '#FB923C' : '#999'}`,
          fontSize: '12px', opacity: 0.8, marginBottom: '16px',
        }}>
          <strong style={{ color: isColor ? '#9A3412' : '#333' }}>Notes:</strong> {notes}
        </div>
      )}

      <div style={{
        textAlign: 'center', marginTop: '16px',
        paddingTop: '16px', borderTop: `1px solid ${borderColor}`,
      }}>
        <p style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 3px', color: isColor ? '#F97316' : '#000' }}>
          Thank you for your business!
        </p>
        {showBranding && (
          <p style={{ fontSize: '11px', margin: 0, color: accentColor, fontWeight: 600, letterSpacing: '0.05em' }}>
            Powered by StockSuite
          </p>
        )}
      </div>
    </div>
  );
}
