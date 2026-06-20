-- Add group_number column to quiz_questions and quiz_results tables
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS group_number INTEGER DEFAULT 1;

ALTER TABLE public.quiz_results 
ADD COLUMN IF NOT EXISTS group_number INTEGER DEFAULT 1;
