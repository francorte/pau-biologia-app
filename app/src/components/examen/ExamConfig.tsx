import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Shuffle, FileQuestion, Play, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Block {
  id: string;
  code: string;
  name: string;
  question_count: number;
}

export interface ExamConfigData {
  selectedBlocks: string[];
  questionCount: number;
  durationMinutes: number;
}

interface ExamConfigProps {
  onStartExam: (config: ExamConfigData) => void;
}

const blockColors: Record<string, string> = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-yellow-500',
  D: 'bg-purple-500',
  E: 'bg-red-500',
  F: 'bg-orange-500',
};

export function ExamConfig({ onStartExam }: ExamConfigProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(90);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data: blocksData, error: blocksError } = await supabase
          .from('blocks')
          .select('*')
          .order('code');

        if (blocksError) throw blocksError;

        // Fetch question counts
        const blocksWithCounts = await Promise.all(
          (blocksData || []).map(async (block) => {
            const { count } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('block_id', block.id);

            return {
              ...block,
              question_count: count || 0,
            };
          })
        );

        setBlocks(blocksWithCounts);
        // Select all blocks by default
        setSelectedBlocks(blocksWithCounts.filter(b => b.question_count > 0).map(b => b.id));
      } catch (err) {
        console.error('Error fetching blocks:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  const totalQuestionsAvailable = blocks
    .filter((b) => selectedBlocks.includes(b.id))
    .reduce((acc, b) => acc + b.question_count, 0);

  const maxQuestions = Math.min(totalQuestionsAvailable, 10);

  const toggleBlock = (blockId: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(blockId)
        ? prev.filter((id) => id !== blockId)
        : [...prev, blockId]
    );
  };

  const handleStartExam = () => {
    onStartExam({
      selectedBlocks,
      questionCount: Math.min(questionCount, maxQuestions),
      durationMinutes,
    });
  };

  const canStart = selectedBlocks.length > 0 && totalQuestionsAvailable > 0;

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <FileQuestion className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="mt-4 text-2xl">Modo Examen PAU</CardTitle>
        <CardDescription>
          Simula las condiciones reales de la Prueba de Acceso a la Universidad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Block Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Bloques temáticos</Label>
          <p className="text-sm text-muted-foreground">
            Selecciona los bloques de los que quieres practicar
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {blocks.map((block) => (
              <label
                key={block.id}
                className={`
                  flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors
                  ${selectedBlocks.includes(block.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                  ${block.question_count === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Checkbox
                  checked={selectedBlocks.includes(block.id)}
                  onCheckedChange={() => toggleBlock(block.id)}
                  disabled={block.question_count === 0}
                />
                <div className="flex flex-1 items-center justify-between">
                  <Badge className={`${blockColors[block.code]} text-white`}>
                    {block.code}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {block.question_count} preg.
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Número de preguntas</Label>
            <Badge variant="secondary" className="font-mono">
              {Math.min(questionCount, maxQuestions)} / {maxQuestions} disponibles
            </Badge>
          </div>
          <Slider
            value={[Math.min(questionCount, maxQuestions)]}
            onValueChange={([value]) => setQuestionCount(value)}
            min={1}
            max={maxQuestions || 1}
            step={1}
            disabled={maxQuestions === 0}
            className="py-4"
          />
          <p className="text-sm text-muted-foreground">
            Las preguntas se seleccionarán aleatoriamente de los bloques elegidos
          </p>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Duración del examen</Label>
            <Badge variant="secondary" className="font-mono">
              <Clock className="mr-1 h-3 w-3" />
              {durationMinutes} minutos
            </Badge>
          </div>
          <Slider
            value={[durationMinutes]}
            onValueChange={([value]) => setDurationMinutes(value)}
            min={15}
            max={120}
            step={15}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>15 min</span>
            <span className="font-medium">PAU Real: 90 min</span>
            <span>120 min</span>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Shuffle className="h-4 w-4" />
          <AlertDescription>
            Las preguntas serán aleatorias y el temporizador comenzará al iniciar. 
            No podrás pausar ni retroceder una vez enviada una respuesta.
          </AlertDescription>
        </Alert>

        {/* Start Button */}
        <Button
          onClick={handleStartExam}
          disabled={!canStart}
          size="lg"
          className="w-full"
        >
          <Play className="mr-2 h-5 w-5" />
          Comenzar Examen
        </Button>

        {!canStart && (
          <p className="text-center text-sm text-destructive">
            Selecciona al menos un bloque con preguntas disponibles
          </p>
        )}
      </CardContent>
    </Card>
  );
}
