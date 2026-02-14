interface SkeletonCardProps {
  variant?: 'default' | 'stat' | 'chart' | 'table';
  className?: string;
}

export default function SkeletonCard({ variant = 'default', className = '' }: SkeletonCardProps) {
  const baseClasses = "animate-pulse bg-zinc-800/50 rounded-xl";
  
  if (variant === 'stat') {
    return (
      <div className={`${baseClasses} p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-zinc-700/50 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-700/50 rounded w-24" />
            <div className="h-3 bg-zinc-700/50 rounded w-16" />
          </div>
        </div>
        <div className="h-8 bg-zinc-700/50 rounded w-20 mb-2" />
        <div className="h-3 bg-zinc-700/50 rounded w-32" />
      </div>
    );
  }
  
  if (variant === 'chart') {
    return (
      <div className={`${baseClasses} p-6 ${className}`}>
        <div className="h-6 bg-zinc-700/50 rounded w-40 mb-6" />
        <div className="space-y-3">
          <div className="h-32 bg-zinc-700/50 rounded" />
          <div className="flex gap-4">
            <div className="h-4 bg-zinc-700/50 rounded flex-1" />
            <div className="h-4 bg-zinc-700/50 rounded flex-1" />
            <div className="h-4 bg-zinc-700/50 rounded flex-1" />
          </div>
        </div>
      </div>
    );
  }
  
  if (variant === 'table') {
    return (
      <div className={`${baseClasses} p-6 ${className}`}>
        <div className="h-6 bg-zinc-700/50 rounded w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-12 bg-zinc-700/50 rounded flex-1" />
              <div className="h-12 bg-zinc-700/50 rounded flex-1" />
              <div className="h-12 bg-zinc-700/50 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className={`${baseClasses} p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-6 bg-zinc-700/50 rounded w-3/4" />
        <div className="h-4 bg-zinc-700/50 rounded w-full" />
        <div className="h-4 bg-zinc-700/50 rounded w-5/6" />
        <div className="h-4 bg-zinc-700/50 rounded w-4/6" />
      </div>
    </div>
  );
}