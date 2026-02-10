import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';

// Predefined color palette for categories
const CATEGORY_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#a855f7', // Purple
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#eab308', // Yellow
    '#84cc16', // Lime
    '#22c55e', // Green
    '#10b981', // Emerald
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#0ea5e9', // Sky
    '#3b82f6', // Blue
    '#6b7280', // Gray
];

interface InlineCategoryFormProps {
    initialData?: {
        id?: string;
        name?: string;
        description?: string;
        color?: string;
    };
    onSubmit: (data: { name: string; description: string; color: string; created_by: string }) => Promise<void>;
    onCancel: () => void;
    isEdit?: boolean;
}

export default function InlineCategoryForm({
    initialData,
    onSubmit,
    onCancel,
    isEdit = false
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
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    // Auto-focus on name input
    useEffect(() => {
        if (nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, []);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showColorPicker) {
                    setShowColorPicker(false);
                } else {
                    onCancel();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel, showColorPicker]);

    // Close color picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
                setShowColorPicker(false);
            }
        };
        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showColorPicker]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Validation
        if (!name.trim()) {
            setError(t('categories.validation.nameRequired', 'Category name is required'));
            setShake(true);
            setTimeout(() => setShake(false), 500);
            nameInputRef.current?.focus();
            return;
        }

        if (name.trim().length < 2) {
            setError(t('categories.validation.nameTooShort', 'Name must be at least 2 characters'));
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        setIsSubmitting(true);

        try {
            const user = useAuthStore.getState().user;
            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                color,
                created_by: user?.uid || 'unknown'
            });
        } catch (err: any) {
            setError(err.message || t('common.error', 'An error occurred'));
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Compact vertical layout for editing inside cards
    if (isEdit) {
        return (
            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{
                    opacity: 1,
                    x: shake ? [0, -5, 5, -5, 5, 0] : 0
                }}
                className="space-y-3"
            >
                {/* Color selector row */}
                <div className="flex items-center gap-2">
                    <button
                        ref={colorButtonRef}
                        type="button"
                        onClick={() => {
                            if (colorButtonRef.current) {
                                const rect = colorButtonRef.current.getBoundingClientRect();
                                setDropdownPosition({
                                    top: rect.bottom + 8,
                                    left: rect.left
                                });
                            }
                            setShowColorPicker(!showColorPicker);
                        }}
                        className="w-10 h-10 rounded-lg border-2 border-dark-600 hover:border-primary-500 transition-colors flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color }}
                    >
                        <ChevronDown className="w-4 h-4 text-white drop-shadow-lg" />
                    </button>

                    {/* Portal-based color picker dropdown */}
                    {showColorPicker && createPortal(
                        <div
                            ref={colorPickerRef}
                            className="fixed p-3 rounded-xl bg-dark-800 border border-dark-600 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                            style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                                zIndex: 99999,
                                minWidth: '220px'
                            }}
                        >
                            <div className="grid grid-cols-6 gap-2">
                                {CATEGORY_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setColor(c);
                                            setShowColorPicker(false);
                                        }}
                                        className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''
                                            }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>,
                        document.body
                    )}
                </div>

                {/* Name input */}
                <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('categories.form.namePlaceholder', 'Category name')}
                    className={`w-full input-dark text-sm ${error ? 'ring-2 ring-error-500' : ''}`}
                    disabled={isSubmitting}
                    maxLength={50}
                />

                {/* Description input */}
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('categories.form.descriptionPlaceholder', 'Description (optional)')}
                    className="w-full input-dark text-sm"
                    disabled={isSubmitting}
                    maxLength={200}
                />

                {/* Error message */}
                {error && (
                    <p className="text-xs text-error-400">{error}</p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting || !name.trim()}
                        className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <LoadingSpinner size="sm" color="white" />
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                {t('common.save', 'Save')}
                            </>
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="btn-secondary py-2 px-4 text-sm"
                    >
                        <X className="w-4 h-4" />
                    </motion.button>
                </div>
            </motion.form>
        );
    }

    // Horizontal layout for adding new categories (top bar)
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
                opacity: 1,
                height: 'auto',
                x: shake ? [0, -10, 10, -10, 10, 0] : 0
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-visible"
        >
            <form onSubmit={handleSubmit} className="card-dark p-4 sm:p-5 mb-6 overflow-visible">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Color picker button */}
                    <div className="relative">
                        <button
                            ref={colorButtonRef}
                            type="button"
                            onClick={() => {
                                if (colorButtonRef.current) {
                                    const rect = colorButtonRef.current.getBoundingClientRect();
                                    setDropdownPosition({
                                        top: rect.bottom + 8,
                                        left: rect.left
                                    });
                                }
                                setShowColorPicker(!showColorPicker);
                            }}
                            className="w-12 h-12 rounded-xl border-2 border-dark-600 hover:border-primary-500 transition-colors flex items-center justify-center"
                            style={{ backgroundColor: color }}
                        >
                            <Palette className="w-5 h-5 text-white drop-shadow-lg" />
                        </button>
                    </div>

                    {/* Color picker dropdown - rendered via portal to body */}
                    {showColorPicker && createPortal(
                        <div
                            ref={colorPickerRef}
                            className="fixed p-3 rounded-xl bg-dark-800 border border-dark-600 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                            style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                                zIndex: 99999,
                                minWidth: '220px'
                            }}
                        >
                            <div className="grid grid-cols-6 gap-2">
                                {CATEGORY_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setColor(c);
                                            setShowColorPicker(false);
                                        }}
                                        className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''
                                            }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>,
                        document.body
                    )}

                    {/* Name input */}
                    <div className="flex-1 min-w-0">
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('categories.form.namePlaceholder', 'Category name (e.g., Electronics, Groceries)')}
                            className={`w-full input-dark ${error ? 'ring-2 ring-error-500' : ''}`}
                            disabled={isSubmitting}
                            maxLength={50}
                        />
                    </div>

                    {/* Description input */}
                    <div className="flex-1 min-w-0 hidden sm:block">
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('categories.form.descriptionPlaceholder', 'Brief description (optional)')}
                            className="w-full input-dark"
                            disabled={isSubmitting}
                            maxLength={200}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="btn-primary px-5 py-2.5 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <LoadingSpinner size="sm" color="white" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    {t('common.add', 'Add')}
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="btn-secondary px-4 py-2.5"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-3 text-sm text-error-400"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>
            </form>
        </motion.div>
    );
}
