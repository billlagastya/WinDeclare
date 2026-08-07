import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPendingInsert() {
  console.log("=== Testing Pending Booking Insert ===");
  const testBookingId = `WD-TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const recordsToInsert = [{
    booking_id: testBookingId,
    ground_id: "162d8c3d-bfc2-40f8-a5d6-de881096cc78",
    user_id: "4d5395f3-1652-49fd-a462-86ee51041168",
    booking_date: "2026-08-10",
    slots: ["6:00 PM"],
    total_amount: 1000,
    status: 'pending',
    payment_status: 'pending',
    booking_type: 'online',
    created_at: new Date().toISOString()
  }];

  const { data, error } = await supabase.from('bookings').insert(recordsToInsert).select();
  if (error) {
    console.error("❌ Pending Insert Error:", error);
  } else {
    console.log("✓ Pending Insert Succeeded! Row created:", data[0]);
  }
}

testPendingInsert();
