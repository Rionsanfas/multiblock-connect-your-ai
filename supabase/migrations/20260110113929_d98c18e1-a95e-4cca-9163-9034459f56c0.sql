-- Add new LLM providers to the enum
ALTER TYPE public.llm_provider ADD VALUE IF NOT EXISTS 'mistral';
ALTER TYPE public.llm_provider ADD VALUE IF NOT EXISTS 'cohere';
ALTER TYPE public.llm_provider ADD VALUE IF NOT EXISTS 'groq';
ALTER TYPE public.llm_provider ADD VALUE IF NOT EXISTS 'together';
ALTER TYPE public.llm_provider ADD VALUE IF NOT EXISTS 'perplexity';