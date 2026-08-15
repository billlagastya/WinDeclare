export interface PaymentOptions {
  amount: number;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  groundId?: number | string;
  bookingDate?: string;
  slots?: string[];
  productInfo?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  provider?: string;
}

export interface PaymentResult {
  success: boolean;
  txnid?: string;
  error?: string;
}

export async function initiateOnlinePayment(options: PaymentOptions): Promise<PaymentResult> {
  console.log("Initiating PayU Payment Order:", options);

  try {
    const response = await fetch('/api/payment/payu-initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: options.bookingId,
        amount: options.amount,
        productinfo: options.productInfo || 'Ground Booking',
        firstname: options.customerName || 'Player',
        email: options.customerEmail || 'player@example.com',
        phone: options.customerPhone || '9999999999',
        udf1: options.udf1 || options.bookingId,
        udf2: options.udf2 || '',
        udf3: options.udf3 || '',
        udf4: options.udf4 || '',
        udf5: options.udf5 || ''
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
        error: `Server returned status ${response.status} (non-JSON response). Please check PayU server configuration.`
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to create PayU payment session"
      };
    }

    const { payuUrl, params } = data;
    if (!payuUrl || !params) {
      return {
        success: false,
        error: "Invalid transaction parameters returned from PayU server."
      };
    }

    // Auto-submitting POST form to PayU payment URL
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payuUrl;

    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value ?? '');
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    return {
      success: true,
      txnid: params.txnid
    };

  } catch (err: any) {
    console.error("PayU Checkout Exception:", err);
    return {
      success: false,
      error: err.message || 'Unknown error during PayU payment initiation'
    };
  }
}
