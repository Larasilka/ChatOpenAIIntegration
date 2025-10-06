/*
  # Clean up legacy RAG table

  This script removes the personality_embeddings table which is no longer used
  in the current architecture. The project now uses OpenAI Vector Stores 
  instead of local embeddings storage.
*/

-- Drop the legacy personality_embeddings table
DROP TABLE IF EXISTS personality_embeddings CASCADE;

-- Drop related indexes if they exist
DROP INDEX IF EXISTS personality_embeddings_personality_id_idx;

-- Note: This is safe to run as the table is not used in current codebase
-- The project now uses OpenAI Vector Stores for RAG functionality