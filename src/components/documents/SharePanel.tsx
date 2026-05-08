import React, { useCallback, useState } from 'react';
import { MessageCircle, Mail, Download, Copy, Image, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DocumentType } from './types';
import { generateWhatsAppMessage, generateEmailSubject, generateEmailBody } from '../../lib/utils/documentTextGenerator';
import { downloadDocumentPDF } from '../../lib/utils/documentPdfGenerator';
import { generateDocumentImage } from '../../lib/utils/documentImageGenerator';

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
  const [sharing, setSharing] = useState<string | null>(null);

  const shareImage = useCallback(async (target: 'whatsapp' | 'email' | 'download') => {
    setSharing(target);
    try {
      const blob = await generateDocumentImage(type, data);
      const filename = `${type}-${data.documentNumber || 'document'}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // Try Web Share API (mobile — lets user pick WhatsApp, Email, etc.)
      if (target !== 'download' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${type.replace(/-/g, ' ')} #${data.documentNumber || ''}`,
          files: [file],
        });
        toast.success('Shared');
        return;
      }

      // Desktop fallback
      if (target === 'whatsapp') {
        // Download image + open WhatsApp with text message
        downloadBlob(blob, filename);
        const message = generateWhatsAppMessage(type, data);
        const phone = data.customer?.phone || data.vendor?.phone || '';
        const cleaned = phone.replace(/[^0-9+]/g, '');
        window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank');
        toast.success('Image downloaded — attach it in WhatsApp');
      } else if (target === 'email') {
        // Download image + open email client
        downloadBlob(blob, filename);
        const subject = generateEmailSubject(type, data);
        const body = generateEmailBody(type, data);
        const to = data.customer?.email || data.vendor?.email || '';
        window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        toast.success('Image downloaded — attach it in your email');
      } else {
        downloadBlob(blob, filename);
        toast.success('Image downloaded');
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast.error('Failed to generate image');
    } finally {
      setSharing(null);
    }
  }, [type, data]);

  const handleWhatsApp = useCallback(() => shareImage('whatsapp'), [shareImage]);
  const handleEmail = useCallback(() => shareImage('email'), [shareImage]);
  const handleDownloadImage = useCallback(() => shareImage('download'), [shareImage]);

  const handleDownloadPDF = useCallback(async () => {
    setSharing('pdf');
    try {
      await downloadDocumentPDF(type, data);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setSharing(null);
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

  const isLoading = (btn: string) => sharing === btn;

  return (
    <div className={className} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <button
        onClick={handleWhatsApp}
        disabled={!!sharing}
        style={{ ...buttonBase, background: '#25D366', color: '#fff', opacity: sharing && !isLoading('whatsapp') ? 0.6 : 1 }}
        title="Share via WhatsApp"
      >
        {isLoading('whatsapp') ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
        WhatsApp
      </button>
      <button
        onClick={handleEmail}
        disabled={!!sharing}
        style={{ ...buttonBase, background: '#0ea5e9', color: '#fff', opacity: sharing && !isLoading('email') ? 0.6 : 1 }}
        title="Share via Email"
      >
        {isLoading('email') ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
        Email
      </button>
      <button
        onClick={handleDownloadImage}
        disabled={!!sharing}
        style={{ ...buttonBase, background: '#F97316', color: '#fff', opacity: sharing && !isLoading('download') ? 0.6 : 1 }}
        title="Download as image"
      >
        {isLoading('download') ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
        Image
      </button>
      <button
        onClick={handleDownloadPDF}
        disabled={!!sharing}
        style={{ ...buttonBase, background: '#dc2626', color: '#fff', opacity: sharing && !isLoading('pdf') ? 0.6 : 1 }}
        title="Download PDF"
      >
        {isLoading('pdf') ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        PDF
      </button>
      <button
        onClick={handleCopy}
        disabled={!!sharing}
        style={{ ...buttonBase, background: '#6b7280', color: '#fff' }}
        title="Copy text"
      >
        <Copy size={16} />
        Copy
      </button>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
