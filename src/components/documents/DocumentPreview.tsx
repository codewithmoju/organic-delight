import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { DocumentVariant } from './types';

interface DocumentPreviewProps {
  variant: DocumentVariant;
  children: React.ReactNode;
  onPrint?: () => void;
}

export default function DocumentPreview({ variant, children, onPrint }: DocumentPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ contentRef });

  const frameStyles: React.CSSProperties = variant === 'thermal'
    ? {
        width: '320px',
        minHeight: '200px',
        margin: '0 auto',
        background: '#f5f5f0',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.1)',
      }
    : variant === 'mobile'
    ? {
        width: '390px',
        minHeight: '400px',
        margin: '0 auto',
        background: '#1a1a1a',
        borderRadius: '32px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }
    : {
        width: '100%',
        maxWidth: '800px',
        minHeight: '400px',
        margin: '0 auto',
        background: '#f3f4f6',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      };

  const innerStyles: React.CSSProperties = variant === 'mobile'
    ? {
        background: '#fff',
        borderRadius: '20px',
        overflow: 'hidden',
        minHeight: '300px',
      }
    : {};

  return (
    <div>
      <div style={frameStyles}>
        <div style={innerStyles} ref={contentRef}>
          {children}
        </div>
      </div>
      {onPrint && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            onClick={() => { handlePrint(); onPrint(); }}
            style={{
              padding: '8px 24px',
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Print
          </button>
        </div>
      )}
    </div>
  );
}
