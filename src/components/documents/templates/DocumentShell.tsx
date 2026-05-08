import React, { forwardRef } from 'react';
import type { DocumentVariant, DocumentColorMode } from '../types';

interface DocumentShellProps {
  variant: DocumentVariant;
  colorMode?: DocumentColorMode;
  children: React.ReactNode;
  className?: string;
}

function getVariantStyles(variant: DocumentVariant, _colorMode: DocumentColorMode): React.CSSProperties {
  const base: Record<DocumentVariant, React.CSSProperties> = {
    thermal: {
      width: '80mm',
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '12px',
      lineHeight: '1.3',
      padding: '4mm 2mm',
      color: '#000',
      background: '#fff',
    },
    standard: {
      width: '210mm',
      minHeight: '297mm',
      fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      fontSize: '14px',
      lineHeight: '1.5',
      padding: '15mm 20mm',
      color: '#1a1a1a',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    mobile: {
      width: '360px',
      fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      fontSize: '14px',
      lineHeight: '1.5',
      padding: '16px',
      color: '#1a1a1a',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
  };

  return base[variant];
}

const DocumentShell = forwardRef<HTMLDivElement, DocumentShellProps>(
  ({ variant, colorMode = 'color', children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={getVariantStyles(variant, colorMode)}
      >
        {children}
      </div>
    );
  }
);

DocumentShell.displayName = 'DocumentShell';
export default DocumentShell;
