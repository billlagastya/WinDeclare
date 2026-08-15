// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';

export interface PaymentOptions {
  amount: number;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  groundId?: number | string;
  bookingDate?: string;
  slots?: string[];
  provider?: 'PAYTM' | 'CASHFREE' | 'RAZORPAY';
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  txnToken?: string;
  error?: string;
}

declare global {
  interface Window {
    Cashfree?: any;
    Paytm?: any;
  }
}

export async function initiateOnlinePayment(options: PaymentOptions): Promise<PaymentResult> {
  const GATEWAY_PROVIDER: 'PAYTM' | 'CASHFREE' | 'RAZORPAY' = options.provider || 'PAYTM';

  if (GATEWAY_PROVIDER === 'PAYTM') {
    console.log("Initiating Paytm Payment Order:", options);

    try {
      // 1. Call Next.js API route to initiate Paytm Transaction & get txnToken
      const response = await fetch('/api/paytm/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ground_id: options.groundId || 1,
          total_amount: options.amount,
          booking_id: options.bookingId,
          booking_date: options.bookingDate,
          slots: options.slots,
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
        return {
          success: false,
          error: `Server returned status ${response.status} (non-JSON response). Please check Paytm environment credentials.`
        };
      }

      if (!response.ok || !data.success) {
        console.warn("Paytm initiation failed:", data.error || data);
        return {
          success: false,
          error: data.error || "Failed to create Paytm payment session"
        };
      }

      const { txnToken, order_id, mid, paytmEnv } = data;
      if (!txnToken || !order_id || !mid) {
        return {
          success: false,
          error: "Invalid transaction parameters returned from Paytm server."
        };
      }

      // 2. Open Paytm hosted checkout view by creating and submitting a form POST
      const host = paytmEnv === 'PRODUCTION' ? 'securegw.paytm.in' : 'securestage.paytmpayments.com';
      const paytmTxnUrl = `https://${host}/theia/api/v1/showPaymentPage?mid=${mid}&orderId=${order_id}`;

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paytmTxnUrl;

      const paytmParams: Record<string, string> = {
        mid: mid,
        orderId: order_id,
        txnToken: txnToken
      };

      // Append all params (mid, orderId, txnToken) to form body
      Object.entries(paytmParams).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

      return {
        success: true,
        orderId: order_id,
        txnToken: txnToken
      };

    } catch (err: any) {
      console.error("Paytm Checkout Exception:", err);
      return {
        success: false,
        error: err.message || 'Unknown error during Paytm payment initiation'
      };
    }
  } else if (GATEWAY_PROVIDER === 'CASHFREE') {
    console.log("Initiating Cashfree Payment Order:", options);

    try {
      const response = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ground_id: options.groundId || 1,
          total_amount: options.amount,
          booking_id: options.bookingId,
          booking_date: options.bookingDate,
          slots: options.slots,
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
        return {
          success: false,
          error: `Server returned status ${response.status} (non-JSON response).`
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Payment order creation failed"
        };
      }

      const paymentSessionId = data.payment_session_id;
      if (!paymentSessionId) {
        return {
          success: false,
          error: "Invalid payment session ID returned from payment gateway."
        };
      }

      const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox';
      const cashfree = await load({ mode: cashfreeMode });

      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self"
      });

      return {
        success: true,
        orderId: data.order_id
      };

    } catch (err: any) {
      console.error("Payment Checkout Exception:", err);
      return {
        success: false,
        error: err.message || 'Unknown error during payment initiation'
      };
    }
  }

  return {
    success: false,
    error: "Unsupported payment provider"
  };
}
