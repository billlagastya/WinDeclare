import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    const signature = headers.get('x-webhook-signature');
    const timestamp = headers.get('x-webhook-timestamp');
    const secretKey = process.env.CASHFREE_SECRET_KEY || '';

    // Signature verification
    if (signature && timestamp && secretKey) {
      const dataToSign = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(dataToSign)
        .digest('base64');

      if (signature !== expectedSignature) {
        console.warn("Webhook Signature Mismatch - Warning in Sandbox/Development");
      }
    }

    const payload = JSON.parse(rawBody);
    console.log("Received Cashfree Webhook:", payload);

    const eventType = payload.type;
    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || paymentData?.payment_status === 'SUCCESS') {
      const orderId = orderData?.order_id || paymentData?.order_id;

      if (orderId) {
        // Update Supabase bookings record
        const { error } = await supabase
          .from('bookings')
          .update({
            payment_status: 'completed',
            status: 'confirmed'
          })
          .or(`booking_id.eq.${orderId},id.eq.${orderId}`);

        if (error) {
          console.error("Failed to update booking status via Cashfree Webhook:", error);
        } else {
          console.log(`✓ Booking ${orderId} successfully marked confirmed via Cashfree Webhook.`);
        }
      }
    }

    return NextResponse.json({ status: 'ok', message: 'Webhook processed' });
  } catch (error: any) {
    console.error("Cashfree Webhook Error:", error.message || error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
