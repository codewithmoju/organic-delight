import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

const RATINGS_KEY = 'vendor_ratings';

function getRatings(): Record<string, number> {
  return readScopedJSON<Record<string, number>>(RATINGS_KEY, {}, undefined, RATINGS_KEY);
}

export function getVendorRating(vendorId: string): number {
  return getRatings()[vendorId] ?? 0;
}

interface VendorRatingProps {
  vendorId: string;
  size?: 'sm' | 'md';
  readonly?: boolean;
}

export default function VendorRating({ vendorId, size = 'sm', readonly = false }: VendorRatingProps) {
  const [rating, setRating] = useState(() => getVendorRating(vendorId));
  const [hover, setHover] = useState(0);

  const save = (value: number) => {
    if (readonly) return;
    const ratings = getRatings();
    ratings[vendorId] = value;
    writeScopedJSON(RATINGS_KEY, ratings);
    setRating(value);
    toast.success(`Rated ${value} star${value !== 1 ? 's' : ''}`);
  };

  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const display = hover || rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => save(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          title={readonly ? `${rating} stars` : `Rate ${i} star${i !== 1 ? 's' : ''}`}
        >
          <Star
            className={`${starSize} transition-colors ${
              i <= display
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
