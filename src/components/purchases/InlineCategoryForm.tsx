import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createCategory } from '../../lib/api/categories';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';

interface InlineCategoryFormProps {
    onCategoryCreated: (categoryId: string, categoryName: string) => void;
    onCancel: () => void;
}

export default function InlineCategoryForm({ onCategoryCreated, onCancel }: InlineCategoryFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const user = useAuthStore(state => state.user);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Category name is required');
            return;
        }
        setIsSubmitting(true);
        try {
            const category = await createCategory({
                name: name.trim(),
                description: description.trim(),
                created_by: user?.uid || 'unknown'
            });
            toast.success('Category created');
            onCategoryCreated(category.id, category.name);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create category');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">New Category</h4>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 rounded-lg hover:bg-secondary transition-colors text-foreground-muted hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Category name *"
                        className="w-full h-9 px-3 rounded-lg bg-background border border-border/60 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        maxLength={50}
                        autoFocus
                    />
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full h-9 px-3 rounded-lg bg-background border border-border/60 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        maxLength={200}
                    />
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn-secondary text-xs px-3 py-1.5 h-8"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="btn-primary text-xs px-3 py-1.5 h-8 flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {isSubmitting
                                ? <LoadingSpinner size="sm" color="white" />
                                : <><Check className="w-3 h-3" />Create</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
