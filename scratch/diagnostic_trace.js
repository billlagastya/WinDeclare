import fs from 'fs';
import path from 'path';
import { PaytmChecksum } from '../lib/paytmchecksum.ts';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      process.env[key] = val;
    }
  });
}

async function testPaytmInitiate(label, signatureInputFormat) {
  const mid = (process.env.PAYTM_MID || '').replace(/^"|"$/g, '').trim();
  const merchantKey = (process.env.PAYTM_MERCHANT_KEY || '').replace(/^"|"$/g, '').trim();
  const website = (process.env.PAYTM_WEBSITE || 'WEBSTAGING').replace(/^"|"$/g, '').trim();
  const paytmEnv = (process.env.PAYTM_ENV || 'STAGING').replace(/^"|"$/g, '').trim().toUpperCase();

  const host = paytmEnv === 'PRODUCTION' ? 'securegw.paytm.in' : 'securestage.paytmpayments.com';
  const orderId = `ORD_TEST_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const endpointUrl = `https://${host}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;

  const callbackUrl = 'https://win-declare.vercel.app/api/paytm/callback';
  const bodyObj = {
    requestType: "Payment",
    mid: mid,
    websiteName: website,
    orderId: orderId,
    callbackUrl: callbackUrl,
    txnAmount: {
      value: "800.00",
      currency: "INR",
    },
    userInfo: {
      custId: "CUST_TEST_1",
      custName: "Diagnostic Player",
      custMobile: "9999999999",
      custEmail: "diagnostic@windeclare.in",
    },
    industryTypeId: "Retail"
  };

  let signature = "";
  if (signatureInputFormat === 'object') {
    signature = await PaytmChecksum.generateSignature(bodyObj, merchantKey);
  } else if (signatureInputFormat === 'string') {
    signature = await PaytmChecksum.generateSignature(JSON.stringify(bodyObj), merchantKey);
  }

  const paytmParams = {
    head: {
      version: "v1",
      channelId: "WEB",
      signature: signature,
    },
    body: bodyObj,
  };

  try {
    const paytmRes = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paytmParams)
    });

    const responseData = await paytmRes.json();
    const resultInfo = responseData?.body?.resultInfo;
    console.log(`[${label}] Status: ${resultInfo?.resultStatus}, Code: ${resultInfo?.resultCode}, Msg: "${resultInfo?.resultMsg}"`);
    if (resultInfo?.resultStatus === 'S') {
      console.log(`   --> SUCCESS txnToken: ${responseData?.body?.txnToken}`);
    }
  } catch (err) {
    console.error(`[${label}] Error:`, err);
  }
}

async function run() {
  console.log("=== Testing Paytm Checksum Formats ===");
  await testPaytmInitiate("Format 1: Object passed to PaytmChecksum.generateSignature", "object");
  await testPaytmInitiate("Format 2: JSON.stringify(body) passed to PaytmChecksum.generateSignature", "string");
}

run();
