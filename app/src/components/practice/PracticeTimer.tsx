import { useState } from 'react';
import { Clock, AlertTriangle, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface PracticeTimerProps {
  formattedTime: string;
  percentageRemaining: number;
  isTimeUp: boolean;
  isRunning: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  pausesRemaining?: number;
  maxPauses?: number;
  totalPausedTime?: number;
  pauseCount?: number;
}

export function PracticeTimer({
  formattedTime,
  percentageRemaining,
  isTimeUp,
  isRunning,
  isMuted = false,
  onToggleMute,
  onPause,
  onResume,
  pausesRemaining = 3,
  maxPauses = 3,
  totalPausedTime = 0,
  pauseCount = 0,
}: PracticeTimerProps) {
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const isLowTime = percentageRemaining <= 20;
  const isCriticalTime = percentageRemaining <= 10;
  const canPause = pausesRemaining > 0;

  const formatPausedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const handlePauseClick = () => {
    if (isRunning && canPause) {
      setShowPauseConfirm(true);
    } else if (!isRunning) {
      onResume?.();
    }
  };

  const handleConfirmPause = () => {
    setShowPauseConfirm(false);
    onPause?.();
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border p-2 transition-colors sm:gap-3 sm:p-3',
          isTimeUp && 'border-destructive bg-destructive/10',
          isCriticalTime && !isTimeUp && 'border-destructive/50 bg-destructive/5 animate-pulse',
          isLowTime && !isCriticalTime && !isTimeUp && 'border-yellow-500/50 bg-yellow-500/5',
          !isRunning && !isTimeUp && 'border-muted bg-muted/50'
        )}
      >
        <div className="flex items-center gap-2">
          {isTimeUp ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Clock className={cn('h-5 w-5', isCriticalTime ? 'text-destructive' : isRunning ? 'text-primary' : 'text-muted-foreground')} />
          )}
          <span
            className={cn(
              'font-mono text-lg font-bold tabular-nums sm:text-xl',
              isTimeUp && 'text-destructive',
              isCriticalTime && !isTimeUp && 'text-destructive',
              isLowTime && !isCriticalTime && !isTimeUp && 'text-yellow-600 dark:text-yellow-400',
              !isRunning && !isTimeUp && 'text-muted-foreground'
            )}
          >
            {formattedTime}
          </span>
        </div>

        <Progress
          value={percentageRemaining}
          className={cn(
            'h-2 w-16 sm:w-24',
            isCriticalTime && '[&>div]:bg-destructive',
            isLowTime && !isCriticalTime && '[&>div]:bg-yellow-500',
            !isRunning && !isTimeUp && '[&>div]:bg-muted-foreground'
          )}
        />

        {/* Pause/Resume button */}
        {(onPause || onResume) && !isTimeUp && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePauseClick}
              className="h-8 w-8"
              disabled={isRunning && !canPause}
              title={
                isRunning 
                  ? canPause 
                    ? `Pausar (${pausesRemaining} restantes)` 
                    : 'Sin pausas disponibles'
                  : 'Reanudar'
              }
            >
              {isRunning ? (
                <Pause className={cn('h-4 w-4', !canPause && 'text-muted-foreground')} />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            {isRunning && maxPauses > 0 && (
              <span className={cn(
                'text-xs tabular-nums',
                canPause ? 'text-muted-foreground' : 'text-destructive'
              )}>
                {pausesRemaining}/{maxPauses}
              </span>
            )}
          </div>
        )}
        
        {onToggleMute && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMute}
            className="h-8 w-8"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {isTimeUp && (
          <span className="text-sm font-medium text-destructive">
            ¡Tiempo agotado!
          </span>
        )}
        
        {!isRunning && !isTimeUp && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              Pausado
            </span>
            {pauseCount > 0 && totalPausedTime > 0 && (
              <span className="text-[10px] text-muted-foreground/70">
                Total: {formatPausedTime(totalPausedTime)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pause Confirmation Dialog */}
      <AlertDialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pausar el temporizador?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>El tiempo se detendrá hasta que decidas continuar.</p>
              <p className="font-medium text-foreground">
                Te quedan {pausesRemaining} pausa{pausesRemaining !== 1 ? 's' : ''} disponible{pausesRemaining !== 1 ? 's' : ''}.
              </p>
              <p className="text-xs">En un examen real no podrías pausar, así que úsalo solo si es necesario.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPause}>
              Pausar ({pausesRemaining - 1} restantes)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
