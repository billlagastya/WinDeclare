import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTestBookings() {
  console.log("Cancelling unpaid test bookings WD-TF5CO and WD-S7H6V in Supabase...");
  const targetIds = ['WD-TF5CO', 'WD-S7H6V'];

  for (const bookingId of targetIds) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('booking_id', bookingId)
      .select();

    if (error) {
      console.error(`Error updating ${bookingId}:`, error);
    } else {
      console.log(`Successfully updated ${bookingId}:`, data);
    }
  }
}

cleanTestBookings();
