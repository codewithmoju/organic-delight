import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
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

        if (!name.trim() || !description.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const category = await createCategory({
                name: name.trim(),
                description: description.trim(),
                created_by: user?.uid || 'unknown'
            });

            toast.success('Category created successfully');
            onCategoryCreated(category.id, category.name);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create category');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-dark-800/50 border border-primary-500/30 rounded-lg p-4 mb-4"
        >
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-primary-400">Create New Category</h4>
                <button
                    onClick={onCancel}
                    className="p-1 hover:bg-dark-700 rounded transition-colors"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Category name (e.g., Smartphones)"
                        className="w-full input-dark text-sm"
                        maxLength={50}
                        required
                    />
                </div>

                <div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description..."
                        className="w-full input-dark text-sm resize-none"
                        rows={2}
                        maxLength={200}
                        required
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-secondary text-sm px-3 py-1.5"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary text-sm px-3 py-1.5 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" color="white" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-3 h-3" />
                                Create Category
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
