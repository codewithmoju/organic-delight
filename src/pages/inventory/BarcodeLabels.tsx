import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Barcode, QrCode, Printer, Search, Package, Download, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { getItems } from '../../lib/api/items';
import { Item } from '../../lib/types';
import { drawBarcode, drawQRCode, printLabels, LabelData } from '../../lib/utils/barcodeGenerator';
import { formatCurrency } from '../../lib/utils/notifications';

// ── Barcode preview canvas ────────────────────────────────────────────────────
function BarcodeCanvas({ value, type }: { value: string; type: 'barcode' | 'qr' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    if (type === 'barcode') {
      try { drawBarcode(canvasRef.current, value, { barWidth: 1.5, height: 50, showText: true }); }
      catch { /* invalid chars */ }
    } else {
      drawQRCode(canvasRef.current, value, 120);
    }
  }, [value, type]);

  if (!value) return (
    <div className="w-full h-16 bg-secondary/30 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
      No barcode
    </div>
  );

  return <canvas ref={canvasRef} className="max-w-full rounded-lg" />;
}

// ── Item row ──────────────────────────────────────────────────────────────────
function ItemRow({ item, qty, onQtyChange, onToggle, selected }: {
  item: Item; qty: number; onQtyChange: (n: number) => void;
  onToggle: () => void; selected: boolean;
}) {
  const code = (item as any).barcode || item.sku || item.id.slice(0, 12);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
        selected ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/40 hover:border-border'
      }`}
      onClick={onToggle}
    >
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        selected ? 'bg-primary border-primary' : 'border-border/60'
      }`}>
        {selected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{code}</p>
      </div>

      {selected && (
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onQtyChange(Math.max(1, qty - 1))}
            className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
          <button onClick={() => onQtyChange(qty + 1)}
            className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BarcodeLabels() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({}); // itemId -> qty
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const [previewType, setPreviewType] = useState<'barcode' | 'qr'>('barcode');
  const [labelsPerRow, setLabelsPerRow] = useState(3);

  useEffect(() => {
    getItems()
      .then(r => setItems(r.items))
      .catch(() => toast.error('Failed to load items'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    ((i as any).barcode || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev[id]) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: 1 };
    });
  };

  const selectedItems = items.filter(i => selected[i.id]);
  const totalLabels = Object.values(selected).reduce((s, q) => s + q, 0);

  const handlePrint = () => {
    if (!selectedItems.length) { toast.error('Select at least one item'); return; }
    const labels: LabelData[] = [];
    selectedItems.forEach(item => {
      const qty = selected[item.id] || 1;
      for (let i = 0; i < qty; i++) {
        labels.push({
          name: item.name,
          sku: item.sku,
          barcode: (item as any).barcode || item.sku || item.id.slice(0, 12),
          price: (item as any).sale_rate || item.unit_price,
        });
      }
    });
    printLabels(labels, labelsPerRow);
    toast.success(`Printing ${labels.length} label${labels.length !== 1 ? 's' : ''}`);
  };

  const downloadCanvas = (type: 'barcode' | 'qr') => {
    if (!previewItem) return;
    const canvas = document.createElement('canvas');
    const code = (previewItem as any).barcode || previewItem.sku || previewItem.id.slice(0, 12);
    const promise = type === 'barcode'
      ? Promise.resolve(drawBarcode(canvas, code, { barWidth: 2, height: 80 }))
      : drawQRCode(canvas, code, 200);
    promise.then(() => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${previewItem.name}-${type}.png`;
      a.click();
      toast.success(`Downloaded ${type}`);
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="app-page-title flex items-center gap-2">
            <Barcode className="w-6 h-6 text-primary" />
            Barcode & QR Labels
          </h1>
          <p className="app-page-subtitle">Generate and print barcodes or QR codes for inventory items</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Labels/row:</span>
            {[2, 3, 4].map(n => (
              <button key={n} onClick={() => setLabelsPerRow(n)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${labelsPerRow === n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={handlePrint}
            disabled={!selectedItems.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print {totalLabels > 0 ? `(${totalLabels})` : ''}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: item list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search items, SKU, barcode..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Selection summary */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs">
              <span className="text-primary font-medium">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected · {totalLabels} label{totalLabels !== 1 ? 's' : ''}</span>
              <button onClick={() => setSelected({})} className="text-primary hover:underline">Clear all</button>
            </div>
          )}

          {/* Items */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/60">
              <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No items found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {filtered.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  qty={selected[item.id] || 1}
                  onQtyChange={n => setSelected(prev => ({ ...prev, [item.id]: n }))}
                  onToggle={() => { toggle(item.id); setPreviewItem(item); }}
                  selected={!!selected[item.id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: preview */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4">Preview</h3>

            {/* Type toggle */}
            <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
              {(['barcode', 'qr'] as const).map(t => (
                <button key={t} onClick={() => setPreviewType(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${previewType === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t === 'barcode' ? <Barcode className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
                  {t === 'barcode' ? 'Barcode' : 'QR Code'}
                </button>
              ))}
            </div>

            {previewItem ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">{previewItem.name}</p>
                <div className="flex justify-center p-3 bg-white rounded-xl border border-border/40">
                  <BarcodeCanvas
                    value={(previewItem as any).barcode || previewItem.sku || previewItem.id.slice(0, 12)}
                    type={previewType}
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {previewItem.sku && <p>SKU: <span className="font-mono text-foreground">{previewItem.sku}</span></p>}
                  {(previewItem as any).barcode && <p>Barcode: <span className="font-mono text-foreground">{(previewItem as any).barcode}</span></p>}
                  {((previewItem as any).sale_rate || previewItem.unit_price) && (
                    <p>Price: <span className="font-semibold text-foreground">{formatCurrency((previewItem as any).sale_rate || previewItem.unit_price || 0)}</span></p>
                  )}
                </div>
                <button onClick={() => downloadCanvas(previewType)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground transition-colors">
                  <Download className="w-4 h-4" />
                  Download {previewType === 'barcode' ? 'Barcode' : 'QR'} PNG
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Select an item to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
