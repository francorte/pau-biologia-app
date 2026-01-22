import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useBlockProgress } from '@/hooks/useBlockProgress';
import { useExamTimer } from '@/hooks/useExamTimer';
import { useTimerSound } from '@/hooks/useTimerSound';
import { CharacterCounter } from '@/components/practice/CharacterCounter';
import { ProgressSummary } from '@/components/practice/ProgressSummary';
import { AutoSaveIndicator } from '@/components/practice/AutoSaveIndicator';
import { AnswerPreview } from '@/components/practice/AnswerPreview';
import { PracticeConfig, PracticeSettings } from '@/components/practice/PracticeConfig';
import { PracticeTimer } from '@/components/practice/PracticeTimer';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Loader2, 
  AlertCircle, 
  BookOpen,
  RefreshCw
} from 'lucide-react';

interface Question {
  id: string;
  statement: string;
  has_image: boolean;
  image_url: string | null;
  year: number | null;
  convocatoria: string | null;
  block: {
    id: string;
    code: string;
    name: string;
  };
}

interface QuestionPart {
  id: string;
  label: string;
  statement: string;
  order_index: number;
  max_score: number;
  correction_text: string;
}

export default function Practica() {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const { user, isDemoMode } = useAuthContext();
  const { toast } = useToast();

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionParts, setQuestionParts] = useState<QuestionPart[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [allBlockAnswers, setAllBlockAnswers] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [emptyPartsLabels, setEmptyPartsLabels] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings | null>(null);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const pauseStartTime = useRef<number | null>(null);
  const initialLoadDone = useRef(false);
  const blockProgressLoaded = useRef(false);

  const { 
    loadBlockProgress, 
    saveBlockProgress, 
    clearBlockProgress,
    getAnsweredQuestionsCount,
  } = useBlockProgress({ blockId: blockId || null });

  const { playSound, isMuted, toggleMute } = useTimerSound();

  // Timer hook - only active when practice has started with timer enabled
  const {
    formattedTime,
    percentageRemaining,
    isTimeUp,
    isRunning: isTimerRunning,
    isWarning,
    timeRemaining,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
  } = useExamTimer({
    initialMinutes: practiceSettings?.timerMinutes || 20,
    onTimeUp: () => {
      playSound('timeUp');
      setShowTimeUpDialog(true);
    },
    onWarning: () => {
      playSound('warning');
      toast({
        title: `⏰ ¡Quedan ${practiceSettings?.warningMinutes || 5} minutos!`,
        description: 'Recuerda revisar tus respuestas antes de que termine el tiempo.',
      });
    },
    warningMinutes: practiceSettings?.warningMinutes || 5,
    autoStart: false,
  });

  const fetchQuestionIds = useCallback(async () => {
    console.log('=== fetchQuestionIds START ===');
    console.log('blockId:', blockId);
    
    if (!blockId) {
      console.log('No blockId, stopping');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id')
        .eq('block_id', blockId)
        .eq('active', true)
        .order('created_at');

      console.log('fetchQuestionIds result:', { data, error, count: data?.length });

      if (error) {
        console.error('Error fetching question IDs:', error);
        setError(`Error al cargar las preguntas: ${error.message}`);
        setIsLoading(false);
        return;
      }

      const ids = data?.map((q) => q.id) || [];
      console.log('Question IDs found:', ids);
      setQuestionIds(ids);
      setQuestionCount(ids.length);
      
      if (ids.length === 0) {
        console.log('No questions found for this block');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error in fetchQuestionIds:', err);
      setError('Error inesperado al cargar las preguntas');
      setIsLoading(false);
    }
  }, [blockId]);

  const fetchQuestion = useCallback(async (questionId: string) => {
    console.log('=== fetchQuestion START ===');
    console.log('questionId:', questionId);
    
    setIsLoading(true);
    setError(null);

    try {
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select(`
          id,
          statement,
          has_image,
          image_url,
          year,
          convocatoria,
          block:blocks(id, code, name)
        `)
        .eq('id', questionId)
        .single();

      console.log('fetchQuestion result:', { questionData, questionError });

      if (questionError) {
        console.error('Question fetch error:', questionError);
        throw new Error(`Error al cargar pregunta: ${questionError.message}`);
      }

      // Fetch question parts from new table
      const { data: partsData, error: partsError } = await supabase
        .from('question_parts')
        .select('*')
        .eq('question_id', questionId)
        .order('order_index');

      console.log('fetchQuestion parts result:', { partsData, partsError, partsCount: partsData?.length });

      if (partsError) {
        console.error('Parts fetch error:', partsError);
        throw new Error(`Error al cargar apartados: ${partsError.message}`);
      }

      if (!partsData || partsData.length === 0) {
        console.warn('No question parts found for question:', questionId);
      }

      setQuestion(questionData as unknown as Question);
      setQuestionParts(partsData || []);
      setAnswers({});
      
      console.log('Question loaded successfully:', {
        questionId: questionData?.id,
        statement: questionData?.statement?.substring(0, 50) + '...',
        partsCount: partsData?.length || 0
      });
    } catch (err) {
      console.error('Error fetching question:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar la pregunta';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestionIds();
  }, [fetchQuestionIds]);

  // Load block progress on mount
  useEffect(() => {
    if (blockId && questionIds.length > 0 && !blockProgressLoaded.current) {
      const progress = loadBlockProgress();
      if (progress) {
        setAllBlockAnswers(progress.answers);
        if (progress.currentQuestionIndex < questionIds.length) {
          setCurrentIndex(progress.currentQuestionIndex);
        }
        setHasRestoredData(true);
        setLastSaveTime(new Date(progress.lastUpdated));
        
        const answeredCount = Object.values(progress.answers).filter(
          qa => Object.values(qa).some(a => a.trim().length > 0)
        ).length;
        
        if (answeredCount > 0) {
          toast({
            title: "Progreso recuperado",
            description: `Se ha cargado tu progreso anterior (${answeredCount} preguntas con respuestas)`,
          });
        }
      }
      blockProgressLoaded.current = true;
    }
  }, [blockId, questionIds, loadBlockProgress, toast]);

  useEffect(() => {
    if (questionIds.length > 0 && questionIds[currentIndex]) {
      fetchQuestion(questionIds[currentIndex]);
    }
  }, [questionIds, currentIndex, fetchQuestion]);

  // Load answers for current question from block progress
  useEffect(() => {
    if (question && blockProgressLoaded.current) {
      const savedAnswers = allBlockAnswers[question.id] || {};
      setAnswers(savedAnswers);
      initialLoadDone.current = true;
    } else if (question) {
      initialLoadDone.current = true;
    }
  }, [question, allBlockAnswers]);

  // Auto-save block progress when answers or current index change
  useEffect(() => {
    if (question && blockId && initialLoadDone.current) {
      const updatedBlockAnswers = {
        ...allBlockAnswers,
        [question.id]: answers,
      };
      
      const hasContent = Object.values(updatedBlockAnswers).some(
        qa => Object.values(qa).some(a => a.trim().length > 0)
      );
      
      if (hasContent || currentIndex > 0) {
        setHasUnsavedChanges(true);
        setAllBlockAnswers(updatedBlockAnswers);
        saveBlockProgress(updatedBlockAnswers, currentIndex);
        
        const timeout = setTimeout(() => {
          setHasUnsavedChanges(false);
          setLastSaveTime(new Date());
        }, 1100);
        return () => clearTimeout(timeout);
      }
    }
  }, [answers, question, blockId, currentIndex, saveBlockProgress]);

  const handleAnswerChange = (partId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [partId]: value,
    }));
  };

  const handleClearDraft = () => {
    clearBlockProgress();
    setAnswers({});
    setAllBlockAnswers({});
    setHasRestoredData(false);
    setLastSaveTime(null);
    toast({
      title: "Progreso eliminado",
      description: "Se ha borrado todo el progreso guardado del bloque",
    });
  };

  const handleStartPractice = (settings: PracticeSettings) => {
    console.log('=== handleStartPractice ===');
    console.log('settings:', settings);
    console.log('Current state:', { 
      question: question?.id, 
      questionParts: questionParts.length,
      questionIds: questionIds.length,
      currentIndex 
    });
    
    setPracticeSettings(settings);
    setPracticeStarted(true);
    if (settings.timerEnabled) {
      resetTimer();
      // Small delay to ensure state is updated
      setTimeout(() => startTimer(), 100);
    }
  };

  const handleTimeUpSubmit = () => {
    setShowTimeUpDialog(false);
    if (hasAnswers) {
      handlePreviewClick();
    }
  };

  const handlePreviewClick = () => {
    if (!question) {
      toast({
        title: "Error",
        description: "No hay pregunta cargada",
        variant: "destructive",
      });
      return;
    }

    // In demo mode, skip user check
    if (!isDemoMode && !user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para enviar respuestas",
        variant: "destructive",
      });
      return;
    }

    // Validate at least one answer has content
    const filledAnswers = Object.values(answers).filter(a => a.trim().length > 0);
    if (filledAnswers.length === 0) {
      toast({
        title: "Respuesta vacía",
        description: "Escribe al menos una respuesta antes de enviar",
        variant: "destructive",
      });
      return;
    }

    // Show preview mode
    setShowPreview(true);
  };

  const handleConfirmFromPreview = () => {
    // Check for empty parts before final submit
    const emptyParts = questionParts.filter(part => !(answers[part.id]?.trim().length || 0));
    if (emptyParts.length > 0) {
      setEmptyPartsLabels(emptyParts.map(p => p.label));
      setShowConfirmDialog(true);
      return;
    }

    // All parts filled, submit directly
    handleSubmit();
  };

  const handleSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setError(null);

    // In demo mode, show correction without saving
    if (isDemoMode) {
      toast({
        title: "Modo demo",
        description: "Mostrando corrección (no se guarda el progreso)",
      });
      // Navigate to correction page without attempt ID (demo mode)
      navigate(`/correccion/${question!.id}`);
      return;
    }

    // Calculate statistics
    const totalCharacters = Object.values(answers).reduce((acc, a) => acc + (a?.length || 0), 0);
    const answeredPartsCount = questionParts.filter(p => (answers[p.id]?.trim().length || 0) > 0).length;

    // Debug logging for practice statistics
    console.log('=== PRACTICE SUBMIT DEBUG ===');
    console.log('answers object:', answers);
    console.log('totalCharacters:', totalCharacters);
    console.log('answeredPartsCount:', answeredPartsCount);
    console.log('questionParts.length:', questionParts.length);
    console.log('practiceSettings:', practiceSettings);
    console.log('pauseCount:', pauseCount);
    console.log('totalPausedTime:', totalPausedTime);
    console.log('timeRemaining:', timeRemaining);

    try {
      const attemptPayload = {
        user_id: user!.id,
        mode: 'practice',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        // Practice statistics
        timer_enabled: practiceSettings?.timerEnabled ?? false,
        timer_minutes: practiceSettings?.timerEnabled ? practiceSettings.timerMinutes : null,
        time_remaining_seconds: practiceSettings?.timerEnabled ? timeRemaining : null,
        pause_count: pauseCount,
        max_pauses: practiceSettings?.maxPauses ?? null,
        total_paused_ms: totalPausedTime,
        total_characters: totalCharacters,
        answered_parts_count: answeredPartsCount,
        total_parts_count: questionParts.length,
      };
      console.log('Attempt payload to insert:', attemptPayload);

      // Create a practice attempt with statistics
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .insert(attemptPayload)
        .select()
        .single();

      if (attemptError) {
        console.error('Error creating attempt:', attemptError);
        throw new Error('No se pudo crear el intento. Verifica tu conexión.');
      }

      // Insert answers for each question part
      const answersToInsert = questionParts.map((part) => ({
        attempt_id: attemptData.id,
        question_part_id: part.id,
        user_text: answers[part.id] || '',
      }));

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert);

      if (answersError) {
        console.error('Error saving answers:', answersError);
        throw new Error('No se pudieron guardar las respuestas.');
      }

      // Clear saved block progress on successful submit
      clearBlockProgress();

      toast({
        title: "¡Respuesta enviada!",
        description: "Redirigiendo a la corrección...",
      });

      // Navigate to correction page with attempt ID
      navigate(`/correccion/${question.id}?attempt=${attemptData.id}`);
    } catch (err) {
      console.error('Error submitting answer:', err);
      const message = err instanceof Error ? err.message : 'Error al enviar la respuesta';
      setError(message);
      toast({
        title: "Error al enviar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchQuestionIds();
  };

  const goToNextQuestion = () => {
    if (currentIndex < questionIds.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const hasAnswers = Object.values(answers).some((a) => a.trim().length > 0);

  const formatPausedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes} min ${seconds} seg`;
    }
    return `${seconds} seg`;
  };

  if (questionCount === 0 && !isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h2 className="mt-6 text-2xl font-bold">No hay preguntas disponibles</h2>
            <p className="mt-2 text-muted-foreground">
              Aún no se han añadido preguntas a este bloque temático.
            </p>
            <Link to="/bloques">
              <Button className="mt-6">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver a los bloques
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/bloques">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver a bloques
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Timer display when active */}
            {practiceStarted && practiceSettings?.timerEnabled && (
              <PracticeTimer
                formattedTime={formattedTime}
                percentageRemaining={percentageRemaining}
                isTimeUp={isTimeUp}
                isRunning={isTimerRunning}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                onPause={() => {
                  pauseTimer();
                  setPauseCount(prev => prev + 1);
                  pauseStartTime.current = Date.now();
                }}
                onResume={() => {
                  if (pauseStartTime.current) {
                    const pausedDuration = Date.now() - pauseStartTime.current;
                    setTotalPausedTime(prev => prev + pausedDuration);
                    pauseStartTime.current = null;
                  }
                  startTimer();
                }}
                pausesRemaining={(practiceSettings?.maxPauses ?? 3) - pauseCount}
                maxPauses={practiceSettings?.maxPauses ?? 3}
                totalPausedTime={totalPausedTime}
                pauseCount={pauseCount}
              />
            )}
            
            {question?.block && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Bloque {question.block.code}
                </Badge>
                {questionCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Pregunta {currentIndex + 1} de {questionCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                <RefreshCw className="mr-2 h-3 w-3" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : !practiceStarted && question ? (
          <PracticeConfig
            blockName={question.block?.name || 'Práctica'}
            questionCount={questionCount}
            onStart={handleStartPractice}
          />
        ) : question && showPreview ? (
          <AnswerPreview
            question={question}
            parts={questionParts}
            answers={answers}
            onBack={() => setShowPreview(false)}
            onConfirm={handleConfirmFromPreview}
            isSubmitting={isSubmitting}
            blockName={question.block?.name || 'Práctica'}
            practiceStats={practiceSettings ? {
              timerEnabled: practiceSettings.timerEnabled,
              totalTimeMinutes: practiceSettings.timerMinutes,
              timeUsedSeconds: timeRemaining,
              pauseCount: pauseCount,
              maxPauses: practiceSettings.maxPauses,
              totalPausedTime: totalPausedTime,
            } : undefined}
          />
        ) : question && practiceStarted ? (
          <div className="space-y-6">
            {/* Question Statement */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-xl font-medium leading-relaxed">
                    {question.statement}
                  </CardTitle>
                  {question.year && (
                    <Badge variant="outline" className="shrink-0">
                      {question.convocatoria} {question.year}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              {question.has_image && question.image_url && (
                <CardContent>
                  <div className="overflow-hidden rounded-lg border bg-muted/50 p-2">
                    <img
                      src={question.image_url}
                      alt="Imagen de la pregunta"
                      className="mx-auto max-h-96 w-auto object-contain"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Auto-save indicator */}
            {(lastSaveTime || hasRestoredData) && (
              <AutoSaveIndicator
                lastSaveTime={lastSaveTime}
                hasUnsavedChanges={hasUnsavedChanges}
                hasRestoredData={hasRestoredData}
                onRestore={handleClearDraft}
                answeredQuestionsCount={Object.values(allBlockAnswers).filter(
                  qa => Object.values(qa).some(a => a.trim().length > 0)
                ).length}
                totalQuestionsCount={questionCount}
              />
            )}

            {/* Question Parts */}
            {questionParts.length > 0 ? (
              <div className="space-y-4">
                {questionParts.map((part) => (
                  <Card key={part.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        <span className="mr-2 font-bold text-primary">{part.label})</span>
                        {part.statement}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({part.max_score} puntos)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Escribe tu respuesta aquí..."
                          value={answers[part.id] || ''}
                          onChange={(e) => handleAnswerChange(part.id, e.target.value)}
                          className="min-h-[120px] resize-y"
                          disabled={isSubmitting}
                        />
                        <CharacterCounter 
                          currentLength={answers[part.id]?.length || 0}
                          recommendedLimit={800}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Escribe tu respuesta aquí..."
                      value={answers['main'] || ''}
                      onChange={(e) => handleAnswerChange('main', e.target.value)}
                      className="min-h-[200px] resize-y"
                      disabled={isSubmitting}
                    />
                    <CharacterCounter 
                      currentLength={answers['main']?.length || 0}
                      recommendedLimit={1500}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Summary */}
            {questionParts.length > 0 && (
              <ProgressSummary 
                parts={questionParts.map(p => ({ id: p.id, label: p.label }))}
                answers={answers}
              />
            )}

            {/* Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={goToPreviousQuestion}
                  disabled={currentIndex === 0 || isSubmitting}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={goToNextQuestion}
                  disabled={currentIndex === questionIds.length - 1 || isSubmitting}
                >
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={handlePreviewClick}
                disabled={!hasAnswers || isSubmitting}
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
                    Revisar y enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Confirmation Dialog for Empty Parts */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Enviar con apartados vacíos?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Tienes {emptyPartsLabels.length} apartado{emptyPartsLabels.length > 1 ? 's' : ''} sin responder:
                </p>
                <p className="font-medium text-foreground">
                  {emptyPartsLabels.join(', ')}
                </p>
                <p>
                  Puedes enviar igualmente, pero no podrás comparar tu respuesta con el texto modelo en esos apartados.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver a editar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit}>
                Enviar de todos modos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Time Up Dialog */}
        <AlertDialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                ¡Tiempo agotado!
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  El tiempo de práctica ha terminado.
                </p>
                {pauseCount > 0 && (
                  <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium text-foreground">Estadísticas de pausas:</p>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      <li>• Pausas utilizadas: {pauseCount} de {practiceSettings?.maxPauses ?? 3}</li>
                      <li>• Tiempo total pausado: {formatPausedTime(totalPausedTime)}</li>
                    </ul>
                  </div>
                )}
                {hasAnswers ? (
                  <p>
                    Puedes revisar y enviar tus respuestas ahora, o continuar editando sin límite de tiempo.
                  </p>
                ) : (
                  <p>
                    No has escrito ninguna respuesta todavía. Puedes continuar practicando sin límite de tiempo.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar sin tiempo</AlertDialogCancel>
              {hasAnswers && (
                <AlertDialogAction onClick={handleTimeUpSubmit}>
                  Revisar y enviar
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}