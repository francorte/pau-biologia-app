import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Upload, X, Image as ImageIcon } from 'lucide-react';

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
}

interface QuestionFormProps {
  blocks: Block[];
  question: Question | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuestionForm({ blocks, question, onSuccess, onCancel }: QuestionFormProps) {
  const [statement, setStatement] = useState(question?.statement || '');
  const [blockId, setBlockId] = useState(question?.block_id || '');
  const [year, setYear] = useState(question?.year?.toString() || '');
  const [convocatoria, setConvocatoria] = useState(question?.convocatoria || '');
  const [hasImage, setHasImage] = useState(question?.has_image || false);
  const [imageUrl, setImageUrl] = useState(question?.image_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `questions/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      setHasImage(true);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setHasImage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!statement.trim()) {
      setError('El enunciado es obligatorio');
      return;
    }

    if (!blockId) {
      setError('Debes seleccionar un bloque');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        statement: statement.trim(),
        block_id: blockId,
        year: year ? parseInt(year) : null,
        convocatoria: convocatoria || null,
        has_image: hasImage && !!imageUrl,
        image_url: hasImage && imageUrl ? imageUrl : null,
      };

      if (question) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(data)
          .eq('id', question.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('questions')
          .insert(data);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving question:', err);
      setError(err.message || 'Error al guardar la pregunta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="block">Bloque temático *</Label>
        <Select value={blockId} onValueChange={setBlockId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un bloque" />
          </SelectTrigger>
          <SelectContent>
            {blocks.map((block) => (
              <SelectItem key={block.id} value={block.id}>
                {block.code} - {block.name.replace(`Bloque ${block.code}: `, '')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="statement">Enunciado *</Label>
        <Textarea
          id="statement"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Escribe el enunciado completo de la pregunta..."
          className="min-h-[150px]"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="year">Año</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="convocatoria">Convocatoria</Label>
          <Select value={convocatoria} onValueChange={setConvocatoria}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona convocatoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ordinaria">Ordinaria</SelectItem>
              <SelectItem value="Extraordinaria">Extraordinaria</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Image upload section */}
      <div className="space-y-4">
        <Label>Imagen de la pregunta</Label>
        
        {imageUrl ? (
          <div className="relative rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-4">
              <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-md border">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground break-all">
                  {imageUrl.length > 60 ? `${imageUrl.substring(0, 60)}...` : imageUrl}
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                >
                  <X className="mr-1 h-4 w-4" />
                  Eliminar imagen
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 transition-colors hover:border-primary/50 hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                </>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Haz clic para subir una imagen</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG o WEBP (máx. 5MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading || isSubmitting}
            />
            
            {/* Alternative: paste URL */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">o introduce una URL</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            
            <div className="flex gap-2">
              <Input
                type="url"
                value={hasImage ? '' : imageUrl}
                onChange={(e) => {
                  const url = e.target.value;
                  setImageUrl(url);
                  setHasImage(!!url);
                }}
                placeholder="https://ejemplo.com/imagen.jpg"
                disabled={isUploading || isSubmitting}
                className="flex-1"
              />
              {!hasImage && imageUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setHasImage(true)}
                  disabled={!imageUrl}
                >
                  <ImageIcon className="mr-1 h-4 w-4" />
                  Usar URL
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isUploading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : question ? (
            'Actualizar'
          ) : (
            'Crear Pregunta'
          )}
        </Button>
      </div>
    </form>
  );
}
