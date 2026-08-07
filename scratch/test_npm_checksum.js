import PaytmChecksum from 'paytmchecksum';
import { PaytmChecksum as LocalPaytmChecksum } from '../lib/paytmchecksum.ts';

const mid = "gyIDFu51887272392467";
const merchantKey = "dhz@wUZTmceaQZSS";
const website = "WEBSTAGING";

async function compareChecksums() {
  const orderId = "ORD_TEST_" + Date.now();
  const bodyObj = {
    requestType: "Payment",
    mid: mid,
    websiteName: website,
    orderId: orderId,
    callbackUrl: "https://win-declare.vercel.app/api/paytm/callback",
    txnAmount: {
      value: "800.00",
      currency: "INR"
    },
    userInfo: {
      custId: "CUST_TEST_1",
      custName: "Diagnostic Player",
      custMobile: "9999999999",
      custEmail: "diagnostic@windeclare.in"
    },
    industryTypeId: "Retail"
  };

  const bodyString = JSON.stringify(bodyObj);

  console.log("=== Testing Official npm paytmchecksum package ===");
  const npmSignature = await PaytmChecksum.generateSignature(bodyString, merchantKey);
  console.log("Official npm signature:", npmSignature);

  console.log("Verifying official signature with Paytm API...");
  const endpointUrl = `https://securestage.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;
  
  const paytmParams = {
    head: {
      version: "v1",
      channelId: "WEB",
      signature: npmSignature
    },
    body: bodyObj
  };

  const res = await fetch(endpointUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paytmParams)
  });

  const json = await res.json();
  console.log("Official npm package response:", JSON.stringify(json, null, 2));

  // Now test with object input for official package
  const npmObjSignature = await PaytmChecksum.generateSignature(bodyObj, merchantKey);
  const paytmParams2 = {
    head: {
      version: "v1",
      channelId: "WEB",
      signature: npmObjSignature
    },
    body: bodyObj
  };

  const res2 = await fetch(endpointUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paytmParams2)
  });

  const json2 = await res2.json();
  console.log("Official npm package (object input) response:", JSON.stringify(json2, null, 2));
}

compareChecksums();
