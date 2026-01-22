import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Trophy,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Pause,
  Timer,
  PenLine,
  CheckCircle2
} from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';

interface Attempt {
  id: string;
  mode: string;
  started_at: string;
  finished_at: string | null;
  total_score: number | null;
  // Practice statistics
  timer_enabled: boolean | null;
  timer_minutes: number | null;
  time_remaining_seconds: number | null;
  pause_count: number | null;
  max_pauses: number | null;
  total_paused_ms: number | null;
  total_characters: number | null;
  answered_parts_count: number | null;
  total_parts_count: number | null;
}

export default function Historial() {
  const { user } = useAuth();
  const [simulacros, setSimulacros] = useState<Attempt[]>([]);
  const [practicas, setPracticas] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('simulacros');

  useEffect(() => {
    async function fetchAttempts() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });

        if (error) throw error;
        
        const allAttempts = data || [];
        setSimulacros(allAttempts.filter(a => a.mode === 'simulacro'));
        setPracticas(allAttempts.filter(a => a.mode === 'practice'));
      } catch (err) {
        console.error('Error fetching attempts:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttempts();
  }, [user]);

  // Calculate stats for simulacros
  const completedSimulacros = simulacros.filter(a => a.finished_at && a.total_score !== null);
  const averageScore = completedSimulacros.length > 0
    ? completedSimulacros.reduce((sum, a) => sum + (a.total_score || 0), 0) / completedSimulacros.length
    : null;
  const bestScore = completedSimulacros.length > 0
    ? Math.max(...completedSimulacros.map(a => a.total_score || 0))
    : null;

  // Calculate stats for practicas
  const totalPracticas = practicas.length;
  const avgCharacters = practicas.length > 0
    ? Math.round(practicas.reduce((sum, p) => sum + (p.total_characters || 0), 0) / practicas.length)
    : 0;
  const avgPauses = practicas.length > 0
    ? (practicas.reduce((sum, p) => sum + (p.pause_count || 0), 0) / practicas.length).toFixed(1)
    : '0';

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 5) return 'default';
    return 'destructive';
  };

  const getTrendIcon = (index: number) => {
    if (index >= completedSimulacros.length - 1) return null;
    
    const current = completedSimulacros[index].total_score || 0;
    const previous = completedSimulacros[index + 1].total_score || 0;
    
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'En progreso';
    return formatDistanceStrict(new Date(end), new Date(start), { locale: es });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPausedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Historial
            </h1>
            <p className="mt-1 text-muted-foreground">
              Revisa tus intentos anteriores y evolución
            </p>
          </div>
          <Link to="/bloques">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="simulacros" className="gap-2">
              <Trophy className="h-4 w-4" />
              Simulacros ({simulacros.length})
            </TabsTrigger>
            <TabsTrigger value="practicas" className="gap-2">
              <PenLine className="h-4 w-4" />
              Prácticas ({practicas.length})
            </TabsTrigger>
          </TabsList>

          {/* Simulacros Tab */}
          <TabsContent value="simulacros" className="space-y-6">
            {/* Stats Summary */}
            {!isLoading && completedSimulacros.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Simulacros Completados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{completedSimulacros.length}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Mejor Nota
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${bestScore !== null ? getScoreColor(bestScore) : ''}`}>
                      {bestScore !== null ? bestScore.toFixed(2) : '-'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Nota Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${averageScore !== null ? getScoreColor(averageScore) : ''}`}>
                      {averageScore !== null ? averageScore.toFixed(2) : '-'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Simulacros List */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : simulacros.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">Sin simulacros todavía</h3>
                  <p className="mt-2 text-muted-foreground">
                    Realiza tu primer simulacro PAU para ver tu historial aquí.
                  </p>
                  <Link to="/examen" className="mt-4 inline-block">
                    <Button>Iniciar Simulacro PAU</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {simulacros.map((attempt, index) => {
                  const isCompleted = attempt.finished_at && attempt.total_score !== null;
                  const completedIndex = isCompleted 
                    ? completedSimulacros.findIndex(a => a.id === attempt.id) 
                    : -1;

                  return (
                    <Card key={attempt.id} className={!isCompleted ? 'opacity-60' : ''}>
                      <CardContent className="py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(attempt.started_at), "d 'de' MMMM, yyyy", { locale: es })}
                              </span>
                              <span className="text-muted-foreground">
                                {format(new Date(attempt.started_at), 'HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDuration(attempt.started_at, attempt.finished_at)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isCompleted && completedIndex >= 0 && getTrendIcon(completedIndex)}
                            
                            {isCompleted ? (
                              <Badge 
                                variant={getScoreBadgeVariant(attempt.total_score!)}
                                className="text-base px-3 py-1"
                              >
                                {attempt.total_score!.toFixed(2)} / 10
                              </Badge>
                            ) : (
                              <Badge variant="secondary">No completado</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Prácticas Tab */}
          <TabsContent value="practicas" className="space-y-6">
            {/* Practice Stats Summary */}
            {!isLoading && practicas.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <PenLine className="h-4 w-4" />
                      Prácticas Realizadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{totalPracticas}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Caracteres Promedio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{avgCharacters.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Pausas Promedio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{avgPauses}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Prácticas List */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : practicas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <PenLine className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">Sin prácticas todavía</h3>
                  <p className="mt-2 text-muted-foreground">
                    Practica con preguntas por bloques para ver tu historial aquí.
                  </p>
                  <Link to="/bloques" className="mt-4 inline-block">
                    <Button>Ir a Bloques</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {practicas.map((attempt) => {
                  const timeUsed = attempt.timer_enabled && attempt.timer_minutes && attempt.time_remaining_seconds !== null
                    ? attempt.timer_minutes * 60 - attempt.time_remaining_seconds
                    : null;

                  return (
                    <Card key={attempt.id}>
                      <CardContent className="py-4">
                        <div className="flex flex-col gap-3">
                          {/* Header row */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(attempt.started_at), "d 'de' MMMM, yyyy", { locale: es })}
                              </span>
                              <span className="text-muted-foreground">
                                {format(new Date(attempt.started_at), 'HH:mm')}
                              </span>
                            </div>
                            
                            {/* Completion badge */}
                            {attempt.answered_parts_count !== null && attempt.total_parts_count !== null && (
                              <Badge variant="outline" className="gap-1 w-fit">
                                <CheckCircle2 className="h-3 w-3" />
                                {attempt.answered_parts_count}/{attempt.total_parts_count} apartados
                              </Badge>
                            )}
                          </div>

                          {/* Stats row */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            {/* Timer info */}
                            {attempt.timer_enabled && timeUsed !== null && (
                              <span className="flex items-center gap-1">
                                <Timer className="h-3.5 w-3.5" />
                                {formatTime(timeUsed)} de {attempt.timer_minutes} min
                              </span>
                            )}

                            {/* Pauses info */}
                            {attempt.timer_enabled && attempt.pause_count !== null && attempt.max_pauses !== null && (
                              <span className="flex items-center gap-1">
                                <Pause className="h-3.5 w-3.5" />
                                {attempt.pause_count}/{attempt.max_pauses} pausas
                                {attempt.total_paused_ms !== null && attempt.total_paused_ms > 0 && (
                                  <span className="text-xs">({formatPausedTime(attempt.total_paused_ms)})</span>
                                )}
                              </span>
                            )}

                            {/* Characters */}
                            {attempt.total_characters !== null && (
                              <span className="flex items-center gap-1">
                                <PenLine className="h-3.5 w-3.5" />
                                {attempt.total_characters.toLocaleString()} caracteres
                              </span>
                            )}

                            {/* Duration */}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(attempt.started_at, attempt.finished_at)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
