import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X, Plus } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    searchable?: boolean;
    className?: string;
    icon?: React.ReactNode;
    creatable?: boolean;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    label,
    error,
    disabled = false,
    searchable = false,
    className = '',
    icon,
    creatable = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If creatable, and search query doesn't match any existing option exactly, show it as an option
    const showCreateOption = creatable && searchQuery && !options.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is inside the trigger container
            if (containerRef.current && containerRef.current.contains(event.target as Node)) {
                return;
            }
            // Check if click is inside the content portal
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            setIsOpen(false);
        };

        const handleScroll = (event: Event) => {
            // If scrolling inside the dropdown, don't close
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            // If scrolling the page, close the dropdown (as it's fixed position and would detach)
            if (isOpen) setIsOpen(false);
        };

        const handleResize = () => {
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    // Calculate position
    const getDropdownStyle = () => {
        if (!containerRef.current) return {};
        const rect = containerRef.current.getBoundingClientRect();
        return {
            position: 'fixed' as const,
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
            zIndex: 9999
        };
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-foreground/80 mb-2">
                    {label}
                </label>
            )}

            <motion.button
                type="button"
                whileTap={!disabled ? { scale: 0.98 } : {}}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full h-12 px-4 flex items-center justify-between rounded-xl border transition-all duration-200 ${error
                    ? 'bg-red-50/50 border-red-500/50 text-red-900 dark:bg-red-900/10 dark:text-red-200'
                    : isOpen
                        ? 'bg-background border-primary/50 ring-4 ring-primary/10'
                        : 'bg-secondary/50 border-transparent hover:bg-secondary/80'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
                    {selectedOption ? (
                        <span className="font-medium text-foreground truncate">
                            {selectedOption.icon && <span className="mr-2 inline-block align-middle">{selectedOption.icon}</span>}
                            {selectedOption.label}
                        </span>
                    ) : (
                        value && creatable ? (
                            <span className="font-medium text-foreground truncate">{value}</span>
                        ) : (
                            <span className="text-muted-foreground truncate">{placeholder}</span>
                        )
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </motion.button>

            {error && (
                <p className="text-error-500 text-xs mt-1 font-medium ml-1">{error}</p>
            )}

            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={getDropdownStyle()}
                        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(searchable || creatable) && (
                            <div className="p-2 border-b border-border">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={creatable ? "Search or type new..." : "Search..."}
                                        className="w-full h-9 pl-9 pr-8 bg-secondary/50 rounded-lg text-sm border-none focus:ring-0 text-foreground placeholder-muted-foreground"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full"
                                        >
                                            <X className="w-3 h-3 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                            {showCreateOption && (
                                <motion.button
                                    type="button"
                                    onClick={() => handleSelect(searchQuery)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 font-medium border-b border-dashed border-border mb-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create "{searchQuery}"</span>
                                </motion.button>
                            )}

                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <motion.button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${value === option.value
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-foreground hover:bg-secondary'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            {option.icon}
                                            <span>{option.label}</span>
                                        </div>
                                        {value === option.value && (
                                            <Check className="w-4 h-4 flex-shrink-0" />
                                        )}
                                    </motion.button>
                                ))
                            ) : (
                                !showCreateOption && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No options found
                                    </div>
                                )
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
