import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { QuestionForm } from './QuestionForm';
import { QuestionPartEditor } from './QuestionPartEditor';

interface Block {
  id: string;
  code: string;
  name: string;
}

interface Question {
  id: string;
  statement: string;
  has_image: boolean;
  image_url: string | null;
  year: number | null;
  convocatoria: string | null;
  block_id: string;
  block: Block;
}

const blockColors: Record<string, string> = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-yellow-500',
  D: 'bg-purple-500',
  E: 'bg-red-500',
  F: 'bg-orange-500',
};

export function QuestionManager() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .order('code');

      if (blocksError) throw blocksError;
      setBlocks(blocksData || []);

      let query = supabase
        .from('questions')
        .select(`
          *,
          block:blocks(id, code, name)
        `)
        .order('created_at', { ascending: false });

      if (selectedBlock !== 'all') {
        query = query.eq('block_id', selectedBlock);
      }

      const { data: questionsData, error: questionsError } = await query;

      if (questionsError) throw questionsError;
      setQuestions(questionsData as Question[]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBlock]);

  const handleDelete = async (questionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta pregunta? Se eliminarán también todas las subpreguntas, soluciones y criterios asociados.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Error al eliminar la pregunta');
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleSuccess = () => {
    handleDialogClose();
    fetchData();
  };

  const toggleExpanded = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedBlock} onValueChange={setSelectedBlock}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filtrar por bloque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los bloques</SelectItem>
            {blocks.map((block) => (
              <SelectItem key={block.id} value={block.id}>
                Bloque {block.code}: {block.name.replace(`Bloque ${block.code}: `, '')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingQuestion(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Pregunta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
              </DialogTitle>
            </DialogHeader>
            <QuestionForm
              blocks={blocks}
              question={editingQuestion}
              onSuccess={handleSuccess}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay preguntas {selectedBlock !== 'all' ? 'en este bloque' : ''}. Crea la primera.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className={`${blockColors[question.block.code]} text-white`}>
                        {question.block.code}
                      </Badge>
                      {question.year && (
                        <Badge variant="outline">
                          {question.convocatoria} {question.year}
                        </Badge>
                      )}
                      {question.has_image && (
                        <Badge variant="secondary">Con imagen</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-medium leading-relaxed">
                      {question.statement.substring(0, 200)}
                      {question.statement.length > 200 && '...'}
                    </CardTitle>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(question.id)}
                    >
                      {expandedQuestion === question.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedQuestion === question.id && (
                <CardContent className="border-t pt-4">
                  <QuestionPartEditor questionId={question.id} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
