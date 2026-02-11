import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';
import { HeldCart } from '../../lib/hooks/usePOSCart';

interface HeldCartsModalProps {
    isOpen: boolean;
    onClose: () => void;
    heldCarts: HeldCart[];
    onRestore: (id: string) => void;
    onDiscard: (id: string) => void;
}

export default function HeldCartsModal({
    isOpen,
    onClose,
    heldCarts,
    onRestore,
    onDiscard
}: HeldCartsModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-2xl bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border/50 flex items-center justify-between bg-card z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-warning-500/20 text-warning-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Held Transactions</h3>
                                <p className="text-foreground-muted text-sm">Resume pending sales</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground-muted hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* List */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        {heldCarts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingCart className="w-8 h-8 text-foreground-muted" />
                                </div>
                                <h3 className="text-foreground font-medium text-lg">No held carts</h3>
                                <p className="text-foreground-muted">Use the Hold button in the cart to suspend transactions.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {heldCarts.map((cart) => (
                                    <motion.div
                                        key={cart.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group bg-muted/20 border border-border/50 rounded-xl p-4 hover:border-primary-500/30 hover:bg-muted/40 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-sm text-foreground-muted">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{formatDate(new Date(cart.timestamp))}</span>
                                                <span className="w-1 h-1 bg-border rounded-full mx-1" />
                                                <span className="text-xs font-mono opacity-70">#{cart.id.slice(-4)}</span>
                                            </div>
                                            <span className="text-lg font-bold text-primary-400">
                                                {formatCurrency(cart.total)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                {cart.customer ? (
                                                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                        <User className="w-4 h-4 text-accent-400" />
                                                        {cart.customer.name}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-foreground-muted text-sm">
                                                        <User className="w-4 h-4" />
                                                        Walk-in Customer
                                                    </div>
                                                )}
                                                <div className="text-xs text-foreground-muted pl-5.5">
                                                    {cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
                                                    {cart.note && <span className="text-warning-400 ml-2 italic">Note: {cart.note}</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => onDiscard(cart.id)}
                                                    className="p-2.5 rounded-lg text-error-400 hover:bg-error-500/10 hover:text-error-500 transition-colors"
                                                    title="Discard"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </motion.button>

                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        onRestore(cart.id);
                                                        onClose();
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white font-medium shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
                                                >
                                                    Available
                                                    <ArrowRight className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
