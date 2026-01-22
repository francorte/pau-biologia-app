import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Block {
  id: string;
  code: string;
  name: string;
  description: string | null;
  question_count?: number;
}

const blockColors: Record<string, string> = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-yellow-500',
  D: 'bg-purple-500',
  E: 'bg-red-500',
  F: 'bg-orange-500',
};

export default function Bloques() {
  const { isDemoMode } = useAuthContext();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data: blocksData, error: blocksError } = await supabase
          .from('blocks')
          .select('*')
          .order('code');

        if (blocksError) throw blocksError;

        // Fetch question counts for each block (only active questions)
        const blocksWithCounts = await Promise.all(
          (blocksData || []).map(async (block) => {
            const { count } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('block_id', block.id)
              .eq('active', true);

            return {
              ...block,
              question_count: count || 0,
            };
          })
        );

        setBlocks(blocksWithCounts);
      } catch (err) {
        console.error('Error fetching blocks:', err);
        setError('Error al cargar los bloques temáticos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  return (
    <Layout>
      <div className="container px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Bloques Temáticos
          </h1>
          <p className="mt-2 text-muted-foreground">
            Selecciona un bloque para comenzar a practicar preguntas de PAU
          </p>
        </div>

        {isDemoMode && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Modo demo:</strong> Puedes explorar las preguntas y ver las correcciones, pero tu progreso no se guardará.{' '}
              <Link to="/registro" className="underline hover:no-underline">
                Crea una cuenta
              </Link>{' '}
              para guardar tus respuestas.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-4 h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blocks.map((block) => (
              <Card 
                key={block.id} 
                className="group overflow-hidden transition-shadow hover:shadow-lg"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={`${blockColors[block.code]} text-white text-lg px-3 py-1`}
                    >
                      {block.code}
                    </Badge>
                    <CardTitle className="text-lg leading-tight">
                      {block.name.replace(`Bloque ${block.code}: `, '')}
                    </CardTitle>
                  </div>
                  {block.description && (
                    <CardDescription className="mt-2 line-clamp-2">
                      {block.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {block.question_count === 0
                        ? 'Sin preguntas aún'
                        : `${block.question_count} pregunta${block.question_count !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <Link to={`/practica/${block.id}`}>
                    <Button 
                      className="w-full group-hover:bg-primary/90"
                      disabled={block.question_count === 0}
                    >
                      Empezar práctica
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && blocks.length === 0 && !error && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No hay bloques disponibles</h3>
            <p className="mt-2 text-muted-foreground">
              Los bloques temáticos serán añadidos próximamente
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
