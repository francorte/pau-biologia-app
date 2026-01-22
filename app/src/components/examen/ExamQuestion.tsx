import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

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
}

interface ExamQuestionProps {
  question: Question;
  questionParts: QuestionPart[];
  answers: Record<string, string>;
  onAnswerChange: (partId: string, value: string) => void;
  questionNumber: number;
  totalQuestions: number;
  disabled?: boolean;
}

const blockColors: Record<string, string> = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-yellow-500',
  D: 'bg-purple-500',
  E: 'bg-red-500',
  F: 'bg-orange-500',
};

export function ExamQuestion({
  question,
  questionParts,
  answers,
  onAnswerChange,
  questionNumber,
  totalQuestions,
  disabled = false,
}: ExamQuestionProps) {
  return (
    <div className="space-y-4">
      {/* Question Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={`${blockColors[question.block.code]} text-white`}>
              Bloque {question.block.code}
            </Badge>
            <Badge variant="outline">
              Pregunta {questionNumber} de {totalQuestions}
            </Badge>
            {question.year && (
              <Badge variant="secondary">
                {question.convocatoria} {question.year}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg font-medium leading-relaxed">
            {question.statement}
          </CardTitle>
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

      {/* Question Parts */}
      {questionParts.length > 0 ? (
        <div className="space-y-4">
          {questionParts.map((part) => (
            <Card key={part.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  <span className="mr-2 font-bold text-primary">{part.label})</span>
                  {part.statement}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({part.max_score} puntos)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Escribe tu respuesta aquí..."
                  value={answers[part.id] || ''}
                  onChange={(e) => onAnswerChange(part.id, e.target.value)}
                  className="min-h-[100px] resize-y"
                  disabled={disabled}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Escribe tu respuesta aquí..."
              value={answers['main'] || ''}
              onChange={(e) => onAnswerChange('main', e.target.value)}
              className="min-h-[150px] resize-y"
              disabled={disabled}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
