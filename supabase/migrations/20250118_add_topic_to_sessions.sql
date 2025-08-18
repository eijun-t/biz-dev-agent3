-- Add missing columns to ideation_sessions table
ALTER TABLE public.ideation_sessions 
ADD COLUMN IF NOT EXISTS theme TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS result JSONB,
ADD COLUMN IF NOT EXISTS final_report JSONB;

-- Update existing rows to have a default theme/topic if null
UPDATE public.ideation_sessions 
SET theme = 'Unknown Theme' 
WHERE theme IS NULL;

UPDATE public.ideation_sessions 
SET topic = theme 
WHERE topic IS NULL AND theme IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_ideation_sessions_created_at ON public.ideation_sessions(created_at DESC);