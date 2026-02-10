import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

interface CustomDatePickerProps {
    value: Date | string;
    onChange: (date: Date) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export default function CustomDatePicker({
    value,
    onChange,
    label,
    placeholder = 'Select date',
    error,
    disabled = false,
    className = ''
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(value || new Date()));
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedDate = value ? new Date(value) : null;

    useEffect(() => {
        if (value) {
            setViewDate(new Date(value));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && containerRef.current.contains(event.target as Node)) {
                return;
            }
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            setIsOpen(false);
        };

        const handleScroll = (event: Event) => {
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
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

    const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
    const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

    const handleDayClick = (day: Date) => {
        onChange(day);
        setIsOpen(false);
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewDate)),
        end: endOfWeek(endOfMonth(viewDate))
    });

    const formatDisplayDate = (date: Date | null) => {
        if (!date) return '';
        return format(date, 'MMM dd, yyyy');
    };

    const getDropdownStyle = () => {
        if (!containerRef.current) return {};
        const rect = containerRef.current.getBoundingClientRect();

        // Smart alignment: if aligning left causes overflow, align right
        const DROPDOWN_WIDTH = 320;
        const screenWidth = window.innerWidth;
        const alignRight = (rect.left + DROPDOWN_WIDTH) > screenWidth;

        return {
            position: 'fixed' as const,
            top: rect.bottom + 8,
            left: alignRight ? 'auto' : rect.left,
            right: alignRight ? (screenWidth - rect.right) : 'auto',
            width: DROPDOWN_WIDTH,
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
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                    {selectedDate ? (
                        <span className="font-medium text-foreground">
                            {formatDisplayDate(selectedDate)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
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
                        className="p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handlePrevMonth}
                                type="button"
                                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-base font-bold text-foreground">
                                {format(viewDate, 'MMMM yyyy')}
                            </h3>
                            <button
                                onClick={handleNextMonth}
                                type="button"
                                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Days of Week */}
                        <div className="grid grid-cols-7 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {daysInMonth.map((day, idx) => {
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, viewDate);
                                const isTodayDate = isToday(day);

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleDayClick(day)}
                                        className={`
                                            h-9 rounded-lg text-sm flex items-center justify-center transition-all relative
                                            ${!isCurrentMonth ? 'text-muted-foreground/30' : 'text-foreground'}
                                            ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20' : 'hover:bg-secondary'}
                                            ${isTodayDate && !isSelected ? 'ring-1 ring-primary/50 text-primary font-semibold' : ''}
                                        `}
                                    >
                                        {format(day, 'd')}
                                        {isTodayDate && !isSelected && (
                                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
