import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type DateRange = { from: Date; to: Date };

type Preset = '7d' | '30d' | 'this_month' | 'this_year' | 'custom';

interface ExpenseDateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'this_year', label: 'This year' },
  { key: 'custom', label: 'Custom range' },
];

function getPresetRange(preset: Preset): DateRange | null {
  const today = new Date();
  switch (preset) {
    case '7d':
      return { from: subDays(today, 6), to: today };
    case '30d':
      return { from: subDays(today, 29), to: today };
    case 'this_month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case 'this_year':
      return { from: startOfYear(today), to: today };
    default:
      return null;
  }
}

export default function ExpenseDateFilter({ value, onChange }: ExpenseDateFilterProps) {
  const { t } = useTranslation();
  const [activePreset, setActivePreset] = useState<Preset>('30d');
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(format(value.from, 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(value.to, 'yyyy-MM-dd'));

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const range = getPresetRange(preset);
    if (range) onChange(range);
  };

  const applyCustom = () => {
    const from = new Date(customFrom);
    const to = new Date(customTo);
    if (from <= to) {
      onChange({ from, to });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span className="font-medium">{t('expenses.filter.period', 'Period:')}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activePreset === p.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {t(`expenses.filter.${p.key}`, p.label)}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="h-8 px-2 text-xs bg-secondary/50 border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="h-8 px-2 text-xs bg-secondary/50 border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={applyCustom}
            className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('common.apply', 'Apply')}
          </button>
        </div>
      )}

      {/* Active range label */}
      {activePreset !== 'custom' && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {format(value.from, 'MMM d')} – {format(value.to, 'MMM d, yyyy')}
        </span>
      )}
    </div>
  );
}
