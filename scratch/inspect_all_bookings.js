import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAllBookings() {
  const { data, error } = await supabase.from('bookings').select('*');
  console.log("Error:", error);
  console.log("All Bookings Count:", data?.length);
  if (data) {
    data.forEach((b, i) => {
      console.log(`\n--- Booking #${i+1} ---`);
      console.log("id:", b.id);
      console.log("booking_id:", b.booking_id);
      console.log("ground_id:", b.ground_id);
      console.log("arena_id:", b.arena_id);
      console.log("user_id:", b.user_id);
      console.log("booking_date:", b.booking_date);
      console.log("date:", b.date);
      console.log("slots:", b.slots);
      console.log("status:", b.status);
      console.log("payment_status:", b.payment_status);
      console.log("created_at:", b.created_at);
    });
  }
}

inspectAllBookings();
