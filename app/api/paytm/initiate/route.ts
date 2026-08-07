import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { PaytmChecksum } from '@/lib/paytmchecksum';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ground_id, total_amount, customer_details, booking_id, booking_date, slots } = body;

    if (!ground_id || !total_amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (ground_id or total_amount)" },
        { status: 400 }
      );
    }

    // Cleanup stale pending bookings older than 10 minutes
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await supabase
        .from('bookings')
        .delete()
        .eq('status', 'pending')
        .lt('created_at', tenMinutesAgo);
    } catch (e) {
      console.warn("Stale pending booking cleanup notice:", e);
    }

    // Double-Booking Check: Verify selected slots are not already active ('confirmed', 'booked')
    if (booking_date && Array.isArray(slots) && slots.length > 0) {
      const isUuid = typeof ground_id === 'string' && ground_id.includes('-');
      let query = supabase
        .from('bookings')
        .select('slots')
        .eq('booking_date', booking_date)
        .in('status', ['confirmed', 'booked']);

      if (isUuid) {
        query = query.eq('ground_id', ground_id);
      } else {
        query = query.or(`arena_id.eq.${Number(ground_id)},ground_id.eq.${ground_id}`);
      }

      const { data: existingBookings, error: checkErr } = await query;
      if (!checkErr && existingBookings && existingBookings.length > 0) {
        const takenSlots = new Set<string>();
        existingBookings.forEach((b: any) => {
          let bSlots: string[] = [];
          if (Array.isArray(b.slots)) {
            bSlots = b.slots.map((s: any) => typeof s === 'string' ? s : s.time);
          } else if (typeof b.slots === 'string') {
            bSlots = b.slots.split(',').map((s: string) => s.trim());
          }
          bSlots.forEach((s: string) => {
            if (s) takenSlots.add(s);
          });
        });

        const isConflict = slots.some((s: string) => takenSlots.has(s));
        if (isConflict) {
          return NextResponse.json(
            { success: false, error: "Slot already booked by another user." },
            { status: 409 }
          );
        }
      }
    }

    // Read Environment Variables & Sanitize
    const mid = (process.env.PAYTM_MID || '').replace(/^"|"$/g, '').trim();
    const merchantKey = (process.env.PAYTM_MERCHANT_KEY || '').replace(/^"|"$/g, '').trim();
    const website = (process.env.PAYTM_WEBSITE || 'WEBSTAGING').replace(/^"|"$/g, '').trim();
    const paytmEnv = (process.env.PAYTM_ENV || 'STAGING').replace(/^"|"$/g, '').trim().toUpperCase();

    if (!mid || !merchantKey || mid.includes('YOUR_PAYTM_MID') || merchantKey.includes('YOUR_PAYTM_MERCHANT_KEY')) {
      return NextResponse.json(
        { success: false, error: "Paytm API credentials are unconfigured. Please update PAYTM_MID and PAYTM_MERCHANT_KEY in .env.local with valid credentials." },
        { status: 400 }
      );
    }

    const orderId = booking_id || `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const customerId = customer_details?.customer_id || `CUST_${Date.now()}`;

    const origin = request.headers.get('origin');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (origin && origin.startsWith('http') ? origin : 'https://win-declare.vercel.app');
    const callbackUrl = `${baseUrl}/api/paytm/callback`;

    const websiteName = (paytmEnv === 'STAGE' || paytmEnv === 'STAGING') ? 'WEBSTAGING' : (website || 'DEFAULT');

    const bodyObj = {
      requestType: "Payment",
      mid: mid,
      websiteName: websiteName,
      orderId: orderId,
      callbackUrl: callbackUrl,
      txnAmount: {
        value: Number(total_amount).toFixed(2),
        currency: "INR",
      },
      userInfo: {
        custId: customerId,
        custName: customer_details?.customer_name || 'Player',
        custMobile: customer_details?.customer_phone || '9999999999',
        custEmail: customer_details?.customer_email || 'player@windeclare.in',
      },
      industryTypeId: "Retail"
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(bodyObj),
      merchantKey
    );

    const paytmParams = {
      head: {
        version: "v1",
        channelId: "WEB",
        signature: checksum,
      },
      body: bodyObj,
    };

    const host = paytmEnv === 'PRODUCTION' ? 'securegw.paytm.in' : 'securestage.paytmpayments.com';
    const endpointUrl = `https://${host}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;

    console.log("Paytm Initiation Request Body:", JSON.stringify(paytmParams.body, null, 2));
    console.log("Paytm Initiation Endpoint:", endpointUrl);

    const paytmRes = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paytmParams)
    });

    const responseData = await paytmRes.json();
    console.log("Paytm Raw API Response Status:", paytmRes.status);
    console.log("Paytm Raw API Response:", JSON.stringify(responseData, null, 2));

    const bodyResult = responseData?.body;
    if (bodyResult?.resultInfo?.resultStatus === 'S' && bodyResult?.txnToken) {
      return NextResponse.json({
        success: true,
        txnToken: bodyResult.txnToken,
        order_id: orderId,
        mid: mid,
        paytmEnv: paytmEnv,
        resultInfo: bodyResult.resultInfo
      });
    } else {
      console.log("PAYTM_RAW_ERROR:", JSON.stringify(responseData, null, 2));
      const errorMsg = bodyResult?.resultInfo?.resultMsg || responseData?.head?.responseTimestamp || JSON.stringify(responseData);
      return NextResponse.json(
        { success: false, error: errorMsg, resultInfo: bodyResult?.resultInfo, rawResponse: responseData },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Paytm Initiate Transaction Exception:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error initiating Paytm transaction" },
      { status: 500 }
    );
  }
}
