import React, { useCallback } from 'react';
import { MessageCircle, Mail, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { DocumentType } from './types';
import { generateWhatsAppMessage, generateEmailSubject, generateEmailBody } from '../../lib/utils/documentTextGenerator';
import { downloadDocumentPDF } from '../../lib/utils/documentPdfGenerator';

interface SharePanelProps {
  type: DocumentType;
  data: any;
  className?: string;
}

const buttonBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '13px',
  transition: 'opacity 0.2s',
};

export default function SharePanel({ type, data, className }: SharePanelProps) {
  const handleWhatsApp = useCallback(() => {
    const message = generateWhatsAppMessage(type, data);
    const phone = data.customer?.phone || data.vendor?.phone || '';
    const cleaned = phone.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }, [type, data]);

  const handleEmail = useCallback(() => {
    const subject = generateEmailSubject(type, data);
    const body = generateEmailBody(type, data);
    const to = data.customer?.email || data.vendor?.email || '';
    const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  }, [type, data]);

  const handleDownloadPDF = useCallback(() => {
    try {
      downloadDocumentPDF(type, data);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  }, [type, data]);

  const handleCopy = useCallback(async () => {
    const text = generateWhatsAppMessage(type, data);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, [type, data]);

  return (
    <div className={className} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <button
        onClick={handleWhatsApp}
        style={{ ...buttonBase, background: '#25D366', color: '#fff' }}
        title="Share via WhatsApp"
      >
        <MessageCircle size={16} />
        WhatsApp
      </button>
      <button
        onClick={handleEmail}
        style={{ ...buttonBase, background: '#0ea5e9', color: '#fff' }}
        title="Share via Email"
      >
        <Mail size={16} />
        Email
      </button>
      <button
        onClick={handleDownloadPDF}
        style={{ ...buttonBase, background: '#dc2626', color: '#fff' }}
        title="Download PDF"
      >
        <Download size={16} />
        PDF
      </button>
      <button
        onClick={handleCopy}
        style={{ ...buttonBase, background: '#6b7280', color: '#fff' }}
        title="Copy text"
      >
        <Copy size={16} />
        Copy
      </button>
    </div>
  );
}
