-- =====================================================
-- MIGRACIÓN: Estructura PRD PAU Biología
-- =====================================================

-- 1. Crear tabla de exámenes oficiales (exams)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL,
    convocatoria TEXT NOT NULL, -- 'ordinaria' | 'extraordinaria' | 'modelo'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para exams
CREATE POLICY "Authenticated users can view exams"
ON public.exams FOR SELECT
USING (true);

CREATE POLICY "Profesores can manage exams"
ON public.exams FOR ALL
USING (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Crear tabla question_parts (reemplaza subquestions + solutions + correction_criteria)
CREATE TABLE IF NOT EXISTS public.question_parts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- 'a', 'b', 'c', etc.
    statement TEXT NOT NULL,
    max_score NUMERIC(3,2) NOT NULL DEFAULT 0.5, -- Puntuación máxima del apartado
    correction_text TEXT NOT NULL, -- Texto modelo oficial de corrección
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en question_parts
ALTER TABLE public.question_parts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para question_parts
CREATE POLICY "Authenticated users can view question_parts"
ON public.question_parts FOR SELECT
USING (true);

CREATE POLICY "Profesores can manage question_parts"
ON public.question_parts FOR ALL
USING (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Añadir columnas a questions para vincular con exams y control de activo
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- 4. Crear tabla attempts (intentos de práctica o simulacro)
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('practice', 'simulacro')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    finished_at TIMESTAMP WITH TIME ZONE,
    total_score NUMERIC(4,2) -- Solo para simulacros
);

-- Habilitar RLS en attempts
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para attempts
CREATE POLICY "Users can view their own attempts"
ON public.attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts"
ON public.attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts"
ON public.attempts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Profesores can view all attempts"
ON public.attempts FOR SELECT
USING (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Crear tabla answers (respuestas por apartado)
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_part_id UUID NOT NULL REFERENCES public.question_parts(id) ON DELETE CASCADE,
    user_text TEXT NOT NULL DEFAULT '',
    score NUMERIC(3,2), -- Solo se rellena en simulacros al finalizar
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en answers
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para answers
CREATE POLICY "Users can view their own answers"
ON public.answers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.attempts 
        WHERE attempts.id = answers.attempt_id 
        AND attempts.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create their own answers"
ON public.answers FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.attempts 
        WHERE attempts.id = answers.attempt_id 
        AND attempts.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own answers"
ON public.answers FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.attempts 
        WHERE attempts.id = answers.attempt_id 
        AND attempts.user_id = auth.uid()
    )
);

CREATE POLICY "Profesores can view all answers"
ON public.answers FOR SELECT
USING (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 6. Migrar datos de subquestions + solutions + correction_criteria a question_parts
INSERT INTO public.question_parts (id, question_id, label, statement, max_score, correction_text, order_index, created_at)
SELECT 
    sq.id,
    sq.question_id,
    sq.label,
    sq.statement,
    0.5 as max_score,
    COALESCE(
        (SELECT s.model_answer FROM public.solutions s WHERE s.subquestion_id = sq.id),
        ''
    ) as correction_text,
    sq.order_index,
    sq.created_at
FROM public.subquestions sq
ON CONFLICT (id) DO NOTHING;

-- 7. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_question_parts_question_id ON public.question_parts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_mode ON public.attempts(mode);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON public.answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(active);