import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle, FileDown, Printer, Clock, Pause, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportAnswersToPdf } from '@/utils/exportPdf';
import { useToast } from '@/hooks/use-toast';

interface QuestionPart {
  id: string;
  label: string;
  statement: string;
  max_score: number;
}

interface Question {
  statement: string;
  year: number | null;
  convocatoria: string | null;
  has_image: boolean;
  image_url: string | null;
}

interface PracticeStats {
  timerEnabled: boolean;
  totalTimeMinutes: number;
  timeUsedSeconds: number;
  pauseCount: number;
  maxPauses: number;
  totalPausedTime: number;
}

interface AnswerPreviewProps {
  question: Question;
  parts: QuestionPart[];
  answers: Record<string, string>;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  blockName?: string;
  practiceStats?: PracticeStats;
}

export function AnswerPreview({
  question,
  parts,
  answers,
  onBack,
  onConfirm,
  isSubmitting,
  blockName = 'Práctica',
  practiceStats,
}: AnswerPreviewProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const answeredParts = parts.filter(p => (answers[p.id]?.trim().length || 0) > 0);
  const emptyParts = parts.filter(p => !(answers[p.id]?.trim().length || 0));
  const totalCharacters = Object.values(answers).reduce((acc, a) => acc + (a?.length || 0), 0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} min ${secs} seg`;
    }
    return `${secs} seg`;
  };

  const formatPausedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes} min ${seconds} seg`;
    }
    return `${seconds} seg`;
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportAnswersToPdf({
        question,
        parts,
        answers,
        blockName,
        practiceStats,
      });
      toast({
        title: "PDF exportado",
        description: "El archivo se ha descargado correctamente",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vista previa de tus respuestas</h2>
          <p className="text-sm text-muted-foreground">
            Revisa tus respuestas antes de enviar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {answeredParts.length} respondidos
          </Badge>
          {emptyParts.length > 0 && (
            <Badge variant="outline" className="gap-1 text-amber-600">
              <AlertCircle className="h-3 w-3" />
              {emptyParts.length} vacíos
            </Badge>
          )}
        </div>
      </div>

      {/* Practice Statistics */}
      {practiceStats && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium text-blue-700 dark:text-blue-300">
              <Timer className="h-4 w-4" />
              Estadísticas de práctica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Time used */}
              {practiceStats.timerEnabled && (
                <div className="flex items-center gap-3 rounded-lg bg-background/80 p-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tiempo empleado</p>
                    <p className="font-semibold">
                      {formatTime(practiceStats.totalTimeMinutes * 60 - practiceStats.timeUsedSeconds)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      de {practiceStats.totalTimeMinutes} min
                    </p>
                  </div>
                </div>
              )}

              {/* Pauses */}
              {practiceStats.timerEnabled && practiceStats.maxPauses > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-background/80 p-3">
                  <div className="rounded-full bg-amber-500/10 p-2">
                    <Pause className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pausas utilizadas</p>
                    <p className="font-semibold">
                      {practiceStats.pauseCount} de {practiceStats.maxPauses}
                    </p>
                    {practiceStats.totalPausedTime > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Total: {formatPausedTime(practiceStats.totalPausedTime)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Answered parts */}
              <div className="flex items-center gap-3 rounded-lg bg-background/80 p-3">
                <div className="rounded-full bg-green-500/10 p-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Apartados respondidos</p>
                  <p className="font-semibold">
                    {answeredParts.length} de {parts.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((answeredParts.length / parts.length) * 100)}% completado
                  </p>
                </div>
              </div>

              {/* Total characters */}
              <div className="flex items-center gap-3 rounded-lg bg-background/80 p-3">
                <div className="rounded-full bg-purple-500/10 p-2">
                  <FileDown className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Caracteres escritos</p>
                  <p className="font-semibold">{totalCharacters.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    ~{Math.ceil(totalCharacters / 5)} palabras
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Statement */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-base font-medium text-primary">
              Enunciado
            </CardTitle>
            {question.year && (
              <Badge variant="secondary" className="shrink-0">
                {question.convocatoria} {question.year}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{question.statement}</p>
          {question.has_image && question.image_url && (
            <div className="mt-3 overflow-hidden rounded-lg border bg-background p-2">
              <img
                src={question.image_url}
                alt="Imagen de la pregunta"
                className="mx-auto max-h-48 w-auto object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answers Preview */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-4 pr-4">
          {parts.map((part) => {
            const answer = answers[part.id]?.trim() || '';
            const isEmpty = answer.length === 0;

            return (
              <Card
                key={part.id}
                className={cn(
                  'transition-colors',
                  isEmpty && 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      <span className="mr-2 font-bold text-primary">{part.label})</span>
                      {part.statement}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {part.max_score} pts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEmpty ? (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Sin respuesta</span>
                    </div>
                  ) : (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {answer}
                      </p>
                      <div className="mt-2 text-right text-xs text-muted-foreground">
                        {answer.length} caracteres
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting || isExporting}
            className="no-print"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a editar
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={isSubmitting || isExporting}
            className="no-print"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isSubmitting || isExporting}
            className="no-print"
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <div className="flex flex-col items-end gap-2 no-print">
          {emptyParts.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Apartados vacíos: {emptyParts.map(p => p.label).join(', ')}
            </p>
          )}
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Confirmar y enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
