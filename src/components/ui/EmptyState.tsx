import { DivideIcon as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`card-theme border border-border/50 rounded-[2.5rem] p-10 sm:p-14 text-center shadow-sm ${className}`.trim()}>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      {action && (
        <div className="mt-8">
          <button
            type="button"
            onClick={action.onClick}
            className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg shadow-primary/20"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}