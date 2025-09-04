import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface PreferenceGroupProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
}

export default function PreferenceGroup({
  title,
  description,
  icon,
  children,
  defaultExpanded = true,
  collapsible = false,
}: PreferenceGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-dark p-6 mb-6"
    >
      <div
        className={`flex items-center justify-between mb-4 ${
          collapsible ? 'cursor-pointer' : ''
        }`}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }
              }
            : undefined
        }
        aria-expanded={collapsible ? isExpanded : undefined}
        aria-controls={collapsible ? `group-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined}
      >
        <div className="flex items-center">
          {icon && (
            <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 mr-4">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-gray-400 text-sm mt-1">{description}</p>
            )}
          </div>
        </div>
        {collapsible && (
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        )}
      </div>

      <motion.div
        id={collapsible ? `group-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined}
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <div className="space-y-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}