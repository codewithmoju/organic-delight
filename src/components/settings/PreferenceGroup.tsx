import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PreferenceGroupProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PreferenceGroup({
  title,
  description,
  icon,
  children,
  className = ''
}: PreferenceGroupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-dark p-6 ${className}`}
    >
      <div className="flex items-center mb-6">
        <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400 mr-4">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}