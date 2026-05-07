import React, { forwardRef } from 'react';
import type { BarcodeLabelProps, BarcodeLabelData } from '../types';

function formatCurrency(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function BarcodeSVG({ code }: { code: string }) {
  // Simple Code128-like barcode visualization using SVG
  const bars: number[] = [];
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    bars.push(charCode % 3 + 1, 1, (charCode % 2) + 1, 1);
  }
  const totalWidth = bars.reduce((a, b) => a + b, 0);
  let x = 0;

  return (
    <svg viewBox={`0 0 ${totalWidth} 40`} style={{ width: '100%', height: '40px' }}>
      {bars.map((w, i) => {
        if (i % 2 === 0) {
          const rect = <rect key={i} x={x} y={0} width={w} height={40} fill="#000" />;
          x += w;
          return rect;
        }
        x += w;
        return null;
      })}
    </svg>
  );
}

interface LabelCardProps {
  label: BarcodeLabelData;
  showPrice: boolean;
  currency: string;
}

function LabelCard({ label, showPrice, currency }: LabelCardProps) {
  return (
    <div style={{
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      padding: '8px',
      textAlign: 'center',
      backgroundColor: '#fff',
      pageBreakInside: 'avoid',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', lineHeight: 1.2 }}>
        {label.name}
      </div>
      {label.sku && (
        <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '4px' }}>
          {label.sku}
        </div>
      )}
      {label.barcode && (
        <div style={{ margin: '4px 0' }}>
          <BarcodeSVG code={label.barcode} />
          <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px', fontFamily: 'monospace' }}>
            {label.barcode}
          </div>
        </div>
      )}
      {showPrice && label.price !== undefined && (
        <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
          {formatCurrency(label.price, currency)}
        </div>
      )}
    </div>
  );
}

const BarcodeLabelTemplate = forwardRef<HTMLDivElement, BarcodeLabelProps>((props, ref) => {
  const { variant, labels, labelsPerRow = 3, showPrice = true, currency = 'PKR' } = props;
  const isThermal = variant === 'thermal';

  const cols = isThermal ? 2 : variant === 'mobile' ? 2 : labelsPerRow;

  return (
    <div
      ref={ref}
      style={{
        width: isThermal ? '80mm' : variant === 'mobile' ? '360px' : '210mm',
        fontFamily: isThermal ? "'Courier New', monospace" : "'Inter', Arial, sans-serif",
        fontSize: isThermal ? '12px' : '14px',
        padding: isThermal ? '4mm' : '15mm',
        background: '#fff',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: isThermal ? '4px' : '12px',
      }}>
        {labels.map((label, i) => (
          <LabelCard key={i} label={label} showPrice={showPrice} currency={currency} />
        ))}
      </div>
    </div>
  );
});

BarcodeLabelTemplate.displayName = 'BarcodeLabelTemplate';
export default BarcodeLabelTemplate;
