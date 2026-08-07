import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Bookings table columns:", Object.keys(data[0]));
  } else {
    console.log("Error or empty:", error);
  }
}

checkColumns();
