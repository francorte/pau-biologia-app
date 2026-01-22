-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('alumno', 'profesor', 'admin');

-- 2. Create user_roles table (secure pattern - separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'alumno',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create blocks table (A-F thematic blocks)
CREATE TABLE public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code CHAR(1) NOT NULL UNIQUE CHECK (code IN ('A', 'B', 'C', 'D', 'E', 'F')),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create questions table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE NOT NULL,
    statement TEXT NOT NULL,
    has_image BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT,
    year INTEGER,
    convocatoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create subquestions table
CREATE TABLE public.subquestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    statement TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create solutions table
CREATE TABLE public.solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subquestion_id UUID REFERENCES public.subquestions(id) ON DELETE CASCADE NOT NULL UNIQUE,
    model_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Create correction_criteria table
CREATE TABLE public.correction_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subquestion_id UUID REFERENCES public.subquestions(id) ON DELETE CASCADE NOT NULL,
    criteria_text TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Create student_answers table
CREATE TABLE public.student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subquestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- 11. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 12. Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'profesor' THEN 2 
      WHEN 'alumno' THEN 3 
    END
  LIMIT 1
$$;

-- 13. RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 14. RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 15. RLS Policies for blocks (readable by all authenticated, writable by profesor/admin)
CREATE POLICY "Authenticated users can view blocks"
ON public.blocks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Profesores can manage blocks"
ON public.blocks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'profesor') OR public.has_role(auth.uid(), 'admin'));

-- 16. RLS Policies for questions
CREATE POLICY "Authenticated users can view questions"
ON public.questions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Profesores can manage questions"
ON public.questions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'profesor') OR public.has_role(auth.uid(), 'admin'));

-- 17. RLS Policies for subquestions
CREATE POLICY "Authenticated users can view subquestions"
ON public.subquestions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Profesores can manage subquestions"
ON public.subquestions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'profesor') OR public.has_role(auth.uid(), 'admin'));

-- 18. RLS Policies for solutions
CREATE POLICY "Authenticated users can view solutions"
ON public.solutions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Profesores can manage solutions"
ON public.solutions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'profesor') OR public.has_role(auth.uid(), 'admin'));

-- 19. RLS Policies for correction_criteria
CREATE POLICY "Authenticated users can view criteria"
ON public.correction_criteria FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Profesores can manage criteria"
ON public.correction_criteria FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'profesor') OR public.has_role(auth.uid(), 'admin'));

-- 20. RLS Policies for student_answers
CREATE POLICY "Students can view their own answers"
ON public.student_answers FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own answers"
ON public.student_answers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profesores can view all answers"
ON public.student_answers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'profesor') OR public.has_role(auth.uid(), 'admin'));

-- 21. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 22. Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solutions_updated_at
BEFORE UPDATE ON public.solutions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 23. Create function to handle new user signup (creates profile and assigns alumno role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    -- Assign default role (alumno)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'alumno');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 24. Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 25. Insert default blocks (A-F)
INSERT INTO public.blocks (code, name, description) VALUES
('A', 'Bloque A: La base molecular y fisicoquímica de la vida', 'Bioelementos, biomoléculas inorgánicas y orgánicas'),
('B', 'Bloque B: Morfología, estructura y funciones celulares', 'Célula procariota y eucariota, orgánulos, ciclo celular'),
('C', 'Bloque C: Genética y evolución', 'Genética molecular, herencia, mutaciones y evolución'),
('D', 'Bloque D: Microbiología e inmunología', 'Microorganismos, respuesta inmunitaria, vacunas'),
('E', 'Bloque E: Autodefensa de los organismos', 'Sistema inmunitario, antígenos, anticuerpos'),
('F', 'Bloque F: Biotecnología', 'Ingeniería genética, aplicaciones biotecnológicas');

-- 26. Create indexes for performance
CREATE INDEX idx_questions_block_id ON public.questions(block_id);
CREATE INDEX idx_subquestions_question_id ON public.subquestions(question_id);
CREATE INDEX idx_solutions_subquestion_id ON public.solutions(subquestion_id);
CREATE INDEX idx_correction_criteria_subquestion_id ON public.correction_criteria(subquestion_id);
CREATE INDEX idx_student_answers_user_id ON public.student_answers(user_id);
CREATE INDEX idx_student_answers_question_id ON public.student_answers(question_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);