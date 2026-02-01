-- Create teacher_classes table to link teachers to their assigned classes
CREATE TABLE public.teacher_classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, class_id)
);

-- Enable RLS on teacher_classes
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- Admins can manage all teacher-class assignments
CREATE POLICY "Admins can manage all teacher_classes"
ON public.teacher_classes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can view their own assignments
CREATE POLICY "Teachers can view their own class assignments"
ON public.teacher_classes
FOR SELECT
USING (auth.uid() = user_id);

-- Create helper function to check if user has access to a class
CREATE OR REPLACE FUNCTION public.user_has_class_access(_user_id UUID, _class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(_user_id, 'admin'::app_role) 
    OR EXISTS (
      SELECT 1 FROM public.teacher_classes 
      WHERE user_id = _user_id AND class_id = _class_id
    )
$$;

-- Drop existing RLS policies on students table
DROP POLICY IF EXISTS "Only admins and teachers can read students" ON public.students;
DROP POLICY IF EXISTS "Only admins and teachers can insert students" ON public.students;
DROP POLICY IF EXISTS "Only admins and teachers can update students" ON public.students;
DROP POLICY IF EXISTS "Only admins and teachers can delete students" ON public.students;

-- Create new scoped RLS policies for students
-- Admins can access all students, teachers only students in their assigned classes
CREATE POLICY "Admins can access all students"
ON public.students
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can read students in their classes"
ON public.students
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can insert students in their classes"
ON public.students
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can update students in their classes"
ON public.students
FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can delete students in their classes"
ON public.students
FOR DELETE
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

-- Update classes policies to scope teacher access
DROP POLICY IF EXISTS "Only admins and teachers can read classes" ON public.classes;
DROP POLICY IF EXISTS "Only admins and teachers can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Only admins and teachers can update classes" ON public.classes;
DROP POLICY IF EXISTS "Only admins and teachers can delete classes" ON public.classes;

CREATE POLICY "Admins can access all classes"
ON public.classes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can read their assigned classes"
ON public.classes
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), id)
);

CREATE POLICY "Teachers can update their assigned classes"
ON public.classes
FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), id)
);

-- Update attendance_sessions policies
DROP POLICY IF EXISTS "Only admins and teachers can read attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Only admins and teachers can insert attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Only admins and teachers can update attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Only admins and teachers can delete attendance_sessions" ON public.attendance_sessions;

CREATE POLICY "Admins can access all attendance_sessions"
ON public.attendance_sessions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can read attendance_sessions in their classes"
ON public.attendance_sessions
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can insert attendance_sessions in their classes"
ON public.attendance_sessions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can update attendance_sessions in their classes"
ON public.attendance_sessions
FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can delete attendance_sessions in their classes"
ON public.attendance_sessions
FOR DELETE
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

-- Update class_subjects policies
DROP POLICY IF EXISTS "Only admins and teachers can read class_subjects" ON public.class_subjects;
DROP POLICY IF EXISTS "Only admins and teachers can insert class_subjects" ON public.class_subjects;
DROP POLICY IF EXISTS "Only admins and teachers can update class_subjects" ON public.class_subjects;
DROP POLICY IF EXISTS "Only admins and teachers can delete class_subjects" ON public.class_subjects;

CREATE POLICY "Admins can access all class_subjects"
ON public.class_subjects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can read class_subjects in their classes"
ON public.class_subjects
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can insert class_subjects in their classes"
ON public.class_subjects
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can update class_subjects in their classes"
ON public.class_subjects
FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);

CREATE POLICY "Teachers can delete class_subjects in their classes"
ON public.class_subjects
FOR DELETE
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND user_has_class_access(auth.uid(), class_id)
);