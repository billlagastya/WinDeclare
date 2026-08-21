import { createClient } from '@supabase/supabase-js';

const url = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc2RzamN3bmljamhkc3ptZGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTMwNzI0MiwiZXhwIjoyMTAwODgzMjQyfQ.FZF6oZvpNoMyaFKg2oaZFeoIn-AsCYZhami0VBVYL4M';
const supabase = createClient(url, key);

async function inspectReviews() {
  const { data, error } = await supabase.from('reviews').select('*').limit(5);
  console.log('reviews data:', data);
  console.log('reviews error:', error);
}

inspectReviews();
