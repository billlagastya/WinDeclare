import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateWithFilters() {
  // Let's check updating WD-4QJV506
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', payment_status: 'completed' })
    .eq('booking_id', 'WD-4QJV506');

  console.log("Update output:", data, error);
}

updateWithFilters();
