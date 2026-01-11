-- Create classes table
CREATE TABLE public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    schedule TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_sessions table (for each time attendance is taken)
CREATE TABLE public.attendance_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_records table (individual student attendance)
CREATE TABLE public.attendance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
    confidence DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(session_id, student_id)
);

-- Enable Row Level Security (public access for now, no auth required)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access
CREATE POLICY "Allow public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow public insert classes" ON public.classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update classes" ON public.classes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete classes" ON public.classes FOR DELETE USING (true);

CREATE POLICY "Allow public read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Allow public read attendance_sessions" ON public.attendance_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance_sessions" ON public.attendance_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendance_sessions" ON public.attendance_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete attendance_sessions" ON public.attendance_sessions FOR DELETE USING (true);

CREATE POLICY "Allow public read attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance_records" ON public.attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendance_records" ON public.attendance_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete attendance_records" ON public.attendance_records FOR DELETE USING (true);

-- Create storage bucket for student photos and class photos
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true);

-- Storage policies for public access
CREATE POLICY "Allow public read student photos" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Allow public upload student photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "Allow public update student photos" ON storage.objects FOR UPDATE USING (bucket_id = 'student-photos');
CREATE POLICY "Allow public delete student photos" ON storage.objects FOR DELETE USING (bucket_id = 'student-photos');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();