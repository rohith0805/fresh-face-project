-- Add new columns to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS semester integer,
ADD COLUMN IF NOT EXISTS section text,
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS faculty_name text;

-- Add new columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS roll_no text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;