import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, File, ChevronDown } from 'lucide-react';
import { exportToCSV } from '../../lib/utils/csvExport';
import { exportToExcel } from '../../lib/utils/excelExport';
import { exportTableToPDF } from '../../lib/utils/pdfExport';
import { toast } from 'sonner';

interface ExportMenuProps {
  /** Data rows to export */
  getData: () => Record<string, any>[];
  /** Base filename (no extension) */
  filename: string;
  /** Optional title shown in PDF header */
  title?: string;
  /** Which formats to show — defaults to all three */
  formats?: ('csv' | 'excel' | 'pdf')[];
  /** Button size variant */
  size?: 'sm' | 'md';
}

const FORMAT_CONFIG = {
  csv:   { label: 'Export CSV',   icon: FileText,        ext: 'CSV'   },
  excel: { label: 'Export Excel', icon: FileSpreadsheet, ext: 'Excel' },
  pdf:   { label: 'Export PDF',   icon: File,            ext: 'PDF'   },
};

export default function ExportMenu({
  getData,
  filename,
  title,
  formats = ['csv', 'excel', 'pdf'],
  size = 'sm',
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const data = getData();
    if (!data.length) {
      toast.error('No data to export');
      setOpen(false);
      return;
    }
    try {
      if (format === 'csv')   exportToCSV(data, filename);
      if (format === 'excel') exportToExcel(data, filename);
      if (format === 'pdf')   exportTableToPDF(data, filename, title);
      toast.success(`Exported as ${FORMAT_CONFIG[format].ext}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export as ${FORMAT_CONFIG[format].ext}`);
    }
    setOpen(false);
  };

  const btnCls = size === 'sm'
    ? 'flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground transition-colors'
    : 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-semibold text-foreground transition-colors';

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} className={btnCls}>
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden"
          >
            {formats.map(fmt => {
              const cfg = FORMAT_CONFIG[fmt];
              const Icon = cfg.icon;
              return (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {cfg.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
