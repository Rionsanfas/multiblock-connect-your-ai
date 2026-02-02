-- Add scope enum type
CREATE TYPE public.memory_scope AS ENUM ('board', 'block', 'chat');

-- Add scope column to board_memory
ALTER TABLE public.board_memory 
ADD COLUMN scope public.memory_scope NOT NULL DEFAULT 'board';

-- Add index for efficient scope-based queries
CREATE INDEX idx_board_memory_scope ON public.board_memory(scope);
CREATE INDEX idx_board_memory_source_block ON public.board_memory(source_block_id) WHERE source_block_id IS NOT NULL;

-- Add keywords column for search/filtering
ALTER TABLE public.board_memory
ADD COLUMN keywords text[] DEFAULT '{}';

-- Create index for keyword search
CREATE INDEX idx_board_memory_keywords ON public.board_memory USING GIN(keywords);