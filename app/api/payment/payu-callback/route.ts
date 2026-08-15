import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const getBaseUrl = (req: Request) => {
  const host = req.headers.get('host');
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }
  const rawEnvUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return rawEnvUrl.replace(/\/$/, '');
};

export async function POST(request: Request) {
  const baseUrl = getBaseUrl(request);

  try {
    const text = await request.text();
    const searchParams = new URLSearchParams(text);
    const params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    console.log('=== PAYU CALLBACK RECEIVED ===', params);

    const {
      key = '',
      txnid = '',
      amount = '',
      productinfo = '',
      firstname = '',
      email = '',
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = '',
      status = '',
      hash: receivedHash = '',
      additionalCharges
    } = params;

    const merchantSalt = process.env.PAYU_MERCHANT_SALT || '4rWasgather';

    // Reverse Hash format:
    // sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    // If additionalCharges is present: sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const baseSequence = [
      merchantSalt,
      status,
      '', '', '', '', '', // 5 empty fields (producing |||||| between status and udf5)
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key
    ].join('|');

    const hashSequence = additionalCharges
      ? `${additionalCharges}|${baseSequence}`
      : baseSequence;

    const calculatedHash = crypto.createHash('sha512').update(hashSequence).digest('hex');

    const isHashValid = calculatedHash.toLowerCase() === (receivedHash || '').toLowerCase();
    const isPaymentSuccess = isHashValid && status.toLowerCase() === 'success';

    console.log('=== PAYU VERIFICATION ===', {
      status,
      txnid,
      calculatedHash,
      receivedHash,
      isHashValid,
      isPaymentSuccess
    });

    const bookingIdentifier = udf1 || txnid;

    if (bookingIdentifier) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

      if (supabaseUrl && serviceKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const targetStatus = isPaymentSuccess ? 'confirmed' : 'failed';
        const targetPaymentStatus = isPaymentSuccess ? 'completed' : 'failed';

        // Update bookings matching booking_id = bookingIdentifier or txnid
        const { data, error } = await supabaseAdmin
          .from('bookings')
          .update({
            status: targetStatus,
            payment_status: targetPaymentStatus
          })
          .or(`booking_id.eq.${bookingIdentifier},booking_id.eq.${txnid}`)
          .select();

        console.log('=== SUPABASE BOOKING UPDATE RESULT ===', { data, error });

        // Fallback REST PATCH if Supabase JS update produced empty array
        if (error || !data || data.length === 0) {
          try {
            await fetch(`${supabaseUrl}/rest/v1/bookings?booking_id=eq.${encodeURIComponent(bookingIdentifier)}`, {
              method: 'PATCH',
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
              },
              body: JSON.stringify({
                status: targetStatus,
                payment_status: targetPaymentStatus
              })
            });
          } catch (patchErr) {
            console.error('Direct PostgREST PATCH exception:', patchErr);
          }
        }
      }
    }

    if (isPaymentSuccess) {
      const redirectUrl = new URL('/booking/success', baseUrl);
      redirectUrl.searchParams.set('txnid', txnid);
      if (bookingIdentifier) {
        redirectUrl.searchParams.set('booking_id', bookingIdentifier);
      }
      return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
    } else {
      const redirectUrl = new URL('/booking/failed', baseUrl);
      redirectUrl.searchParams.set('txnid', txnid);
      if (bookingIdentifier) {
        redirectUrl.searchParams.set('booking_id', bookingIdentifier);
      }
      if (!isHashValid) {
        redirectUrl.searchParams.set('reason', 'hash_mismatch');
      } else {
        redirectUrl.searchParams.set('reason', status || 'failed');
      }
      return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
    }
  } catch (error: any) {
    console.error('Critical PayU Callback Exception:', error);
    const redirectUrl = new URL('/booking/failed', baseUrl);
    redirectUrl.searchParams.set('reason', 'server_error');
    return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
  }
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  return NextResponse.redirect(`${baseUrl}/`, 303);
}
