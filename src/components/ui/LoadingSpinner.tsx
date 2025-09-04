interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-primary-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`${sizeClasses[size]} border-2 border-solid rounded-full ${colorClasses[color]}`} />
      {text && (
        <p className="text-sm text-gray-400 font-medium">
          {text}
        </p>
      )}
    </div>
  );
}