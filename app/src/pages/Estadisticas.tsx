import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Trophy,
  Target
} from 'lucide-react';

interface BlockStats {
  block_id: string;
  block_code: string;
  block_name: string;
  answers_count: number;
  total_questions: number;
  total_score: number;
  max_possible_score: number;
  average_score: number | null;
}

interface RecentAttempt {
  id: string;
  started_at: string;
  finished_at: string | null;
  total_score: number | null;
  mode: string;
  answers_count: number;
}

const blockColors: Record<string, string> = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-yellow-500',
  D: 'bg-purple-500',
  E: 'bg-red-500',
  F: 'bg-orange-500',
};

export default function Estadisticas() {
  const { user } = useAuthContext();
  const [blockStats, setBlockStats] = useState<BlockStats[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [overallAverage, setOverallAverage] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      try {
        // Fetch all blocks
        const { data: blocks, error: blocksError } = await supabase
          .from('blocks')
          .select('id, code, name')
          .order('code');

        if (blocksError) throw blocksError;

        // Fetch user's attempts
        const { data: attempts, error: attemptsError } = await supabase
          .from('attempts')
          .select('id, started_at, finished_at, total_score, mode')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });

        if (attemptsError) throw attemptsError;

        // Fetch all user's answers with question parts and their questions
        const { data: answers, error: answersError } = await supabase
          .from('answers')
          .select(`
            id,
            score,
            attempt_id,
            question_part:question_parts(
              id,
              max_score,
              question:questions(
                id,
                block_id
              )
            )
          `)
          .in('attempt_id', (attempts || []).map(a => a.id));

        if (answersError) throw answersError;

        // Calculate stats per block
        const stats: BlockStats[] = await Promise.all(
          (blocks || []).map(async (block) => {
            const blockAnswers = (answers || []).filter(
              (a: any) => a.question_part?.question?.block_id === block.id
            );

            const totalScore = blockAnswers.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
            const maxPossibleScore = blockAnswers.reduce((sum: number, a: any) => sum + (a.question_part?.max_score || 0), 0);

            const { count } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('block_id', block.id)
              .eq('active', true);

            return {
              block_id: block.id,
              block_code: block.code,
              block_name: block.name,
              answers_count: blockAnswers.length,
              total_questions: count || 0,
              total_score: totalScore,
              max_possible_score: maxPossibleScore,
              average_score: maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 10 : null,
            };
          })
        );

        // Calculate recent attempts with answer counts
        const recentAttemptsData: RecentAttempt[] = (attempts || []).slice(0, 5).map(attempt => {
          const attemptAnswers = (answers || []).filter((a: any) => a.attempt_id === attempt.id);
          return {
            ...attempt,
            answers_count: attemptAnswers.length,
          };
        });

        // Calculate overall statistics
        const completedAttempts = (attempts || []).filter(a => a.finished_at && a.total_score !== null);
        const avgScore = completedAttempts.length > 0
          ? completedAttempts.reduce((sum, a) => sum + (a.total_score || 0), 0) / completedAttempts.length
          : null;
        const maxScore = completedAttempts.length > 0
          ? Math.max(...completedAttempts.map(a => a.total_score || 0))
          : null;

        setBlockStats(stats);
        setRecentAttempts(recentAttemptsData);
        setTotalAnswers(answers?.length || 0);
        setOverallAverage(avgScore);
        setBestScore(maxScore);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Error al cargar las estadísticas');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const mostPracticedBlock = blockStats.reduce(
    (max, block) => (block.answers_count > max.answers_count ? block : max),
    { answers_count: 0, block_code: '-', block_name: '' } as BlockStats
  );

  const bestPerformingBlock = blockStats
    .filter(b => b.average_score !== null)
    .reduce(
      (best, block) => ((block.average_score || 0) > (best.average_score || 0) ? block : best),
      { average_score: 0, block_code: '-', block_name: '' } as BlockStats
    );

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <Skeleton className="mb-8 h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mis Estadísticas</h1>
          <p className="mt-2 text-muted-foreground">
            Tu progreso en la preparación de la PAU de Biología
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total respuestas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalAnswers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Nota media
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {overallAverage !== null ? overallAverage.toFixed(1) : '-'}
                <span className="text-lg text-muted-foreground">/ 10</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Mejor nota
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {bestScore !== null ? bestScore.toFixed(1) : '-'}
                <span className="text-lg text-muted-foreground">/ 10</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Mejor bloque
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bestPerformingBlock.average_score !== null && bestPerformingBlock.average_score > 0 ? (
                <div className="flex items-center gap-2">
                  <Badge className={blockColors[bestPerformingBlock.block_code]}>
                    {bestPerformingBlock.block_code}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({bestPerformingBlock.average_score?.toFixed(1)} media)
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Block Progress with Scores */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Rendimiento por bloque</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blockStats.map((block) => (
              <Card key={block.block_id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`${blockColors[block.block_code]} text-white`}>
                      {block.block_code}
                    </Badge>
                    <div className="text-right">
                      {block.average_score !== null ? (
                        <span className="text-lg font-bold">
                          {block.average_score.toFixed(1)}
                          <span className="text-sm text-muted-foreground">/10</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin datos</span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-sm font-medium mt-2">
                    {block.block_name.replace(`Bloque ${block.block_code}: `, '')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full ${blockColors[block.block_code]} transition-all`}
                        style={{
                          width: block.average_score !== null
                            ? `${Math.min(block.average_score * 10, 100)}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {block.answers_count} respuestas · {block.total_questions} preguntas disponibles
                    </p>
                  </div>
                  <Link to={`/practica/${block.block_id}`}>
                    <Button variant="ghost" size="sm" className="mt-2 w-full">
                      Practicar
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Attempts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Intentos recientes</h2>
            <Link to="/historial">
              <Button variant="ghost" size="sm">
                Ver todo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {recentAttempts.length > 0 ? (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => (
                <Card key={attempt.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={attempt.mode === 'examen' ? 'default' : 'secondary'}>
                        {attempt.mode === 'examen' ? 'Simulacro' : 'Práctica'}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {attempt.answers_count} respuestas
                          {attempt.total_score !== null && (
                            <span className="ml-2 text-primary font-bold">
                              {attempt.total_score.toFixed(1)}/10
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(attempt.started_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {attempt.finished_at ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Completado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        En progreso
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-medium">Sin intentos recientes</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comienza a practicar para ver tu historial aquí
                </p>
                <Link to="/bloques">
                  <Button className="mt-4">
                    Comenzar a practicar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
