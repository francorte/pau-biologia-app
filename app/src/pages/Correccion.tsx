import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle, 
  BookOpen,
  FileText,
  RefreshCw,
  AlertTriangle
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

interface Answer {
  id: string;
  question_part_id: string;
  user_text: string;
}

interface Attempt {
  id: string;
  mode: string;
  started_at: string;
  finished_at: string | null;
}

export default function Correccion() {
  const { questionId } = useParams<{ questionId: string }>();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt');
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionParts, setQuestionParts] = useState<QuestionPart[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingAttempt, setMissingAttempt] = useState(false);

  const fetchData = useCallback(async () => {
    if (!questionId) {
      setError('ID de pregunta no válido');
      setIsLoading(false);
      return;
    }
    
    if (!user) {
      setError('Debes iniciar sesión para ver la corrección');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMissingAttempt(false);

    try {
      // Fetch question
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

      if (questionError) {
        console.error('Error fetching question:', questionError);
        throw new Error('No se encontró la pregunta solicitada');
      }

      // Fetch question parts
      const { data: partsData, error: partsError } = await supabase
        .from('question_parts')
        .select('*')
        .eq('question_id', questionId)
        .order('order_index');

      if (partsError) {
        console.error('Error fetching question parts:', partsError);
        throw new Error('Error al cargar los apartados de la pregunta');
      }

      // Fetch attempt and answers if attemptId is provided
      let attemptData = null;
      let answersData: Answer[] = [];

      if (attemptId) {
        const { data: fetchedAttempt, error: attemptError } = await supabase
          .from('attempts')
          .select('*')
          .eq('id', attemptId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (attemptError) {
          console.error('Error fetching attempt:', attemptError);
        }

        attemptData = fetchedAttempt;

        if (!attemptData) {
          setMissingAttempt(true);
          toast({
            title: "Intento no encontrado",
            description: "No se encontró tu intento. Mostrando solo el texto modelo.",
            variant: "destructive",
          });
        } else {
          const partIds = partsData?.map((p) => p.id) || [];
          if (partIds.length > 0) {
            const { data: fetchedAnswers, error: answersError } = await supabase
              .from('answers')
              .select('*')
              .eq('attempt_id', attemptId)
              .in('question_part_id', partIds);

            if (answersError) {
              console.error('Error fetching answers:', answersError);
            }

            answersData = fetchedAnswers || [];
          }
        }
      }

      setQuestion(questionData as unknown as Question);
      setQuestionParts(partsData || []);
      setAttempt(attemptData);
      setAnswers(answersData);
      
      // Success feedback if we have answers to show
      if (answersData.length > 0) {
        toast({
          title: "Corrección cargada",
          description: `Comparando ${answersData.filter(a => a.user_text.trim()).length} respuesta(s) con el texto modelo`,
        });
      }
    } catch (err) {
      console.error('Error fetching correction data:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar los datos de corrección';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [questionId, attemptId, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAnswerForPart = (partId: string) => {
    return answers.find((a) => a.question_part_id === partId);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !question) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error || 'Pregunta no encontrada'}</span>
              <Button variant="outline" size="sm" onClick={fetchData} className="ml-4">
                <RefreshCw className="mr-2 h-3 w-3" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
          <Link to="/bloques">
            <Button className="mt-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver a los bloques
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to={`/practica/${question.block.id}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver a la práctica
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Bloque {question.block.code}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="mr-1 h-3 w-3" />
              Corrección
            </Badge>
          </div>
        </div>

        {/* Warning for missing attempt */}
        {missingAttempt && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Intento no encontrado</AlertTitle>
            <AlertDescription>
              No se encontraron tus respuestas para esta pregunta. 
              Solo se muestra el texto modelo oficial.
            </AlertDescription>
          </Alert>
        )}

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
                    className="mx-auto max-h-64 w-auto object-contain"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Correction by Question Part */}
          {questionParts.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Corrección por apartado
              </h2>
              
              {questionParts.map((part) => {
                const answer = getAnswerForPart(part.id);

                return (
                  <Card key={part.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        <span className="mr-2 font-bold text-primary">{part.label})</span>
                        {part.statement}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({part.max_score} puntos)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Student Answer */}
                      {answer && answer.user_text.trim() && (
                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2 text-primary">
                            <FileText className="h-4 w-4" />
                            Tu respuesta
                          </h4>
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <p className="whitespace-pre-wrap">{answer.user_text}</p>
                          </div>
                        </div>
                      )}

                      {/* Model Answer / Correction Text */}
                      {part.correction_text && (
                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            Texto modelo oficial
                          </h4>
                          <div className="prose-academic rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
                            {part.correction_text}
                          </div>
                        </div>
                      )}

                      {!part.correction_text && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Sin información de corrección</AlertTitle>
                          <AlertDescription>
                            Aún no se ha añadido el texto modelo oficial para este apartado.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta pregunta no tiene apartados definidos.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <Separator />
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Link to={`/practica/${question.block.id}`}>
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Continuar practicando
              </Button>
            </Link>
            
            <div className="flex gap-2">
              <Link to="/estadisticas">
                <Button variant="ghost">
                  Ver mis estadísticas
                </Button>
              </Link>
              <Link to="/bloques">
                <Button>
                  Elegir otro bloque
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}