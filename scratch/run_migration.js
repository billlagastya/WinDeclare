import { createClient } from '@supabase/supabase-js';

const url = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc2RzamN3bmljamhkc3ptZGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTMwNzI0MiwiZXhwIjoyMTAwODgzMjQyfQ.FZF6oZvpNoMyaFKg2oaZFeoIn-AsCYZhami0VBVYL4M';
const supabase = createClient(url, key);

async function run() {
  const sql = `
  ALTER TABLE IF EXISTS public.favorite_arenas RENAME TO favorite_grounds;

  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'favorite_grounds' AND column_name = 'arena_id'
    ) THEN
      ALTER TABLE public.favorite_grounds RENAME COLUMN arena_id TO ground_id;
    END IF;
  END $$;

  ALTER TABLE public.favorite_grounds 
    DROP CONSTRAINT IF EXISTS favorite_arenas_arena_id_fkey,
    DROP CONSTRAINT IF EXISTS favorite_grounds_arena_id_fkey,
    DROP CONSTRAINT IF EXISTS favorite_grounds_ground_id_fkey;

  ALTER TABLE public.favorite_grounds
    ADD CONSTRAINT favorite_grounds_ground_id_fkey 
    FOREIGN KEY (ground_id) REFERENCES public.grounds(id) ON DELETE CASCADE;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });
  console.log('Result:', { data, error });
}

run();
