-- Migración: Añadir campos de clasificación a la tabla questions
-- Estos campos permiten una mejor organización y filtrado de preguntas PAU

-- 1. Crear tipo enum para tipo de examen
DO $$ BEGIN
    CREATE TYPE exam_type AS ENUM ('Ordinaria', 'Extraordinaria', 'Reserva', 'Suplente', 'Modelo Oficial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tipo enum para dificultad
DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('Baja', 'Media', 'Alta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Crear tipo enum para estado de revisión
DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('Pendiente', 'Revisado', 'Verificado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Añadir nuevos campos a la tabla questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS tipo_examen exam_type DEFAULT 'Ordinaria',
ADD COLUMN IF NOT EXISTS comunidad_autonoma TEXT DEFAULT 'Andalucía',
ADD COLUMN IF NOT EXISTS codigo_ccaa CHAR(3) DEFAULT 'AND',
ADD COLUMN IF NOT EXISTS fecha_examen DATE,
ADD COLUMN IF NOT EXISTS num_pregunta_original INTEGER,
ADD COLUMN IF NOT EXISTS image_description TEXT,
ADD COLUMN IF NOT EXISTS dificultad difficulty_level DEFAULT 'Media',
ADD COLUMN IF NOT EXISTS conceptos_clave TEXT[],
ADD COLUMN IF NOT EXISTS estado_revision review_status DEFAULT 'Pendiente',
ADD COLUMN IF NOT EXISTS puntuacion_total DECIMAL(3,1) DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 5. Añadir campo de puntuación a subquestions
ALTER TABLE public.subquestions
ADD COLUMN IF NOT EXISTS puntuacion DECIMAL(3,2) DEFAULT 0.50,
ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 6. Crear tabla de catálogo de comunidades autónomas
CREATE TABLE IF NOT EXISTS public.comunidades_autonomas (
      codigo CHAR(3) PRIMARY KEY,
      nombre TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );

-- 7. Insertar datos de comunidades autónomas
INSERT INTO public.comunidades_autonomas (codigo, nombre) VALUES
('AND', 'Andalucía'),
('ARA', 'Aragón'),
('AST', 'Asturias'),
('BAL', 'Islas Baleares'),
('CAN', 'Canarias'),
('CANT', 'Cantabria'),
('CYL', 'Castilla y León'),
('CLM', 'Castilla-La Mancha'),
('CAT', 'Cataluña'),
('VAL', 'Comunidad Valenciana'),
('EXT', 'Extremadura'),
('GAL', 'Galicia'),
('MAD', 'Madrid'),
('MUR', 'Murcia'),
('NAV', 'Navarra'),
('PV', 'País Vasco'),
('RIO', 'La Rioja'),
('CEU', 'Ceuta'),
('MEL', 'Melilla')
ON CONFLICT (codigo) DO NOTHING;

-- 8. Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_questions_tipo_examen ON public.questions(tipo_examen);
CREATE INDEX IF NOT EXISTS idx_questions_ccaa ON public.questions(codigo_ccaa);
CREATE INDEX IF NOT EXISTS idx_questions_year ON public.questions(year);
CREATE INDEX IF NOT EXISTS idx_questions_dificultad ON public.questions(dificultad);
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(active);

-- 9. Habilitar RLS en nueva tabla
ALTER TABLE public.comunidades_autonomas ENABLE ROW LEVEL SECURITY;

-- 10. Política de lectura pública para comunidades
CREATE POLICY "Anyone can view comunidades_autonomas" 
ON public.comunidades_autonomas FOR SELECT 
TO anon, authenticated 
USING (true);

-- 11. Comentarios de documentación
COMMENT ON COLUMN public.questions.tipo_examen IS 'Tipo de convocatoria: Ordinaria, Extraordinaria, Reserva, Suplente o Modelo Oficial';
COMMENT ON COLUMN public.questions.comunidad_autonoma IS 'Nombre completo de la comunidad autónoma';
COMMENT ON COLUMN public.questions.codigo_ccaa IS 'Código de 3 letras de la CCAA (AND, MAD, CAT...)';
COMMENT ON COLUMN public.questions.dificultad IS 'Nivel de dificultad estimado de la pregunta';
COMMENT ON COLUMN public.questions.conceptos_clave IS 'Array de palabras clave para búsqueda';
COMMENT ON COLUMN public.questions.estado_revision IS 'Estado de revisión de la pregunta';
COMMENT ON COLUMN public.questions.active IS 'Si la pregunta está activa para mostrar a estudiantes';
