import { NextResponse } from 'next/server';
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
  try {
    const body = await request.json();
    const {
      booking_id,
      txnid: customTxnId,
      amount,
      productinfo = 'Ground Booking',
      firstname = 'Player',
      email = 'player@example.com',
      phone = '9999999999',
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = ''
    } = body;

    const merchantKey = process.env.PAYU_MERCHANT_KEY || 'gtK28y';
    const merchantSalt = process.env.PAYU_MERCHANT_SALT || '4rWasgather';
    const rawPayuBaseUrl = process.env.PAYU_BASE_URL || 'https://secure.payu.in';
    const payuBaseUrl = rawPayuBaseUrl.replace(/\/$/, '');

    const txnid = customTxnId || booking_id || `WD-${Date.now()}`;
    const formattedAmount = Number(amount).toFixed(2);
    
    // Pass booking_id in udf1 if not explicitly provided
    const resolvedUdf1 = udf1 || booking_id || txnid;

    const baseUrl = getBaseUrl(request);
    const surl = `${baseUrl}/api/payment/payu-callback`;
    const furl = `${baseUrl}/api/payment/payu-callback`;

    // Hash format: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashSequence = [
      merchantKey,
      txnid,
      formattedAmount,
      productinfo,
      firstname,
      email,
      resolvedUdf1,
      udf2,
      udf3,
      udf4,
      udf5,
      '', '', '', '', '', // 5 empty fields (producing |||||| before SALT)
      merchantSalt
    ].join('|');

    const hash = crypto.createHash('sha512').update(hashSequence).digest('hex');

    const payuUrl = `${payuBaseUrl}/_payment`;

    const params = {
      key: merchantKey,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      udf1: resolvedUdf1,
      udf2,
      udf3,
      udf4,
      udf5,
      hash,
      service_provider: 'payu_paisa'
    };

    return NextResponse.json({
      success: true,
      payuUrl,
      params
    });
  } catch (error: any) {
    console.error('Error initiating PayU payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate PayU payment' },
      { status: 500 }
    );
  }
}
