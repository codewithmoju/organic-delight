import React from 'react';
import type { DocumentVariant, DocumentColorMode, DocumentPartyInfo } from '../types';

interface DocumentPartyDetailsProps {
  variant: DocumentVariant;
  colorMode?: DocumentColorMode;
  party: DocumentPartyInfo;
  label?: string;
}

export default function DocumentPartyDetails({ variant, colorMode = 'color', party, label = 'Customer' }: DocumentPartyDetailsProps) {
  const isThermal = variant === 'thermal';
  const isColor = colorMode === 'color';

  if (isThermal) {
    return (
      <div style={{ margin: '4px 0' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>{label}:</div>
        <p style={{ fontWeight: 600, fontSize: '12px', margin: '0 0 1px' }}>{party.name}</p>
        {party.phone && <p style={{ fontSize: '10px', margin: '0 0 1px', opacity: 0.7 }}>{party.phone}</p>}
        {party.address && <p style={{ fontSize: '10px', margin: 0, opacity: 0.7 }}>{party.address}</p>}
      </div>
    );
  }

  const bg = isColor ? '#F0FDFA' : '#f5f5f5';
  const borderColor = isColor ? '#0D9488' : '#000';
  const labelColor = isColor ? '#0D9488' : '#000';

  return (
    <div style={{
      margin: '12px 0', padding: '14px',
      borderRadius: '8px', backgroundColor: bg,
      borderLeft: `4px solid ${borderColor}`,
    }}>
      <h3 style={{
        fontSize: '12px', fontWeight: 700, margin: '0 0 8px',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: labelColor,
      }}>
        {label}
      </h3>
      <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 3px' }}>{party.name}</p>
      {party.company && <p style={{ fontSize: '13px', margin: '0 0 2px', opacity: 0.7 }}>{party.company}</p>}
      {party.phone && <p style={{ fontSize: '13px', margin: '0 0 2px', opacity: 0.7 }}>{party.phone}</p>}
      {party.email && <p style={{ fontSize: '13px', margin: '0 0 2px', opacity: 0.7 }}>{party.email}</p>}
      {party.address && <p style={{ fontSize: '13px', margin: 0, opacity: 0.7 }}>{party.address}</p>}
    </div>
  );
}
