import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getBaseUrl = (req: Request) => {
  // Check headers to detect if running on localhost vs production
  const host = req.headers.get('host');
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }
  // Fallback to environment variable or hardcoded domain
  const rawEnvUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://win-declare.vercel.app';
  return rawEnvUrl.replace(/\[\vert{}\]|\(\vert{}\)/g, '').replace(/\/$/, '');
};

export async function POST(request: Request) {
  try {
    console.log({
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SERVICE_ROLE_KEY_PRESENT: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SERVICE_ROLE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
    });

    // Safely parse incoming data as URLSearchParams or FormData
    const text = await request.text();
    const searchParams = new URLSearchParams(text);
    const params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    console.log("=== PAYTM CALLBACK RECEIVED ===", params);

    const status = params.STATUS;
    const orderId = params.ORDERID;
    const respCode = params.RESPCODE;

    const isSuccess = respCode === '01' || (status === 'TXN_SUCCESS' && respCode === '01');

    // 1. Await DB update strictly first
    if (orderId) {
      const { data: before, error: beforeError } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('booking_id', orderId);

      console.log('=== BEFORE UPDATE ===');
      console.log({ orderId, beforeError, before });

      if (isSuccess) {
        const { data, error } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'completed'
          })
          .eq('booking_id', orderId)
          .select();

        console.log('=== UPDATE RESULT ===');
        console.log({ data, error });

        if (error || !data || data.length === 0) {
          console.warn("Direct select update returned empty, executing update without .select()...");
          const { error: directError } = await supabaseAdmin
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_status: 'completed'
            })
            .eq('booking_id', orderId);

          console.log('=== FALLBACK DIRECT UPDATE ERROR ===', directError);
        }
      } else {
        console.log("Payment unsuccessful or cancelled:", params.RESPMSG);
        const { data, error } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'cancelled',
            payment_status: 'failed'
          })
          .eq('booking_id', orderId)
          .select();

        console.log('=== UPDATE RESULT ===');
        console.log({ data, error });

        if (error || !data || data.length === 0) {
          const { error: directError } = await supabaseAdmin
            .from('bookings')
            .update({
              status: 'cancelled',
              payment_status: 'failed'
            })
            .eq('booking_id', orderId);

          console.log('=== FALLBACK DIRECT CANCEL ERROR ===', directError);
        }
      }

      const { data: after, error: afterError } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('booking_id', orderId);

      console.log('=== AFTER UPDATE ===');
      console.log({ afterError, after });
    }

    // 2. Only THEN construct and return the redirect
    const baseUrl = getBaseUrl(request);
    const redirectUrl = new URL('/#profile-bookings', baseUrl);
    redirectUrl.searchParams.set('booking', isSuccess ? 'success' : 'failed');
    redirectUrl.searchParams.set('orderId', orderId || '');

    return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
  } catch (error: any) {
    console.error("CRITICAL CALLBACK EXCEPTION:", error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(`${baseUrl}/?booking=error#profile-bookings`, 303);
  }
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  return NextResponse.redirect(`${baseUrl}/`, 303);
}
