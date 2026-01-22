import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { ExamQuestion } from '@/components/examen/ExamQuestion';
import { ExamTimer } from '@/components/examen/ExamTimer';
import { useExamTimer } from '@/hooks/useExamTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  Trophy,
  Clock,
  FileQuestion,
  Play,
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

interface ExamQuestionData {
  question: Question;
  questionParts: QuestionPart[];
}

type ExamPhase = 'intro' | 'exam' | 'submitting' | 'complete';

// Constants for real PAU exam
const PAU_DURATION_MINUTES = 90;
const PAU_QUESTION_COUNT = 5;

export default function Examen() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  // Exam state
  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [examQuestions, setExamQuestions] = useState<ExamQuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [examEndTime, setExamEndTime] = useState<Date | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleTimeUp = useCallback(() => {
    setShowTimeUpDialog(true);
  }, []);

  const timer = useExamTimer({
    initialMinutes: PAU_DURATION_MINUTES,
    onTimeUp: handleTimeUp,
    autoStart: false,
  });

  // Fetch 5 random questions from different blocks
  const fetchExamQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all active questions
      const { data: questionsData, error: questionsError } = await supabase
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
        .eq('active', true);

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length < PAU_QUESTION_COUNT) {
        throw new Error(`Se necesitan al menos ${PAU_QUESTION_COUNT} preguntas activas para el simulacro`);
      }

      // Shuffle and pick random questions, trying to get diverse blocks
      const shuffled = [...questionsData].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, PAU_QUESTION_COUNT);

      // Fetch question parts for each selected question
      const examData: ExamQuestionData[] = await Promise.all(
        selected.map(async (q) => {
          const { data: partsData } = await supabase
            .from('question_parts')
            .select('*')
            .eq('question_id', q.id)
            .order('order_index');

          return {
            question: q as unknown as Question,
            questionParts: partsData || [],
          };
        })
      );

      setExamQuestions(examData);
      
      // Initialize answers object
      const initialAnswers: Record<string, Record<string, string>> = {};
      examData.forEach(({ question, questionParts }) => {
        initialAnswers[question.id] = {};
        if (questionParts.length > 0) {
          questionParts.forEach((part) => {
            initialAnswers[question.id][part.id] = '';
          });
        } else {
          initialAnswers[question.id]['main'] = '';
        }
      });
      setAllAnswers(initialAnswers);

    } catch (err: any) {
      console.error('Error fetching exam questions:', err);
      setError(err.message || 'Error al cargar las preguntas del examen');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartExam = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Create attempt record
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .insert({
          user_id: user.id,
          mode: 'simulacro',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      
      setAttemptId(attemptData.id);
      await fetchExamQuestions();
      setPhase('exam');
      setExamStartTime(new Date());
      timer.reset();
    } catch (err) {
      console.error('Error starting exam:', err);
      setError('Error al iniciar el simulacro');
    } finally {
      setIsLoading(false);
    }
  };

  // Start timer when exam phase begins
  useEffect(() => {
    if (phase === 'exam' && examQuestions.length > 0 && !timer.isRunning) {
      timer.start();
    }
  }, [phase, examQuestions.length, timer]);

  const handleAnswerChange = (partId: string, value: string) => {
    const currentQuestion = examQuestions[currentIndex];
    if (!currentQuestion) return;

    setAllAnswers((prev) => ({
      ...prev,
      [currentQuestion.question.id]: {
        ...prev[currentQuestion.question.id],
        [partId]: value,
      },
    }));
  };

  const goToNext = () => {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const submitExam = async () => {
    if (!user || !attemptId) return;

    setPhase('submitting');
    timer.pause();
    const endTime = new Date();
    setExamEndTime(endTime);

    try {
      // Calculate total max score and prepare answers
      let totalMaxScore = 0;
      const answersToInsert: { attempt_id: string; question_part_id: string; user_text: string }[] = [];

      examQuestions.forEach(({ question, questionParts }) => {
        const questionAnswers = allAnswers[question.id] || {};
        
        questionParts.forEach((part) => {
          totalMaxScore += Number(part.max_score);
          answersToInsert.push({
            attempt_id: attemptId,
            question_part_id: part.id,
            user_text: questionAnswers[part.id] || '',
          });
        });
      });

      // Insert all answers
      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from('answers')
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      // Update attempt with finish time
      // Note: In the PRD, score is calculated based on actual grading
      // For MVP, we'll just mark it as complete without automatic scoring
      const { error: updateError } = await supabase
        .from('attempts')
        .update({
          finished_at: endTime.toISOString(),
          // total_score will be filled when manual grading is implemented
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      setFinalScore(null); // Score to be added via manual grading
      setPhase('complete');
    } catch (err) {
      console.error('Error submitting exam:', err);
      setError('Error al enviar el examen');
      setPhase('exam');
    }
  };

  const handleSubmitClick = () => {
    setShowSubmitDialog(true);
  };

  const handleTimeUpConfirm = () => {
    setShowTimeUpDialog(false);
    submitExam();
  };

  const currentQuestion = examQuestions[currentIndex];
  const answeredCount = examQuestions.filter(({ question, questionParts }) => {
    const qAnswers = allAnswers[question.id] || {};
    if (questionParts.length > 0) {
      return questionParts.some((part) => qAnswers[part.id]?.trim());
    }
    return qAnswers['main']?.trim();
  }).length;

  // Intro phase
  if (phase === 'intro') {
    return (
      <Layout>
        <div className="container px-4 py-8 md:py-12">
          <Card className="mx-auto max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <FileQuestion className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="mt-4 text-2xl">Simulacro PAU Biología</CardTitle>
              <CardDescription>
                Simula las condiciones reales de la Prueba de Acceso a la Universidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <Clock className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-2xl font-bold">{PAU_DURATION_MINUTES} min</p>
                  <p className="text-sm text-muted-foreground">Duración</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <FileQuestion className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-2xl font-bold">{PAU_QUESTION_COUNT}</p>
                  <p className="text-sm text-muted-foreground">Preguntas</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Una vez iniciado, el temporizador comenzará y no podrás pausar el examen.
                  Las preguntas serán seleccionadas aleatoriamente de todos los bloques.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleStartExam}
                disabled={isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparando examen...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Comenzar Simulacro
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Loading phase
  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  // Complete phase
  if (phase === 'complete') {
    const duration = examStartTime && examEndTime
      ? Math.round((examEndTime.getTime() - examStartTime.getTime()) / 60000)
      : 0;

    return (
      <Layout>
        <div className="container px-4 py-12">
          <Card className="mx-auto max-w-lg text-center">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="mt-4 text-2xl">¡Simulacro Completado!</CardTitle>
              <CardDescription>
                Has enviado todas tus respuestas correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg bg-muted p-4">
                  <FileQuestion className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-2xl font-bold">{examQuestions.length}</p>
                  <p className="text-sm text-muted-foreground">Preguntas</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <Clock className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-2xl font-bold">{duration} min</p>
                  <p className="text-sm text-muted-foreground">Duración</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tu simulacro ha sido guardado. Puedes ver tu historial de simulacros en la sección de estadísticas.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/historial')}>
                  Ver historial de simulacros
                </Button>
                <Button variant="outline" onClick={() => setPhase('intro')}>
                  Realizar otro simulacro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Exam phase
  return (
    <Layout>
      <div className="container px-4 py-4 md:py-6">
        {/* Exam Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ExamTimer
              formattedTime={timer.formattedTime}
              percentageRemaining={timer.percentageRemaining}
              isRunning={timer.isRunning}
              isTimeUp={timer.isTimeUp}
              onPause={timer.pause}
              onResume={timer.start}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {answeredCount} de {examQuestions.length} respondidas
            </span>
            <Button onClick={handleSubmitClick} disabled={phase === 'submitting'}>
              {phase === 'submitting' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Finalizar Simulacro
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Question Navigation Dots */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {examQuestions.map(({ question, questionParts }, index) => {
            const qAnswers = allAnswers[question.id] || {};
            const hasAnswer = questionParts.length > 0
              ? questionParts.some((part) => qAnswers[part.id]?.trim())
              : qAnswers['main']?.trim();

            return (
              <button
                key={question.id}
                onClick={() => setCurrentIndex(index)}
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors
                  ${index === currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : hasAnswer
                      ? 'bg-green-100 text-green-700 ring-1 ring-green-500'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="mx-auto max-w-3xl">
            <ExamQuestion
              question={currentQuestion.question}
              questionParts={currentQuestion.questionParts}
              answers={allAnswers[currentQuestion.question.id] || {}}
              onAnswerChange={handleAnswerChange}
              questionNumber={currentIndex + 1}
              totalQuestions={examQuestions.length}
              disabled={phase === 'submitting'}
            />

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentIndex === 0 || phase === 'submitting'}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={goToNext}
                disabled={currentIndex === examQuestions.length - 1 || phase === 'submitting'}
              >
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Time Up Dialog */}
      <AlertDialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-destructive" />
              ¡Tiempo agotado!
            </AlertDialogTitle>
            <AlertDialogDescription>
              El tiempo del simulacro ha terminado. Tu examen será enviado automáticamente con las respuestas actuales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleTimeUpConfirm}>
              Enviar simulacro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar simulacro?</AlertDialogTitle>
            <AlertDialogDescription>
              Has respondido {answeredCount} de {examQuestions.length} preguntas.
              {answeredCount < examQuestions.length && (
                <span className="block mt-2 font-medium text-amber-600">
                  ⚠️ Tienes {examQuestions.length - answeredCount} pregunta(s) sin responder.
                </span>
              )}
              Una vez enviado, no podrás modificar tus respuestas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar simulacro</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowSubmitDialog(false); submitExam(); }}>
              Enviar simulacro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}