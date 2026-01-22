import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionPart {
  id: string;
  label: string;
}

interface ProgressSummaryProps {
  parts: QuestionPart[];
  answers: Record<string, string>;
  className?: string;
}

export function ProgressSummary({ parts, answers, className }: ProgressSummaryProps) {
  const answeredParts = parts.filter(part => (answers[part.id]?.trim().length || 0) > 0);
  const emptyParts = parts.filter(part => !(answers[part.id]?.trim().length || 0));
  
  const totalParts = parts.length;
  const answeredCount = answeredParts.length;
  const percentage = totalParts > 0 ? Math.round((answeredCount / totalParts) * 100) : 0;
  
  const allAnswered = answeredCount === totalParts;
  const noneAnswered = answeredCount === 0;

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Resumen de progreso</h4>
        <span className={cn(
          'text-sm font-semibold',
          allAnswered ? 'text-green-600 dark:text-green-400' : 
          noneAnswered ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'
        )}>
          {answeredCount} / {totalParts} apartados
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted mb-3">
        <div
          className={cn(
            'h-full transition-all duration-300',
            allAnswered ? 'bg-green-500' : 
            noneAnswered ? 'bg-muted' : 'bg-amber-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Part indicators */}
      <div className="flex flex-wrap gap-2">
        {parts.map((part) => {
          const hasAnswer = (answers[part.id]?.trim().length || 0) > 0;
          return (
            <div
              key={part.id}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
                hasAnswer 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {hasAnswer ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              {part.label}
            </div>
          );
        })}
      </div>

      {/* Warning message if not all answered */}
      {!allAnswered && answeredCount > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 p-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Tienes {emptyParts.length} apartado{emptyParts.length > 1 ? 's' : ''} sin responder: {' '}
            <strong>{emptyParts.map(p => p.label).join(', ')}</strong>
          </span>
        </div>
      )}

      {noneAnswered && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>No has respondido ningún apartado todavía.</span>
        </div>
      )}
    </div>
  );
}
