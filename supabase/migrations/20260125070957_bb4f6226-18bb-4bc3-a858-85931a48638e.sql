-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- Policy for user_roles: admins can manage, users can view their own
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop all existing public policies
DROP POLICY IF EXISTS "Allow public delete attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public insert attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public read attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public update attendance_records" ON public.attendance_records;

DROP POLICY IF EXISTS "Allow public delete attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Allow public insert attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Allow public read attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Allow public update attendance_sessions" ON public.attendance_sessions;

DROP POLICY IF EXISTS "Allow public delete classes" ON public.classes;
DROP POLICY IF EXISTS "Allow public insert classes" ON public.classes;
DROP POLICY IF EXISTS "Allow public read classes" ON public.classes;
DROP POLICY IF EXISTS "Allow public update classes" ON public.classes;

DROP POLICY IF EXISTS "Allow public delete students" ON public.students;
DROP POLICY IF EXISTS "Allow public insert students" ON public.students;
DROP POLICY IF EXISTS "Allow public read students" ON public.students;
DROP POLICY IF EXISTS "Allow public update students" ON public.students;

-- Create new authenticated policies for classes
CREATE POLICY "Authenticated users can read classes"
ON public.classes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update classes"
ON public.classes FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete classes"
ON public.classes FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create new authenticated policies for students
CREATE POLICY "Authenticated users can read students"
ON public.students FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update students"
ON public.students FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete students"
ON public.students FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create new authenticated policies for attendance_sessions
CREATE POLICY "Authenticated users can read attendance_sessions"
ON public.attendance_sessions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert attendance_sessions"
ON public.attendance_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update attendance_sessions"
ON public.attendance_sessions FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete attendance_sessions"
ON public.attendance_sessions FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create new authenticated policies for attendance_records
CREATE POLICY "Authenticated users can read attendance_records"
ON public.attendance_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert attendance_records"
ON public.attendance_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update attendance_records"
ON public.attendance_records FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete attendance_records"
ON public.attendance_records FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Make student-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'student-photos';
UPDATE storage.buckets SET public = false WHERE id = 'session-photos';

-- Drop existing storage policies for student-photos
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Create authenticated storage policies for student-photos
CREATE POLICY "Authenticated users can upload student photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view student photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'student-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update student photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete student photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-photos' AND auth.uid() IS NOT NULL);

-- Create authenticated storage policies for session-photos
CREATE POLICY "Authenticated users can upload session photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'session-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view session photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'session-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update session photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'session-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete session photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'session-photos' AND auth.uid() IS NOT NULL);