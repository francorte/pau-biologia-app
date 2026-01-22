import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Clock, Pause, PenLine, Timer, Users, CheckCircle2 } from 'lucide-react';

interface BlockData {
  code: string;
  name: string;
  questions: number;
  answers: number;
}

interface DailyActivity {
  date: string;
  count: number;
}

interface PracticeStats {
  totalPractices: number;
  uniqueStudents: number;
  avgTimeUsedSeconds: number;
  avgPauseCount: number;
  avgTotalPausedMs: number;
  avgCharacters: number;
  avgCompletionRate: number;
  timerUsageRate: number;
  practicesWithTimer: number;
  practicesWithoutTimer: number;
}

interface DailyPracticeActivity {
  date: string;
  practices: number;
  avgCharacters: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ef4444', '#f97316'];

export function GlobalStats() {
  const [blockData, setBlockData] = useState<BlockData[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [practiceStats, setPracticeStats] = useState<PracticeStats | null>(null);
  const [dailyPracticeActivity, setDailyPracticeActivity] = useState<DailyPracticeActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch blocks with question and answer counts
        const { data: blocks } = await supabase
          .from('blocks')
          .select('id, code, name')
          .order('code');

        const blockStats = await Promise.all(
          (blocks || []).map(async (block) => {
            const { count: questionCount } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('block_id', block.id);

            const { data: questions } = await supabase
              .from('questions')
              .select('id')
              .eq('block_id', block.id);

            const questionIds = questions?.map(q => q.id) || [];
            
            let answerCount = 0;
            if (questionIds.length > 0) {
              const { count } = await supabase
                .from('student_answers')
                .select('*', { count: 'exact', head: true })
                .in('question_id', questionIds);
              answerCount = count || 0;
            }

            return {
              code: block.code,
              name: block.name.replace(`Bloque ${block.code}: `, ''),
              questions: questionCount || 0,
              answers: answerCount,
            };
          })
        );

        setBlockData(blockStats);

        // Fetch daily activity (last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const { data: answers } = await supabase
          .from('student_answers')
          .select('created_at')
          .gte('created_at', fourteenDaysAgo.toISOString())
          .order('created_at');

        const activityMap = new Map<string, number>();
        for (let i = 0; i < 14; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (13 - i));
          activityMap.set(date.toISOString().split('T')[0], 0);
        }

        (answers || []).forEach((answer) => {
          const date = answer.created_at.split('T')[0];
          if (activityMap.has(date)) {
            activityMap.set(date, (activityMap.get(date) || 0) + 1);
          }
        });

        const activity = Array.from(activityMap.entries()).map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          count,
        }));

        setDailyActivity(activity);

        // Fetch practice statistics
        const { data: practices } = await supabase
          .from('attempts')
          .select('*')
          .eq('mode', 'practice');

        if (practices && practices.length > 0) {
          const uniqueStudentIds = new Set(practices.map(p => p.user_id));
          const practicesWithTimer = practices.filter(p => p.timer_enabled);
          const practicesWithStats = practices.filter(p => p.total_characters !== null);

          // Calculate averages
          const avgTimeUsed = practicesWithTimer.length > 0
            ? practicesWithTimer.reduce((sum, p) => {
                if (p.timer_minutes && p.time_remaining_seconds !== null) {
                  return sum + (p.timer_minutes * 60 - p.time_remaining_seconds);
                }
                return sum;
              }, 0) / practicesWithTimer.length
            : 0;

          const avgPauses = practicesWithTimer.length > 0
            ? practicesWithTimer.reduce((sum, p) => sum + (p.pause_count || 0), 0) / practicesWithTimer.length
            : 0;

          const avgPausedTime = practicesWithTimer.length > 0
            ? practicesWithTimer.reduce((sum, p) => sum + (p.total_paused_ms || 0), 0) / practicesWithTimer.length
            : 0;

          const avgChars = practicesWithStats.length > 0
            ? practicesWithStats.reduce((sum, p) => sum + (p.total_characters || 0), 0) / practicesWithStats.length
            : 0;

          const avgCompletion = practicesWithStats.length > 0
            ? practicesWithStats.reduce((sum, p) => {
                if (p.answered_parts_count !== null && p.total_parts_count !== null && p.total_parts_count > 0) {
                  return sum + (p.answered_parts_count / p.total_parts_count);
                }
                return sum;
              }, 0) / practicesWithStats.length * 100
            : 0;

          setPracticeStats({
            totalPractices: practices.length,
            uniqueStudents: uniqueStudentIds.size,
            avgTimeUsedSeconds: avgTimeUsed,
            avgPauseCount: avgPauses,
            avgTotalPausedMs: avgPausedTime,
            avgCharacters: avgChars,
            avgCompletionRate: avgCompletion,
            timerUsageRate: (practicesWithTimer.length / practices.length) * 100,
            practicesWithTimer: practicesWithTimer.length,
            practicesWithoutTimer: practices.length - practicesWithTimer.length,
          });

          // Daily practice activity
          const practiceActivityMap = new Map<string, { count: number; totalChars: number }>();
          for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (13 - i));
            practiceActivityMap.set(date.toISOString().split('T')[0], { count: 0, totalChars: 0 });
          }

          practices.forEach((practice) => {
            const date = practice.started_at.split('T')[0];
            if (practiceActivityMap.has(date)) {
              const current = practiceActivityMap.get(date)!;
              practiceActivityMap.set(date, {
                count: current.count + 1,
                totalChars: current.totalChars + (practice.total_characters || 0),
              });
            }
          });

          const dailyPractice = Array.from(practiceActivityMap.entries()).map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            practices: data.count,
            avgCharacters: data.count > 0 ? Math.round(data.totalChars / data.count) : 0,
          }));

          setDailyPracticeActivity(dailyPractice);
        }
      } catch (err) {
        console.error('Error fetching global stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
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

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAnswers = blockData.reduce((sum, b) => sum + b.answers, 0);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="general">Estadísticas Generales</TabsTrigger>
        <TabsTrigger value="practicas">Estadísticas de Práctica</TabsTrigger>
      </TabsList>

      {/* General Stats Tab */}
      <TabsContent value="general" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Questions by Block */}
          <Card>
            <CardHeader>
              <CardTitle>Preguntas por Bloque</CardTitle>
              <CardDescription>Distribución de preguntas en cada bloque temático</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={blockData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="code" type="category" width={40} />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'questions' ? 'Preguntas' : 'Respuestas']}
                    labelFormatter={(label) => `Bloque ${label}`}
                  />
                  <Bar dataKey="questions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Answers Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Respuestas</CardTitle>
              <CardDescription>Respuestas de alumnos por bloque</CardDescription>
            </CardHeader>
            <CardContent>
              {totalAnswers === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Aún no hay respuestas de alumnos
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={blockData.filter(b => b.answers > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ code, percent }) => `${code} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="answers"
                    >
                      {blockData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Respuestas']}
                      labelFormatter={(_, payload) => payload[0]?.payload?.name || ''}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Diaria</CardTitle>
            <CardDescription>Respuestas enviadas en los últimos 14 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Respuestas']} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Block Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Bloque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Bloque</th>
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium text-center">Preguntas</th>
                    <th className="pb-3 font-medium text-center">Respuestas</th>
                    <th className="pb-3 font-medium text-center">Promedio/Pregunta</th>
                  </tr>
                </thead>
                <tbody>
                  {blockData.map((block, index) => (
                    <tr key={block.code} className="border-b last:border-0">
                      <td className="py-3">
                        <Badge style={{ backgroundColor: COLORS[index] }} className="text-white">
                          {block.code}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">{block.name}</td>
                      <td className="py-3 text-center font-medium">{block.questions}</td>
                      <td className="py-3 text-center font-medium">{block.answers}</td>
                      <td className="py-3 text-center text-muted-foreground">
                        {block.questions > 0 ? (block.answers / block.questions).toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Practice Stats Tab */}
      <TabsContent value="practicas" className="space-y-6">
        {!practiceStats || practiceStats.totalPractices === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PenLine className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Sin datos de prácticas</h3>
              <p className="mt-2 text-muted-foreground">
                Aún no hay estadísticas de práctica disponibles.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <PenLine className="h-4 w-4" />
                    Total Prácticas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{practiceStats.totalPractices}</p>
                  <p className="text-sm text-muted-foreground">
                    {practiceStats.uniqueStudents} alumnos únicos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Tiempo Promedio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatTime(practiceStats.avgTimeUsedSeconds)}</p>
                  <p className="text-sm text-muted-foreground">
                    {practiceStats.timerUsageRate.toFixed(0)}% usan temporizador
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pausas Promedio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{practiceStats.avgPauseCount.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPausedTime(practiceStats.avgTotalPausedMs)} pausado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Tasa Completado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{practiceStats.avgCompletionRate.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">
                    ~{Math.round(practiceStats.avgCharacters).toLocaleString()} caracteres
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Timer Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Uso del Temporizador</CardTitle>
                  <CardDescription>Prácticas con y sin temporizador</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Con temporizador', value: practiceStats.practicesWithTimer },
                          { name: 'Sin temporizador', value: practiceStats.practicesWithoutTimer },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#94a3b8" />
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Prácticas']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Characters Written Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Caracteres Promedio por Día</CardTitle>
                  <CardDescription>Productividad de escritura en los últimos 14 días</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dailyPracticeActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          value, 
                          name === 'avgCharacters' ? 'Caracteres promedio' : 'Prácticas'
                        ]} 
                      />
                      <Bar dataKey="avgCharacters" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Daily Practice Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad de Prácticas</CardTitle>
                <CardDescription>Prácticas realizadas en los últimos 14 días</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyPracticeActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [value, 'Prácticas']} />
                    <Line 
                      type="monotone" 
                      dataKey="practices" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      dot={{ fill: '#a855f7' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Insights Clave</CardTitle>
                <CardDescription>Resumen de comportamiento de los alumnos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Timer className="h-5 w-5" />
                      <span className="font-medium">Gestión del Tiempo</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {practiceStats.timerUsageRate >= 50 
                        ? 'La mayoría de alumnos practica con temporizador, simulando condiciones reales.'
                        : 'Muchos alumnos prefieren practicar sin límite de tiempo.'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Pause className="h-5 w-5" />
                      <span className="font-medium">Uso de Pausas</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {practiceStats.avgPauseCount >= 2
                        ? 'Los alumnos utilizan las pausas con frecuencia para reflexionar.'
                        : 'Los alumnos raramente pausan, manteniendo el flujo de trabajo.'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Completitud</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {practiceStats.avgCompletionRate >= 80
                        ? 'Excelente tasa de respuestas completadas por los alumnos.'
                        : practiceStats.avgCompletionRate >= 50
                          ? 'La mayoría completa más de la mitad de los apartados.'
                          : 'Hay margen para mejorar la completitud de respuestas.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
