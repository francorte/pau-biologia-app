import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';

interface QuestionPart {
  id: string;
  label: string;
  statement: string;
  max_score: number;
  correction_text: string;
  order_index: number;
}

interface QuestionPartEditorProps {
  questionId: string;
}

export function QuestionPartEditor({ questionId }: QuestionPartEditorProps) {
  const [parts, setParts] = useState<QuestionPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchParts = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('question_parts')
        .select('*')
        .eq('question_id', questionId)
        .order('order_index');

      if (fetchError) throw fetchError;

      setParts(data || []);
    } catch (err) {
      console.error('Error fetching question_parts:', err);
      setError('Error al cargar los apartados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [questionId]);

  const addPart = () => {
    const nextLabel = String.fromCharCode(97 + parts.length); // a, b, c...
    setParts([
      ...parts,
      {
        id: `new-${Date.now()}`,
        label: nextLabel,
        statement: '',
        max_score: 0.5,
        correction_text: '',
        order_index: parts.length,
      },
    ]);
  };

  const updatePart = (index: number, field: keyof QuestionPart, value: any) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const removePart = async (index: number) => {
    const part = parts[index];
    
    if (!part.id.startsWith('new-')) {
      if (!confirm('¿Eliminar este apartado?')) return;
      
      try {
        const { error: deleteError } = await supabase
          .from('question_parts')
          .delete()
          .eq('id', part.id);
        
        if (deleteError) throw deleteError;
      } catch (err) {
        console.error('Error deleting part:', err);
        setError('Error al eliminar el apartado');
        return;
      }
    }
    
    const updated = [...parts];
    updated.splice(index, 1);
    // Re-order remaining parts
    updated.forEach((p, i) => {
      p.order_index = i;
      p.label = String.fromCharCode(97 + i);
    });
    setParts(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (!part.statement.trim()) {
          setError(`El apartado ${part.label}) necesita un enunciado`);
          setIsSaving(false);
          return;
        }

        if (part.id.startsWith('new-')) {
          const { error: insertError } = await supabase
            .from('question_parts')
            .insert({
              question_id: questionId,
              label: part.label,
              statement: part.statement,
              max_score: part.max_score,
              correction_text: part.correction_text,
              order_index: i,
            });

          if (insertError) throw insertError;
        } else {
          const { error: updateError } = await supabase
            .from('question_parts')
            .update({
              label: part.label,
              statement: part.statement,
              max_score: part.max_score,
              correction_text: part.correction_text,
              order_index: i,
            })
            .eq('id', part.id);

          if (updateError) throw updateError;
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchParts(); // Refresh data
    } catch (err: any) {
      console.error('Error saving:', err);
      setError(err.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total score
  const totalScore = parts.reduce((sum, p) => sum + (p.max_score || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Guardado correctamente</AlertDescription>
        </Alert>
      )}

      {/* Total score indicator */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
        <span className="text-sm text-muted-foreground">Puntuación total:</span>
        <span className={`font-bold ${totalScore === 2 ? 'text-green-600' : 'text-amber-600'}`}>
          {totalScore.toFixed(2)} / 2.00 puntos
        </span>
      </div>

      {parts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No hay apartados. Añade el primero.</p>
        </div>
      ) : (
        parts.map((part, index) => (
          <Card key={part.id} className="bg-muted/30">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Apartado {part.label})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removePart(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-4 sm:grid-cols-[80px_1fr]">
                <div className="space-y-2">
                  <Label className="text-xs">Etiqueta</Label>
                  <Input
                    value={part.label}
                    onChange={(e) => updatePart(index, 'label', e.target.value)}
                    className="h-9"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Enunciado del apartado</Label>
                  <Textarea
                    value={part.statement}
                    onChange={(e) => updatePart(index, 'statement', e.target.value)}
                    placeholder="Escribe el enunciado de este apartado..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Max Score */}
              <div className="space-y-2">
                <Label className="text-xs">Puntuación máxima</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    max="2"
                    value={part.max_score}
                    onChange={(e) => updatePart(index, 'max_score', parseFloat(e.target.value) || 0)}
                    className="h-9 w-24"
                  />
                  <span className="text-sm text-muted-foreground">puntos</span>
                </div>
              </div>

              {/* Correction Text */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Texto modelo de corrección (oficial PAU)
                </Label>
                <Textarea
                  value={part.correction_text}
                  onChange={(e) => updatePart(index, 'correction_text', e.target.value)}
                  placeholder="Escribe el texto modelo oficial de corrección..."
                  className="min-h-[100px] border-green-200 bg-green-50/50"
                />
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={addPart}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir apartado
        </Button>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar todo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
