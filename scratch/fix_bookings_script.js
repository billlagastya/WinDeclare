import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Updating WD-4QJV506 (verified TXN_SUCCESS on Paytm)...");
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'completed'
    })
    .eq('booking_id', 'WD-4QJV506')
    .select();

  if (error) {
    console.error("Error updating WD-4QJV506:", error);
  } else {
    console.log("Successfully updated WD-4QJV506:", data);
  }

  console.log("\nLeaving WD-MORU4W4 as pending because Paytm transaction status API returned TXN_FAILURE (Declined by bank).");
}

main();
