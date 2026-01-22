import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Users, 
  FileQuestion, 
  BarChart3,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestionManager } from '@/components/profesor/QuestionManager';
import { GlobalStats } from '@/components/profesor/GlobalStats';

interface DashboardStats {
  totalQuestions: number;
  totalAnswers: number;
  totalStudents: number;
  questionsByBlock: { code: string; count: number }[];
}

export default function Profesor() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Total questions
        const { count: questionsCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true });

        // Total answers
        const { count: answersCount } = await supabase
          .from('student_answers')
          .select('*', { count: 'exact', head: true });

        // Total students (profiles with alumno role)
        const { count: studentsCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'alumno');

        // Questions by block
        const { data: blocks } = await supabase
          .from('blocks')
          .select('id, code')
          .order('code');

        const questionsByBlock = await Promise.all(
          (blocks || []).map(async (block) => {
            const { count } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('block_id', block.id);
            return { code: block.code, count: count || 0 };
          })
        );

        setStats({
          totalQuestions: questionsCount || 0,
          totalAnswers: answersCount || 0,
          totalStudents: studentsCount || 0,
          questionsByBlock,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel del Profesor</h1>
            <p className="mt-1 text-muted-foreground">
              Gestiona preguntas, soluciones y consulta estadísticas
            </p>
          </div>
          <Link to="/bloques">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <FileQuestion className="h-4 w-4" />
                    Total Preguntas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalQuestions}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Respuestas Totales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalAnswers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Alumnos Registrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalStudents}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Por Bloque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {stats?.questionsByBlock.map((b) => (
                      <Badge key={b.code} variant="secondary" className="text-xs">
                        {b.code}: {b.count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="questions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="questions">Gestión de Preguntas</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas Globales</TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <QuestionManager />
          </TabsContent>

          <TabsContent value="stats">
            <GlobalStats />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
