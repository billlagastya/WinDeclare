-- 1. Rename the table from favorite_arenas to favorite_grounds
ALTER TABLE IF EXISTS public.favorite_arenas RENAME TO favorite_grounds;

-- 2. Rename the column inside the table if it was named arena_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'favorite_grounds' AND column_name = 'arena_id'
  ) THEN
    ALTER TABLE public.favorite_grounds RENAME COLUMN arena_id TO ground_id;
  END IF;
END $$;

-- 3. Ensure Foreign Key points correctly to grounds(id)
ALTER TABLE public.favorite_grounds 
  DROP CONSTRAINT IF EXISTS favorite_arenas_arena_id_fkey,
  DROP CONSTRAINT IF EXISTS favorite_grounds_arena_id_fkey,
  DROP CONSTRAINT IF EXISTS favorite_grounds_ground_id_fkey;

ALTER TABLE public.favorite_grounds
  ADD CONSTRAINT favorite_grounds_ground_id_fkey 
  FOREIGN KEY (ground_id) REFERENCES public.grounds(id) ON DELETE CASCADE;
