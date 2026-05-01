import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6b7280',
];

interface InlineCategoryFormProps {
  initialData?: { id?: string; name?: string; description?: string; color?: string };
  onSubmit: (data: { name: string; description: string; color: string; created_by: string }) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function InlineCategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}: InlineCategoryFormProps) {
  const { t } = useTranslation();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || CATEGORY_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => { nameInputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showColorPicker) setShowColorPicker(false);
        else onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel, showColorPicker]);

  useEffect(() => {
    if (!showColorPicker) return;
    const handleOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showColorPicker]);

  const openColorPicker = () => {
    if (colorButtonRef.current) {
      const r = colorButtonRef.current.getBoundingClientRect();
      // On mobile keep it within viewport
      const pickerWidth = 224;
      const left = Math.min(r.left, window.innerWidth - pickerWidth - 8);
      setDropdownPos({ top: r.bottom + 6, left: Math.max(8, left), width: pickerWidth });
    }
    setShowColorPicker(v => !v);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('categories.form.nameRequired', 'Category name is required'));
      triggerShake();
      nameInputRef.current?.focus();
      return;
    }
    if (name.trim().length < 2) {
      setError(t('categories.form.nameTooShort', 'Name must be at least 2 characters'));
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    try {
      const user = useAuthStore.getState().user;
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        color,
        created_by: user?.uid || 'unknown',
      });
    } catch (err: any) {
      setError(err.message || t('common.error', 'An error occurred'));
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Shared color picker portal ──────────────────────────────────────────
  const ColorPickerPortal = () =>
    showColorPicker
      ? createPortal(
          <div
            ref={colorPickerRef}
            className="fixed z-[99999] p-3 rounded-2xl bg-card border border-border/60 shadow-2xl"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            <p className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wider">
              Pick a colour
            </p>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setColor(c); setShowColorPicker(false); }}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 active:scale-95 ${
                    color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>,
          document.body
        )
      : null;

  // ── EDIT mode — compact vertical layout inside a card ──────────────────
  if (isEdit) {
    return (
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, x: shake ? [0, -5, 5, -5, 5, 0] : 0 }}
        className="space-y-2.5"
      >
        {/* Color + name row */}
        <div className="flex items-center gap-2">
          <button
            ref={colorButtonRef}
            type="button"
            onClick={openColorPicker}
            className="w-9 h-9 rounded-xl border-2 border-border/60 hover:border-primary/50 transition-colors flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
            aria-label="Pick colour"
          >
            <ChevronDown className="w-3.5 h-3.5 text-white drop-shadow" />
          </button>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('categories.form.namePlaceholder', 'Category name')}
            className={`flex-1 h-9 px-3 rounded-xl bg-background border text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all ${
              error ? 'border-error-500 ring-2 ring-error-500/20' : 'border-border/60'
            }`}
            disabled={isSubmitting}
            maxLength={50}
          />
        </div>

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('categories.form.descriptionPlaceholder', 'Description (optional)')}
          className="w-full h-9 px-3 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          disabled={isSubmitting}
          maxLength={200}
        />

        {error && <p className="text-xs text-error-500">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? <LoadingSpinner size="sm" color="white" /> : <><Check className="w-3.5 h-3.5" />{t('common.save', 'Save')}</>}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary py-2 px-3 text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ColorPickerPortal />
      </motion.form>
    );
  }

  // ── ADD mode — full-width form above the grid ───────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, x: shake ? [0, -8, 8, -8, 8, 0] : 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Color button */}
          <button
            ref={colorButtonRef}
            type="button"
            onClick={openColorPicker}
            className="w-11 h-11 rounded-xl border-2 border-border/60 hover:border-primary/50 transition-colors flex items-center justify-center flex-shrink-0 shadow-sm self-start sm:self-auto"
            style={{ backgroundColor: color }}
            aria-label="Pick colour"
          >
            <Palette className="w-4 h-4 text-white drop-shadow" />
          </button>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('categories.form.namePlaceholder', 'Category name (e.g., Electronics)')}
              className={`w-full h-11 px-4 rounded-xl bg-background border text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all ${
                error ? 'border-error-500 ring-2 ring-error-500/20' : 'border-border/60'
              }`}
              disabled={isSubmitting}
              maxLength={50}
            />
          </div>

          {/* Description — visible on all sizes now */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('categories.form.descriptionPlaceholder', 'Description (optional)')}
              className="w-full h-11 px-4 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="btn-primary h-11 px-5 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting
                ? <LoadingSpinner size="sm" color="white" />
                : <><Check className="w-4 h-4" /><span className="hidden sm:inline">{t('common.add', 'Add')}</span></>
              }
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn-secondary h-11 px-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-xs text-error-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <ColorPickerPortal />
    </motion.div>
  );
}
