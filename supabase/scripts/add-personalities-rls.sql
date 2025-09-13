/*
  # Add RLS policies for personalities table

  This migration adds Row Level Security policies for the personalities table
  to ensure users can only access their own personalities.
*/

-- Enable RLS on personalities table
ALTER TABLE public.personalities ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'personalities' AND policyname = 'Users can view their own personalities'
  ) THEN
    CREATE POLICY "Users can view their own personalities"
      ON public.personalities
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy for INSERT (create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'personalities' AND policyname = 'Users can insert their own personalities'
  ) THEN
    CREATE POLICY "Users can insert their own personalities"
      ON public.personalities
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy for UPDATE (modify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'personalities' AND policyname = 'Users can update their own personalities'
  ) THEN
    CREATE POLICY "Users can update their own personalities"
      ON public.personalities
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy for DELETE (remove)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'personalities' AND policyname = 'Users can delete their own personalities'
  ) THEN
    CREATE POLICY "Users can delete their own personalities"
      ON public.personalities
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;