import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';
const supabase = createClient(url, key);

async function setup() {
  console.log("Checking reviews table query...");
  const { data, error } = await supabase.from('reviews').select('*').limit(1);
  console.log("Query result:", { data, error });
}

setup();
