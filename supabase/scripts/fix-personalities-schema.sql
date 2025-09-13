/*
  # Update personalities table schema to match TypeScript types

  This migration updates the personalities table to match the current
  TypeScript interface definitions and adds missing fields.
*/

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Replace 'role' column with 'prompt' column if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personalities' AND column_name = 'role'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personalities' AND column_name = 'prompt'
  ) THEN
    -- Rename role to prompt
    ALTER TABLE public.personalities RENAME COLUMN role TO prompt;
  END IF;

  -- Add prompt column if it doesn't exist at all
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personalities' AND column_name = 'prompt'
  ) THEN
    ALTER TABLE public.personalities ADD COLUMN prompt TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personalities' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.personalities ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
  END IF;

  -- Add is_active column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personalities' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.personalities ADD COLUMN is_active BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;

  -- Add openai_assistant_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personalities' AND column_name = 'openai_assistant_id'
  ) THEN
    ALTER TABLE public.personalities ADD COLUMN openai_assistant_id TEXT;
  END IF;

  -- Add files column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personalities' AND column_name = 'files'
  ) THEN
    ALTER TABLE public.personalities ADD COLUMN files JSONB DEFAULT '[]' NOT NULL;
  END IF;

  -- Add file_instruction column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personalities' AND column_name = 'file_instruction'
  ) THEN
    ALTER TABLE public.personalities ADD COLUMN file_instruction TEXT;
  END IF;
END $$;

-- Create or update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_personalities_updated_at ON public.personalities;

-- Create trigger for updated_at
CREATE TRIGGER update_personalities_updated_at
  BEFORE UPDATE ON public.personalities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Constraint for files array length (max 20 files)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'personalities_files_limit'
  ) THEN
    ALTER TABLE public.personalities 
    ADD CONSTRAINT personalities_files_limit 
    CHECK (jsonb_array_length(files) <= 20);
  END IF;
END $$;

-- Create GIN index for files JSONB column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'personalities_files_gin_idx'
  ) THEN
    CREATE INDEX personalities_files_gin_idx ON public.personalities USING GIN (files);
  END IF;
END $$;

-- Create index for openai_assistant_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'personalities_assistant_id_idx'
  ) THEN
    CREATE INDEX personalities_assistant_id_idx ON public.personalities (openai_assistant_id);
  END IF;
END $$;