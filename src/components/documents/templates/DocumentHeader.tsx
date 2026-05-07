import React from 'react';
import type { DocumentVariant, DocumentColorMode, DocumentStoreInfo } from '../types';

interface DocumentHeaderProps {
  variant: DocumentVariant;
  colorMode?: DocumentColorMode;
  store: DocumentStoreInfo;
  title?: string;
  subtitle?: string;
}

export default function DocumentHeader({ variant, colorMode = 'color', store, title, subtitle }: DocumentHeaderProps) {
  const isThermal = variant === 'thermal';
  const isColor = colorMode === 'color';

  // Thermal always monochrome
  if (isThermal) {
    return (
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        {store.logo && (
          <img src={store.logo} alt={store.name} style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto 4px', borderRadius: '8px' }} />
        )}
        <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{store.name}</h1>
        {store.address && <p style={{ fontSize: '10px', margin: '2px 0 0', opacity: 0.7 }}>{store.address}</p>}
        {(store.phone || store.email) && <p style={{ fontSize: '10px', margin: '2px 0 0', opacity: 0.7 }}>{store.phone}{store.phone && store.email ? ' | ' : ''}{store.email}</p>}
        {store.taxId && <p style={{ fontSize: '10px', margin: '2px 0 0', opacity: 0.6 }}>Tax ID: {store.taxId}</p>}
        {title && (
          <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', paddingBottom: '4px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
            {subtitle && <p style={{ fontSize: '10px', margin: '2px 0 0', opacity: 0.6 }}>{subtitle}</p>}
          </div>
        )}
      </div>
    );
  }

  // Standard / Mobile
  const headerBg = isColor
    ? 'linear-gradient(135deg, #F97316 0%, #EA580C 40%, #0E3D3B 100%)'
    : '#000';

  return (
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      {/* Gradient Header Bar */}
      <div style={{
        background: headerBg,
        margin: variant === 'mobile' ? '-16px -16px 16px' : '-15mm -20mm 16px',
        padding: variant === 'mobile' ? '20px 16px' : '20mm 20mm 16px',
        borderRadius: variant === 'mobile' ? '12px 12px 0 0' : '0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles (color mode only) */}
        {isColor && (
          <>
            <div style={{
              position: 'absolute', right: '-20px', top: '-20px',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            }} />
            <div style={{
              position: 'absolute', left: '-10px', bottom: '-30px',
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }} />
          </>
        )}

        {store.logo && (
          <img
            src={store.logo}
            alt={store.name}
            style={{
              width: '56px', height: '56px', objectFit: 'contain',
              margin: '0 auto 8px', borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
            }}
          />
        )}
        <h1 style={{
          fontSize: variant === 'mobile' ? '22px' : '26px',
          fontWeight: 800,
          margin: 0,
          color: '#fff',
          letterSpacing: '-0.02em',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}>
          {store.name}
        </h1>
        {store.address && (
          <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'rgba(255,255,255,0.85)' }}>
            {store.address}
          </p>
        )}
        {(store.phone || store.email) && (
          <p style={{ fontSize: '12px', margin: '2px 0 0', color: 'rgba(255,255,255,0.75)' }}>
            {store.phone}{store.phone && store.email ? ' | ' : ''}{store.email}
          </p>
        )}
        {store.taxId && (
          <p style={{ fontSize: '11px', margin: '2px 0 0', color: 'rgba(255,255,255,0.6)' }}>
            Tax ID: {store.taxId}
          </p>
        )}
      </div>

      {/* Title below gradient bar */}
      {title && (
        <div style={{ marginTop: '4px' }}>
          <h2 style={{
            fontSize: variant === 'mobile' ? '18px' : '20px',
            fontWeight: 700,
            margin: 0,
            color: isColor ? '#F97316' : '#000',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '12px', margin: '2px 0 0', opacity: 0.6 }}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
