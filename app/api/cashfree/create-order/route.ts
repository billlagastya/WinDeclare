import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ground_id, total_amount, customer_details, booking_id } = body;

    if (!ground_id || !total_amount) {
      return NextResponse.json({ error: "Missing required fields (ground_id or total_amount)" }, { status: 400 });
    }

    // 1. Query ground/arena details safely from Supabase
    const gidStr = String(ground_id);
    let { data: grounds, error: groundErr } = await supabase
      .from('grounds')
      .select('*')
      .eq('id', gidStr);

    if (groundErr || !grounds || grounds.length === 0) {
      const isNumeric = /^\d+$/.test(gidStr);
      if (isNumeric) {
        const { data: arenasData } = await supabase
          .from('arenas')
          .select('*')
          .eq('id', Number(gidStr));
        if (arenasData && arenasData.length > 0) {
          grounds = arenasData;
        }
      }
    }
    const ground = grounds?.[0];
    const planType = ground?.plan_type || (ground?.plan === 'commission' ? 'commission' : (ground?.plan === 'hybrid' ? 'hybrid' : 'free'));

    console.log("DEBUG Order Creation Ground:", {
      id: ground?.id || ground?.ground_id,
      name: ground?.name || ground?.title,
      raw_plan_type: ground?.plan_type,
      raw_plan: ground?.plan,
      resolved_planType: planType,
      cashfree_vendor_id: ground?.cashfree_vendor_id
    });

    // 2. Strict Rule: Block 'free' tier (0%) from online payment processing
    if (planType === 'free') {
      return NextResponse.json(
        { error: "Free tier venues cannot process online payments. Please use WhatsApp booking to contact venue owner." },
        { status: 403 }
      );
    }

    // 3. Environment Variables Check & Sanitization
    const appId = (process.env.CASHFREE_APP_ID || '').replace(/^"|"$/g, '').trim();
    const secretKey = (process.env.CASHFREE_SECRET_KEY || '').replace(/^"|"$/g, '').trim();
    const envStr = (process.env.CASHFREE_ENV || '').replace(/^"|"$/g, '').trim();
    console.log("DEBUG ENV CHECK:", { appIdLength: appId.length, secretKeyLength: secretKey.length, appIdPreview: appId.slice(0,8), envStr });

    if (!appId || !secretKey || appId.includes('YOUR_APP_ID') || secretKey.includes('YOUR_SECRET_KEY')) {
      return NextResponse.json(
        { error: "Cashfree API keys are unconfigured. Please update CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env.local with valid Cashfree credentials." },
        { status: 400 }
      );
    }

    // 4. Initialize Cashfree PG SDK Instance
    const env = envStr === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const cashfree = new Cashfree(env, appId, secretKey);

    const orderId = booking_id || `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const customerId = customer_details?.customer_id || `CUST_${Date.now()}`;
    const customerPhone = customer_details?.customer_phone || '9999999999';
    const customerEmail = customer_details?.customer_email || 'player@windeclare.in';
    const customerName = customer_details?.customer_name || 'Player';

    // 5. Easy Split calculation for hybrid (97% vendor / 3% platform) & commission (90% vendor / 10% platform)
    const vendorId = ground?.cashfree_vendor_id;
    let orderSplits = undefined;

    if (vendorId && (planType === 'hybrid' || planType === 'commission')) {
      const vendorShareRate = planType === 'hybrid' ? 0.97 : 0.90;
      const vendorAmount = Math.round(Number(total_amount) * vendorShareRate * 100) / 100;
      orderSplits = [
        {
          vendor_id: vendorId,
          amount: vendorAmount
        }
      ];
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const orderRequest: any = {
      order_id: orderId,
      order_amount: Number(total_amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      },
      order_meta: {
        return_url: `${origin}/?booking={order_id}#profile-bookings`
      }
    };

    if (orderSplits) {
      orderRequest.order_splits = orderSplits;
    }

    const response = await cashfree.PGCreateOrder(orderRequest);
    const data = response.data;

    return NextResponse.json({
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
      order_status: data.order_status
    });

  } catch (error: any) {
    const errorDetails = error?.response?.data || error?.message || String(error);
    console.error("Cashfree Order Creation Exception:", errorDetails);

    return NextResponse.json(
      { error: typeof errorDetails === 'object' ? (errorDetails.message || JSON.stringify(errorDetails)) : String(errorDetails) },
      { status: 500 }
    );
  }
}
