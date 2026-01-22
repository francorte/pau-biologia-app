-- Eliminar políticas RESTRICTIVE existentes
DROP POLICY IF EXISTS "Authenticated users can view blocks" ON public.blocks;
DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can view question_parts" ON public.question_parts;
DROP POLICY IF EXISTS "Authenticated users can view exams" ON public.exams;

-- Recrear como PERMISSIVE (el comportamiento por defecto)
CREATE POLICY "Authenticated users can view blocks"
  ON public.blocks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view question_parts"
  ON public.question_parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view exams"
  ON public.exams FOR SELECT
  TO authenticated
  USING (true);