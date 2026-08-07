import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  // Query RLS policies via rpc or inspecting system view pg_policies
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'bookings');
  if (error) {
    console.log("pg_policies query error:", error.message);
    // Let's test reading bookings with anon client without auth header
    const { data: bData, error: bError } = await supabase.from('bookings').select('*');
    console.log("Reading all bookings with anon client returns count:", bData?.length, "error:", bError);
  } else {
    console.log("Policies:", data);
  }
}

checkRLS();
