-- Fix security issue: Restrict students table access to admin/teacher roles only
DROP POLICY IF EXISTS "Authenticated users can read students" ON public.students;

CREATE POLICY "Only admins and teachers can read students"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

-- Fix security issue: Restrict attendance_records access to admin/teacher roles only
DROP POLICY IF EXISTS "Authenticated users can read attendance_records" ON public.attendance_records;

CREATE POLICY "Only admins and teachers can read attendance_records"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

-- Also restrict attendance_sessions for consistency
DROP POLICY IF EXISTS "Authenticated users can read attendance_sessions" ON public.attendance_sessions;

CREATE POLICY "Only admins and teachers can read attendance_sessions"
ON public.attendance_sessions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

-- Restrict classes read access as well for consistency
DROP POLICY IF EXISTS "Authenticated users can read classes" ON public.classes;

CREATE POLICY "Only admins and teachers can read classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);