import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  currentLength: number;
  recommendedLimit?: number;
  className?: string;
}

export function CharacterCounter({ 
  currentLength, 
  recommendedLimit = 800,
  className 
}: CharacterCounterProps) {
  const percentage = Math.min((currentLength / recommendedLimit) * 100, 100);
  const isOverLimit = currentLength > recommendedLimit;
  const isNearLimit = currentLength > recommendedLimit * 0.8 && !isOverLimit;
  
  const getProgressColor = () => {
    if (isOverLimit) return 'bg-amber-500';
    if (isNearLimit) return 'bg-amber-400';
    if (currentLength > 0) return 'bg-primary';
    return 'bg-muted';
  };

  const getTextColor = () => {
    if (isOverLimit) return 'text-amber-600 dark:text-amber-400';
    if (isNearLimit) return 'text-amber-600 dark:text-amber-400';
    if (currentLength > 0) return 'text-muted-foreground';
    return 'text-muted-foreground/50';
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all duration-300', getProgressColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={cn('transition-colors', getTextColor())}>
          {currentLength} / {recommendedLimit} caracteres
          {isOverLimit && ' (extenso)'}
        </span>
        {currentLength > 0 && (
          <span className={cn('transition-colors', getTextColor())}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}
