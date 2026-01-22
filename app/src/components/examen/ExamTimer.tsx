import { Clock, Pause, Play, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  formattedTime: string;
  percentageRemaining: number;
  isRunning: boolean;
  isTimeUp: boolean;
  onPause: () => void;
  onResume: () => void;
  allowPause?: boolean;
}

export function ExamTimer({
  formattedTime,
  percentageRemaining,
  isRunning,
  isTimeUp,
  onPause,
  onResume,
  allowPause = false,
}: ExamTimerProps) {
  const isLowTime = percentageRemaining <= 20;
  const isCriticalTime = percentageRemaining <= 10;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        isTimeUp && 'border-destructive bg-destructive/10',
        isCriticalTime && !isTimeUp && 'border-destructive/50 bg-destructive/5 animate-pulse',
        isLowTime && !isCriticalTime && !isTimeUp && 'border-warning bg-warning/5'
      )}
    >
      <div className="flex items-center gap-2">
        {isTimeUp ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <Clock className={cn('h-5 w-5', isCriticalTime ? 'text-destructive' : 'text-primary')} />
        )}
        <span
          className={cn(
            'font-mono text-xl font-bold tabular-nums',
            isTimeUp && 'text-destructive',
            isCriticalTime && !isTimeUp && 'text-destructive',
            isLowTime && !isCriticalTime && !isTimeUp && 'text-warning-foreground'
          )}
        >
          {formattedTime}
        </span>
      </div>

      <Progress
        value={percentageRemaining}
        className={cn(
          'h-2 w-24',
          isCriticalTime && '[&>div]:bg-destructive',
          isLowTime && !isCriticalTime && '[&>div]:bg-yellow-500'
        )}
      />

      {allowPause && !isTimeUp && (
        <Button
          variant="ghost"
          size="icon"
          onClick={isRunning ? onPause : onResume}
          className="h-8 w-8"
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
