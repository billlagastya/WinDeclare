import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

const decodeRoleFromJwt = (jwtToken?: string) => {
  if (!jwtToken) return 'KEY_NOT_SET';
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) return 'INVALID_JWT_FORMAT';
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.role || 'ROLE_FIELD_MISSING';
  } catch (e) {
    return 'DECODE_ERROR';
  }
};

export async function POST(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const decodedRole = decodeRoleFromJwt(process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("=== SUPABASE RUNTIME CLIENT DIAGNOSTICS ===", {
      SUPABASE_URL: supabaseUrl,
      SERVICE_ROLE_KEY_PRESENT: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SERVICE_ROLE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      DECODED_JWT_ROLE: decodedRole
    });

    // Create fresh un-cached admin client for callback execution
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

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

      const targetStatus = isSuccess ? 'confirmed' : 'cancelled';
      const targetPaymentStatus = isSuccess ? 'completed' : 'failed';

      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update({
          status: targetStatus,
          payment_status: targetPaymentStatus
        })
        .eq('booking_id', orderId)
        .select();

      console.log('=== UPDATE RESULT ===');
      console.log({ data, error });

      // If update returned empty array, perform raw HTTP PATCH directly against PostgREST for exact status code & response diagnostics
      if (error || !data || data.length === 0) {
        console.warn("Direct Supabase JS update returned empty data []. Executing raw PostgREST REST API PATCH...");
        try {
          const patchRes = await fetch(`${supabaseUrl}/rest/v1/bookings?booking_id=eq.${encodeURIComponent(orderId)}`, {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              status: targetStatus,
              payment_status: targetPaymentStatus
            })
          });

          const rawBody = await patchRes.text();
          console.log("DIRECT POSTGREST PATCH DIAGNOSTIC RESPONSE:", {
            status: patchRes.status,
            statusText: patchRes.statusText,
            headers: Object.fromEntries(patchRes.headers.entries()),
            body: rawBody
          });
        } catch (rawErr) {
          console.error("DIRECT POSTGREST PATCH EXCEPTION:", rawErr);
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
