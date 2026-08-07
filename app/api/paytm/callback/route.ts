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
  const baseUrl = getBaseUrl(request);

  try {
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

    if (isSuccess) {
      if (orderId) {
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

        console.log("LOCAL CALLBACK UPDATE RESULT:", { orderId, error: dbError, data });

        if (dbError) {
          console.error("Supabase booking update error in callback:", dbError);
          return NextResponse.redirect(`${baseUrl}/?booking=error&reason=db_update_failed#profile-bookings`, 303);
        }
      }

      return NextResponse.redirect(`${baseUrl}/?booking=success&orderId=${orderId}#profile-bookings`, 303);
    } else {
      console.log("Payment unsuccessful or cancelled:", params.RESPMSG);
      if (orderId) {
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

        console.log("LOCAL CALLBACK CANCEL RESULT:", { orderId, error: dbError, data });

        if (dbError) {
          console.error("Supabase booking cancel error in callback:", dbError);
          return NextResponse.redirect(`${baseUrl}/?booking=error&reason=db_update_failed#profile-bookings`, 303);
        }
      }

      return NextResponse.redirect(`${baseUrl}/?booking=cancelled&orderId=${orderId}#profile-bookings`, 303);
    }
  } catch (error: any) {
    console.error("CRITICAL CALLBACK EXCEPTION:", error);
    return NextResponse.redirect(`${baseUrl}/?booking=error#profile-bookings`, 303);
  }
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  return NextResponse.redirect(`${baseUrl}/`, 303);
}
