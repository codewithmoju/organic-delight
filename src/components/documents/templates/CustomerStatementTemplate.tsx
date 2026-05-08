import React, { forwardRef } from 'react';
import type { CustomerStatementProps } from '../types';
import DocumentShell from './DocumentShell';
import DocumentHeader from './DocumentHeader';
import DocumentFooter from './DocumentFooter';
import DocumentPartyDetails from './DocumentPartyDetails';

function formatCurrency(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const CustomerStatementTemplate = forwardRef<HTMLDivElement, CustomerStatementProps>((props, ref) => {
  const { variant, colorMode = 'color', store, documentNumber, date, currency, notes, customer, ledgerEntries, openingBalance, closingBalance, periodStart, periodEnd } = props;
  const isThermal = variant === 'thermal';
  const cm = isThermal ? 'bw' : colorMode;
  const isColor = cm === 'color';

  const formattedDate = date instanceof Date ? date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : String(date);
  const fmtPeriod = `${periodStart.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const accentColor = isColor ? '#F97316' : '#000';
  const altRowBg = isColor ? '#fafafa' : '#f5f5f5';
  const debitColor = isColor ? '#EF4444' : '#000';
  const creditColor = isColor ? '#16A34A' : '#000';

  return (
    <DocumentShell ref={ref} variant={variant} colorMode={cm}>
      <DocumentHeader variant={variant} colorMode={cm} store={store} title="Customer Statement" />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isThermal ? '10px' : '12px', margin: isThermal ? '4px 0' : '8px 0', opacity: 0.7 }}>
        <span>Statement: {documentNumber}</span>
        <span>{formattedDate}</span>
      </div>
      <div style={{ fontSize: isThermal ? '10px' : '12px', opacity: 0.7, marginBottom: isThermal ? '2px' : '8px' }}>
        Period: {fmtPeriod}
      </div>

      <DocumentPartyDetails variant={variant} colorMode={cm} party={customer} label="Account" />

      {/* Summary Cards */}
      {!isThermal && (
        <div style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
          {[
            { label: 'Opening Balance', value: formatCurrency(openingBalance, currency), color: isColor ? '#6b7280' : '#333' },
            { label: 'Closing Balance', value: formatCurrency(closingBalance, currency), color: closingBalance > 0 ? (isColor ? '#DC2626' : '#000') : (isColor ? '#16A34A' : '#000') },
          ].map(card => (
            <div key={card.label} style={{
              flex: 1, padding: '14px', borderRadius: '8px',
              backgroundColor: '#f9fafb',
              borderLeft: `4px solid ${card.color}`,
            }}>
              <div style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{card.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: card.color, marginTop: '4px' }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {isThermal && (
        <div style={{ margin: '4px 0', borderTop: '2px solid #000', borderBottom: '1px dashed #000', padding: '4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>Opening:</span><span>{formatCurrency(openingBalance, currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
            <span>Closing:</span><span>{formatCurrency(closingBalance, currency)}</span>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {!isThermal ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
              <th style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 700, fontSize: '11px', color: '#374151' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 700, fontSize: '11px', color: '#374151' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 700, fontSize: '11px', color: '#374151' }}>Debit</th>
              <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 700, fontSize: '11px', color: '#374151' }}>Credit</th>
              <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 700, fontSize: '11px', color: '#374151' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.map((entry, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? '#fff' : altRowBg }}>
                <td style={{ padding: '8px 6px' }}>{entry.date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</td>
                <td style={{ padding: '8px 6px' }}>{entry.description}</td>
                <td style={{ textAlign: 'right', padding: '8px 6px', color: entry.debit > 0 ? debitColor : undefined, fontWeight: entry.debit > 0 ? 600 : 400 }}>
                  {entry.debit > 0 ? formatCurrency(entry.debit, currency) : '-'}
                </td>
                <td style={{ textAlign: 'right', padding: '8px 6px', color: entry.credit > 0 ? creditColor : undefined, fontWeight: entry.credit > 0 ? 600 : 400 }}>
                  {entry.credit > 0 ? formatCurrency(entry.credit, currency) : '-'}
                </td>
                <td style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 700, color: '#1a1a1a' }}>
                  {formatCurrency(entry.balance, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ margin: '4px 0' }}>
          {ledgerEntries.map((entry, i) => (
            <div key={i} style={{ padding: '2px 0', borderBottom: '1px dotted #ccc', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{entry.date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(entry.balance, currency)}</span>
              </div>
              <div style={{ opacity: 0.6 }}>{entry.description}</div>
            </div>
          ))}
        </div>
      )}

      <DocumentFooter variant={variant} colorMode={cm} notes={notes} />
    </DocumentShell>
  );
});

CustomerStatementTemplate.displayName = 'CustomerStatementTemplate';
export default CustomerStatementTemplate;
