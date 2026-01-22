-- Permitir a usuarios anónimos ver contenido de solo lectura
CREATE POLICY "Anon can view blocks" ON public.blocks FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view questions" ON public.questions FOR SELECT TO anon USING (active = true);
CREATE POLICY "Anon can view question_parts" ON public.question_parts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view exams" ON public.exams FOR SELECT TO anon USING (true);