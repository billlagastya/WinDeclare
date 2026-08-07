import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: b1, error: e1 } = await supabase
    .from('bookings')
    .select('booking_id, status, payment_status')
    .eq('booking_id', 'WD-4QJV506');
  console.log("WD-4QJV506:", b1, e1);

  const { data: b2, error: e2 } = await supabase
    .from('bookings')
    .select('booking_id, status, payment_status')
    .eq('booking_id', 'WD-MORU4W4');
  console.log("WD-MORU4W4:", b2, e2);
}

check();
