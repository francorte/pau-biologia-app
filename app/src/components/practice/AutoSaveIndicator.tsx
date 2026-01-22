import { Save, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AutoSaveIndicatorProps {
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
  onRestore?: () => void;
  hasRestoredData?: boolean;
  answeredQuestionsCount?: number;
  totalQuestionsCount?: number;
  className?: string;
}

export function AutoSaveIndicator({ 
  lastSaveTime, 
  hasUnsavedChanges,
  onRestore,
  hasRestoredData,
  answeredQuestionsCount,
  totalQuestionsCount,
  className 
}: AutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const showProgress = answeredQuestionsCount !== undefined && totalQuestionsCount !== undefined && totalQuestionsCount > 1;

  if (!lastSaveTime && !hasRestoredData) return null;

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors',
              hasUnsavedChanges 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            )}>
              {hasUnsavedChanges ? (
                <>
                  <Save className="h-3 w-3 animate-pulse" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  <span>Guardado {lastSaveTime && `a las ${formatTime(lastSaveTime)}`}</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Tus respuestas se guardan automáticamente en este dispositivo
              {showProgress && ` (${answeredQuestionsCount}/${totalQuestionsCount} preguntas)`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showProgress && (
        <span className="text-muted-foreground">
          {answeredQuestionsCount}/{totalQuestionsCount} preguntas
        </span>
      )}

      {hasRestoredData && onRestore && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestore}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Borrar borrador
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar las respuestas guardadas y empezar de nuevo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
