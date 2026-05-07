const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const ESCAPE_RE = /[&<>"']/g;

/** Escape HTML special characters to prevent XSS when interpolating into HTML strings. */
export function escapeHtml(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value).replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch]);
}
