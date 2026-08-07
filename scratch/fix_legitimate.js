import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLegitimateBookings() {
  console.log("Updating verified Paytm successful booking WD-4QJV506...");
  const { data: successData, error: successErr } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', 'WD-4QJV506')
    .select();

  if (successErr) {
    console.error("Error updating WD-4QJV506:", successErr);
  } else {
    console.log("Successfully updated WD-4QJV506 to confirmed:", successData);
  }

  console.log("Updating verified Paytm failed booking WD-MORU4W4...");
  const { data: failData, error: failErr } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      payment_status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', 'WD-MORU4W4')
    .select();

  if (failErr) {
    console.error("Error updating WD-MORU4W4:", failErr);
  } else {
    console.log("Successfully updated WD-MORU4W4 to cancelled:", failData);
  }
}

fixLegitimateBookings();
