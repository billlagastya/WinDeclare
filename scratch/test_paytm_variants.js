import crypto from 'crypto';

class PaytmChecksum {
  static iv = '4641041059261441';

  static async encrypt(input, key) {
    const cipher = crypto.createCipheriv('aes-128-cbc', key, this.iv);
    let encrypted = cipher.update(input, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  static async generateSignature(params, key) {
    let data;
    if (typeof params === 'object') {
      data = this.getStringByParams(params);
    } else {
      data = params;
    }
    const salt = await this.generateRandomString(4);
    const finalString = `${data}|${salt}`;
    const sha256 = crypto.createHash('sha256').update(finalString).digest('hex');
    const hashAndSalt = sha256 + salt;
    return this.encrypt(hashAndSalt, key);
  }

  static generateRandomString(length) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes((length * 300) / 4, (err, buf) => {
        if (err) return reject(err);
        const salt = buf.toString('base64').replace(/[^a-zA-Z0-9]/g, '').substr(0, length);
        resolve(salt);
      });
    });
  }

  static getStringByParams(params) {
    const data = {};
    Object.keys(params)
      .sort()
      .forEach((key) => {
        const val = params[key] !== undefined && params[key] !== null ? String(params[key]) : '';
        if (val !== 'null' && val !== 'undefined') {
          data[key] = val;
        }
      });
    return Object.values(data).join('|');
  }
}

const mid = "gyIDFu51887272392467";
const merchantKey = "dhz@wUZTmceaQZSS";

async function testVariant(label, host, website, channelInHead) {
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

  const sig = await PaytmChecksum.generateSignature(
    JSON.stringify(bodyObj),
    merchantKey
  );

  const headObj = { signature: sig };
  if (channelInHead) {
    headObj.channelId = "WEB";
  }

  const paytmParams = {
    head: headObj,
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
    console.log(`[${label}] Status: ${res.status} ResultStatus: ${json?.body?.resultInfo?.resultStatus} Code: ${json?.body?.resultInfo?.resultCode} Msg: ${json?.body?.resultInfo?.resultMsg}`);
    if (json?.body?.txnToken) {
      console.log(`🎉 SUCCESS! TxnToken: ${json.body.txnToken}`);
    }
  } catch (e) {
    console.log(`[${label}] Error: ${e.message}`);
  }
}

async function runAll() {
  console.log("Testing Channel ID Variants...");
  await testVariant("Stage + channelId: WEB in head", "securegw-stage.paytm.in", "WEBSTAGING", true);
  await testVariant("Prod + channelId: WEB in head", "securegw.paytm.in", "DEFAULT", true);
  await testVariant("Stage + channelId: WAP in head", "securegw-stage.paytm.in", "WEBSTAGING", true);
}

runAll();
