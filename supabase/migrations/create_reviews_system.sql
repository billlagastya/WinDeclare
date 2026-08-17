-- Migration: Ensure Verified Reviews table structure and foreign keys
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ground_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  booking_id UUID NOT NULL UNIQUE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure profiles table has name and avatar_url columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ensure Foreign Keys point to profiles(id) and bookings(id)
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_user_id_profiles_fkey,
  DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_booking_id_fkey 
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access for reviews
DROP POLICY IF EXISTS "Allow public read access for reviews" ON public.reviews;
CREATE POLICY "Allow public read access for reviews" 
  ON public.reviews FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own reviews
DROP POLICY IF EXISTS "Allow authenticated insert for reviews" ON public.reviews;
CREATE POLICY "Allow authenticated insert for reviews" 
  ON public.reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
