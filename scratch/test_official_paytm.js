import PaytmChecksum from 'paytmchecksum';

const mid = "gyIDFu51887272392467";
const merchantKey = "dhz@wUZTmceaQZSS";

async function testWithOfficialSdk(label, host, website, useString) {
  const orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const bodyObj = {
    requestType: "Payment",
    mid: mid,
    websiteName: website,
    orderId: orderId,
    callbackUrl: "https://win-declare.vercel.app/api/paytm/callback",
    txnAmount: {
      value: "100.00",
      currency: "INR"
    },
    userInfo: {
      custId: "CUST_TEST_1"
    }
  };

  const payloadToSign = useString ? JSON.stringify(bodyObj) : bodyObj;
  const signature = await PaytmChecksum.generateSignature(payloadToSign, merchantKey);

  const paytmParams = {
    head: {
      signature: signature
    },
    body: bodyObj
  };

  const url = `https://${host}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paytmParams)
    });
    const json = await res.json();
    console.log(`[${label}] HTTP ${res.status}:`, JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(`[${label}] Error:`, e.message);
  }
}

async function run() {
  console.log("--- Official PaytmChecksum SDK Test ---");
  await testWithOfficialSdk("Official SDK (JSON String)", "securegw-stage.paytm.in", "WEBSTAGING", true);
  await testWithOfficialSdk("Official SDK (Object)", "securegw-stage.paytm.in", "WEBSTAGING", false);
}

run();
