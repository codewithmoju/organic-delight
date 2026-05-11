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
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If creatable, and search query doesn't match any existing option exactly, show it as an option
    const showCreateOption = creatable && searchQuery && !options.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase());

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && containerRef.current.contains(event.target as Node)) {
                return;
            }
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            setIsOpen(false);
        };

        const handleScroll = (event: Event) => {
            if (isMobile) return; // Don't close on scroll in bottom sheet
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            if (isOpen) setIsOpen(false);
        };

        const handleResize = () => {
            // Only close on resize if we are not on mobile (to prevent keyboard pop closing it)
            if (isOpen && window.innerWidth >= 768) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, isMobile]);

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
        if (isMobile) return { zIndex: 9999 };
        if (!containerRef.current) return {};
        const rect = containerRef.current.getBoundingClientRect();
        
        // Check space
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 300;
        
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
             return {
                position: 'fixed' as const,
                bottom: window.innerHeight - rect.top + 8,
                left: rect.left,
                width: rect.width,
                zIndex: 9999
            };
        }

        return {
            position: 'fixed' as const,
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
            zIndex: 9999
        };
    };

    // Use a simpler tween animation for better mobile performance
    const sheetTransition = isMobile 
        ? { type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] } 
        : { duration: 0.2 };

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

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {isMobile && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="fixed inset-0 bg-black/60 z-[9998]"
                                    onClick={() => setIsOpen(false)}
                                />
                            )}
                            <motion.div
                                ref={dropdownRef}
                                initial={isMobile ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.95 }}
                                animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                                exit={isMobile ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.95 }}
                                transition={sheetTransition}
                                style={isMobile ? { zIndex: 9999, willChange: 'transform' } : getDropdownStyle()}
                                className={isMobile 
                                    ? "fixed bottom-0 left-0 right-0 bg-background rounded-t-[2rem] border-t border-black/5 dark:border-white/10 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[85vh]"
                                    : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden"}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {isMobile && (
                                    <div className="flex flex-col items-center pt-4 pb-2 px-4 shrink-0 bg-background z-10 sticky top-0 border-b border-border/50">
                                        <div className="w-12 h-1.5 bg-border rounded-full mb-4" />
                                        <div className="w-full flex justify-between items-center mb-2">
                                            <h3 className="font-semibold text-lg text-foreground">
                                                {label || placeholder}
                                            </h3>
                                            <button 
                                                onClick={() => setIsOpen(false)}
                                                className="p-2 -mr-2 bg-secondary/50 rounded-full text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {(searchable || creatable) && (
                                    <div className={`p-2 border-b border-border shrink-0 ${isMobile ? 'px-4 bg-background border-none' : ''}`}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder={creatable ? "Search or type new..." : "Search..."}
                                                className={`w-full ${isMobile ? 'h-12 pl-10 bg-secondary/30 rounded-xl text-base' : 'h-9 pl-9 pr-8 bg-secondary/50 rounded-lg text-sm'} border-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground`}
                                                autoFocus={!isMobile}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full"
                                                >
                                                    <X className={`text-muted-foreground ${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={`${isMobile ? 'overflow-y-auto p-2 pb-8 overscroll-contain' : 'max-h-60 overflow-y-auto p-1'} scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex-1`}>
                                    {showCreateOption && (
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(searchQuery)}
                                            className={`w-full flex items-center gap-3 ${isMobile ? 'px-4 py-4 rounded-xl text-base' : 'px-3 py-2 rounded-lg text-sm'} text-primary hover:bg-primary/10 font-medium border-b border-dashed border-border mb-1 transition-colors`}
                                        >
                                            <Plus className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                                            <span>Create "{searchQuery}"</span>
                                        </button>
                                    )}

                                    {filteredOptions.length > 0 ? (
                                        filteredOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => handleSelect(option.value)}
                                                className={`w-full flex items-center justify-between transition-colors ${isMobile ? 'px-4 py-4 rounded-xl text-base mb-1' : 'px-3 py-2 rounded-lg text-sm'} ${value === option.value
                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                    : 'text-foreground hover:bg-secondary active:bg-secondary'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 truncate">
                                                    {option.icon && <span className={isMobile ? 'scale-110' : ''}>{option.icon}</span>}
                                                    <span>{option.label}</span>
                                                </div>
                                                {value === option.value && (
                                                    <Check className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0 text-primary`} />
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        !showCreateOption && (
                                            <div className={`p-4 text-center ${isMobile ? 'text-base py-8' : 'text-sm'} text-muted-foreground`}>
                                                No options found
                                            </div>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
