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

const isUuid = (str: string) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function POST(request: Request) {
  try {
    console.log("SERVICE_ROLE_KEY_PRESENT:", !!process.env.SUPABASE_SERVICE_ROLE_KEY, "LENGTH:", (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length);
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
      if (isSuccess) {
        let query = supabaseAdmin
          .from('bookings')
          .update({ 
            status: 'confirmed', 
            payment_status: 'completed'
          });

        if (isUuid(orderId)) {
          query = query.or(`booking_id.eq.${orderId},id.eq.${orderId}`);
        } else {
          query = query.eq('booking_id', orderId);
        }

        const { data, error: dbError } = await query.select();
        console.log("CALLBACK DB UPDATE RESULT:", { orderId, error: dbError, data });

        if (dbError) {
          console.error("Supabase booking update error in callback:", dbError);
        }
      } else {
        console.log("Payment unsuccessful or cancelled:", params.RESPMSG);
        let query = supabaseAdmin
          .from('bookings')
          .update({
            status: 'cancelled',
            payment_status: 'failed'
          })
          .neq('status', 'confirmed');

        if (isUuid(orderId)) {
          query = query.or(`booking_id.eq.${orderId},id.eq.${orderId}`);
        } else {
          query = query.eq('booking_id', orderId);
        }

        const { data, error: dbError } = await query.select();
        console.log("CALLBACK DB CANCEL RESULT:", { orderId, error: dbError, data });

        if (dbError) {
          console.error("Supabase booking cancel error in callback:", dbError);
        }
      }
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
