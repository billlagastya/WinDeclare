// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';

export interface PaymentOptions {
  amount: number;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  groundId?: number | string;
}

declare global {
  interface Window {
    Cashfree?: any;
  }
}

export async function initiateOnlinePayment(options: PaymentOptions) {
  const GATEWAY_PROVIDER: 'RAZORPAY' | 'CASHFREE' = 'CASHFREE';

  if (GATEWAY_PROVIDER === 'CASHFREE') {
    console.log("Initiating Cashfree Payment Order:", options);

    try {
      // 1. Call Next.js API route to create Cashfree Order & get paymentSessionId
      const response = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ground_id: options.groundId || 1,
          total_amount: options.amount,
          booking_id: options.bookingId,
          customer_details: {
            customer_name: options.customerName || 'Player',
            customer_phone: options.customerPhone || '9999999999',
            customer_email: options.customerEmail || 'player@windeclare.in'
          }
        })
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        console.error(`API response was not JSON (Status ${response.status}):`, rawText);
        throw new Error(`Server returned status ${response.status} (non-JSON response). Please check server logs or Cashfree environment credentials.`);
      }

      if (!response.ok) {
        if (response.status === 403) {
          alert(`🚫 Booking Restriction:\n${data.error}`);
          return;
        }
        throw new Error(data.error || "Failed to create Cashfree payment session");
      }

      const paymentSessionId = data.payment_session_id;
      if (!paymentSessionId) {
        throw new Error("Invalid payment session ID returned from Cashfree server.");
      }

      // 2. Load Cashfree Checkout SDK via @cashfreepayments/cashfree-js loader
      const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
      const cashfree = await load({ mode: cashfreeMode });

      // 3. Trigger Cashfree Checkout UI Dropin / Redirect
      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self"
      });

    } catch (err: any) {
      console.error("Cashfree Checkout Exception:", err);
      alert(`Payment Initialization Failed: ${err.message || 'Unknown error'}`);
    }
  } else if (GATEWAY_PROVIDER === 'RAZORPAY') {
    console.log("Initiating Razorpay payment:", options);
  }
}
