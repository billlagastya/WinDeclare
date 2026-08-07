import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

const isUuid = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

async function testSimulateCallback() {
  console.log("=== 1. FETCHING LATEST PENDING BOOKING FROM SUPABASE ===");
  const { data: pendingBookings, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr || !pendingBookings || pendingBookings.length === 0) {
    console.log("No pending booking found. Creating a test pending booking...");
    const testOrderId = `WD-TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { data: newBk, error: insErr } = await supabase
      .from('bookings')
      .insert([{
        booking_id: testOrderId,
        status: 'pending',
        payment_status: 'pending',
        booking_date: '2026-08-07',
        slots: ['10:00 AM'],
        total_amount: 800
      }])
      .select();
    
    if (insErr) {
      console.error("Failed to create test pending booking:", insErr);
      return;
    }
    console.log("Created test pending booking:", newBk[0]);
    await sendCallback(newBk[0].booking_id || newBk[0].id);
  } else {
    const target = pendingBookings[0];
    const targetOrderId = target.booking_id || target.id;
    console.log(`Found target pending booking ID: "${targetOrderId}" (row id: "${target.id}")`);
    await sendCallback(targetOrderId);
  }
}

async function sendCallback(orderId) {
  console.log(`\n=== 2. SENDING SIMULATED PAYTM CALLBACK POST FOR ORDERID="${orderId}" ===`);
  const formBody = new URLSearchParams({
    ORDERID: orderId,
    STATUS: 'TXN_SUCCESS',
    RESPCODE: '01',
    RESPMSG: 'Txn Success',
    TXNAMOUNT: '800.00'
  }).toString();

  try {
    const res = await fetch('http://localhost:3000/api/paytm/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody,
      redirect: 'manual'
    });

    console.log(`Callback Response Status: HTTP ${res.status}`);
    console.log(`Redirect Location: ${res.headers.get('location')}`);

    // Verify row status in database after callback
    console.log(`\n=== 3. VERIFYING DATABASE STATUS AFTER CALLBACK ===`);
    let query = supabase.from('bookings').select('*');
    if (isUuid(orderId)) {
      query = query.or(`booking_id.eq.${orderId},id.eq.${orderId}`);
    } else {
      query = query.eq('booking_id', orderId);
    }

    const { data: updatedRows, error: verifyErr } = await query;

    if (verifyErr || !updatedRows || updatedRows.length === 0) {
      console.error("Verification error or row not found:", verifyErr);
    } else {
      console.log("Updated Booking Row in Supabase:");
      console.log(`  id: ${updatedRows[0].id}`);
      console.log(`  booking_id: ${updatedRows[0].booking_id}`);
      console.log(`  status: "${updatedRows[0].status}"`);
      console.log(`  payment_status: "${updatedRows[0].payment_status}"`);
    }
  } catch (err) {
    console.error("Callback POST request failed:", err);
  }
}

testSimulateCallback();
