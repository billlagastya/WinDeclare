import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAllUnpaidBookings() {
  console.log("Fetching all bookings from Supabase...");
  const { data: allBookings, error: fetchErr } = await supabase
    .from('bookings')
    .select('*');

  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }

  console.log(`Found ${allBookings?.length || 0} total bookings in database:`);
  allBookings?.forEach(b => {
    console.log(`- ID: ${b.id} | BookingID: ${b.booking_id} | Status: ${b.status} | PaymentStatus: ${b.payment_status}`);
  });

  const unpaidOrTest = allBookings?.filter(b => 
    b.payment_status === 'pending' || 
    b.status === 'pending' ||
    b.booking_id === 'WD-TF5CO' || 
    b.booking_id === 'WD-S7H6V'
  );

  console.log(`Updating ${unpaidOrTest?.length || 0} unpaid/test bookings to status='cancelled'...`);
  for (const b of (unpaidOrTest || [])) {
    const { error: upErr } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('id', b.id);
    
    if (upErr) console.error(`Failed to update ${b.id}:`, upErr);
    else console.log(`Cancelled booking ${b.booking_id || b.id}`);
  }
}

cleanAllUnpaidBookings();
