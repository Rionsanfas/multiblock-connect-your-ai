-- Add 'moonshot' to the llm_provider enum
ALTER TYPE public.llm_provider ADD VALUE IF NOT EXISTS 'moonshot';