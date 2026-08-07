import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
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

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = origin.startsWith('http') ? origin : 'http://localhost:3000';

    const isSuccess = respCode === '01' || (status === 'TXN_SUCCESS' && respCode === '01');

    if (isSuccess) {
      if (orderId) {
        const { error: dbError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed', 
            payment_status: 'completed'
          })
          .eq('booking_id', orderId);

        if (dbError) {
          console.error("Supabase booking update error in callback:", dbError);
          return NextResponse.redirect(`${baseUrl}/?booking=error&reason=db_update_failed#profile-bookings`, 303);
        }
      }

      return NextResponse.redirect(`${baseUrl}/?booking=success&orderId=${orderId}#profile-bookings`, 303);
    } else {
      console.log("Payment unsuccessful or cancelled:", params.RESPMSG);
      if (orderId) {
        const { error: dbError } = await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            payment_status: 'failed'
          })
          .neq('status', 'confirmed')
          .eq('booking_id', orderId);

        if (dbError) {
          console.error("Supabase booking cancel error in callback:", dbError);
          return NextResponse.redirect(`${baseUrl}/?booking=error&reason=db_update_failed#profile-bookings`, 303);
        }
      }

      return NextResponse.redirect(`${baseUrl}/?booking=cancelled&orderId=${orderId}#profile-bookings`, 303);
    }
  } catch (error: any) {
    console.error("CRITICAL CALLBACK EXCEPTION:", error);
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = origin.startsWith('http') ? origin : 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/?booking=error#profile-bookings`, 303);
  }
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const baseUrl = origin.startsWith('http') ? origin : 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/`, 303);
}
