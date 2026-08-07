import { createClient } from '@supabase/supabase-js';
import PaytmChecksum from 'paytmchecksum';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAndVerifyPendingBookings() {
  console.log("Fetching all pending bookings from Supabase...");
  const { data: pendingBookings, error } = await supabase
    .from('bookings')
    .select('*')
    .or('status.eq.pending,payment_status.eq.pending');

  if (error) {
    console.error("Error fetching pending bookings:", error);
    return;
  }

  console.log(`Found ${pendingBookings?.length || 0} pending bookings in database:`);
  console.log(JSON.stringify(pendingBookings, null, 2));

  const mid = (process.env.PAYTM_MID || 'gyIDFu51887272392467').replace(/^"|"$/g, '').trim();
  const merchantKey = (process.env.PAYTM_MERCHANT_KEY || 'dhz@wUZTmceaQZSS').replace(/^"|"$/g, '').trim();
  const paytmEnv = (process.env.PAYTM_ENV || 'STAGING').replace(/^"|"$/g, '').trim().toUpperCase();

  for (const b of (pendingBookings || [])) {
    const orderId = b.booking_id;
    if (!orderId) continue;

    console.log(`\nChecking Paytm status for Order ID: ${orderId}...`);

    try {
      const bodyObj = { mid, orderId };
      const checksum = await PaytmChecksum.generateSignature(JSON.stringify(bodyObj), merchantKey);
      const paytmParams = {
        head: { signature: checksum },
        body: bodyObj
      };

      const host = paytmEnv === 'PRODUCTION' ? 'securegw.paytm.in' : 'securestage.paytmpayments.com';
      const statusUrl = `https://${host}/v3/order/status`;

      const res = await fetch(statusUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paytmParams)
      });

      const resData = await res.json();
      console.log(`Paytm API Response for ${orderId}:`, JSON.stringify(resData, null, 2));

      const resultInfo = resData?.body?.resultInfo;
      const txnStatus = resData?.body?.resultInfo?.resultStatus;
      const txnId = resData?.body?.txnId;

      if (txnStatus === 'TXN_SUCCESS') {
        console.log(`SUCCESS! Paytm confirmed payment for ${orderId}. Updating DB status to 'confirmed'...`);
        const { data: updated, error: upErr } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'completed',
            payment_id: txnId || 'PAYTM_VERIFIED',
            updated_at: new Date().toISOString()
          })
          .eq('booking_id', orderId)
          .select();

        if (upErr) {
          console.error(`Error updating booking ${orderId}:`, upErr);
        } else {
          console.log(`Updated booking ${orderId} in Supabase:`, updated);
        }
      } else {
        console.log(`Order ${orderId} status on Paytm: ${resultInfo?.resultMsg || 'Not TXN_SUCCESS'}`);
      }
    } catch (err) {
      console.error(`Exception checking status for ${orderId}:`, err);
    }
  }
}

inspectAndVerifyPendingBookings();
