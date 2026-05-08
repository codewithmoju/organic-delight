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

  // Standard / Mobile — clean, simple design
  const accentColor = isColor ? '#F97316' : '#000';
  const mutedColor = isColor ? '#6b7280' : '#555';

  return (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      {/* Thin accent line at top */}
      <div style={{
        height: '3px',
        background: accentColor,
        borderRadius: '2px',
        marginBottom: '20px',
      }} />

      {store.logo && (
        <img
          src={store.logo}
          alt={store.name}
          style={{
            width: '52px', height: '52px', objectFit: 'contain',
            margin: '0 auto 10px', borderRadius: '10px',
          }}
        />
      )}

      <h1 style={{
        fontSize: variant === 'mobile' ? '22px' : '26px',
        fontWeight: 800,
        margin: 0,
        color: '#1a1a1a',
        letterSpacing: '-0.02em',
      }}>
        {store.name}
      </h1>

      {store.address && (
        <p style={{ fontSize: '12px', margin: '4px 0 0', color: mutedColor }}>
          {store.address}
        </p>
      )}
      {(store.phone || store.email) && (
        <p style={{ fontSize: '12px', margin: '2px 0 0', color: mutedColor }}>
          {store.phone}{store.phone && store.email ? ' | ' : ''}{store.email}
        </p>
      )}
      {store.taxId && (
        <p style={{ fontSize: '11px', margin: '2px 0 0', color: mutedColor }}>
          Tax ID: {store.taxId}
        </p>
      )}

      {/* Title section */}
      {title && (
        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: `2px solid ${accentColor}`,
        }}>
          <h2 style={{
            fontSize: variant === 'mobile' ? '16px' : '18px',
            fontWeight: 700,
            margin: 0,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '12px', margin: '3px 0 0', opacity: 0.6 }}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
