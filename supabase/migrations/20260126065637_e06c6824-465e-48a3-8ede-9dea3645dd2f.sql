-- Fix attendance_sessions INSERT/UPDATE/DELETE policies to use role-based access
DROP POLICY IF EXISTS "Authenticated users can insert attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Authenticated users can update attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Authenticated users can delete attendance_sessions" ON public.attendance_sessions;

CREATE POLICY "Only admins and teachers can insert attendance_sessions"
ON public.attendance_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admins and teachers can update attendance_sessions"
ON public.attendance_sessions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admins and teachers can delete attendance_sessions"
ON public.attendance_sessions
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

-- Fix attendance_records INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Authenticated users can insert attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Authenticated users can update attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Authenticated users can delete attendance_records" ON public.attendance_records;

CREATE POLICY "Only admins and teachers can insert attendance_records"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admins and teachers can update attendance_records"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admins and teachers can delete attendance_records"
ON public.attendance_records
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

-- Fix students INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

CREATE POLICY "Only admins and teachers can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admins and teachers can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admins and teachers can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

-- Fix classes INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Authenticated users can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can update classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can delete classes" ON public.classes;

CREATE POLICY "Only admins and teachers can insert classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admins and teachers can update classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Only admins and teachers can delete classes"
ON public.classes
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
);

-- Fix storage policies for student-photos bucket
DROP POLICY IF EXISTS "Authenticated users can upload student photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view student photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update student photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete student photos" ON storage.objects;

CREATE POLICY "Admins and teachers can upload student photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-photos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Admins and teachers can view student photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-photos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Admins and teachers can update student photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-photos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Admins and teachers can delete student photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-photos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

-- Fix storage policies for session-photos bucket
DROP POLICY IF EXISTS "Authenticated users can upload session photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view session photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update session photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete session photos" ON storage.objects;

CREATE POLICY "Admins and teachers can upload session photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'session-photos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Admins and teachers can view session photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'session-photos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Admins and teachers can update session photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'session-photos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Admins and teachers can delete session photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'session-photos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

-- Create trigger to auto-assign teacher role to new users
CREATE OR REPLACE FUNCTION public.auto_assign_teacher_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'teacher');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_teacher_role();